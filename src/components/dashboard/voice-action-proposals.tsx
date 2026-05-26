"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Loader2, ListTodo, BriefcaseIcon, BellIcon, FileTextIcon, SparklesIcon } from "lucide-react";
import { confirmVoiceActionAction } from "@/app/(dashboard)/voice/actions";
import type { VoiceActionItem } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionState = "pending" | "confirmed" | "rejected" | "loading";

type ActionItemState = {
  action: VoiceActionItem;
  status: ActionState;
  error?: string;
};

type Props = {
  noteId: string;
  transcript: string;
  summary: string;
  actionItems: VoiceActionItem[];
  onDone?: () => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTION_META: Record<
  VoiceActionItem["type"],
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  task:     { label: "Tâche",    icon: ListTodo,       color: "text-blue-600 bg-blue-50 border-blue-200" },
  brief:    { label: "Brief",    icon: BriefcaseIcon,  color: "text-purple-600 bg-purple-50 border-purple-200" },
  reminder: { label: "Rappel",   icon: BellIcon,       color: "text-amber-600 bg-amber-50 border-amber-200" },
  note:     { label: "Note",     icon: FileTextIcon,   color: "text-slate-600 bg-slate-50 border-slate-200" },
};

const ACTION_BADGE: Record<VoiceActionItem["type"], "default" | "soft" | "success"> = {
  task:     "default",
  brief:    "soft",
  reminder: "soft",
  note:     "soft",
};

// ---------------------------------------------------------------------------
// Single action card
// ---------------------------------------------------------------------------

function ActionCard({
  item,
  noteId,
  onUpdate,
}: {
  item: ActionItemState;
  noteId: string;
  onUpdate: (status: ActionState, error?: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const meta = ACTION_META[item.action.type];
  const Icon = meta.icon;

  function handleConfirm() {
    startTransition(async () => {
      onUpdate("loading");
      const result = await confirmVoiceActionAction(noteId, item.action);
      if (result.success) {
        onUpdate("confirmed");
      } else {
        onUpdate("rejected", result.error);
      }
    });
  }

  function handleReject() {
    onUpdate("rejected");
  }

  const isLoading = isPending || item.status === "loading";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        item.status === "confirmed" && "border-green-200 bg-green-50 opacity-75",
        item.status === "rejected" && "border-red-100 bg-red-50/50 opacity-50",
        item.status === "pending" && `border ${meta.color}`,
        item.status === "loading" && "border border-muted bg-muted/20 animate-pulse"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn("mt-0.5 rounded-lg p-1.5 shrink-0", meta.color.split(" ").slice(1).join(" "))}>
            <Icon className={cn("size-4", meta.color.split(" ")[0])} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={ACTION_BADGE[item.action.type]} className="text-xs">
                {meta.label}
              </Badge>
              {item.action.due_date && (
                <span className="text-xs text-muted-foreground">
                  {new Date(item.action.due_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium leading-snug">{item.action.title}</p>
            {item.action.body && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {item.action.body}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {item.status === "pending" && (
          <div className="flex shrink-0 gap-2">
            <Button
              aria-label="Refuser"
              className="size-8 rounded-full"
              disabled={isLoading}
              onClick={handleReject}
              size="icon"
              type="button"
              variant="ghost"
            >
              <XCircle className="size-4 text-muted-foreground" />
            </Button>
            <Button
              aria-label="Confirmer"
              className="size-8 rounded-full"
              disabled={isLoading}
              onClick={handleConfirm}
              size="icon"
              type="button"
              variant="ghost"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4 text-green-600" />
              )}
            </Button>
          </div>
        )}

        {item.status === "confirmed" && (
          <CheckCircle2 className="size-5 shrink-0 text-green-500 mt-0.5" />
        )}

        {item.status === "rejected" && (
          <XCircle className="size-5 shrink-0 text-red-400 mt-0.5" />
        )}
      </div>

      {item.error && (
        <p className="mt-2 text-xs text-destructive">{item.error}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main proposals panel
// ---------------------------------------------------------------------------

export function VoiceActionProposals({ noteId, transcript, summary, actionItems, onDone }: Props) {
  const [items, setItems] = useState<ActionItemState[]>(
    actionItems.map((action) => ({ action, status: "pending" }))
  );

  const allDone = items.every((i) => i.status === "confirmed" || i.status === "rejected");
  const confirmedCount = items.filter((i) => i.status === "confirmed").length;

  function updateItem(index: number, status: ActionState, error?: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? ({ ...item, status, ...(error !== undefined ? { error } : {}) } as ActionItemState)
          : item
      )
    );
  }

  function confirmAll() {
    items.forEach((item, i) => {
      if (item.status === "pending") {
        updateItem(i, "loading");
        confirmVoiceActionAction(noteId, item.action).then((result) => {
          updateItem(i, result.success ? "confirmed" : "rejected", result.success ? undefined : result.error);
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
        <SparklesIcon className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Résumé de la note</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{summary}</p>
          {transcript && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                Voir la transcription complète
              </summary>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed rounded-lg bg-muted/40 p-3">
                {transcript}
              </p>
            </details>
          )}
        </div>
      </div>

      {/* Action items */}
      {items.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Actions proposées{" "}
              <span className="text-muted-foreground font-normal">({items.length})</span>
            </p>
            {!allDone && items.filter((i) => i.status === "pending").length > 1 && (
              <Button
                onClick={confirmAll}
                size="sm"
                type="button"
                variant="outline"
                className="text-xs"
              >
                Tout confirmer
              </Button>
            )}
          </div>

          {items.map((item, i) => (
            <ActionCard
              key={i}
              item={item}
              noteId={noteId}
              onUpdate={(status, error) => updateItem(i, status, error)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Aucune action détectée dans cette note.
          </CardContent>
        </Card>
      )}

      {/* Done footer */}
      {allDone && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">
            {confirmedCount > 0
              ? `${confirmedCount} action${confirmedCount > 1 ? "s" : ""} créée${confirmedCount > 1 ? "s" : ""}`
              : "Aucune action créée"}
          </p>
          {onDone && (
            <Button onClick={onDone} size="sm" type="button" variant="outline">
              Nouvelle note
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
