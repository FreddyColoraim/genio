"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, Loader2, MapPin, Star, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { captureNomadeContact } from "@/app/(dashboard)/nomade/actions";
import { cn } from "@/lib/utils";

type Brief = { id: string; title: string };

type Props = {
  briefs:      Brief[];
  defaultEvent?: string;
  onCaptured?: () => void;
};

export function NomadeContactForm({ briefs, defaultEvent = "", onCaptured }: Props) {
  const formRef             = useRef<HTMLFormElement>(null);
  const [score, setScore]   = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (score) fd.set("score", String(score));

    startTransition(async () => {
      const result = await captureNomadeContact(fd);
      if (result.success) {
        setSuccess(true);
        setScore(null);
        formRef.current?.reset();
        setTimeout(() => {
          setSuccess(false);
          onCaptured?.();
        }, 1800);
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <CheckCircle2 className="size-10 text-green-500" />
        <p className="text-base font-semibold text-green-800">Contact enregistré !</p>
        <p className="text-sm text-green-600">Ajouté dans le pipeline — source Événement.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Événement */}
      <div className="flex items-center gap-2 rounded-lg border border-blue/20 bg-blue/5 px-3 py-2">
        <MapPin className="size-4 shrink-0 text-blue" />
        <Input
          className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
          defaultValue={defaultEvent}
          name="eventName"
          placeholder="Nom du salon / événement"
        />
      </div>

      {/* Identité */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-xs">Prénom *</Label>
          <Input id="firstName" name="firstName" placeholder="Sophie" required className="h-11 text-base" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-xs">Nom</Label>
          <Input id="lastName" name="lastName" placeholder="Martin" className="h-11 text-base" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs">Email</Label>
        <Input id="email" name="email" type="email" placeholder="sophie@exemple.com" className="h-11 text-base" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs">Téléphone</Label>
          <Input id="phone" name="phone" type="tel" placeholder="06 12 34 56 78" className="h-11 text-base" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="poste" className="text-xs">Poste / métier</Label>
          <Input id="poste" name="poste" placeholder="Infirmier·ère" className="h-11 text-base" />
        </div>
      </div>

      {/* Brief */}
      {briefs.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="briefId" className="text-xs">Associer à une annonce</Label>
          <select
            id="briefId"
            name="briefId"
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">— Aucune annonce —</option>
            {briefs.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Score terrain */}
      <div className="space-y-1.5">
        <Label className="text-xs">Potentiel (optionnel)</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScore(score === s ? null : s)}
              className="p-1 transition-transform active:scale-90"
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  s <= (score ?? 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs">Note rapide</Label>
        <Input id="notes" name="notes" placeholder="Disponible en mars, 3 ans d'expérience..." className="h-11 text-base" />
      </div>

      <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
        {pending ? (
          <><Loader2 className="mr-2 size-4 animate-spin" />Enregistrement…</>
        ) : (
          <><UserPlus className="mr-2 size-5" />Capturer le contact</>
        )}
      </Button>
    </form>
  );
}
