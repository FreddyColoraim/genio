"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendTrainerBriefing } from "@/app/(dashboard)/nomade/actions";
import type { NomadeContact } from "@/app/(dashboard)/nomade/actions";

type Props = { contacts: NomadeContact[] };

export function NomadeTrainerBriefing({ contacts }: Props) {
  const [open, setOpen]     = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendTrainerBriefing(fd);
      if (result.success) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-warm/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <Send className="size-4 text-indigo-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-navy">Briefer le formateur interne</p>
            <p className="text-xs text-muted-foreground">Logistique, salle, parking, infos formation</p>
          </div>
        </div>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t px-5 py-5">
          {success ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="size-4 shrink-0" />
              Briefing envoyé au formateur.
              <button
                type="button"
                className="ml-auto text-xs underline"
                onClick={() => setSuccess(false)}
              >
                Nouveau
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="trainerEmail" className="text-xs">Email du formateur *</Label>
                  <Input id="trainerEmail" name="trainerEmail" type="email" placeholder="formateur@entreprise.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trainerName" className="text-xs">Nom du formateur</Label>
                  <Input id="trainerName" name="trainerName" placeholder="Jean Dupont" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="candidateName" className="text-xs">Candidat concerné *</Label>
                {contacts.length > 0 ? (
                  <select
                    id="candidateName"
                    name="candidateName"
                    required
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">— Sélectionner un contact —</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}{c.poste ? ` — ${c.poste}` : ""}</option>
                    ))}
                  </select>
                ) : (
                  <Input id="candidateName" name="candidateName" placeholder="Nom du candidat" required />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="trainingTitle" className="text-xs">Intitulé de la formation *</Label>
                <Input id="trainingTitle" name="trainingTitle" placeholder="Formation sécurité incendie" required />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="trainingDate" className="text-xs">Date *</Label>
                  <Input id="trainingDate" name="trainingDate" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trainingTime" className="text-xs">Heure</Label>
                  <Input id="trainingTime" name="trainingTime" type="time" placeholder="09:00" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="room" className="text-xs">Salle / lieu</Label>
                  <Input id="room" name="room" placeholder="Salle B2, Bâtiment RH" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parking" className="text-xs">Parking / accès</Label>
                  <Input id="parking" name="parking" placeholder="Parking P3, badge à l'accueil" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="extraInfo" className="text-xs">Informations complémentaires</Label>
                <Input id="extraInfo" name="extraInfo" placeholder="Apporter une pièce d'identité, tenue de sécurité fournie…" />
              </div>

              <Button type="submit" className="w-full" disabled={pending}>
                {pending
                  ? <><Loader2 className="mr-2 size-4 animate-spin" />Envoi…</>
                  : <><Send className="mr-2 size-4" />Envoyer le briefing</>
                }
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
