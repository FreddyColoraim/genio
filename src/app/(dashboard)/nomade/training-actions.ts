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
} from "@/services/questionnaire-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient }      from "@/lib/supabase/server";
import { onQuizSentToRookie } from "@/lib/brevo";

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

// ---------------------------------------------------------------------------
// Envoyer un quiz à tous les stagiaires d'une session (SMS + email pré-remplis)
// ---------------------------------------------------------------------------

export type SendQuizResult =
  | { success: true; sent: number; failed: number }
  | { success: false; error: string };

export async function sendQuizToRookiesAction(
  questionnaireId: string,
): Promise<SendQuizResult> {
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return { success: false, error: "Non authentifié." };

    const admin = createAdminClient();

    // Récupérer le questionnaire (titre + token + session_id + tenant_id)
    const { data: quiz, error: qErr } = await admin
      .from("questionnaires")
      .select("title, access_token, session_id, tenant_id")
      .eq("id", questionnaireId)
      .single();

    if (qErr || !quiz) return { success: false, error: "Questionnaire introuvable." };

    // Récupérer les assignments de la session liée
    const { data: assignments } = await admin
      .from("training_assignments")
      .select("entity_id, entities(first_name, last_name, email, metadata)")
      .eq("session_id",  quiz.session_id)
      .eq("tenant_id",   quiz.tenant_id);

    if (!assignments?.length) return { success: false, error: "Aucun stagiaire assigné à cette session." };

    let sent = 0;
    let failed = 0;

    for (const a of assignments) {
      const entity = a.entities as unknown as {
        first_name: string | null;
        last_name:  string | null;
        email:      string | null;
        metadata:   Record<string, string> | null;
      } | null;

      if (!entity) { failed++; continue; }

      const email     = entity.email ?? undefined;
      const phone     = entity.metadata?.["phone"] ?? undefined;
      const firstName = entity.first_name ?? undefined;
      const lastName  = entity.last_name  ?? undefined;

      if (!email && !phone) { failed++; continue; }

      await onQuizSentToRookie({
        email,
        phone,
        firstName,
        lastName,
        quizToken:  quiz.access_token as string,
        quizTitle:  quiz.title as string,
        entityId:   a.entity_id as string,
      }).catch(() => { failed++; });

      sent++;
    }

    revalidatePath("/nomade");
    return { success: true, sent, failed };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}
