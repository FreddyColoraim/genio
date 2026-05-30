export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient }      from "@/lib/supabase/server";
import { QuizRealtime, type LiveResponse } from "@/components/nomade/quiz-realtime";
import { Button } from "@/components/ui/button";
import { SendQuizToRookiesButton } from "@/components/nomade/send-quiz-rookies-button";

export const metadata: Metadata = { title: "Quiz live | Nomade Formation" };

async function getQuizLiveData(questionnaireId: string) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  // Vérifier que le questionnaire appartient au tenant de l'user
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!membership) return null;

  const { data: quiz } = await admin
    .from("questionnaires")
    .select("id, title, access_token, session_id, is_active")
    .eq("id", questionnaireId)
    .eq("tenant_id", membership.tenant_id)
    .single();

  if (!quiz) return null;

  // Réponses existantes
  const { data: responses } = await admin
    .from("questionnaire_responses")
    .select("id, respondent_name, score, max_score, submitted_at")
    .eq("questionnaire_id", questionnaireId)
    .order("submitted_at", { ascending: false });

  const liveResponses: LiveResponse[] = (responses ?? []).map((r) => ({
    id:             r.id,
    respondentName: r.respondent_name ?? null,
    score:          r.score ?? null,
    maxScore:       r.max_score ?? null,
    submittedAt:    r.submitted_at,
    isNew:          false,
  }));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const quizUrl = `${appUrl}/quiz/${quiz.access_token}`;

  return {
    id:            quiz.id as string,
    title:         quiz.title as string,
    accessToken:   quiz.access_token as string,
    sessionId:     quiz.session_id as string | null,
    tenantId:      membership.tenant_id as string,
    quizUrl,
    liveResponses,
  };
}

export default async function QuizLivePage({
  params,
}: {
  params: Promise<{ questionnaireId: string }>;
}) {
  const { questionnaireId } = await params;
  const data = await getQuizLiveData(questionnaireId);
  if (!data) return notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={"/nomade?tab=questionnaires" as never}>
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue">Suivi live</p>
          <h2 className="text-xl font-semibold text-navy">{data.title}</h2>
        </div>
        {/* Bouton envoyer aux rookies si session liée */}
        {data.sessionId && (
          <SendQuizToRookiesButton questionnaireId={data.id} />
        )}
      </div>

      {/* Lien quiz */}
      <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground mb-0.5">Lien quiz public</p>
          <p className="text-sm font-mono text-navy truncate">{data.quizUrl}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={undefined}
          className="shrink-0"
          asChild
        >
          <a href={data.quizUrl} target="_blank" rel="noopener noreferrer">
            <Send className="size-3.5 mr-1.5" />Ouvrir
          </a>
        </Button>
      </div>

      {/* Realtime component */}
      <QuizRealtime
        questionnaireId={data.id}
        tenantId={data.tenantId}
        title={data.title}
        initialResponses={data.liveResponses}
      />
    </div>
  );
}
