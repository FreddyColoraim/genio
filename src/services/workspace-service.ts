import { createAdminClient } from "@/lib/supabase/admin";

type ProvisionWorkspaceInput = {
  email: string;
  userId: string;
  workspaceName: string;
};

export async function provisionSignupWorkspace({
  email,
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
    .update({ created_by: userId })
    .eq("id", workspace.id);

  if (workspaceOwnerError) {
    throw new Error(`Unable to assign workspace owner: ${workspaceOwnerError.message}`);
  }
}
