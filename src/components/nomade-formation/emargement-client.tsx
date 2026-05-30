"use client";

import { useState } from "react";
import { CheckSquare, Square, Download } from "lucide-react";
import type { TrainingSession } from "@/services/training-config";

type Participant = {
  id: string;
  name: string;
};

function QrCodeSvg({ token }: { token: string }) {
  // Simple QR placeholder: display the URL prominently with a border
  // Real QR generation would need a library like qrcode.react
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${appUrl}/quiz/${token}`;
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white shadow-sm p-5">
      <p className="text-xs font-bold text-[#0B3D2E] uppercase tracking-wider">QR Code — Accès Quiz</p>
      {/* QR visual placeholder */}
      <div className="size-40 rounded-xl bg-slate-100 border-2 border-slate-200 flex flex-col items-center justify-center gap-2 p-2">
        <div className="grid grid-cols-3 gap-1 w-full">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm"
              style={{
                backgroundColor:
                  [0, 2, 6, 8].includes(i)
                    ? "#0B3D2E"
                    : [1, 3, 5, 7].includes(i)
                    ? "#c8e6c9"
                    : "#0B3D2E",
              }}
            />
          ))}
        </div>
        <p className="text-[8px] text-center text-slate-400 break-all leading-tight">{token.slice(0, 12)}…</p>
      </div>
      <p className="text-[11px] text-slate-500 text-center break-all">{url}</p>
    </div>
  );
}

export function EmargementClient({
  sessions,
  participants,
}: {
  sessions: TrainingSession[];
  participants: Record<string, Participant[]>;
}) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id ?? "");
  const [checked, setChecked] = useState<Record<string, string>>({});

  const session = sessions.find((s) => s.id === selectedSessionId);
  const parts = selectedSessionId ? (participants[selectedSessionId] ?? []) : [];
  const presentCount = parts.filter((p) => !!checked[p.id]).length;

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      }
      return next;
    });
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-sm p-8 text-center">
        <p className="font-semibold text-[#0B3D2E]">Aucune session disponible</p>
        <p className="text-sm text-slate-500 mt-1">Créez une session depuis Nexo RH.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Session selector */}
      <div className="rounded-2xl bg-white shadow-sm p-4">
        <label className="text-xs font-bold text-[#0B3D2E] uppercase tracking-wider block mb-2">
          Session active
        </label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-[#0B3D2E] font-medium outline-none focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E]"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* QR Code */}
      {session && <QrCodeSvg token={session.id} />}

      {/* Progress bar */}
      {parts.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-[#0B3D2E] uppercase tracking-wider">Présences</p>
            <p className="text-sm font-bold text-[#0B3D2E]">
              {presentCount} / {parts.length}
            </p>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-2 rounded-full bg-[#0B3D2E] transition-all duration-300"
              style={{ width: parts.length ? `${(presentCount / parts.length) * 100}%` : "0%" }}
            />
          </div>
        </div>
      )}

      {/* Participant list */}
      <div className="flex flex-col gap-2">
        {parts.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm p-4 text-center text-sm text-slate-400">
            Aucun participant assigné à cette session.
          </div>
        ) : (
          parts.map((p) => {
            const isPresent = !!checked[p.id];
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`flex items-center gap-3 rounded-2xl shadow-sm p-4 text-left transition-colors ${
                  isPresent ? "bg-emerald-50 border border-emerald-200" : "bg-white"
                }`}
              >
                {isPresent ? (
                  <CheckSquare className="size-5 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="size-5 text-slate-300 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isPresent ? "text-emerald-800" : "text-[#0B3D2E]"}`}>
                    {p.name}
                  </p>
                  {isPresent && checked[p.id] && (
                    <p className="text-[11px] text-emerald-600">Émargé à {checked[p.id]}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isPresent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isPresent ? "Présent" : "Absent"}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Export PDF placeholder */}
      {parts.length > 0 && (
        <button
          onClick={() => alert("Export PDF — fonctionnalité à venir.")}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#0B3D2E]/30 py-3.5 text-sm font-semibold text-[#0B3D2E]"
        >
          <Download className="size-4" /> Exporter PDF
        </button>
      )}
    </div>
  );
}
