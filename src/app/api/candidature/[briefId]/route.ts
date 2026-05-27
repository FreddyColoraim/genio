import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

// Route publique — aucune session requise
// Utilisée par le formulaire QR Code Salon (Nomade)

const schema = z.object({
  firstName: z.string().min(1, "Le prénom est obligatoire.").max(100),
  lastName:  z.string().min(1, "Le nom est obligatoire.").max(100),
  email:     z.string().email("Email invalide."),
  phone:     z.string().max(30).optional(),
  message:   z.string().max(2000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ briefId: string }> }
) {
  try {
    const { briefId } = await params;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Données invalides.";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    const { firstName, lastName, email, phone, message } = parsed.data;
    const admin = createAdminClient();

    // Vérifier que le brief existe et est ouvert
    const { data: brief } = await admin
      .from("briefs")
      .select("id, title, tenant_id, status")
      .eq("id", briefId)
      .eq("status", "open")
      .maybeSingle();

    if (!brief) {
      return NextResponse.json(
        { error: "Ce brief n'est plus disponible ou a été clôturé." },
        { status: 404 }
      );
    }

    const tenantId = brief.tenant_id as string;

    // Vérifier qu'un candidat avec cet email n'existe pas déjà pour ce brief
    const { data: existing } = await admin
      .from("entities")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .eq("entity_type", "candidate")
      .maybeSingle();

    let entityId: string;

    if (existing) {
      // Réutiliser l'entité existante
      entityId = existing.id as string;
    } else {
      // Créer une nouvelle entité candidat
      const phoneNote  = phone   ? `Tél : ${phone}`     : null;
      const motiv      = message ? `Motivation : ${message}` : null;
      const extraNotes = [phoneNote, motiv].filter(Boolean).join("\n") || null;

      const { data: entity, error: entityErr } = await admin
        .from("entities")
        .insert({
          tenant_id:   tenantId,
          entity_type: "candidate",
          first_name:  firstName,
          last_name:   lastName,
          email,
          status:      "active",
          notes:       extraNotes,
        })
        .select("id")
        .single();

      if (entityErr || !entity) {
        console.error("[candidature] entity insert:", entityErr);
        return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
      }

      entityId = entity.id as string;
    }

    // Composer les notes pipeline
    const notesLines = [
      `QR Code Salon — ${brief.title}`,
      phone   ? `Tél : ${phone}`   : null,
      message ? `Message : ${message}` : null,
    ].filter(Boolean);

    // Insérer dans pipeline_stages
    const { error: pipelineErr } = await admin
      .from("pipeline_stages")
      .insert({
        tenant_id: tenantId,
        entity_id: entityId,
        stage:     "new",
        source:    "event",
        brief_id:  briefId,
        notes:     notesLines.join("\n"),
        moved_at:  new Date().toISOString(),
        // moved_by intentionnellement absent (candidature externe)
      });

    if (pipelineErr) {
      console.error("[candidature] pipeline insert:", pipelineErr);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[candidature] unexpected:", err);
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
