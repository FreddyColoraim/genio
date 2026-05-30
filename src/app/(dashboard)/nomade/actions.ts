"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { brevoSendTemplate, BREVO_TEMPLATES } from "@/lib/brevo";
import type { AcquisitionSource, PipelineStage } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getTenantContext() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) redirect("/login");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!membership) redirect("/login");
  return { userId: user.id, tenantId: membership.tenant_id as string };
}

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export type NomadeContact = {
  id:         string;
  entityId:   string;
  name:       string;
  email:      string | null;
  phone:      string | null;
  poste:      string | null;
  score:      number | null;
  eventName:  string | null;
  briefId:    string | null;
  briefTitle: string | null;
  briefSent:  boolean;
  capturedAt: string;
};

// ---------------------------------------------------------------------------
// Lire les contacts Nomade du tenant (source = event)
// ---------------------------------------------------------------------------

export async function getNomadeContacts(): Promise<NomadeContact[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("pipeline_stages")
    .select(`
      id,
      entity_id,
      score,
      notes,
      moved_at,
      brief_id,
      briefs(title),
      entities!inner(first_name, last_name, email, metadata)
    `)
    .eq("tenant_id", tenantId)
    .eq("source", "event" satisfies AcquisitionSource)
    .order("moved_at", { ascending: false });

  if (error) throw new Error(`Impossible de charger les contacts : ${error.message}`);

  // Dédupliquer par entity_id (garder le plus récent)
  const seen = new Set<string>();
  const contacts: NomadeContact[] = [];

  for (const row of data ?? []) {
    if (seen.has(row.entity_id)) continue;
    seen.add(row.entity_id);

    const entity = row.entities as unknown as {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      metadata: Record<string, string> | null;
    } | null;
    const brief = row.briefs as unknown as { title: string } | null;
    const meta  = entity?.metadata ?? {};

    contacts.push({
      id:         row.id,
      entityId:   row.entity_id,
      name:       [entity?.first_name, entity?.last_name].filter(Boolean).join(" ") || "—",
      email:      entity?.email ?? null,
      phone:      meta["phone"] ?? null,
      poste:      meta["poste"] ?? null,
      score:      row.score ?? null,
      eventName:  meta["event_name"] ?? null,
      briefId:    row.brief_id ?? null,
      briefTitle: brief?.title ?? null,
      briefSent:  meta["brief_sent"] === "true",
      capturedAt: row.moved_at,
    });
  }

  return contacts;
}

// ---------------------------------------------------------------------------
// Capturer un contact terrain
// ---------------------------------------------------------------------------

const captureSchema = z.object({
  firstName:  z.string().trim().min(1, "Prénom requis"),
  lastName:   z.string().trim().default(""),
  email:      z.string().trim().email("Email invalide").or(z.literal("")),
  phone:      z.string().trim().default(""),
  poste:      z.string().trim().default(""),
  score:      z.coerce.number().min(1).max(5).nullable().default(null),
  eventName:  z.string().trim().default(""),
  briefId:    z.string().trim().default(""),
  notes:      z.string().trim().default(""),
});

export type CaptureResult = { success: true; contactId: string } | { success: false; error: string };

export async function captureNomadeContact(formData: FormData): Promise<CaptureResult> {
  try {
    const { userId, tenantId } = await getTenantContext();
    const input = captureSchema.parse(Object.fromEntries(formData));
    const admin = createAdminClient();

    const { data: entity, error: entityError } = await admin
      .from("entities")
      .insert({
        tenant_id:   tenantId,
        entity_type: "candidate",
        first_name:  input.firstName,
        last_name:   input.lastName || null,
        email:       input.email   || null,
        status:      "active",
        created_by:  userId,
        metadata: {
          poste:      input.poste      || null,
          phone:      input.phone      || null,
          event_name: input.eventName  || null,
          brief_sent: "false",
        },
        tags: ["nomade"],
      })
      .select("id")
      .single();

    if (entityError) return { success: false, error: entityError.message };

    const { data: ps, error: psError } = await admin
      .from("pipeline_stages")
      .insert({
        tenant_id: tenantId,
        entity_id: entity.id,
        stage:     "new" satisfies PipelineStage,
        source:    "event" satisfies AcquisitionSource,
        brief_id:  input.briefId || null,
        score:     input.score,
        notes:     input.notes || null,
        moved_by:  userId,
        moved_at:  new Date().toISOString(),
      })
      .select("id")
      .single();

    if (psError) {
      await admin.from("entities").delete().eq("id", entity.id);
      return { success: false, error: psError.message };
    }

    revalidatePath("/nomade");
    return { success: true, contactId: ps.id };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0]?.message ?? "Champs invalides." };
    }
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

