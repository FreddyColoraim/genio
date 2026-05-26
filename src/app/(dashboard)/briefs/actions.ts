"use server";

import { revalidatePath } from "next/cache";
import { createBrief, updateBrief, updateBriefStatus } from "@/services/brief-service";
import type { BriefItem, BriefStatus } from "@/services/brief-service";

export type BriefActionResult =
  | { success: true; brief: BriefItem }
  | { success: false; error: string };

export async function createBriefAction(formData: FormData): Promise<BriefActionResult> {
  try {
    const brief = await createBrief(formData);
    revalidatePath("/briefs");
    return { success: true, brief };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export async function updateBriefAction(
  id: string,
  formData: FormData
): Promise<BriefActionResult> {
  try {
    const brief = await updateBrief(id, formData);
    revalidatePath("/briefs");
    return { success: true, brief };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export type StatusActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateBriefStatusAction(
  id: string,
  status: BriefStatus
): Promise<StatusActionResult> {
  try {
    await updateBriefStatus(id, status);
    revalidatePath("/briefs");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
