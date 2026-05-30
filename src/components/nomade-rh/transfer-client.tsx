"use client";

import { useState, useTransition } from "react";
import { ArrowRight, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { sendBriefToCandidate } from "@/app/(dashboard)/nomade/actions";
import type { NomadeContact } from "@/app/(dashboard)/nomade/actions";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

export function TransferClient({ contacts }: { contacts: NomadeContact[] }) {
  const pending = contacts.filter((c) => !c.briefSent);
  const transferred = contacts.filter((c) => c.briefSent);

  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [allDone, setAllDone] = useState(false);

  async function handleSend(entityId: string, briefId: string) {
    startTransition(async () => {
      const res = await sendBriefToCandidate(entityId, briefId);
      if (res.success) {
        setSentIds((prev) => new Set([...prev, entityId]));
      } else {
        setErrors((prev) => ({ ...prev, [entityId]: res.error }));
      }
    });
  }

  async function handleSendAll() {
    startTransition(async () => {
      const toSend = pending.filter((c) => c.briefId && !sentIds.has(c.entityId));
      const results = await Promise.allSettled(
        toSend.map((c) => sendBriefToCandidate(c.entityId, c.briefId!)),
      );
      const newSent = new Set(sentIds);
      const newErrors: Record<string, string> = { ...errors };
      results.forEach((r, i) => {
        const c = toSend[i]!;
        if (r.status === "fulfilled" && r.value.success) {
          newSent.add(c.entityId);
        } else {
          newErrors[c.entityId] =
            r.status === "fulfilled" && !r.value.success
              ? r.value.error
              : "Erreur inconnue.";
        }
      });
      setSentIds(newSent);
      setErrors(newErrors);
      if (toSend.every((c) => newSent.has(c.entityId))) setAllDone(true);
    });
  }

  const actionablePending = pending.filter((c) => c.briefId);
  const noBriefPending = pending.filter((c) => !c.briefId);

  return (
    <div className="flex flex-col gap-6">
      {/* En attente */}
      <section>
        <h2 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">
          En attente ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm p-4 text-center text-sm text-slate-400">
            Tous les contacts ont déjà reçu leur brief.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {actionablePending.map((c) => {
              const done = sentIds.has(c.entityId);
              return (
                <div key={c.entityId} className="rounded-2xl bg-white shadow-sm p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1B2A4A] text-sm truncate">{c.name}</p>
                    {c.poste && <p className="text-xs text-slate-400 truncate">{c.poste}</p>}
                    {c.briefTitle && (
                      <p className="text-xs text-blue-600 truncate mt-0.5">Brief : {c.briefTitle}</p>
                    )}
                    {errors[c.entityId] && (
                      <p className="text-xs text-red-500 mt-1">{errors[c.entityId]}</p>
                    )}
                  </div>
                  {done ? (
                    <CheckCircle2 className="size-6 text-emerald-500 shrink-0" />
                  ) : (
                    <button
                      onClick={() => handleSend(c.entityId, c.briefId!)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-[#1B2A4A] px-3 py-2 text-xs font-semibold text-white shrink-0 disabled:opacity-60"
                    >
                      {isPending ? <Loader2 className="size-3 animate-spin" /> : <ArrowRight className="size-3" />}
                      Nexo
                    </button>
                  )}
                </div>
              );
            })}
            {noBriefPending.map((c) => (
              <div key={c.entityId} className="rounded-2xl bg-white shadow-sm p-4 flex items-center gap-3 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1B2A4A] text-sm truncate">{c.name}</p>
                  {c.poste && <p className="text-xs text-slate-400 truncate">{c.poste}</p>}
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                  <Clock className="size-3" /> Sans brief
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bouton tout transférer */}
      {actionablePending.filter((c) => !sentIds.has(c.entityId)).length > 0 && !allDone && (
        <button
          onClick={handleSendAll}
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#1B2A4A] py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-5" />}
          Tout transférer vers Nexo RH
        </button>
      )}

      {/* Déjà transmis */}
      <section>
        <h2 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">
          Déjà transmis ({transferred.length + sentIds.size})
        </h2>
        {transferred.length === 0 && sentIds.size === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm p-4 text-center text-sm text-slate-400">
            Aucun contact transféré pour l&apos;instant.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {[
              ...contacts.filter((c) => sentIds.has(c.entityId)),
              ...transferred.filter((c) => !sentIds.has(c.entityId)),
            ].map((c) => (
              <div key={c.entityId} className="rounded-2xl bg-white shadow-sm p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1B2A4A] text-sm truncate">{c.name}</p>
                  {c.poste && <p className="text-xs text-slate-400 truncate">{c.poste}</p>}
                </div>
                <div className="text-right shrink-0">
                  <CheckCircle2 className="size-5 text-emerald-500 mx-auto" />
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(c.capturedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