// ---------------------------------------------------------------------------
// Envoyer le brief au candidat par email
// ---------------------------------------------------------------------------

export type SendBriefResult = { success: true } | { success: false; error: string };

export async function sendBriefToCandidate(
  entityId: string,
  briefId:  string,
): Promise<SendBriefResult> {
  try {
    const { tenantId } = await getTenantContext();
    const admin = createAdminClient();

    const [{ data: entity }, { data: brief }] = await Promise.all([
      admin.from("entities").select("first_name, last_name, email, metadata").eq("id", entityId).eq("tenant_id", tenantId).single(),
      admin.from("briefs").select("title, description").eq("id", briefId).eq("tenant_id", tenantId).single(),
    ]);

    if (!entity) return { success: false, error: "Contact introuvable." };
    if (!brief)  return { success: false, error: "Brief introuvable." };

    const email = entity.email as string | null;
    if (!email)  return { success: false, error: "Ce contact n'a pas d'email renseigné." };

    const firstName = entity.first_name as string ?? "";
    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    await brevoSendTemplate({
      templateId: BREVO_TEMPLATES.welcome,
      to: [{ email, name: `${firstName} ${entity.last_name ?? ""}`.trim() }],
      params: {
        PRENOM:       firstName,
        POSTE:        brief.title as string,
        DESCRIPTION:  (brief.description as string | null) ?? "",
        LIEN:         `${appUrl}/candidater/${briefId}`,
      },
    });

    // Marquer brief_sent dans les metadata
    const meta = ((entity.metadata as Record<string, string> | null) ?? {});
    await admin.from("entities").update({ metadata: { ...meta, brief_sent: "true" } }).eq("id", entityId);

    revalidatePath("/nomade");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

// ---------------------------------------------------------------------------
// Envoyer le briefing logistique au formateur
// ---------------------------------------------------------------------------

const trainerSchema = z.object({
  trainerEmail:    z.string().trim().email("Email formateur invalide"),
  trainerName:     z.string().trim().default("Formateur"),
  candidateName:   z.string().trim().min(1, "Nom du candidat requis"),
  trainingTitle:   z.string().trim().min(1, "Intitulé de la formation requis"),
  trainingDate:    z.string().trim().min(1, "Date requise"),
  trainingTime:    z.string().trim().default(""),
  room:            z.string().trim().default(""),
  parking:         z.string().trim().default(""),
  extraInfo:       z.string().trim().default(""),
});

export type TrainerBriefResult = { success: true } | { success: false; error: string };

export async function sendTrainerBriefing(formData: FormData): Promise<TrainerBriefResult> {
  try {
    const input = trainerSchema.parse(Object.fromEntries(formData));

    await brevoSendTemplate({
      templateId: BREVO_TEMPLATES.welcome,
      to: [{ email: input.trainerEmail, name: input.trainerName }],
      params: {
        PRENOM:         input.trainerName,
        CANDIDAT:       input.candidateName,
        FORMATION:      input.trainingTitle,
        DATE:           input.trainingDate,
        HEURE:          input.trainingTime,
        SALLE:          input.room,
        PARKING:        input.parking,
        INFOS:          input.extraInfo,
      },
    });

    return { success: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0]?.message ?? "Champs invalides." };
    }
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}
