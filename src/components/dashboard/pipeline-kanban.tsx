"use client";

import { useState, useTransition } from "react";
import {
  ArrowRight, CheckCircle2, ChevronRight, Mail,
  Plus, UserRound, UserRoundX, X,
} from "lucide-react";
import { moveCandidateAction, addCandidateAction } from "@/app/(dashboard)/pipeline/actions";
import type {
  CandidateCard, PipelineColumn, PipelineStage, AcquisitionSource,
} from "@/services/pipeline-config";
import { RH_STAGES, SOURCE_LABELS } from "@/services/pipeline-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Couleurs par colonne
// ---------------------------------------------------------------------------

const COLUMN_COLOR: Record<string, string> = {
  new:       "border-t-blue",
  contacted: "border-t-amber-400",
  interview: "border-t-purple-400",
  retained:  "border-t-sage",
  refused:   "border-t-red-400",
};

const COLUMN_COUNT_COLOR: Record<string, string> = {
  new:       "bg-blue/10 text-blue",
  contacted: "bg-amber-50 text-amber-700",
  interview: "bg-purple-50 text-purple-700",
  retained:  "bg-sage/20 text-green-700",
  refused:   "bg-red-50 text-red-600",
};

// ---------------------------------------------------------------------------
// Kanban principal
// ---------------------------------------------------------------------------

type Props = {
  initialColumns: PipelineColumn[];
  briefs: { id: string; title: string }[];
};

