"use client";

import { useState, useTransition } from "react";
import {
  BookOpen, Check, Copy, Link2, Loader2, Mail, MoreVertical,
  Phone, Plus, Send, Star, Tag, Trash2, UserCheck, X,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Badge }    from "@/components/ui/badge";
import { cn }       from "@/lib/utils";
import {
  createTrainerAction,
  deactivateTrainerAction,
  assignTrainerAction,
  removeTrainerAction,
  resendPortalLinkAction,
} from "@/app/(dashboard)/nomade/trainer-actions";
import { SPECIALTY_OPTIONS, type Trainer } from "@/services/trainer-config";
import type { TrainingSession } from "@/services/training-config";

const APP_URL = typeof window !== "undefined"
  ? window.location.origin
  : process.env.NEXT_PUBLIC_APP_URL ?? "";

// ── Initials avatar ────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const sz = { sm: "size-7 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" }[size];
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700", sz)}>
      {initials}
    </span>
  );
}

// ── Carte formateur ────────────────────────────────────────────────────────

function TrainerCard({
  trainer,
  sessions,
  onRemoved,
}: {
  trainer:   Trainer;
  sessions:  TrainingSession[];
  onRemoved: () => void;
}) {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentLink, setSentLink] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pending, startTransition]  = useTransition();
  const [error, setError]   = useState<string | null>(null);

  const portalLink = `${APP_URL}/formateur/${trainer.accessToken}`;

  function copyLink() {
    navigator.clipboard.writeText(portalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDeactivate() {
    if (!confirm(`Désactiver ${trainer.name} ?`)) return;
    startTransition(async () => {
      const r = await deactivateTrainerAction(trainer.id);
      if (r.success) onRemoved();
      else setError(r.error);
    });
  }

  function handleResendLink() {
    startTransition(async () => {
      const r = await resendPortalLinkAction(trainer.email, trainer.name, trainer.accessToken);
      if (r.success) setSentLink(true);
      else setError(r.error);
    });
  }

  function handleAssign(sessionId: string) {
    startTransition(async () => {
      const r = await assignTrainerAction(trainer.id, sessionId);
      if (!r.success) setError(r.error);
      else setAssignOpen(false);
    });
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Header carte */}
      <div className="flex items-start gap-3 p-4">
        <Avatar name={trainer.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-navy truncate">{trainer.name}</p>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="rounded p-1 text-muted-foreground hover:text-navy hover:bg-warm transition-colors"
              >
                <MoreVertical className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {trainer.email && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="size-3" />{trainer.email}
              </span>
            )}
            {trainer.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="size-3" />{trainer.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compétences */}
      {(trainer.competences.length > 0 || trainer.specialties.length > 0) && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {trainer.competences.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full bg-blue/8 px-2 py-0.5 text-[11px] font-medium text-blue">
              <Star className="size-2.5" />{c}
            </span>
          ))}
          {trainer.specialties.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
              <Tag className="size-2.5" />{s}
            </span>
          ))}
        </div>
      )}

      {trainer.bio && (
        <p className="px-4 pb-3 text-xs text-muted-foreground line-clamp-2">{trainer.bio}</p>
      )}

      {/* Sessions count */}
      <div className="border-t px-4 py-2.5 flex items-center gap-2 bg-warm/20 text-xs text-muted-foreground">
        <BookOpen className="size-3.5 shrink-0" />
        {trainer.sessionCount} session{trainer.sessionCount !== 1 ? "s" : ""} assignée{trainer.sessionCount !== 1 ? "s" : ""}
      </div>

      {/* Actions (dropdown) */}
      {open && (
        <div className="border-t p-3 space-y-2 bg-warm/10">
          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* Portail link */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8" onClick={copyLink}>
              {copied ? <><Check className="size-3 text-green-500" />Copié</> : <><Copy className="size-3" />Copier le lien portail</>}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleResendLink} disabled={pending || sentLink}>
              {sentLink ? <Check className="size-3 text-green-500" /> : <Send className="size-3" />}
              {sentLink ? "Envoyé" : "Email"}
            </Button>
          </div>

          {/* Assigner à une session */}
          {sessions.length > 0 && (
            <div>
              {!assignOpen ? (
                <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-8" onClick={() => setAssignOpen(true)}>
                  <Link2 className="size-3" />Assigner à une session
                </Button>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">Choisir une session :</p>
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={pending}
                      onClick={() => handleAssign(s.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-input bg-white px-3 py-2 text-xs hover:border-blue/30 hover:bg-blue/5 transition-colors"
                    >
                      <span>{s.title}</span>
                      {pending ? <Loader2 className="size-3 animate-spin" /> : <UserCheck className="size-3 text-muted-foreground" />}
                    </button>
                  ))}
                  <button type="button" className="text-xs text-muted-foreground hover:text-navy" onClick={() => setAssignOpen(false)}>
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Désactiver */}
          <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-8 text-red-600 hover:bg-red-50 hover:border-red-200 border-red-100" onClick={handleDeactivate} disabled={pending}>
            <Trash2 className="size-3" />Désactiver le formateur
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Formulaire création ────────────────────────────────────────────────────

function CreateTrainerForm({ onDone }: { onDone: () => void }) {
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleSpecialty(s: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("specialties", selectedSpecialties.join(","));
    startTransition(async () => {
      const result = await createTrainerAction(fd);
      if (result.success) onDone();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-5">
      <p className="text-sm font-semibold text-navy">Nouveau formateur</p>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Nom complet *</Label>
          <Input name="name" placeholder="Jean Dupont" required className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email *</Label>
          <Input name="email" type="email" placeholder="formateur@entreprise.com" required className="h-10" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Téléphone</Label>
          <Input name="phone" type="tel" placeholder="06 12 34 56 78" className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Compétences clés (séparées par virgule)</Label>
          <Input name="competences" placeholder="Excel, Hygiène, HACCP…" className="h-10" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Bio / présentation</Label>
        <Input name="bio" placeholder="10 ans d'expérience terrain, formateur certifié…" className="h-10" />
      </div>

      {/* Spécialités */}
      <div className="space-y-2">
        <Label className="text-xs">Spécialités</Label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map((s) => {
            const active = selectedSpecialties.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialty(s)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  active
                    ? "border-blue bg-blue text-white"
                    : "border-input text-muted-foreground hover:border-blue/40"
                )}
              >
                {active && <X className="mr-1 inline size-2.5" />}{s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Créer le formateur"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>Annuler</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Un email avec le lien portail Nomade sera automatiquement envoyé au formateur.
      </p>
    </form>
  );
}

// ── Composant principal ────────────────────────────────────────────────────

type Props = {
  trainers: Trainer[];
  sessions: TrainingSession[];
};

export function NomadeTrainers({ trainers: initial, sessions }: Props) {
  const [trainers, setTrainers] = useState(initial);
  const [creating, setCreating] = useState(false);

  function handleRemoved(id: string) {
    setTrainers((t) => t.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-navy">
            Formateurs
            {trainers.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                {trainers.length}
              </span>
            )}
          </h3>
        </div>
        {!creating && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" />Nouveau formateur
          </Button>
        )}
      </div>

      {creating && <CreateTrainerForm onDone={() => setCreating(false)} />}

      {trainers.length === 0 && !creating ? (
        <div className="rounded-xl border border-dashed bg-warm/30 p-8 text-center">
          <UserCheck className="mx-auto size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucun formateur. Créez-en un — ils recevront leur lien portail Nomade par email.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trainers.map((t) => (
            <TrainerCard
              key={t.id}
              trainer={t}
              sessions={sessions}
              onRemoved={() => handleRemoved(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
