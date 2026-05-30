import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitQuestionnaireResponse } from "@/services/questionnaire-service";

const schema = z.object({
  questionnaireId: z.string().uuid(),
  tenantId:        z.string().uuid(),
  respondentName:  z.string().default(""),
  respondentEmail: z.string().default(""),
  answers:         z.record(z.union([z.string(), z.array(z.string())])),
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

    const result = await submitQuestionnaireResponse({
      questionnaireId: input.questionnaireId,
      tenantId:        input.tenantId,
      respondentName:  input.respondentName,
      respondentEmail: input.respondentEmail,
      answers:         input.answers,
      questions:       input.questions as Parameters<typeof submitQuestionnaireResponse>[0]["questions"],
    });

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
