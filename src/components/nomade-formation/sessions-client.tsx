"use client";

import { useState } from "react";
import { Plus, Clock, Users, ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { TrainingSession, TrainingType } from "@/services/training-config";

type TypeLabel = { label: string; color: string };

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function SessionCard({
  session,
  typeLabels,
}: {
  session: TrainingSession;
  typeLabels: Record<TrainingType, TypeLabel>;
}) {
  const [open, setOpen] = useState(false);
  const tl = typeLabels[session.type] ?? { label: session.type, color: "bg-slate-100 text-slate-600" };

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tl.color}`}>{tl.label}</span>
          </div>
          <p className="font-semibold text-[#0B3D2E] text-sm mt-1 leading-tight">{session.title}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="size-3" /> {formatDuration(session.durationMinutes)}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="size-3" /> {session.assignedCount} stagiaire{session.assignedCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronUp className="size-4 text-slate-400 shrink-0 mt-1" />
        ) : (
          <ChevronDown className="size-4 text-slate-400 shrink-0 mt-1" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4 bg-[#F0FDF4]">
          {session.description ? (
            <p className="text-sm text-slate-600 mb-3">{session.description}</p>
          ) : (
            <p className="text-sm text-slate-400 italic mb-3">Aucune description.</p>
          )}
          <div className="flex flex-col gap-2 text-xs text-slate-500">
            <p className="font-semibold text-[#0B3D2E]">Programme</p>
            <p className="text-slate-400">— Contenu à renseigner dans Nexo RH</p>
            {session.materialsUrl && (
              <a
                href={session.materialsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#0B3D2E] font-semibold"
              >
                <FileText className="size-3" /> Supports de formation
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SessionsClient({
  sessions,
  typeLabels,
}: {
  sessions: TrainingSession[];
  typeLabels: Record<TrainingType, TypeLabel>;
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-sm p-8 text-center flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#F0FDF4]">
          <FileText className="size-7 text-[#0B3D2E]" />
        </div>
        <p className="font-semibold text-[#0B3D2E]">Aucune session</p>
        <p className="text-sm text-slate-500">Créez votre première session de formation dans Nexo RH.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <SessionCard key={s.id} session={s} typeLabels={typeLabels} />
      ))}
    </div>
  );
}
