"use server";

import { revalidatePath } from "next/cache";
import {
  moveCandidateStage,
  addCandidateToPipeline,
} from "@/services/pipeline-service";
import type { CandidateCard, PipelineStage } from "@/services/pipeline-service";

export type MoveResult =
  | { success: true }
  | { success: false; error: string };

export async function moveCandidateAction(
  entityId: string,
  newStage: PipelineStage,
  briefId: string | null
): Promise<MoveResult> {
  try {
    await moveCandidateStage(entityId, newStage, briefId);
    revalidatePath("/pipeline");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export type AddCandidateResult =
  | { success: true; card: CandidateCard }
  | { success: false; error: string };

export async function addCandidateAction(formData: FormData): Promise<AddCandidateResult> {
  try {
    const card = await addCandidateToPipeline(formData);
    revalidatePath("/pipeline");
    return { success: true, card };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
