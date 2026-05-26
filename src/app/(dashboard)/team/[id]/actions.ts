"use server";

import { revalidatePath } from "next/cache";
import { saveTeamMemberMeta, toggleTaskComplete } from "@/services/team-service";
import type { ObjectifsMap } from "@/services/team-service";

export type ActionResult = { success: true } | { success: false; error: string };

export async function saveObjectifsAction(
  entityId: string,
  objectifs: ObjectifsMap
): Promise<ActionResult> {
  try {
    await saveTeamMemberMeta(entityId, { objectifs });
    revalidatePath(`/team/${entityId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export async function saveNotesAction(
  entityId: string,
  notes: string
): Promise<ActionResult> {
  try {
    await saveTeamMemberMeta(entityId, { notes });
    revalidatePath(`/team/${entityId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export async function saveOutilsAction(
  entityId: string,
  outils: string[]
): Promise<ActionResult> {
  try {
    await saveTeamMemberMeta(entityId, { outils });
    revalidatePath(`/team/${entityId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export async function toggleTaskAction(
  taskId: string,
  onboardingId: string,
  isComplete: boolean
): Promise<ActionResult> {
  try {
    await toggleTaskComplete(taskId, onboardingId, isComplete);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
