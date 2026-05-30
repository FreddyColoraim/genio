"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, FileCheck } from "lucide-react";
import type { TrainingSession } from "@/services/training-config";
import { TRAINING_TYPE_LABELS } from "@/services/training-config";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

const CHECKLIST_ITEMS = [
  { id: "emargement", label: "Feuille d'émargement" },
  { id: "evaluations", label: "Évaluations stagiaires" },
  { id: "exercises",  label: "Exercices & quiz" },
  { id: "rapport",   label: "Rapport de formation" },
] as const;

function SessionTransferCard({ session }: { session: TrainingSession }) {
  const tl = TRAINING_TYPE_LABELS[session.type] ?? { label: session.type, color: "bg-slate-100 text-slate-600" };
  const [checklist, setChecklist] = useState<Set<string>>(
    new Set(["emargement", "evaluations"]),
  );
  const [transferred, setTransferred] = useState(false);

  function toggle(id: string) {
    setChecklist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (transferred) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
        <CheckCircle2 className="size-6 text-emerald-500 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-800 text-sm">{session.title}</p>
          <p className="text-xs text-emerald-600">Transféré vers Nexo RH</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tl.color}`}>{tl.label}</span>
        <p className="font-semibold text-[#0B3D2E] text-sm flex-1">{session.title}</p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-slate-500">
        <span>{session.assignedCount} stagiaire{session.assignedCount !== 1 ? "s" : ""}</span>
        <span>Créé le {formatDate(session.createdAt)}</span>
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-bold text-[#0B3D2E] uppercase tracking-wider">Données à transférer</p>
        {CHECKLIST_ITEMS.map((item) => {
          const checked = checklist.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="flex items-center gap-2 text-sm text-left"
            >
              <CheckCircle2
                className={`size-4 shrink-0 transition-colors ${checked ? "text-emerald-500" : "text-slate-200"}`}
              />
              <span className={checked ? "text-slate-700" : "text-slate-400"}>{item.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setTransferred(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#0B3D2E] py-2.5 text-sm font-semibold text-white"
      >
        <ArrowRight className="size-4" /> Transférer vers Nexo RH
      </button>
    </div>
  );
}

export function FormationTransferClient({ sessions }: { sessions: TrainingSession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-sm p-8 text-center flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#F0FDF4]">
          <FileCheck className="size-7 text-[#0B3D2E]" />
        </div>
        <p className="font-semibold text-[#0B3D2E]">Aucune session à transférer</p>
        <p className="text-sm text-slate-500">Les sessions terminées apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <SessionTransferCard key={s.id} session={s} />
      ))}
    </div>
  );
}
