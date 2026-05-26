"use server";

import { revalidatePath } from "next/cache";
import { updateProfileName, updatePassword, uploadAvatar } from "@/services/profile-service";

export type ActionResult = { success: true } | { success: false; error: string };

export async function updateProfileNameAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = String(formData.get("fullName") ?? "").trim();
    await updateProfileName(name);
    revalidatePath("/settings/profile");
    revalidatePath("/dashboard");  // refreshes the layout header
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  try {
    const current = String(formData.get("currentPassword") ?? "");
    const next    = String(formData.get("newPassword") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");
    if (next !== confirm) return { success: false, error: "Les mots de passe ne correspondent pas." };
    await updatePassword(current, next);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult & { url?: string }> {
  try {
    const file = formData.get("avatar");
    if (!(file instanceof File)) return { success: false, error: "Fichier manquant." };
    const url = await uploadAvatar(file);
    revalidatePath("/settings/profile");
    return { success: true, url };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
