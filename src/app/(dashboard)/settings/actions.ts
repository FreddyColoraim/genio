"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateWorkspaceProfile, updateTenantName } from "@/services/workspace-service";
import { inviteMember, updateMemberRole, removeMember } from "@/services/members-service";
import type { MemberRole } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Workspace profile
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tenant name
// ---------------------------------------------------------------------------

export async function updateTenantNameAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const name = String(formData.get("name") ?? "").trim();
    await updateTenantName(name);
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

// ---------------------------------------------------------------------------
// Members — invite
// ---------------------------------------------------------------------------

export async function inviteMemberAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const role  = String(formData.get("role") ?? "member") as MemberRole;
    await inviteMember(email, role);
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

// ---------------------------------------------------------------------------
// Members — update role
// ---------------------------------------------------------------------------

export async function updateMemberRoleAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const membershipId = String(formData.get("membershipId") ?? "");
    const role         = String(formData.get("role") ?? "member") as MemberRole;
    await updateMemberRole(membershipId, role);
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

// ---------------------------------------------------------------------------
// Members — remove
// ---------------------------------------------------------------------------

export async function removeMemberAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const membershipId = String(formData.get("membershipId") ?? "");
    await removeMember(membershipId);
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
