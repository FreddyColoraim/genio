"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, Wifi, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type LiveResponse = {
  id:              string;
  respondentName:  string | null;
  score:           number | null;
  maxScore:        number | null;
  submittedAt:     string;
  isNew?:          boolean;
};

type Props = {
  questionnaireId: string;
  tenantId:        string;
  title:           string;
  initialResponses: LiveResponse[];
};

function ScoreBadge({ score, maxScore }: { score: number | null; maxScore: number | null }) {
  if (score === null || !maxScore) {
    return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">À corriger</span>;
  }
  const pct = Math.round((score / maxScore) * 100);
  const cls = pct >= 70
    ? "bg-green-50 text-green-700 border border-green-200"
    : pct >= 50
    ? "bg-amber-50 text-amber-700 border border-amber-200"
    : "bg-red-50 text-red-700 border border-red-200";
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", cls)}>
      {pct}%
    </span>
  );
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-blue/15 text-blue",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

export function QuizRealtime({ questionnaireId, tenantId, title, initialResponses }: Props) {
  const [responses, setResponses] = useState<LiveResponse[]>(initialResponses);
  const [connected, setConnected] = useState(false);
  const [newCount, setNewCount]   = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`quiz-live-${questionnaireId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "questionnaire_responses",
          filter: `questionnaire_id=eq.${questionnaireId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            respondent_name:  string | null;
            score:            number | null;
            max_score:        number | null;
            submitted_at:     string;
          };

          setResponses((prev) => {
            // Éviter les doublons
            if (prev.some((r) => r.id === row.id)) return prev;
            return [
              {
                id:             row.id,
                respondentName: row.respondent_name,
                score:          row.score,
                maxScore:       row.max_score,
                submittedAt:    row.submitted_at,
                isNew:          true,
              },
              ...prev,
            ];
          });
          setNewCount((n) => n + 1);

          // Retirer le flag "new" après 3s
          setTimeout(() => {
            setResponses((prev) =>
              prev.map((r) => r.id === row.id ? { ...r, isNew: false } : r)
            );
          }, 3000);
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionnaireId]);

  const avgScore = responses
    .filter((r) => r.score !== null && r.maxScore)
    .reduce((acc, r, _, arr) => {
      const pct = Math.round((r.score! / r.maxScore!) * 100);
      return acc + pct / arr.length;
    }, 0);

  return (
    <div className="space-y-5">
      {/* Header live */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-navy">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Tableau de bord live · Réponses en temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
              <Wifi className="size-3" />Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />Connexion…
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-3xl font-black text-navy">{responses.length}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Réponses</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-3xl font-black text-green-600">
            {responses.filter((r) => r.score !== null).length}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Auto-corrigées</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-3xl font-black", avgScore >= 70 ? "text-green-600" : avgScore >= 50 ? "text-amber-600" : "text-red-600")}>
            {responses.filter((r) => r.score !== null).length > 0 ? `${Math.round(avgScore)}%` : "—"}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Score moyen</p>
        </div>
      </div>

      {/* Feed des réponses */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-warm/30">
          <p className="text-sm font-semibold text-navy">Réponses entrantes</p>
          {newCount > 0 && (
            <span className="rounded-full bg-blue text-white text-xs font-bold px-2 py-0.5">
              +{newCount} nouvelles
            </span>
          )}
        </div>

        {responses.length === 0 ? (
          <div className="p-10 text-center">
            <Clock className="mx-auto size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">En attente des premières réponses…</p>
            <p className="text-xs text-muted-foreground mt-1">Les stagiaires peuvent utiliser leur lien SMS ou scanner le QR code</p>
          </div>
        ) : (
          <div className="divide-y">
            {responses.map((r, i) => (
              <div
                key={r.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-all duration-500",
                  r.isNew && "bg-green-50/60"
                )}
              >
                <div className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  AVATAR_COLORS[i % AVATAR_COLORS.length]
                )}>
                  {getInitials(r.respondentName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">
                    {r.respondentName ?? "Anonyme"}
                    {r.isNew && (
                      <span className="ml-2 text-[10px] font-bold text-green-600 animate-pulse">● nouveau</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.submittedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {r.score !== null && r.maxScore ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{r.score}/{r.maxScore}</span>
                    <ScoreBadge score={r.score} maxScore={r.maxScore} />
                    <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  </div>
                ) : (
                  <ScoreBadge score={null} maxScore={null} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
