"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createTrainingSession,
  assignSessionToEntity,
  completeAssignment,
  type TrainingType,
} from "@/services/training-service";
import {
  createQuestionnaire,
  correctResponse,
  type Question,
  type QuestionType,
} from "@/services/questionnaire-service";

// ---------------------------------------------------------------------------
// Créer une session de formation
// ---------------------------------------------------------------------------

const sessionSchema = z.object({
  title:           z.string().trim().min(1, "Titre requis"),
  type:            z.enum(["product","security","procedure","regulatory","other"]),
  description:     z.string().trim().default(""),
  durationMinutes: z.coerce.number().min(1).max(480).default(60),
  materialsUrl:    z.string().trim().url("URL invalide").or(z.literal("")).default(""),
});

export type CreateSessionResult = { success: true; id: string } | { success: false; error: string };

export async function createSessionAction(formData: FormData): Promise<CreateSessionResult> {
  try {
    const input = sessionSchema.parse(Object.fromEntries(formData));
    const sessionInput: Parameters<typeof createTrainingSession>[0] = {
      title:           input.title,
      type:            input.type as TrainingType,
      durationMinutes: input.durationMinutes,
    };
    if (input.description)  sessionInput.description  = input.description;
    if (input.materialsUrl) sessionInput.materialsUrl = input.materialsUrl;
    const { id } = await createTrainingSession(sessionInput);
    revalidatePath("/nomade");
    return { success: true, id };
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.errors[0]?.message ?? "Champs invalides." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

// ---------------------------------------------------------------------------
// Assigner une session à un rookie
// ---------------------------------------------------------------------------

export type AssignResult = { success: true } | { success: false; error: string };

export async function assignSessionAction(sessionId: string, entityId: string): Promise<AssignResult> {
  try {
    await assignSessionToEntity(sessionId, entityId);
    revalidatePath("/nomade");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

// ---------------------------------------------------------------------------
// Marquer une session comme complétée
// ---------------------------------------------------------------------------

export async function completeAssignmentAction(assignmentId: string): Promise<AssignResult> {
  try {
    await completeAssignment(assignmentId);
    revalidatePath("/nomade");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

// ---------------------------------------------------------------------------
// Créer un questionnaire
// ---------------------------------------------------------------------------

const quizSchema = z.object({
  title:       z.string().trim().min(1, "Titre requis"),
  description: z.string().trim().default(""),
  sessionId:   z.string().trim().default(""),
  questionsJson: z.string().min(2, "Questions requises"),
});

export type CreateQuizResult = { success: true; id: string; token: string } | { success: false; error: string };

export async function createQuizAction(formData: FormData): Promise<CreateQuizResult> {
  try {
    const input     = quizSchema.parse(Object.fromEntries(formData));
    const questions = JSON.parse(input.questionsJson) as Question[];

    const quizInput: Parameters<typeof createQuestionnaire>[0] = { title: input.title, questions };
    if (input.description) quizInput.description = input.description;
    if (input.sessionId)   quizInput.sessionId   = input.sessionId;
    const { id, accessToken } = await createQuestionnaire(quizInput);
    revalidatePath("/nomade");
    return { success: true, id, token: accessToken };
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.errors[0]?.message ?? "Champs invalides." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

// ---------------------------------------------------------------------------
// Corriger une réponse
// ---------------------------------------------------------------------------

const correctSchema = z.object({
  responseId:      z.string().uuid(),
  score:           z.coerce.number().min(0),
  maxScore:        z.coerce.number().min(0),
  correctionNotes: z.string().trim().default(""),
  entityId:        z.string().trim().default(""),
});

export type CorrectResult = { success: true } | { success: false; error: string };

export async function correctResponseAction(formData: FormData): Promise<CorrectResult> {
  try {
    const input = correctSchema.parse(Object.fromEntries(formData));
    const correctInput: Parameters<typeof correctResponse>[0] = {
      responseId:      input.responseId,
      score:           input.score,
      maxScore:        input.maxScore,
      correctionNotes: input.correctionNotes,
    };
    if (input.entityId) correctInput.entityId = input.entityId;
    await correctResponse(correctInput);
    revalidatePath("/nomade");
    return { success: true };
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.errors[0]?.message ?? "Champs invalides." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}
