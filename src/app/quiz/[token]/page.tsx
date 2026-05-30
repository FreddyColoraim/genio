export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuestionnaireByToken } from "@/services/questionnaire-service";
import { QuizForm } from "./quiz-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const quiz = await getQuestionnaireByToken(token);
  return {
    title: quiz ? `${quiz.title} | Nexo RH` : "Questionnaire",
    description: quiz?.description ?? "Répondez à ce questionnaire.",
  };
}

export default async function QuizPage({
  params,
  searchParams,
}: {
  params:       Promise<{ token: string }>;
  searchParams: Promise<{ eid?: string; name?: string }>;
}) {
  const { token }         = await params;
  const { eid, name }     = await searchParams;
  const quiz = await getQuestionnaireByToken(token);

  if (!quiz) return notFound();

  // Si eid fourni → stagiaire identifié, nom pré-rempli
  const prefillName = name ? decodeURIComponent(name) : "";
  const entityId    = eid  ?? null;

  return (
    <div className="min-h-screen bg-warm px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">

        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue/10">
            <svg className="size-6 fill-current text-blue" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-sm text-muted-foreground">{quiz.description}</p>
          )}

          {/* Badge stagiaire identifié */}
          {prefillName ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-green-700">
                Bonjour, {prefillName} 👋
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {quiz.questions.length} question{quiz.questions.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <QuizForm
          questionnaireId={quiz.id}
          tenantId={quiz.tenantId}
          questions={quiz.questions}
          storageKey={`quiz_draft_${token}_${eid ?? "anon"}`}
          prefillName={prefillName}
          entityId={entityId}
        />

        <p className="text-center text-xs text-muted-foreground">
          Propulsé par <span className="font-medium text-navy">Nexo RH</span>
        </p>
      </div>
    </div>
  );
}
