"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, MapPin, Star, UserPlus } from "lucide-react";
import { captureNomadeContact } from "@/app/(dashboard)/nomade/actions";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUALIF_TAGS = ["Contact chaud", "Expérimenté·e", "Relance J+3", "Mobile", "Urgent", "Profil rare"];

export default function CapturePage() {
  const [score, setScore]          = useState<number | null>(null);
  const [tags, setTags]            = useState<string[]>([]);
  const [success, setSuccess]      = useState(false);
  const [error, setError]          = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleTag(t: string) {
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (score) fd.set("score", String(score));
    const noteBase = (fd.get("noteRapide") as string ?? "").trim();
    const fullNote = [noteBase, tags.length ? "[" + tags.join(", ") + "]" : ""].filter(Boolean).join(" ");
    fd.set("notes", fullNote);
    startTransition(async () => {
      const result = await captureNomadeContact(fd);
      if (result.success) {
        setSuccess(true); setScore(null); setTags([]);
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setSuccess(false), 2400);
      } else { setError(result.error); }
    });
  }

  if (success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="size-8 text-green-500" />
        </div>
        <h2 className="text-lg font-black text-[#1B2A4A]">Contact enregistré !</h2>
        <p className="text-sm text-slate-400">Ajouté dans Nomade · source Événement</p>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={"/terrain/contacts" as never}>Voir les contacts</Link>
          </Button>
          <Button className="rounded-xl bg-[#1B2A4A]" onClick={() => setSuccess(false)}>Nouveau</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-[#1B2A4A] px-5 pb-5 pt-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href={"/terrain" as never} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Nomade RH</p>
            <h1 className="text-lg font-black text-white">Capturer un contact</h1>
          </div>
        </div>
        {/* Événement pill */}
        <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-2.5">
          <MapPin className="size-4 text-blue-300 shrink-0" />
          <input
            name="eventName" form="capture-form"
            placeholder="Salon / événement en cours…"
            className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-white/35 focus:outline-none"
          />
        </div>
      </div>

      <form id="capture-form" onSubmit={handleSubmit} className="flex-1 space-y-3 p-4 pb-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Identité */}
        <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Identité</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Prénom *</Label>
              <Input name="firstName" placeholder="Sophie" required className="h-11 rounded-xl border-slate-200 text-[15px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Nom</Label>
              <Input name="lastName" placeholder="Martin" className="h-11 rounded-xl border-slate-200 text-[15px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Téléphone</Label>
              <Input name="phone" type="tel" placeholder="06 12 34 56 78" className="h-11 rounded-xl border-slate-200 text-[15px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Email</Label>
              <Input name="email" type="email" placeholder="sophie@…" className="h-11 rounded-xl border-slate-200 text-[15px]" />
            </div>
          </div>
        </div>

        {/* Profil */}
        <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Profil & disponibilité</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Poste visé</Label>
              <Input name="poste" placeholder="Infirmier·ère" className="h-11 rounded-xl border-slate-200 text-[15px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Disponibilité</Label>
              <Input name="disponibilite" placeholder="Mars 2026" className="h-11 rounded-xl border-slate-200 text-[15px]" />
            </div>
          </div>
        </div>

        {/* Évaluation */}
        <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Potentiel terrain</p>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map((s) => (
              <button key={s} type="button" onClick={() => setScore(score === s ? null : s)}
                className={cn("flex-1 rounded-xl py-2.5 transition-all", s <= (score ?? 0) ? "bg-amber-50" : "bg-slate-50")}>
                <Star className={cn("mx-auto size-6 transition-colors", s <= (score ?? 0) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {QUALIF_TAGS.map((t) => (
              <button key={t} type="button" onClick={() => toggleTag(t)}
                className={cn("rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  tags.includes(t) ? "bg-[#1B2A4A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}>
                {tags.includes(t) ? "✓ " : ""}{t}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="rounded-2xl bg-white p-4 shadow-sm space-y-2">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Note rapide</Label>
          <textarea
            name="noteRapide" rows={3}
            placeholder="Spé. Alzheimer, zone Lyon-Est, disponible mars, a demandé les conditions…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-[#1B2A4A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 resize-none"
          />
        </div>

        {/* CTA */}
        <Button type="submit" className="h-13 w-full rounded-2xl bg-[#1B2A4A] text-[15px] font-bold" disabled={pending}>
          {pending
            ? <><Loader2 className="mr-2 size-4 animate-spin" />Enregistrement…</>
            : <><UserPlus className="mr-2 size-5" />Enregistrer dans Nomade</>
          }
        </Button>
      </form>
    </div>
  );
}
