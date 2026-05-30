"use client";

import { useTransition, useState } from "react";
import { BookOpen, CheckCircle2, Clock, Loader2, Plus, Shield, Wrench, FileCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createSessionAction } from "@/app/(dashboard)/nomade/training-actions";
import { TRAINING_TYPE_LABELS, type TrainingSession, type TrainingType } from "@/services/training-config";

const TYPE_ICONS: Record<TrainingType, React.ElementType> = {
  product:    BookOpen,
  security:   Shield,
  procedure:  Wrench,
  regulatory: FileCheck,
  other:      Tag,
};

function SessionCard({ session }: { session: TrainingSession }) {
  const cfg  = TRAINING_TYPE_LABELS[session.type];
  const Icon = TYPE_ICONS[session.type];
  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", cfg.color.replace("text-", "bg-").replace("bg-", "bg-").split(" ")[0] + "/15")}>
            <Icon className={cn("size-4", cfg.color.split(" ")[1])} />
          </span>
          <div>
            <p className="text-sm font-semibold text-navy">{session.title}</p>
            <p className="text-xs text-muted-foreground">{session.durationMinutes} min</p>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", cfg.color)}>
          {cfg.label}
        </span>
      </div>
      {session.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{session.description}</p>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="size-3" />{session.assignedCount} assigné{session.assignedCount > 1 ? "s" : ""}
        </span>
        {session.materialsUrl && (
          <a href={session.materialsUrl} target="_blank" rel="noopener noreferrer"
            className="text-blue hover:underline">
            Supports →
          </a>
        )}
      </div>
    </div>
  );
}

function CreateSessionForm({ onDone }: { onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createSessionAction(fd);
      if (result.success) onDone();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-5">
      <p className="text-sm font-semibold text-navy">Nouvelle session</p>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="space-y-1.5">
        <Label className="text-xs">Intitulé *</Label>
        <Input name="title" placeholder="Formation sécurité incendie" required />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Type *</Label>
          <select name="type" required
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {Object.entries(TRAINING_TYPE_LABELS).map(([v, { label }]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Durée (min)</Label>
          <Input name="durationMinutes" type="number" min={5} max={480} defaultValue={60} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Input name="description" placeholder="Objectifs, contenu, prérequis…" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">URL supports (optionnel)</Label>
        <Input name="materialsUrl" type="url" placeholder="https://drive.google.com/…" />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Créer la session"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>Annuler</Button>
      </div>
    </form>
  );
}

export function NomadeSessions({ sessions }: { sessions: TrainingSession[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-navy">
            Sessions de formation
            {sessions.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue/10 px-2 py-0.5 text-xs font-medium text-blue">
                {sessions.length}
              </span>
            )}
          </h3>
        </div>
        {!creating && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" />Nouvelle session
          </Button>
        )}
      </div>

      {creating && <CreateSessionForm onDone={() => setCreating(false)} />}

      {sessions.length === 0 && !creating ? (
        <div className="rounded-xl border border-dashed bg-warm/30 p-8 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Aucune session créée. Ajoutez vos modules de formation.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
        </div>
      )}
    </div>
  );
}
