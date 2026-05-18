"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateWorkspaceProfile } from "@/services/workspace-service";

export async function updateWorkspaceProfileAction(formData: FormData) {
  try {
    await updateWorkspaceProfile(formData);
  } catch (error) {
    console.error(error);
    redirect("/settings?error=workspace_profile_failed");
  }

  revalidatePath("/settings");
  redirect("/settings?updated=workspace_profile");
}
