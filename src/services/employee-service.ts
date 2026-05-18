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

  const { error: insertError } = await adminClient.from("employees").insert({
    workspace_id: typedProfile.workspace_id,
    full_name: input.fullName,
    email: input.email,
    title: input.title,
    department: input.department,
    manager_name: input.managerName || null,
    start_date: input.startDate,
    status: "not_started",
    progress: 0
  });

  if (insertError) {
    throw new Error(`Impossible de créer le collaborateur: ${insertError.message}`);
  }
}
