import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/roles";

const employeeInputSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  title: z.string().trim().min(2),
  department: z.string().trim().min(2),
  managerName: z.string().trim().optional(),
  startDate: z.string().trim().min(1)
});

type ProfileRow = {
  role: UserRole;
  workspace_id: string | null;
};

const employeeWriteRoles = new Set<UserRole>(["admin", "hr", "manager"]);

const defaultOnboardingSteps = [
  {
    title: "Candidature validée",
    description: "Confirmer le passage du candidat vers le parcours d'arrivée."
  },
  {
    title: "Mail candidat envoyé",
    description: "Envoyer le message de bienvenue avec les prochaines informations."
  },
  {
    title: "RDV téléphonique manager planifié",
    description: "Caler le premier échange entre le manager et le futur collaborateur."
  },
  {
    title: "Documents d'arrivée demandés",
    description: "Demander les documents nécessaires au dossier RH."
  },
  {
    title: "Jour d'arrivée préparé",
    description: "Vérifier le planning, le matériel et les accès de base."
  }
] as const;

export async function createEmployee(formData: FormData) {
  const input = employeeInputSchema.parse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    title: formData.get("title"),
    department: formData.get("department"),
    managerName: formData.get("managerName"),
    startDate: formData.get("startDate")
  });

  const sessionClient = await createClient();
  const { data: userData, error: userError } = await sessionClient.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Vous devez être connecté pour ajouter un collaborateur.");
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", userData.user.id)
    .single();

  if (profileError) {
    throw new Error(`Impossible de charger le profil utilisateur: ${profileError.message}`);
  }

  const typedProfile = profile as ProfileRow;

  if (!typedProfile.workspace_id) {
    throw new Error("Aucun workspace n'est associé à votre profil.");
  }

  if (!employeeWriteRoles.has(typedProfile.role)) {
    throw new Error("Votre rôle ne permet pas d'ajouter un collaborateur.");
  }

  const { data: employee, error: insertError } = await adminClient
    .from("employees")
    .insert({
      workspace_id: typedProfile.workspace_id,
      full_name: input.fullName,
      email: input.email,
      title: input.title,
      department: input.department,
      manager_name: input.managerName || null,
      start_date: input.startDate,
      status: "not_started",
      progress: 0
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Impossible de créer le collaborateur: ${insertError.message}`);
  }

  const { error: stepsError } = await adminClient.from("employee_onboarding_steps").insert(
    defaultOnboardingSteps.map((step, index) => ({
      employee_id: employee.id,
      workspace_id: typedProfile.workspace_id,
      title: step.title,
      description: step.description,
      position: index + 1,
      status: index === 0 ? "done" : "todo",
      completed_at: index === 0 ? new Date().toISOString() : null
    }))
  );

  if (stepsError) {
    if (isMissingOnboardingStepsTable(stepsError)) {
      return;
    }

    throw new Error(`Impossible de créer les étapes d'onboarding: ${stepsError.message}`);
  }

  await refreshEmployeeOnboardingProgress(adminClient, employee.id);
}

export async function completeOnboardingStep(formData: FormData) {
  const stepId = z.string().uuid().parse(formData.get("stepId"));
  const { workspaceId } = await getCurrentWorkspace();
  const adminClient = createAdminClient();

  const { data: step, error: stepError } = await adminClient
    .from("employee_onboarding_steps")
    .select("employee_id")
    .eq("id", stepId)
    .eq("workspace_id", workspaceId)
    .single();

  if (stepError) {
    throw new Error(`Impossible de charger l'étape: ${stepError.message}`);
  }

  const { error: updateError } = await adminClient
    .from("employee_onboarding_steps")
    .update({
      completed_at: new Date().toISOString(),
      status: "done"
    })
    .eq("id", stepId)
    .eq("workspace_id", workspaceId);

  if (updateError) {
    throw new Error(`Impossible de valider l'étape: ${updateError.message}`);
  }

  await refreshEmployeeOnboardingProgress(adminClient, String(step.employee_id));
}

async function getCurrentWorkspace() {
  const sessionClient = await createClient();
  const { data: userData, error: userError } = await sessionClient.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Vous devez être connecté.");
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", userData.user.id)
    .single();

  if (profileError) {
    throw new Error(`Impossible de charger le profil utilisateur: ${profileError.message}`);
  }

  const typedProfile = profile as ProfileRow;

  if (!typedProfile.workspace_id) {
    throw new Error("Aucun workspace n'est associé à votre profil.");
  }

  if (!employeeWriteRoles.has(typedProfile.role)) {
    throw new Error("Votre rôle ne permet pas de modifier l'onboarding.");
  }

  return { workspaceId: typedProfile.workspace_id };
}

async function refreshEmployeeOnboardingProgress(
  adminClient: ReturnType<typeof createAdminClient>,
  employeeId: string
) {
  const { data: steps, error: stepsError } = await adminClient
    .from("employee_onboarding_steps")
    .select("status")
    .eq("employee_id", employeeId);

  if (stepsError) {
    throw new Error(`Impossible de recalculer la progression: ${stepsError.message}`);
  }

  const totalSteps = steps.length;
  const completedSteps = steps.filter((step) => step.status === "done").length;
  const progress = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const status =
    progress === 100 ? "complete" : progress > 0 ? "in_progress" : "not_started";

  const { error: employeeError } = await adminClient
    .from("employees")
    .update({ progress, status })
    .eq("id", employeeId);

  if (employeeError) {
    throw new Error(`Impossible de mettre à jour la progression: ${employeeError.message}`);
  }
}

function isMissingOnboardingStepsTable(error: {
  code?: string | undefined;
  message?: string | undefined;
}) {
  return error.code === "42P01" || Boolean(error.message?.includes("employee_onboarding_steps"));
}
