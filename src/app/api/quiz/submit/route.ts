import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitQuestionnaireResponse } from "@/services/questionnaire-service";

const schema = z.object({
  questionnaireId: z.string().uuid(),
  tenantId:        z.string().uuid(),
  respondentName:  z.string().default(""),
  respondentEmail: z.string().default(""),
  answers:         z.record(z.union([z.string(), z.array(z.string())])),
  entityId:        z.string().uuid().optional(),
  questions:       z.array(z.object({
    id:       z.string(),
    type:     z.string(),
    label:    z.string(),
    options:  z.array(z.string()).optional(),
    correct:  z.union([z.string(), z.array(z.string())]).optional(),
    required: z.boolean().default(true),
  })),
});

export async function POST(req: NextRequest) {
  try {
    const body  = await req.json();
    const input = schema.parse(body);

    const submitInput: Parameters<typeof submitQuestionnaireResponse>[0] = {
      questionnaireId: input.questionnaireId,
      tenantId:        input.tenantId,
      respondentName:  input.respondentName,
      respondentEmail: input.respondentEmail,
      answers:         input.answers,
      questions:       input.questions as Parameters<typeof submitQuestionnaireResponse>[0]["questions"],
    };
    if (input.entityId) submitInput.entityId = input.entityId;

    const result = await submitQuestionnaireResponse(submitInput);

    // ── Auto-push vers profil Nexo si entityId + score calculable ─────────
    if (input.entityId && result.maxScore > 0) {
      await autoPushToNexo({
        entityId:        input.entityId,
        tenantId:        input.tenantId,
        responseId:      result.id,
        questionnaireId: input.questionnaireId,
        score:           result.score,
        maxScore:        result.maxScore,
      }).catch((err) => {
        // Non-bloquant
        console.error("[quiz/submit] auto-push failed:", err);
      });
    }

    return NextResponse.json({ id: result.id, score: result.score, maxScore: result.maxScore });
  } catch (err) {
    console.error("[quiz/submit]", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Auto-push score → entity.metadata.quiz_scores
// ---------------------------------------------------------------------------

async function autoPushToNexo(params: {
  entityId:        string;
  tenantId:        string;
  responseId:      string;
  questionnaireId: string;
  score:           number;
  maxScore:        number;
}) {
  const admin = createAdminClient();

  const { data: entity } = await admin
    .from("entities")
    .select("metadata")
    .eq("id", params.entityId)
    .eq("tenant_id", params.tenantId)
    .single();

  if (!entity) return;

  const meta       = (entity.metadata as Record<string, unknown> | null) ?? {};
  const quizScores = (meta["quiz_scores"] as Record<string, unknown> | null) ?? {};

  quizScores[params.responseId] = {
    questionnaireId: params.questionnaireId,
    score:           params.score,
    maxScore:        params.maxScore,
    pct:             Math.round((params.score / params.maxScore) * 100),
    autoCorrecte:    true,
    at:              new Date().toISOString(),
  };

  await admin
    .from("entities")
    .update({ metadata: { ...meta, quiz_scores: quizScores } })
    .eq("id", params.entityId)
    .eq("tenant_id", params.tenantId);

  // Marquer la réponse comme auto-corrigée
  await admin
    .from("questionnaire_responses")
    .update({
      entity_id:        params.entityId,
      corrected_at:     new Date().toISOString(),
      correction_notes: "Auto-corrected",
    })
    .eq("id", params.responseId);
}
