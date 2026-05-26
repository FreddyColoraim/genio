"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Vertical } from "@/types/database.types";

const entityInputSchema = z.object({
  firstName:  z.string().trim().min(1),
  lastName:   z.string().trim().min(1),
  email:      z.string().trim().email(),
  title:      z.string().trim().min(1),
  department: z.string().trim().optional(),
  startDate:  z.string().trim().min(1),
});

// ---------------------------------------------------------------------------
// Onboarding templates par vertical
// ---------------------------------------------------------------------------

type StepTemplate = { title: string; description: string };

const commonSteps: StepTemplate[] = [
  { title: "Candidature validée",           description: "Confirmer le passage du candidat vers le parcours d'arrivée." },
  { title: "Mail de bienvenue envoyé",       description: "Envoyer le message de bienvenue avec les prochaines informations." },
  { title: "RDV manager planifié",           description: "Caler le premier échange entre le manager et le futur collaborateur." },
  { title: "Documents d'arrivée demandés",  description: "Demander les documents nécessaires au dossier RH." },
];

const stepsByVertical: Record<string, StepTemplate[]> = {
  rh: [
    ...commonSteps,
    { title: "Matériel et accès préparés",   description: "Préparer ordinateur, email, outils internes et accès nécessaires." },
    { title: "Planning première semaine",    description: "Planifier les points manager, rencontres équipe et premières priorités." },
    { title: "Objectifs 30 jours définis",   description: "Clarifier les attentes et livrables du premier mois." },
  ],
  craft: [
    ...commonSteps,
    { title: "Permis et habilitations vérifiés", description: "Contrôler les permis, attestations et documents nécessaires." },
    { title: "Zones d'intervention définies",    description: "Valider le secteur géographique et les clients." },
    { title: "Consignes sécurité transmises",    description: "Partager les règles sécurité, procédures incident et contacts clés." },
  ],
  field: [
    ...commonSteps,
    { title: "Planning hebdo confirmé",    description: "Valider les créneaux et bénéficiaires assignés." },
    { title: "Tournée de découverte",      description: "Accompagner l'intervenant sur sa première tournée." },
    { title: "Bilan première semaine",     description: "Point retour après les premiers jours terrain." },
  ],
};

function getStepsForVertical(vertical: string): StepTemplate[] {
  return stepsByVertical[vertical] ?? stepsByVertical.rh!;
}

// ---------------------------------------------------------------------------
// Helpers session
// ---------------------------------------------------------------------------

async function getTenantContext() {
  const sessionClient = await createClient();
  const { data: userData, error } = await sessionClient.auth.getUser();
  if (error || !userData.user) throw new Error("Vous devez être connecté.");

  const admin = createAdminClient();
  const { data: membership, error: memberError } = await admin
    .from("memberships")
    .select("tenant_id, role")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .single();

  if (memberError || !membership) throw new Error("Aucun tenant associé à votre compte.");

  const { data: tenant } = await admin
    .from("tenants")
    .select("vertical")
    .eq("id", membership.tenant_id)
    .single();

  return {
    userId:   userData.user.id,
    tenantId: membership.tenant_id as string,
    role:     membership.role as string,
    vertical: (tenant?.vertical ?? "rh") as Vertical,
  };
}

// ---------------------------------------------------------------------------
// Créer un candidat + onboarding
// ---------------------------------------------------------------------------

export async function createCandidate(formData: FormData) {
  const input = entityInputSchema.parse({
    firstName:  formData.get("firstName"),
    lastName:   formData.get("lastName"),
    email:      formData.get("email"),
    title:      formData.get("title"),
    department: formData.get("department") ?? undefined,
    startDate:  formData.get("startDate"),
  });

  const { userId, tenantId, role, vertical } = await getTenantContext();

  const writeRoles = new Set(["owner", "admin", "rh", "manager"]);
  if (!writeRoles.has(role)) throw new Error("Votre rôle ne permet pas d'ajouter un candidat.");

  const admin = createAdminClient();

  const { data: entity, error: entityError } = await admin
    .from("entities")
    .insert({
      tenant_id:   tenantId,
      entity_type: "candidate",
      first_name:  input.firstName,
      last_name:   input.lastName,
      email:       input.email,
      status:      "active",
      metadata:    { poste: input.title, departement: input.department ?? null },
      tags:        [],
      created_by:  userId,
    })
    .select("id")
    .single();

  if (entityError) throw new Error(`Impossible de créer le candidat : ${entityError.message}`);

  const { data: onboarding, error: onboardingError } = await admin
    .from("onboardings")
    .insert({
      tenant_id:      tenantId,
      entity_id:      entity.id,
      title:          `Onboarding — ${input.firstName} ${input.lastName}`,
      start_date:     input.startDate,
      status:         "in_progress",
      completion_pct: 0,
    })
    .select("id")
    .single();

  if (onboardingError) throw new Error(`Impossible de créer l'onboarding : ${onboardingError.message}`);

  const steps = getStepsForVertical(vertical);

  const { error: tasksError } = await admin.from("onboarding_tasks").insert(
    steps.map((step, i) => ({
      tenant_id:      tenantId,
      onboarding_id:  onboarding.id,
      title:          step.title,
      description:    step.description,
      priority:       i + 1,
      completed_at:   i === 0 ? new Date().toISOString() : null,
      completed_by:   i === 0 ? userId : null,
    }))
  );

  if (tasksError) throw new Error(`Impossible de créer les étapes : ${tasksError.message}`);

  await refreshOnboardingProgress(admin, onboarding.id, tenantId);
}

// ---------------------------------------------------------------------------
// Valider une étape d'onboarding
// ---------------------------------------------------------------------------

export async function completeOnboardingTask(formData: FormData) {
  const taskId = z.string().uuid().parse(formData.get("taskId"));
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data: task, error: taskError } = await admin
    .from("onboarding_tasks")
    .select("onboarding_id")
    .eq("id", taskId)
    .eq("tenant_id", tenantId)
    .single();

  if (taskError) throw new Error(`Étape introuvable : ${taskError.message}`);

  const { error: updateError } = await admin
    .from("onboarding_tasks")
    .update({ completed_at: new Date().toISOString(), completed_by: userId })
    .eq("id", taskId)
    .eq("tenant_id", tenantId);

  if (updateError) throw new Error(`Impossible de valider l'étape : ${updateError.message}`);

  await refreshOnboardingProgress(admin, task.onboarding_id, tenantId);
}

// ---------------------------------------------------------------------------
// Recalcul progression
// ---------------------------------------------------------------------------

async function refreshOnboardingProgress(
  admin: ReturnType<typeof createAdminClient>,
  onboardingId: string,
  tenantId: string,
) {
  const { data: tasks } = await admin
    .from("onboarding_tasks")
    .select("completed_at")
    .eq("onboarding_id", onboardingId)
    .eq("tenant_id", tenantId);

  const total     = tasks?.length ?? 0;
  const completed = tasks?.filter((t) => t.completed_at !== null).length ?? 0;
  const pct       = total ? Math.round((completed / total) * 100) : 0;
  const status    = pct === 100 ? "completed" : "in_progress";

  await admin
    .from("onboardings")
    .update({ completion_pct: pct, status })
    .eq("id", onboardingId);
}
