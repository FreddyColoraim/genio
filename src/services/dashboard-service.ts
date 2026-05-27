import type { Metric } from "@/components/dashboard/metric-card";
import type { UpcomingArrival } from "@/components/dashboard/dashboard-upcoming";
import type { UrgentAction } from "@/components/dashboard/dashboard-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types UI (compatibles avec les composants existants)
// ---------------------------------------------------------------------------

export type OnboardingStatus = "Not started" | "In progress" | "Waiting" | "Complete";

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  position: number;
  status: "todo" | "done";
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  accessRole: "employee";
  department: string;
  manager: string;
  startDate: string;
  progress: number;
  status: OnboardingStatus;
  pendingDocuments: number;
  onboardingSteps: OnboardingStep[];
};

export type DashboardData = {
  employees: Employee[];
  metrics: Metric[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const frenchDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function formatDate(d: string) {
  return frenchDate.format(new Date(`${d}T00:00:00`));
}

function isCurrentMonth(d: string) {
  const now  = new Date();
  const date = new Date(`${d}T00:00:00`);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function pctToStatus(pct: number): OnboardingStatus {
  if (pct === 100) return "Complete";
  if (pct > 0)    return "In progress";
  return "Not started";
}

// ---------------------------------------------------------------------------
// getDashboardData
// ---------------------------------------------------------------------------

export async function getDashboardData(): Promise<DashboardData> {
  const sessionClient = await createClient();
  const { data: userData } = await sessionClient.auth.getUser();
  if (!userData.user) return { employees: [], metrics: buildMetrics([], []) };

  const admin = createAdminClient();

  // tenant via membership
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .single();

  if (!membership) return { employees: [], metrics: buildMetrics([], []) };

  const tenantId = membership.tenant_id as string;

  // entités (candidats + employés)
  const { data: entityRows, error: entityError } = await admin
    .from("entities")
    .select("id, first_name, last_name, email, metadata, created_at, status")
    .eq("tenant_id", tenantId)
    .in("entity_type", ["employee", "candidate"])
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (entityError) throw new Error(`Impossible de charger les entités : ${entityError.message}`);

  const entities = entityRows ?? [];
  if (entities.length === 0) return { employees: [], metrics: buildMetrics([], []) };

  const entityIds = entities.map((e) => e.id);

  // onboardings
  const { data: onboardingRows } = await admin
    .from("onboardings")
    .select("id, entity_id, completion_pct, start_date")
    .eq("tenant_id", tenantId)
    .in("entity_id", entityIds);

  const onboardingByEntity = Object.fromEntries(
    (onboardingRows ?? []).map((o) => [o.entity_id, o])
  );

  // tâches onboarding
  const onboardingIds = (onboardingRows ?? []).map((o) => o.id);
  const taskRows = onboardingIds.length > 0
    ? (await admin
        .from("onboarding_tasks")
        .select("id, onboarding_id, title, description, priority, completed_at")
        .in("onboarding_id", onboardingIds)
        .order("priority", { ascending: true })
      ).data ?? []
    : [];

  const tasksByOnboarding: Record<string, typeof taskRows> = {};
  for (const task of taskRows) {
    tasksByOnboarding[task.onboarding_id] = [...(tasksByOnboarding[task.onboarding_id] ?? []), task];
  }

  // documents en attente
  const { data: docRows } = await admin
    .from("documents")
    .select("entity_id, signature_status")
    .eq("tenant_id", tenantId)
    .in("entity_id", entityIds);

  const pendingDocsByEntity: Record<string, number> = {};
  for (const doc of docRows ?? []) {
    if (doc.signature_status !== "signed") {
      pendingDocsByEntity[doc.entity_id] = (pendingDocsByEntity[doc.entity_id] ?? 0) + 1;
    }
  }

  // assemblage
  const employees: Employee[] = entities.map((e) => {
    const meta   = (e.metadata ?? {}) as Record<string, unknown>;
    const ob     = onboardingByEntity[e.id];
    const tasks  = ob ? (tasksByOnboarding[ob.id] ?? []) : [];
    const pct    = ob?.completion_pct ?? 0;
    const startD = ob?.start_date ?? e.created_at.slice(0, 10);

    return {
      id:         e.id,
      name:       [e.first_name, e.last_name].filter(Boolean).join(" ") || "—",
      email:      e.email ?? "",
      role:       String(meta["poste"] ?? "—"),
      accessRole: "employee" as const,
      department: String(meta["departement"] ?? "—"),
      manager:    "—",
      startDate:  formatDate(startD),
      progress:   pct,
      status:     pctToStatus(pct),
      pendingDocuments: pendingDocsByEntity[e.id] ?? 0,
      onboardingSteps:  tasks.map((t, i) => ({
        id:          t.id,
        title:       t.title,
        description: t.description ?? "",
        position:    t.priority ?? i + 1,
        status:      t.completed_at ? "done" : "todo",
      })),
    };
  });

  return { employees, metrics: buildMetrics(employees, docRows ?? []) };
}

// ---------------------------------------------------------------------------
// Métriques
// ---------------------------------------------------------------------------

function buildMetrics(
  employees: Employee[],
  docs: Array<{ signature_status: string | null }>,
): Metric[] {
  const total     = employees.length;
  const active    = employees.filter((e) => e.status !== "Complete").length;
  const complete  = employees.filter((e) => e.status === "Complete").length;
  const avgPct    = total ? Math.round(employees.reduce((s, e) => s + e.progress, 0) / total) : 0;
  const pending   = docs.filter((d) => d.signature_status !== "signed").length;
  const received  = docs.filter((d) => d.signature_status === "pending").length;
  const thisMonth = employees.filter((e) => {
    const raw = e.startDate;
    const d   = new Date(raw);
    return !isNaN(d.getTime()) && isCurrentMonth(d.toISOString().slice(0, 10));
  }).length;

  return [
    { label: "Onboardings actifs",    value: String(active),   detail: `${complete} parcours terminés`,               tone: "blue" },
    { label: "Progression moyenne",   value: `${avgPct}%`,     detail: `${total} collaborateur${total > 1 ? "s" : ""} suivi${total > 1 ? "s" : ""}`, tone: "sage" },
    { label: "Documents en attente",  value: String(pending),  detail: `${received} reçus à valider`,                 tone: "lavender" },
    { label: "Arrivées ce mois-ci",   value: String(thisMonth),detail: "Basé sur la date d'arrivée",                  tone: "navy" },
  ];
}

// ---------------------------------------------------------------------------
// getUpcomingArrivals — onboardings dans les 14 prochains jours
// ---------------------------------------------------------------------------

export async function getUpcomingArrivals(): Promise<UpcomingArrival[]> {
  const sessionClient = await createClient();
  const { data: userData } = await sessionClient.auth.getUser();
  if (!userData.user) return [];

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .single();
  if (!membership) return [];

  const tenantId = membership.tenant_id as string;
  const now   = new Date();
  const past7 = new Date(now.getTime() - 7  * 86400000).toISOString().slice(0, 10);
  const in14  = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);

  const { data: onboardings } = await admin
    .from("onboardings")
    .select("id, entity_id, start_date, completion_pct")
    .eq("tenant_id", tenantId)
    .gte("start_date", past7)
    .lte("start_date", in14)
    .order("start_date", { ascending: true })
    .limit(8);

  if (!onboardings?.length) return [];

  const entityIds = onboardings.map((o) => o.entity_id);
  const { data: entities } = await admin
    .from("entities")
    .select("id, first_name, last_name, metadata")
    .in("id", entityIds);

  const entityMap = Object.fromEntries(
    (entities ?? []).map((e) => [e.id, e])
  );

  return onboardings.map((ob) => {
    const entity   = entityMap[ob.entity_id];
    const meta     = (entity?.metadata ?? {}) as Record<string, unknown>;
    const name     = entity ? [entity.first_name, entity.last_name].filter(Boolean).join(" ") || "—" : "—";
    const daysUntil = ob.start_date
      ? Math.round((new Date(ob.start_date).getTime() - now.getTime()) / 86400000)
      : 0;
    return {
      id:           ob.entity_id,
      name,
      poste:        (meta["poste"] as string) ?? "",
      startDate:    ob.start_date ?? now.toISOString().slice(0, 10),
      daysUntil,
      progress:     ob.completion_pct ?? 0,
      onboardingId: ob.id,
    };
  });
}

// ---------------------------------------------------------------------------
// getUrgentActions — docs en attente + onboardings non configurés
// ---------------------------------------------------------------------------

export async function getUrgentActions(): Promise<UrgentAction[]> {
  const sessionClient = await createClient();
  const { data: userData } = await sessionClient.auth.getUser();
  if (!userData.user) return [];

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .single();
  if (!membership) return [];

  const tenantId = membership.tenant_id as string;
  const actions: UrgentAction[] = [];

  // Entities without onboarding
  const { data: entities } = await admin
    .from("entities")
    .select("id, first_name, last_name, metadata")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  if (entities?.length) {
    const entityIds = entities.map((e) => e.id);
    const { data: onboardings } = await admin
      .from("onboardings")
      .select("entity_id")
      .eq("tenant_id", tenantId)
      .in("entity_id", entityIds);

    const onboardedIds = new Set((onboardings ?? []).map((o) => o.entity_id));

    for (const entity of entities.slice(0, 5)) {
      const name = [entity.first_name, entity.last_name].filter(Boolean).join(" ") || "—";
      if (!onboardedIds.has(entity.id)) {
        actions.push({
          id:         `no-onb-${entity.id}`,
          entityId:   entity.id,
          entityName: name,
          type:       "no_onboarding",
          label:      "Onboarding non configuré",
          detail:     "Aucune tâche ou document associé",
          href:       `/employees/${entity.id}?tab=docs`,
        });
      }
    }

    // Kit docs pending
    const { data: pendingDocTasks } = await admin
      .from("onboarding_tasks")
      .select("id, onboarding_id, title")
      .eq("tenant_id", tenantId)
      .eq("category", "document")
      .is("completed_at", null)
      .limit(20);

    if (pendingDocTasks?.length) {
      const { data: obs } = await admin
        .from("onboardings")
        .select("id, entity_id")
        .in("id", [...new Set(pendingDocTasks.map((t) => t.onboarding_id))]);

      const obMap   = Object.fromEntries((obs ?? []).map((o) => [o.id, o.entity_id]));
      const nameMap = Object.fromEntries(
        (entities ?? []).map((e) => [
          e.id,
          [e.first_name, e.last_name].filter(Boolean).join(" ") || "—",
        ])
      );

      const byEntity = new Map<string, string[]>();
      for (const task of pendingDocTasks) {
        const entityId = obMap[task.onboarding_id] ?? "";
        if (!entityId) continue;
        const list = byEntity.get(entityId) ?? [];
        list.push(task.title);
        byEntity.set(entityId, list);
      }

      for (const [entityId, docs] of byEntity.entries()) {
        if (actions.length >= 10) break;
        actions.push({
          id:         `docs-${entityId}`,
          entityId,
          entityName: nameMap[entityId] ?? "—",
          type:       "pending_doc",
          label:      `${docs.length} document${docs.length > 1 ? "s" : ""} à collecter`,
          detail:     docs.slice(0, 2).join(", ") + (docs.length > 2 ? "…" : ""),
          href:       `/team/${entityId}?tab=documents`,
        });
      }
    }
  }

  return actions.slice(0, 8);
}

// ---------------------------------------------------------------------------
// getEmployeeById — fiche onboarding d'un seul collaborateur
// ---------------------------------------------------------------------------

export async function getEmployeeById(entityId: string): Promise<Employee | null> {
  const sessionClient = await createClient();
  const { data: userData } = await sessionClient.auth.getUser();
  if (!userData.user) return null;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .single();
  if (!membership) return null;

  const tenantId = membership.tenant_id as string;

  // Entité
  const { data: entity } = await admin
    .from("entities")
    .select("id, first_name, last_name, email, metadata, created_at")
    .eq("id", entityId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!entity) return null;

  const meta = (entity.metadata ?? {}) as Record<string, unknown>;

  // Onboarding
  const { data: ob } = await admin
    .from("onboardings")
    .select("id, completion_pct, start_date")
    .eq("entity_id", entityId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  // Tâches
  let onboardingSteps: OnboardingStep[] = [];
  if (ob) {
    const { data: tasks } = await admin
      .from("onboarding_tasks")
      .select("id, title, description, priority, completed_at")
      .eq("onboarding_id", ob.id)
      .order("priority", { ascending: true });

    onboardingSteps = (tasks ?? []).map((t, i) => ({
      id:          t.id,
      title:       t.title,
      description: t.description ?? "",
      position:    t.priority ?? i + 1,
      status:      t.completed_at ? "done" : "todo",
    }));
  }

  // Documents en attente
  const { data: docs } = await admin
    .from("documents")
    .select("signature_status")
    .eq("entity_id", entityId)
    .eq("tenant_id", tenantId);

  const pendingDocuments = (docs ?? []).filter((d) => d.signature_status !== "signed").length;

  const pct    = ob?.completion_pct ?? 0;
  const startD = ob?.start_date ?? entity.created_at.slice(0, 10);

  return {
    id:         entityId,
    name:       [entity.first_name, entity.last_name].filter(Boolean).join(" ") || "—",
    email:      entity.email ?? "",
    role:       String(meta["poste"] ?? "—"),
    accessRole: "employee" as const,
    department: String(meta["departement"] ?? "—"),
    manager:    "—",
    startDate:  formatDate(startD),
    progress:   pct,
    status:     pctToStatus(pct),
    pendingDocuments,
    onboardingSteps,
  };
}
