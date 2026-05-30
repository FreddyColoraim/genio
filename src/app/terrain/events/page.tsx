export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";
import { getNomadeContacts } from "@/app/(dashboard)/nomade/actions";
import type { NomadeContact } from "@/app/(dashboard)/nomade/actions";
import { NewEventForm } from "@/components/nomade-rh/new-event-form";

type EventSummary = {
  name: string;
  count: number;
  lastCaptured: string;
};

function buildEventSummaries(contacts: NomadeContact[]): EventSummary[] {
  const map = new Map<string, { count: number; lastCaptured: string }>();
  for (const c of contacts) {
    const key = c.eventName ?? "Sans événement";
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { count: 1, lastCaptured: c.capturedAt });
    } else {
      existing.count++;
      if (c.capturedAt > existing.lastCaptured) {
        existing.lastCaptured = c.capturedAt;
      }
    }
  }
  return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function EventCard({ event }: { event: EventSummary }) {
  const daysAgo = Math.floor((Date.now() - new Date(event.lastCaptured).getTime()) / 86_400_000);
  const badge =
    daysAgo <= 1
      ? { label: "En cours", cls: "bg-emerald-100 text-emerald-700" }
      : daysAgo <= 30
      ? { label: "Récent", cls: "bg-blue-100 text-blue-700" }
      : { label: "Passé", cls: "bg-slate-100 text-slate-500" };

  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 flex gap-3 items-start">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF]">
        <CalendarDays className="size-5 text-[#1B2A4A]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-[#1B2A4A] text-sm truncate">{event.name}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Users className="size-3" /> {event.count} contact{event.count !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-slate-400">{formatDate(event.lastCaptured)}</span>
        </div>
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const contacts = await getNomadeContacts().catch(() => [] as NomadeContact[]);
  const events = buildEventSummaries(contacts);

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="bg-[#1B2A4A] px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={"/terrain" as never} className="text-white/70 hover:text-white">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-white font-bold text-xl">Événements</h1>
              <p className="text-white/60 text-xs mt-0.5">
                {events.length} événement{events.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New event form */}
      <div className="px-4 pt-4">
        <NewEventForm />
      </div>

      {/* Events list */}
      <div className="p-4 flex flex-col gap-3">
        {events.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm p-8 text-center flex flex-col items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#EEF2FF]">
              <CalendarDays className="size-7 text-[#1B2A4A]" />
            </div>
            <p className="font-semibold text-[#1B2A4A]">Aucun événement</p>
            <p className="text-sm text-slate-500">Les événements apparaîtront dès que vous capturez des contacts.</p>
          </div>
        ) : (
          events.map((event) => <EventCard key={event.name} event={event} />)
        )}
      </div>
    </div>
  );
}
