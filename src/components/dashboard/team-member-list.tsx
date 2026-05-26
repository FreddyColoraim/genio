"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ChevronRight, FileText, Search, SlidersHorizontal,
} from "lucide-react";
import type { TeamMember, TeamMemberStatus } from "@/services/team-service";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<TeamMemberStatus, string> = {
  not_started: "Non démarré",
  in_progress: "En cours",
  complete:    "Terminé",
};

const STATUS_VARIANTS: Record<TeamMemberStatus, "soft" | "blue" | "success"> = {
  not_started: "soft",
  in_progress: "blue",
  complete:    "success",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FilterStatus = "all" | TeamMemberStatus;

export function TeamMemberList({ members }: { members: TeamMember[] }) {
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.poste.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un collaborateur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
          <SlidersHorizontal className="ml-1 size-3.5 text-muted-foreground" />
          {(["all", "not_started", "in_progress", "complete"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-navy text-white"
                  : "text-muted-foreground hover:text-navy"
              )}
            >
              {s === "all" ? "Tous" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">
          {filtered.length} collaborateur{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {members.length === 0
              ? "Aucun collaborateur dans l'équipe pour le moment."
              : "Aucun résultat pour cette recherche."}
          </div>
        ) : (
          <div className="divide-y">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-[2fr_1.2fr_1fr_0.8fr_1fr_auto] gap-4 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-warm/40">
              <span>Collaborateur</span>
              <span>Poste / Département</span>
              <span>Progression</span>
              <span>Statut</span>
              <span>Alertes</span>
              <span />
            </div>

            {filtered.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function MemberRow({ member }: { member: TeamMember }) {
  const startDateFmt = member.startDate
    ? new Date(member.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const lastActivityFmt = member.lastActivity
    ? new Date(member.lastActivity).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    : null;

  return (
    <div className="grid gap-3 px-4 py-3.5 md:grid-cols-[2fr_1.2fr_1fr_0.8fr_1fr_auto] md:items-center hover:bg-warm/20 transition-colors">
      {/* Collaborateur */}
      <div>
        <p className="font-medium text-navy">{member.name}</p>
        <p className="text-xs text-muted-foreground">{member.email}</p>
        {startDateFmt && (
          <p className="mt-0.5 text-xs text-muted-foreground">Arrivée : {startDateFmt}</p>
        )}
      </div>

      {/* Poste / Département */}
      <div>
        <p className="text-sm font-medium">{member.poste || <span className="text-muted-foreground italic">Poste non défini</span>}</p>
        {member.department && <p className="text-xs text-muted-foreground">{member.department}</p>}
        {member.manager && <p className="text-xs text-muted-foreground">Manager : {member.manager}</p>}
      </div>

      {/* Progression */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{member.completedTasks}/{member.totalTasks} tâches</span>
          <span>{member.progress}%</span>
        </div>
        <Progress value={member.progress} />
        {lastActivityFmt && (
          <p className="text-[10px] text-muted-foreground">Dernier point : {lastActivityFmt}</p>
        )}
      </div>

      {/* Statut */}
      <div>
        <Badge variant={STATUS_VARIANTS[member.status]}>
          {STATUS_LABELS[member.status]}
        </Badge>
        {member.pendingDocuments > 0 && (
          <p className="mt-1 text-xs text-amber-700">
            {member.pendingDocuments} doc{member.pendingDocuments > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Alertes */}
      <div className="space-y-1">
        {member.alerts.length === 0 ? (
          <span className="text-xs text-green-600">✓ Aucune alerte</span>
        ) : (
          member.alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="size-3 shrink-0" />
              <span>{alert.label}</span>
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/employees/${member.id}?tab=docs` as never}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-blue/40 hover:text-navy transition-colors"
          title="Kit documents"
        >
          <FileText className="size-3.5" />
          Docs
        </Link>
        <Link
          href={`/team/${member.id}` as never}
          className="flex items-center gap-1 rounded-lg border border-blue/30 bg-blue/5 px-2.5 py-1.5 text-xs font-medium text-blue hover:bg-blue/10 transition-colors"
          title="Fiche collaborateur"
        >
          Fiche
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
