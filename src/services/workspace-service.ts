import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/roles";
import type { WorkspaceIndustry, WorkspaceProfile } from "@/types/workspace";

type ProvisionWorkspaceInput = {
  email: string;
  industry?: WorkspaceIndustry | null;
  userId: string;
  workspaceName: string;
};

type ProfileRow = {
  role: UserRole;
  workspace_id: string | null;
};

type WorkspaceRow = {
  id: string;
  name: string;
  industry: WorkspaceIndustry | null;
  team_size: string | null;
  operating_mode: string | null;
};

export async function provisionSignupWorkspace({
  email,
  industry,
  userId,
  workspaceName
}: ProvisionWorkspaceInput) {
  const supabase = createAdminClient();
  const name = workspaceName.trim() || `${email.split("@")[0] ?? "Nexo"} Workspace`;

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfileError) {
    throw new Error(`Unable to check existing profile: ${existingProfileError.message}`);
  }

  if (existingProfile) {
    return;
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ name })
    .select("id")
    .single();

  if (workspaceError) {
    throw new Error(`Unable to create workspace: ${workspaceError.message}`);
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    workspace_id: workspace.id,
    full_name: email,
    role: "admin"
  });

  if (profileError) {
    throw new Error(`Unable to create profile: ${profileError.message}`);
  }

  const { error: workspaceOwnerError } = await supabase
    .from("workspaces")
    .update({ created_by: userId, industry: industry ?? null })
    .eq("id", workspace.id);

  if (workspaceOwnerError) {
    if (isMissingWorkspaceProfileColumns(workspaceOwnerError)) {
      const { error: fallbackWorkspaceOwnerError } = await supabase
        .from("workspaces")
        .update({ created_by: userId })
        .eq("id", workspace.id);

      if (fallbackWorkspaceOwnerError) {
        throw new Error(`Unable to assign workspace owner: ${fallbackWorkspaceOwnerError.message}`);
      }

      return;
    }

    throw new Error(`Unable to assign workspace owner: ${workspaceOwnerError.message}`);
  }
}

export async function getWorkspaceProfile(): Promise<WorkspaceProfile | null> {
  const { workspaceId } = await getCurrentWorkspace();
  const supabase = createAdminClient();
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, name, industry, team_size, operating_mode")
    .eq("id", workspaceId)
    .single();

  if (error) {
    if (isMissingWorkspaceProfileColumns(error)) {
      const { data: fallbackWorkspace, error: fallbackError } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("id", workspaceId)
        .single();

      if (fallbackError) {
        throw new Error(`Unable to load workspace profile: ${fallbackError.message}`);
      }

      const typedFallbackWorkspace = fallbackWorkspace as Pick<WorkspaceRow, "id" | "name">;

      return {
        id: typedFallbackWorkspace.id,
        name: typedFallbackWorkspace.name,
        industry: "services",
        teamSize: "",
        operatingMode: ""
      };
    }

    throw new Error(`Unable to load workspace profile: ${error.message}`);
  }

  const typedWorkspace = workspace as WorkspaceRow;

  return {
    id: typedWorkspace.id,
    name: typedWorkspace.name,
    industry: typedWorkspace.industry ?? "services",
    teamSize: typedWorkspace.team_size ?? "",
    operatingMode: typedWorkspace.operating_mode ?? ""
  };
}

export async function updateWorkspaceProfile(formData: FormData) {
  const { workspaceId } = await getCurrentWorkspace(["admin", "hr"]);
  const industry = String(formData.get("industry") ?? "services") as WorkspaceIndustry;
  const teamSize = String(formData.get("teamSize") ?? "").trim();
  const operatingMode = String(formData.get("operatingMode") ?? "").trim();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("workspaces")
    .update({
      industry,
      team_size: teamSize || null,
      operating_mode: operatingMode || null
    })
    .eq("id", workspaceId);

  if (error) {
    throw new Error(`Unable to update workspace profile: ${error.message}`);
  }
}

async function getCurrentWorkspace(allowedRoles: UserRole[] = ["admin", "hr", "manager"]) {
  const sessionClient = await createClient();
  const { data: userData, error: userError } = await sessionClient.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Vous devez être connecté.");
  }

  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", userData.user.id)
    .single();

  if (profileError) {
    throw new Error(`Unable to load profile: ${profileError.message}`);
  }

  const typedProfile = profile as ProfileRow;

  if (!typedProfile.workspace_id) {
    throw new Error("Aucun workspace n'est associé à votre profil.");
  }

  if (!allowedRoles.includes(typedProfile.role)) {
    throw new Error("Votre rôle ne permet pas de modifier ce workspace.");
  }

  return { workspaceId: typedProfile.workspace_id };
}

function isMissingWorkspaceProfileColumns(error: {
  code?: string | undefined;
  message?: string | undefined;
}) {
  return (
    error.code === "42703" ||
    Boolean(error.message?.includes("industry") || error.message?.includes("team_size"))
  );
}
