"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, Circle, Download, FilePlus,
  Loader2, Plus, Save, UploadCloud, X,
} from "lucide-react";
import type { TeamMemberDetail, ObjectifsMap, TeamMemberStatus } from "@/services/team-service";
import {
  saveObjectifsAction, saveNotesAction, saveOutilsAction, toggleTaskAction,
} from "@/app/(dashboard)/team/[id]/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
// Tabs
// ---------------------------------------------------------------------------

type TabKey = "profil" | "onboarding" | "objectifs" | "documents" | "notes" | "outils";

const TABS: { key: TabKey; label: string }[] = [
  { key: "profil",     label: "Profil" },
  { key: "onboarding", label: "Onboarding" },
  { key: "objectifs",  label: "Objectifs" },
  { key: "documents",  label: "Documents" },
  { key: "outils",     label: "Outils & accès" },
  { key: "notes",      label: "Notes RH" },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TeamMemberDetailView({ member }: { member: TeamMemberDetail }) {
  const [activeTab, setActiveTab] = useState<TabKey>("profil");

  return (
    <div className="space-y-0">
      {/* Sub-header / status strip */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_VARIANTS[member.status]}>
              {STATUS_LABELS[member.status]}
            </Badge>
            {member.alerts.map((alert, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                <AlertTriangle className="size-3" />
                {alert.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progression onboarding</span>
                <span>{member.progress}%</span>
              </div>
              <Progress value={member.progress} />
            </div>
            <span className="text-xs text-muted-foreground">
              {member.completedTasks}/{member.totalTasks} tâches
            </span>
            {member.pendingDocuments > 0 && (
              <span className="text-xs text-amber-700">
                {member.pendingDocuments} doc{member.pendingDocuments > 1 ? "s" : ""} en attente
              </span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/employees/${member.id}?tab=docs` as never}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-blue/40 hover:text-navy transition-colors"
          >
            <FilePlus className="size-3.5" />
            Kit docs
          </Link>
          {member.onboardingId && (
            <Link
              href={`/employees/${member.id}/docs/print` as never}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-blue/40 hover:text-navy transition-colors"
            >
              <Download className="size-3.5" />
              PDF
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px",
              activeTab === tab.key
                ? "border-blue text-navy"
                : "border-transparent text-muted-foreground hover:text-navy"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "profil"     && <ProfilTab member={member} />}
        {activeTab === "onboarding" && <OnboardingTab member={member} />}
        {activeTab === "objectifs"  && <ObjectifsTab member={member} />}
        {activeTab === "documents"  && <DocumentsTab member={member} />}
        {activeTab === "outils"     && <OutilsTab member={member} />}
        {activeTab === "notes"      && <NotesTab member={member} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profil tab
// ---------------------------------------------------------------------------

function ProfilTab({ member }: { member: TeamMemberDetail }) {
  const fields = [
    { label: "Nom complet",    value: member.name },
    { label: "Email",          value: member.email },
    { label: "Poste",          value: member.poste || "—" },
    { label: "Département",    value: member.department || "—" },
    { label: "Manager",        value: member.manager || "—" },
    {
      label: "Date d'arrivée",
      value: member.startDate
        ? new Date(member.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        : "—",
    },
    {
      label: "Dernière activité",
      value: member.lastActivity
        ? new Date(member.lastActivity).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        : "—",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map(({ label, value }) => (
        <div key={label} className="rounded-xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-medium text-navy">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onboarding tab
// ---------------------------------------------------------------------------

function OnboardingTab({ member }: { member: TeamMemberDetail }) {
  const [tasks, setTasks]      = useState(member.tasks);
  const [pending, startTransition] = useTransition();

  function toggle(taskId: string) {
    if (!member.onboardingId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const isComplete = !task.completedAt;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, completedAt: isComplete ? new Date().toISOString() : null }
          : t
      )
    );

    startTransition(async () => {
      await toggleTaskAction(taskId, member.onboardingId!, isComplete);
    });
  }

  if (!member.onboardingId) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
        <p>Aucun onboarding configuré pour ce collaborateur.</p>
        <p className="mt-2">
          <Link href={`/employees/${member.id}?tab=docs` as never} className="text-blue underline">
            Configurer le kit de documents
          </Link>
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Aucune tâche d'onboarding enregistrée.
      </div>
    );
  }

  const completed = tasks.filter((t) => t.completedAt !== null).length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy">Tâches d'intégration</p>
          <span className="text-xs text-muted-foreground">{completed}/{tasks.length} terminées</span>
        </div>
        <Progress value={tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0} />
      </div>

      <div className="rounded-xl border bg-white divide-y overflow-hidden">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => toggle(task.id)}
            disabled={pending}
            className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-warm/30 transition-colors"
          >
            {task.completedAt ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
            ) : (
              <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1">
              <p className={cn("text-sm font-medium", task.completedAt && "line-through text-muted-foreground")}>
                {task.title}
              </p>
              {task.completedAt && (
                <p className="text-xs text-muted-foreground">
                  Validé le {new Date(task.completedAt).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Objectifs tab — J7 / J30 / J60 / J90
// ---------------------------------------------------------------------------

function ObjectifsTab({ member }: { member: TeamMemberDetail }) {
  const [objectifs, setObjectifs] = useState<ObjectifsMap>({ ...member.objectifs });
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const result = await saveObjectifsAction(member.id, objectifs);
      if (!result.success) { setError(result.error); return; }
      setSaved(true);
    });
  }

  const reviews: { key: keyof ObjectifsMap; label: string; sublabel: string; color: string }[] = [
    { key: "j7",  label: "Point J+7",  sublabel: "Première semaine", color: "border-l-blue" },
    { key: "j30", label: "Point J+30", sublabel: "Premier mois",    color: "border-l-green-400" },
    { key: "j60", label: "Point J+60", sublabel: "Deuxième mois",   color: "border-l-amber-400" },
    { key: "j90", label: "Point J+90", sublabel: "Fin de période",  color: "border-l-purple-400" },
  ];

  return (
    <div className="space-y-4">
      {reviews.map(({ key, label, sublabel, color }) => (
        <div key={key} className={cn("rounded-xl border bg-white p-4 border-l-4", color)}>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-navy">{label}</p>
              <p className="text-xs text-muted-foreground">{sublabel}</p>
            </div>
            {member.startDate && (
              <ReviewDate startDate={member.startDate} days={parseInt(key.slice(1))} />
            )}
          </div>
          <textarea
            value={objectifs[key]}
            onChange={(e) => setObjectifs((prev) => ({ ...prev, [key]: e.target.value }))}
            placeholder={`Objectifs et points clés à valider lors du point ${label}…`}
            rows={3}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      ))}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          ✓ Objectifs sauvegardés.
        </p>
      )}

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {isPending ? "Sauvegarde…" : "Enregistrer les objectifs"}
      </Button>
    </div>
  );
}

function ReviewDate({ startDate, days }: { startDate: string; days: number }) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + days);
  return (
    <span className="rounded-lg bg-warm px-2 py-1 text-xs font-medium text-muted-foreground">
      {d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Documents tab
// ---------------------------------------------------------------------------

function DocumentsTab({ member }: { member: TeamMemberDetail }) {
  const [docs, setDocs]             = useState(member.documents);
  const [pending, startTransition]  = useTransition();

  function toggleDoc(docId: string) {
    if (!member.onboardingId) return;
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return;
    const isComplete = !doc.completedAt;

    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, completedAt: isComplete ? new Date().toISOString() : null }
          : d
      )
    );

    startTransition(async () => {
      await toggleTaskAction(docId, member.onboardingId!, isComplete);
    });
  }

  if (docs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
        <p>Aucun document sélectionné.</p>
        <p className="mt-2">
          <Link href={`/employees/${member.id}?tab=docs` as never} className="text-blue underline">
            Configurer le kit de documents →
          </Link>
        </p>
      </div>
    );
  }

  const toGenerate = docs.filter((d) => d.action === "generate");
  const toCollect  = docs.filter((d) => d.action === "collect");

  return (
    <div className="space-y-4">
      {toGenerate.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-green-50/50">
            <p className="text-sm font-semibold text-green-800">
              <FilePlus className="inline size-4 mr-1.5 -mt-0.5" />
              À générer ({toGenerate.length})
            </p>
            <Link
              href={`/employees/${member.id}/docs/print` as never}
              className="flex items-center gap-1 text-xs text-green-700 hover:underline"
            >
              <Download className="size-3.5" />
              Tout imprimer
            </Link>
          </div>
          <div className="divide-y">
            {toGenerate.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                <p className="flex-1 text-sm text-navy">{doc.label}</p>
                <span className="text-xs text-muted-foreground capitalize">{doc.bloc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {toCollect.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-amber-50/50">
            <p className="text-sm font-semibold text-amber-800">
              <UploadCloud className="inline size-4 mr-1.5 -mt-0.5" />
              À collecter ({toCollect.length})
            </p>
          </div>
          <div className="divide-y">
            {toCollect.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => toggleDoc(doc.id)}
                disabled={pending}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-warm/30 transition-colors"
              >
                {doc.completedAt ? (
                  <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <p className={cn("flex-1 text-sm", doc.completedAt && "line-through text-muted-foreground")}>
                  {doc.label}
                </p>
                {doc.completedAt ? (
                  <span className="text-xs text-green-600">Reçu</span>
                ) : (
                  <span className="text-xs text-amber-600">En attente</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outils & accès tab
// ---------------------------------------------------------------------------

const SUGGESTED_TOOLS = [
  "Slack", "Notion", "Google Workspace", "Microsoft 365", "Jira", "Trello",
  "Figma", "GitHub", "Salesforce", "HubSpot", "Asana", "Monday", "Zoom",
];

function OutilsTab({ member }: { member: TeamMemberDetail }) {
  const [outils, setOutils]           = useState<string[]>(member.outils);
  const [newTool, setNewTool]          = useState("");
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  function addTool(tool: string) {
    const trimmed = tool.trim();
    if (!trimmed || outils.includes(trimmed)) return;
    setOutils((prev) => [...prev, trimmed]);
    setNewTool("");
  }

  function removeTool(tool: string) {
    setOutils((prev) => prev.filter((t) => t !== tool));
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const result = await saveOutilsAction(member.id, outils);
      if (!result.success) { setError(result.error); return; }
      setSaved(true);
    });
  }

  const suggestions = SUGGESTED_TOOLS.filter((t) => !outils.includes(t));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-white p-4 space-y-4">
        <p className="text-sm font-semibold text-navy">Outils assignés</p>

        {outils.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun outil assigné pour le moment.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {outils.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue/5 border border-blue/20 px-3 py-1 text-sm font-medium text-blue"
              >
                {tool}
                <button type="button" onClick={() => removeTool(tool)}>
                  <X className="size-3 hover:text-destructive" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add tool input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTool}
            onChange={(e) => setNewTool(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTool(newTool); } }}
            placeholder="Ajouter un outil…"
            className="h-9 flex-1 rounded-lg border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="button" variant="outline" onClick={() => addTool(newTool)} disabled={!newTool.trim()}>
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Suggestions :</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 8).map((tool) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => addTool(tool)}
                  className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-blue/40 hover:text-blue transition-colors"
                >
                  + {tool}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          ✓ Outils enregistrés.
        </p>
      )}

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {isPending ? "Sauvegarde…" : "Enregistrer les accès"}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes tab
// ---------------------------------------------------------------------------

function NotesTab({ member }: { member: TeamMemberDetail }) {
  const [notes, setNotes]            = useState(member.notes);
  const [saved, setSaved]            = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const result = await saveNotesAction(member.id, notes);
      if (!result.success) { setError(result.error); return; }
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-navy">Notes RH — {member.name}</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Notes internes visibles uniquement par les RH et managers.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations, points de vigilance, historique RH, informations de contexte…"
          rows={10}
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          ✓ Notes sauvegardées.
        </p>
      )}

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {isPending ? "Sauvegarde…" : "Enregistrer les notes"}
      </Button>
    </div>
  );
}
