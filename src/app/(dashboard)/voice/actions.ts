"use server";

import { revalidatePath } from "next/cache";
import { uploadVoiceAudio, processVoiceNote, confirmVoiceAction } from "@/services/voice-service";
import type { VoiceActionItem } from "@/types/database.types";

export type ProcessVoiceNoteResult =
  | { success: true; noteId: string; transcript: string; summary: string; actionItems: VoiceActionItem[] }
  | { success: false; error: string };

export async function uploadAndProcessVoiceNoteAction(
  formData: FormData
): Promise<ProcessVoiceNoteResult> {
  try {
    // 1. Upload audio
    const { audioUrl, storagePath, noteId } = await uploadVoiceAudio(formData);

    // 2. Transcribe + Claude processing
    const { transcript, summary, actionItems } = await processVoiceNote(noteId, audioUrl, storagePath);

    return { success: true, noteId, transcript, summary, actionItems };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return { success: false, error: message };
  }
}

export type ConfirmActionResult =
  | { success: true; type: string; id: string }
  | { success: false; error: string };

export async function confirmVoiceActionAction(
  noteId: string,
  action: VoiceActionItem
): Promise<ConfirmActionResult> {
  try {
    const result = await confirmVoiceAction(noteId, action);
    revalidatePath("/dashboard");
    revalidatePath("/employees");
    return { success: true, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return { success: false, error: message };
  }
}
