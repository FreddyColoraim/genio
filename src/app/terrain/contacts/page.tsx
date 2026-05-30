export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Plus, User, Star, Mail, Phone } from "lucide-react";
import { getNomadeContacts } from "@/app/(dashboard)/nomade/actions";
import type { NomadeContact } from "@/app/(dashboard)/nomade/actions";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StarRating({ score }: { score: number | null }) {
  if (!score) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-3 ${i <= score ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

function BriefBadge({ contact }: { contact: NomadeContact }) {
  if (contact.briefSent) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        Brief ✓
      </span>
    );
  }
  if (contact.briefId) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        À envoyer
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
      En attente
    </span>
  );
}

function ContactCard({ contact }: { contact: NomadeContact }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 flex gap-3 items-start">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A] text-white text-sm font-bold">
        {initials(contact.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-[#1B2A4A] text-sm truncate">{contact.name}</p>
          <BriefBadge contact={contact} />
        </div>
        {contact.poste && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{contact.poste}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-1.5">
          {contact.phone && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Phone className="size-3" /> {contact.phone}
            </span>
          )}
          {contact.email && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Mail className="size-3" /> {contact.email}
            </span>
          )}
        </div>
        <div className="mt-1.5">
          <StarRating score={contact.score} />
        </div>
      </div>
    </div>
  );
}

export default async function ContactsPage() {
  const contacts = await getNomadeContacts().catch(() => [] as NomadeContact[]);

  // Group by eventName
  const grouped = new Map<string, NomadeContact[]>();
  for (const c of contacts) {
    const key = c.eventName ?? "Sans événement";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  }

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
              <h1 className="text-white font-bold text-xl">Contacts</h1>
              <p className="text-white/60 text-xs mt-0.5">
                {contacts.length} contact{contacts.length !== 1 ? "s" : ""} capturé{contacts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Link
            href={"/terrain/capture" as never}
            className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-white text-sm font-semibold"
          >
            <Plus className="size-4" /> Nouveau
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-6">
        {contacts.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm p-8 text-center flex flex-col items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#EEF2FF]">
              <User className="size-7 text-[#1B2A4A]" />
            </div>
            <p className="font-semibold text-[#1B2A4A]">Aucun contact capturé</p>
            <p className="text-sm text-slate-500">Commencez à capturer des contacts sur le terrain.</p>
            <Link
              href={"/terrain/capture" as never}
              className="mt-2 rounded-xl bg-[#1B2A4A] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Capturer un contact
            </Link>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([eventName, group]) => (
            <div key={eventName}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider">{eventName}</h2>
                <span className="rounded-full bg-[#1B2A4A]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1B2A4A]">
                  {group.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {group.map((c) => (
                  <ContactCard key={c.id} contact={c} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
