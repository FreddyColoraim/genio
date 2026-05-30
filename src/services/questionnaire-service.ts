import { createAdminClient } from "@/lib/supabase/admin";
import { createClient }      from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuestionType = "text" | "single" | "multiple" | "yesno" | "number";

export type Question = {
  id:       string;
  type:     QuestionType;
  label:    string;
  options?: string[];   // pour single / multiple
  correct?: string | string[]; // réponse(s) correcte(s) pour l'auto-correction
  required: boolean;
};

export type Questionnaire = {
  id:          string;
  title:       string;
  description: string | null;
  sessionId:   string | null;
  sessionTitle:string | null;
  questions:   Question[];
  accessToken: string;
  isActive:    boolean;
  createdAt:   string;
  responseCount: number;
};

export type QuestionnaireResponse = {
  id:               string;
  questionnaireId:  string;
  entityId:         string | null;
  respondentName:   string | null;
  respondentEmail:  string | null;
  answers:          Record<string, string | string[]>;
  score:            number | null;
  maxScore:         number | null;
  passThreshold:    number | null;
  correctedAt:      string | null;
  correctionNotes:  string | null;
  submittedAt:      string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getTenantContext() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) throw new Error("Non authentifié.");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!membership) throw new Error("Aucun workspace.");
  return { userId: user.id, tenantId: membership.tenant_id as string };
}

// ---------------------------------------------------------------------------
// CRUD Questionnaires
// ---------------------------------------------------------------------------

export async function getQuestionnaires(): Promise<Questionnaire[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("questionnaires")
    .select("*, training_sessions(title), questionnaire_responses(count)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const session = row.training_sessions as unknown as { title: string } | null;
    return {
      id:            row.id,
      title:         row.title,
      description:   row.description ?? null,
      sessionId:     row.session_id ?? null,
      sessionTitle:  session?.title ?? null,
      questions:     (row.questions as unknown as Question[]) ?? [],
      accessToken:   row.access_token,
      isActive:      row.is_active,
      createdAt:     row.created_at,
      responseCount: (row.questionnaire_responses as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    };
  });
}

export async function createQuestionnaire(input: {
  title:       string;
  description?: string;
  sessionId?:  string;
  questions:   Question[];
}): Promise<{ id: string; accessToken: string }> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("questionnaires")
    .insert({
      tenant_id:  tenantId,
      title:      input.title,
      description:input.description ?? null,
      session_id: input.sessionId   ?? null,
      questions:  input.questions as unknown as object,
      created_by: userId,
    })
    .select("id, access_token")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, accessToken: data.access_token };
}

export async function updateQuestionnaire(id: string, questions: Question[]): Promise<void> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { error } = await admin
    .from("questionnaires")
    .update({ questions: questions as unknown as object })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Lecture publique par token (sans auth — pour /quiz/[token])
// ---------------------------------------------------------------------------

export async function getQuestionnaireByToken(token: string): Promise<{
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
  tenantId: string;
} | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("questionnaires")
    .select("id, title, description, questions, tenant_id")
    .eq("access_token", token)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  return {
    id:          data.id,
    title:       data.title,
    description: data.description ?? null,
    questions:   (data.questions as unknown as Question[]) ?? [],
    tenantId:    data.tenant_id,
  };
}

// ---------------------------------------------------------------------------
// Soumettre des réponses (sans auth)
// ---------------------------------------------------------------------------

export async function submitQuestionnaireResponse(input: {
  questionnaireId: string;
  tenantId:        string;
  respondentName:  string;
  respondentEmail: string;
  answers:         Record<string, string | string[]>;
  questions:       Question[];
  entityId?:       string;
}): Promise<{ id: string; score: number; maxScore: number }> {
  const admin = createAdminClient();

  // Auto-correction sur les questions avec réponse correcte définie
  let score = 0;
  let maxScore = 0;

  for (const q of input.questions) {
    if (!q.correct) continue;
    maxScore++;
    const given   = input.answers[q.id];
    const correct = q.correct;

    if (Array.isArray(correct)) {
      const givenArr = (Array.isArray(given) ? given : [given]).sort();
      const corrArr  = [...correct].sort();
      if (JSON.stringify(givenArr) === JSON.stringify(corrArr)) score++;
    } else {
      if (String(given ?? "").trim().toLowerCase() === correct.toLowerCase()) score++;
    }
  }

  const { data, error } = await admin
    .from("questionnaire_responses")
    .insert({
      tenant_id:        input.tenantId,
      questionnaire_id: input.questionnaireId,
      entity_id:        input.entityId ?? null,
      respondent_name:  input.respondentName  || null,
      respondent_email: input.respondentEmail || null,
      answers:          input.answers as unknown as object,
      score:            maxScore > 0 ? score    : null,
      max_score:        maxScore > 0 ? maxScore : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, score, maxScore };
}

// ---------------------------------------------------------------------------
// Lire les réponses (formateur)
// ---------------------------------------------------------------------------

export async function getQuestionnaireResponses(questionnaireId: string): Promise<QuestionnaireResponse[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("questionnaire_responses")
    .select("*")
    .eq("questionnaire_id", questionnaireId)
    .eq("tenant_id", tenantId)
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id:              row.id,
    questionnaireId: row.questionnaire_id,
    entityId:        row.entity_id ?? null,
    respondentName:  row.respondent_name ?? null,
    respondentEmail: row.respondent_email ?? null,
    answers:         (row.answers as unknown as Record<string, string | string[]>) ?? {},
    score:           row.score ?? null,
    maxScore:        row.max_score ?? null,
    passThreshold:   row.pass_threshold ?? null,
    correctedAt:     row.corrected_at ?? null,
    correctionNotes: row.correction_notes ?? null,
    submittedAt:     row.submitted_at,
  }));
}

// ---------------------------------------------------------------------------
// Corriger une réponse + pousser vers le profil de l'entité
// ---------------------------------------------------------------------------

export async function correctResponse(input: {
  responseId:      string;
  score:           number;
  maxScore:        number;
  correctionNotes: string;
  entityId?:       string;
}): Promise<void> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  await admin
    .from("questionnaire_responses")
    .update({
      score:            input.score,
      max_score:        input.maxScore,
      correction_notes: input.correctionNotes,
      corrected_at:     new Date().toISOString(),
      corrected_by:     userId,
    })
    .eq("id", input.responseId)
    .eq("tenant_id", tenantId);

  // Push sur le profil de l'entité si on a un entityId
  if (input.entityId) {
    const { data: entity } = await admin
      .from("entities")
      .select("metadata")
      .eq("id", input.entityId)
      .eq("tenant_id", tenantId)
      .single();

    const meta = (entity?.metadata as Record<string, unknown> | null) ?? {};
    const quizScores = (meta["quiz_scores"] as Record<string, unknown> | null) ?? {};

    quizScores[input.responseId] = {
      score:    input.score,
      maxScore: input.maxScore,
      pct:      input.maxScore > 0 ? Math.round((input.score / input.maxScore) * 100) : null,
      notes:    input.correctionNotes,
      at:       new Date().toISOString(),
    };

    await admin
      .from("entities")
      .update({ metadata: { ...meta, quiz_scores: quizScores } })
      .eq("id", input.entityId)
      .eq("tenant_id", tenantId);
  }
}
