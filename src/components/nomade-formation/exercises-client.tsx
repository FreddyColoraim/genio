"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Radio, Eye, Send, Loader2, MessageSquare } from "lucide-react";
import { sendQuizToRookiesAction } from "@/app/(dashboard)/nomade/training-actions";
import type { Questionnaire } from "@/services/questionnaire-service";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

export function ExercisesClient({ questionnaires }: { questionnaires: Questionnaire[] }) {
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Record<string, string>>({});

  function handleSend(id: string) {
    startTransition(async () => {
      const res = await sendQuizToRookiesAction(id);
      if (res.success) {
        setMessages((prev) => ({
          ...prev,
          [id]: `Envoyé à ${res.sent} stagiaire${res.sent !== 1 ? "s" : ""}${res.failed > 0 ? ` (${res.failed} échec${res.failed !== 1 ? "s" : ""})` : ""}`,
        }));
      } else {
        setMessages((prev) => ({ ...prev, [id]: `Erreur : ${res.error}` }));
      }
    });
  }

  if (questionnaires.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-sm p-8 text-center flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#F0FDF4]">
          <MessageSquare className="size-7 text-[#0B3D2E]" />
        </div>
        <p className="font-semibold text-[#0B3D2E]">Aucun exercice</p>
        <p className="text-sm text-slate-500">Créez des questionnaires depuis Nexo RH.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {questionnaires.map((q) => (
        <div key={q.id} className="rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#0B3D2E] text-sm leading-tight">{q.title}</p>
              {q.sessionTitle && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">Session : {q.sessionTitle}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-slate-500">{q.responseCount} réponse{q.responseCount !== 1 ? "s" : ""}</span>
                <span className="text-xs text-slate-400">{formatDate(q.createdAt)}</span>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                q.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {q.isActive ? "Actif" : "Inactif"}
            </span>
          </div>

          {messages[q.id] && (
            <p className="text-xs rounded-xl bg-green-50 text-green-700 px-3 py-2 font-medium">{messages[q.id]}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSend(q.id)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl bg-[#0B3D2E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
              Envoyer aux stagiaires
            </button>
            <Link
              href={`/nomade/quiz-live/${q.id}` as never}
              className="flex items-center gap-1.5 rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700"
            >
              <Radio className="size-3" /> Live
            </Link>
            <Link
              href={`/quiz/${q.accessToken}` as never}
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              <Eye className="size-3" /> Voir
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