export function PipelineKanban({ initialColumns, briefs }: Props) {
  const [columns, setColumns]         = useState<PipelineColumn[]>(initialColumns);
  const [briefFilter, setBriefFilter] = useState<string>("all");
  const [addOpen, setAddOpen]         = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const filteredColumns = columns.map((col) => ({
    ...col,
    cards: briefFilter === "all"
      ? col.cards
      : col.cards.filter((c) => c.briefId === briefFilter),
  }));

  function moveCard(card: CandidateCard, newStage: PipelineStage) {
    // Optimistic UI
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.stage === card.stage
          ? col.cards.filter((c) => c.entityId !== card.entityId)
          : col.stage === newStage
          ? [{ ...card, stage: newStage, movedAt: new Date().toISOString() }, ...col.cards]
          : col.cards,
      }))
    );

    moveCandidateAction(card.entityId, newStage, card.briefId).then((result) => {
      if (!result.success) {
        setGlobalError(result.error);
        // Rollback
        setColumns(initialColumns);
      }
    });
  }

  function handleCandidateAdded(card: CandidateCard) {
    setColumns((prev) =>
      prev.map((col) =>
        col.stage === "new" ? { ...col, cards: [card, ...col.cards] } : col
      )
    );
    setAddOpen(false);
  }

  const totalCandidates = filteredColumns.reduce((acc, col) => acc + col.cards.length, 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-navy">{totalCandidates}</span> candidat{totalCandidates > 1 ? "s" : ""}
          </p>
          {briefs.length > 0 && (
            <select
              className="h-9 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={briefFilter}
              onChange={(e) => setBriefFilter(e.target.value)}
            >
              <option value="all">Tous les briefs</option>
              {briefs.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          )}
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" type="button">
              <Plus className="size-4" />
              Ajouter un candidat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <AddCandidateForm
              briefs={briefs}
              onSuccess={handleCandidateAdded}
              onCancel={() => setAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {globalError && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2">
          <p className="text-sm text-destructive">{globalError}</p>
          <button onClick={() => setGlobalError(null)} type="button">
            <X className="size-4 text-destructive" />
          </button>
        </div>
      )}

      {/* Kanban grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {filteredColumns.map((col) => (
          <KanbanColumn
            key={col.stage}
            column={col}
            allStages={RH_STAGES}
            onMove={moveCard}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Colonne
// ---------------------------------------------------------------------------

function KanbanColumn({
  column,
  allStages,
  onMove,
}: {
  column: PipelineColumn;
  allStages: typeof RH_STAGES;
  onMove: (card: CandidateCard, stage: PipelineStage) => void;
}) {
  const stageIndex  = allStages.findIndex((s) => s.stage === column.stage);
  const nextStage   = allStages[stageIndex + 1] ?? null;
  const isRefused   = column.stage === "refused";
  const isRetained  = column.stage === "retained";

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className={cn("rounded-xl border-t-4 bg-white p-3 shadow-sm", COLUMN_COLOR[column.stage])}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy">{column.label}</p>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", COLUMN_COUNT_COLOR[column.stage])}>
            {column.cards.length}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {RH_STAGES.find((s) => s.stage === column.stage)?.description ?? ""}
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {column.cards.length === 0 && (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            Aucun candidat
          </p>
        )}
        {column.cards.map((card) => (
          <CandidateCardItem
            key={card.pipelineId}
            card={card}
            nextStage={nextStage}
            isRefused={isRefused}
            isRetained={isRetained}
            onMove={onMove}
            allStages={allStages}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card candidat
// ---------------------------------------------------------------------------

function CandidateCardItem({
  card,
  nextStage,
  isRefused,
  isRetained,
  onMove,
  allStages,
}: {
  card: CandidateCard;
  nextStage: (typeof RH_STAGES)[number] | null;
  isRefused: boolean;
  isRetained: boolean;
  onMove: (card: CandidateCard, stage: PipelineStage) => void;
  allStages: typeof RH_STAGES;
}) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded]      = useState(false);

  function handleMove(stage: PipelineStage) {
    startTransition(() => { onMove(card, stage); });
  }

  return (
    <div className={cn(
      "rounded-xl border bg-white p-3 shadow-sm transition-opacity",
      isPending && "opacity-50"
    )}>
      {/* Header candidat */}
      <div className="flex items-start gap-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-lavender text-xs font-semibold text-navy">
          {card.name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-navy">{card.name}</p>
          {card.email && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" />{card.email}
            </p>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          type="button"
          className="text-muted-foreground hover:text-navy"
        >
          <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} />
        </button>
      </div>

      {/* Tags */}
      <div className="mt-2 flex flex-wrap gap-1">
        {card.source && (
          <Badge variant="soft" className="text-[10px]">
            {SOURCE_LABELS[card.source]}
          </Badge>
        )}
        {card.score !== null && (
          <Badge variant="blue" className="text-[10px]">
            Score {card.score}
          </Badge>
        )}
        {card.briefTitle && (
          <Badge variant="default" className="max-w-[120px] truncate text-[10px]">
            {card.briefTitle}
          </Badge>
        )}
      </div>

      {/* Notes expandables */}
      {expanded && card.notes && (
        <p className="mt-2 rounded-lg bg-warm px-2 py-1.5 text-xs leading-relaxed text-muted-foreground">
          {card.notes}
        </p>
      )}

      {/* Actions */}
      {!isRefused && (
        <div className="mt-3 flex items-center gap-2">
          {isRetained ? (
            <Button
              className="h-7 flex-1 text-xs"
              disabled={isPending}
              onClick={() => handleMove("new" as PipelineStage)}
              size="sm"
              type="button"
              variant="outline"
            >
              <CheckCircle2 className="size-3 text-sage" />
              Intégration
            </Button>
          ) : nextStage ? (
            <Button
              className="h-7 flex-1 text-xs"
              disabled={isPending}
              onClick={() => handleMove(nextStage.stage)}
              size="sm"
              type="button"
              variant="outline"
            >
              {nextStage.label}
              <ArrowRight className="size-3" />
            </Button>
          ) : null}
          <Button
            aria-label="Refuser"
            className="size-7 shrink-0"
            disabled={isPending}
            onClick={() => handleMove("refused")}
            size="icon"
            type="button"
            variant="ghost"
          >
            <UserRoundX className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      )}

      {isRefused && (
        <div className="mt-3">
          <Button
            className="h-7 w-full text-xs"
            disabled={isPending}
            onClick={() => handleMove("new")}
            size="sm"
            type="button"
            variant="ghost"
          >
            <UserRound className="size-3 text-muted-foreground" />
            Remettre en Nouveau
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal ajout candidat
// ---------------------------------------------------------------------------

function AddCandidateForm({
  briefs,
  onSuccess,
  onCancel,
}: {
  briefs: { id: string; title: string }[];
  onSuccess: (card: CandidateCard) => void;
  onCancel: () => void;
}) {
  const [error, setError]            = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setError(null);
      const result = await addCandidateAction(fd);
      if (!result.success) { setError(result.error); return; }
      onSuccess(result.card);
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ajouter un candidat</DialogTitle>
        <DialogDescription>
          Le candidat sera ajouté en colonne "Nouveau" du pipeline.
        </DialogDescription>
      </DialogHeader>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" name="firstName" placeholder="Maya" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" name="lastName" placeholder="Chen" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" placeholder="maya@example.com" type="email" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <select
              id="source"
              name="source"
              className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue="other"
            >
              {(Object.entries(SOURCE_LABELS) as [AcquisitionSource, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {briefs.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="briefId">Brief lié</Label>
              <select
                id="briefId"
                name="briefId"
                className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue=""
              >
                <option value="">Aucun brief</option>
                {briefs.map((b) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Impressions, source de contact…"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onCancel} type="button" variant="outline">
            Annuler
          </Button>
          <Button disabled={isPending} type="submit">
            {isPending ? "Ajout…" : "Ajouter au pipeline"}
          </Button>
        </div>
      </form>
    </>
  );
}
