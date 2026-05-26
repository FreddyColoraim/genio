import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TeamMemberStatus = "not_started" | "in_progress" | "complete";

export type TeamAlert = {
  type: "no_onboarding" | "missing_docs" | "no_start_date" | "overdue";
  label: string;
};

export type ObjectifsMap = {
  j7:  string;
  j30: string;
  j60: string;
  j90: string;
};

export type TeamMember = {
  id:               string;
  name:             string;
  email:            string;
  poste:            string;
  department:       string;
  manager:          string;
  startDate:        string | null;
  status:           TeamMemberStatus;
  progress:         number;
  totalTasks:       number;
  completedTasks:   number;
  pendingDocuments: number;
  onboardingId:     string | null;
  lastActivity:     string | null;
  alerts:           TeamAlert[];
};

export type TeamTask = {
  id:          string;
  title:       string;
  category:    string;
  completedAt: string | null;
  priority:    number;
  key:         string;
};

export type TeamDocument = {
  id:          string;
  docId:       string;
  label:       string;
  action:      "collect" | "generate";
  completedAt: string | null;
  bloc:        string;
};

export type TeamMemberDetail = TeamMember & {
  notes:     string;
  outils:    string[];
  objectifs: ObjectifsMap;
  tasks:     TeamTask[];
  documents: TeamDocument[];
};

export type TeamOverview = {
  total:          number;
  inProgress:     number;
  complete:       number;
  pendingActions: number;
  alertCount:     number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getTenantContext() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) throw new Error("Vous devez être connecté.");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!membership) throw new Error("Aucun tenant associé.");
  return { userId: user.id, tenantId: membership.tenant_id as string };
}

function buildMemberStatus(
  onboarding: { id: string; start_date: string | null } | null,
  progress: number
): TeamMemberStatus {
  if (!onboarding) return "not_started";
  if (progress === 100) return "complete";
  if (progress > 0) return "in_progress";
  return "not_started";
}

// ---------------------------------------------------------------------------
// getTeamMembers
// ---------------------------------------------------------------------------

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data: entities } = await admin
    .from("entities")
    .select("id, first_name, last_name, email, metadata, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (!entities?.length) return [];

  // All onboardings for this tenant — dedupe by entity_id keeping first (latest)
  const { data: onboardings } = await admin
    .from("onboardings")
    .select("id, entity_id, start_date")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const onboardingByEntity = new Map<string, { id: string; start_date: string | null }>();
  for (const ob of onboardings ?? []) {
    if (!onboardingByEntity.has(ob.entity_id)) {
      onboardingByEntity.set(ob.entity_id, { id: ob.id, start_date: ob.start_date });
    }
  }

  const onboardingIds = Array.from(onboardingByEntity.values()).map((o) => o.id);

  const tasksByOnboarding = new Map<
    string,
    { id: string; title: string; category: string; completed_at: string | null; metadata: unknown; priority: number; key: string | null }[]
  >();

  if (onboardingIds.length > 0) {
    const { data: tasks } = await admin
      .from("onboarding_tasks")
      .select("id, onboarding_id, title, category, completed_at, metadata, priority, key")
      .in("onboarding_id", onboardingIds)
      .eq("tenant_id", tenantId);

    for (const task of tasks ?? []) {
      const list = tasksByOnboarding.get(task.onboarding_id) ?? [];
      list.push(task);
      tasksByOnboarding.set(task.onboarding_id, list);
    }
  }

  return entities.map((entity) => {
    const meta     = (entity.metadata ?? {}) as Record<string, unknown>;
    const onboarding = onboardingByEntity.get(entity.id) ?? null;
    const tasks    = onboarding ? (tasksByOnboarding.get(onboarding.id) ?? []) : [];

    const regularTasks  = tasks.filter((t) => t.category !== "document");
    const collectDocs   = tasks.filter((t) => {
      const m = (t.metadata ?? {}) as Record<string, unknown>;
      return t.category === "document" && m["action"] === "collect";
    });

    const totalTasks      = regularTasks.length;
    const completedTasks  = regularTasks.filter((t) => t.completed_at !== null).length;
    const pendingDocuments = collectDocs.filter((t) => t.completed_at === null).length;
    const progress        = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const status          = buildMemberStatus(onboarding, progress);

    const lastActivity = tasks
      .filter((t) => t.completed_at !== null)
      .map((t) => t.completed_at as string)
      .sort()
      .at(-1) ?? null;

    const alerts: TeamAlert[] = [];
    if (!onboarding) {
      alerts.push({ type: "no_onboarding", label: "Onboarding non configuré" });
    }
    if (pendingDocuments > 0) {
      alerts.push({ type: "missing_docs", label: `${pendingDocuments} doc${pendingDocuments > 1 ? "s" : ""} en attente` });
    }
    if (!onboarding?.start_date && !(meta["startDate"] as string | undefined)) {
      alerts.push({ type: "no_start_date", label: "Date d'arrivée manquante" });
    }

    return {
      id:               entity.id,
      name:             [entity.first_name, entity.last_name].filter(Boolean).join(" ") || "—",
      email:            entity.email ?? "",
      poste:            (meta["poste"] as string) ?? "",
      department:       (meta["departement"] as string) ?? "",
      manager:          (meta["manager"] as string) ?? "",
      startDate:        onboarding?.start_date ?? (meta["startDate"] as string) ?? null,
      status,
      progress,
      totalTasks,
      completedTasks,
      pendingDocuments,
      onboardingId:     onboarding?.id ?? null,
      lastActivity,
      alerts,
    };
  });
}

// ---------------------------------------------------------------------------
// computeTeamOverview (pure — no DB call)
// ---------------------------------------------------------------------------

export function computeTeamOverview(members: TeamMember[]): TeamOverview {
  return {
    total:          members.length,
    inProgress:     members.filter((m) => m.status === "in_progress").length,
    complete:       members.filter((m) => m.status === "complete").length,
    pendingActions: members.reduce((acc, m) => acc + (m.totalTasks - m.completedTasks), 0),
    alertCount:     members.reduce((acc, m) => acc + m.alerts.length, 0),
  };
}

// ---------------------------------------------------------------------------
// getTeamMemberDetail
// ---------------------------------------------------------------------------

export async function getTeamMemberDetail(entityId: string): Promise<TeamMemberDetail> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data: entity, error } = await admin
    .from("entities")
    .select("id, first_name, last_name, email, metadata")
    .eq("id", entityId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !entity) throw new Error("Collaborateur introuvable.");

  const { data: onboarding } = await admin
    .from("onboardings")
    .select("id, start_date")
    .eq("entity_id", entityId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let allTasks: {
    id: string; title: string; category: string;
    completed_at: string | null; metadata: unknown; priority: number; key: string | null;
  }[] = [];

  if (onboarding) {
    const { data: tasks } = await admin
      .from("onboarding_tasks")
      .select("id, title, category, completed_at, metadata, priority, key")
      .eq("onboarding_id", onboarding.id)
      .eq("tenant_id", tenantId)
      .order("priority", { ascending: true });
    allTasks = tasks ?? [];
  }

  const meta          = (entity.metadata ?? {}) as Record<string, unknown>;
  const regularTasks  = allTasks.filter((t) => t.category !== "document");
  const docTasks      = allTasks.filter((t) => t.category === "document");
  const collectDocs   = docTasks.filter((t) => {
    const m = (t.metadata ?? {}) as Record<string, unknown>;
    return m["action"] === "collect";
  });

  const totalTasks      = regularTasks.length;
  const completedTasks  = regularTasks.filter((t) => t.completed_at !== null).length;
  const pendingDocuments = collectDocs.filter((t) => t.completed_at === null).length;
  const progress        = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const status          = buildMemberStatus(onboarding ?? null, progress);

  const lastActivity = allTasks
    .filter((t) => t.completed_at !== null)
    .map((t) => t.completed_at as string)
    .sort()
    .at(-1) ?? null;

  const alerts: TeamAlert[] = [];
  if (!onboarding) alerts.push({ type: "no_onboarding", label: "Onboarding non configuré" });
  if (pendingDocuments > 0) alerts.push({ type: "missing_docs", label: `${pendingDocuments} doc${pendingDocuments > 1 ? "s" : ""} en attente` });

  const objRaw   = (meta["objectifs"] ?? {}) as Record<string, string>;
  const outilsRaw = meta["outils"];

  return {
    id:               entity.id,
    name:             [entity.first_name, entity.last_name].filter(Boolean).join(" ") || "—",
    email:            entity.email ?? "",
    poste:            (meta["poste"] as string) ?? "",
    department:       (meta["departement"] as string) ?? "",
    manager:          (meta["manager"] as string) ?? "",
    startDate:        onboarding?.start_date ?? (meta["startDate"] as string) ?? null,
    status,
    progress,
    totalTasks,
    completedTasks,
    pendingDocuments,
    onboardingId:     onboarding?.id ?? null,
    lastActivity,
    alerts,
    notes:     (meta["notes"] as string) ?? "",
    outils:    Array.isArray(outilsRaw) ? (outilsRaw as string[]) : [],
    objectifs: {
      j7:  objRaw["j7"]  ?? "",
      j30: objRaw["j30"] ?? "",
      j60: objRaw["j60"] ?? "",
      j90: objRaw["j90"] ?? "",
    },
    tasks: regularTasks.map((t) => ({
      id:          t.id,
      title:       t.title,
      category:    t.category,
      completedAt: t.completed_at,
      priority:    t.priority,
      key:         t.key ?? "",
    })),
    documents: docTasks.map((t) => {
      const m = (t.metadata ?? {}) as Record<string, unknown>;
      return {
        id:          t.id,
        docId:       t.key ?? "",
        label:       t.title,
        action:      ((m["action"] as string) === "generate" ? "generate" : "collect") as "collect" | "generate",
        completedAt: t.completed_at,
        bloc:        (m["bloc"] as string) ?? "administratif",
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// saveTeamMemberMeta
// ---------------------------------------------------------------------------

export async function saveTeamMemberMeta(
  entityId: string,
  patch: {
    notes?:     string;
    outils?:    string[];
    objectifs?: Partial<ObjectifsMap>;
    manager?:   string;
    poste?:     string;
    departement?: string;
  }
): Promise<void> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data: entity, error } = await admin
    .from("entities")
    .select("metadata")
    .eq("id", entityId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !entity) throw new Error("Collaborateur introuvable.");

  const meta = { ...((entity.metadata ?? {}) as Record<string, unknown>) };

  if (patch.notes     !== undefined) meta["notes"]      = patch.notes;
  if (patch.outils    !== undefined) meta["outils"]     = patch.outils;
  if (patch.manager   !== undefined) meta["manager"]    = patch.manager;
  if (patch.poste     !== undefined) meta["poste"]      = patch.poste;
  if (patch.departement !== undefined) meta["departement"] = patch.departement;
  if (patch.objectifs !== undefined) {
    const existing = ((meta["objectifs"] ?? {}) as Record<string, string>);
    meta["objectifs"] = { ...existing, ...patch.objectifs };
  }

  await admin
    .from("entities")
    .update({ metadata: meta })
    .eq("id", entityId)
    .eq("tenant_id", tenantId);
}

// ---------------------------------------------------------------------------
// toggleTaskComplete
// ---------------------------------------------------------------------------

export async function toggleTaskComplete(
  taskId: string,
  onboardingId: string,
  isComplete: boolean
): Promise<void> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  await admin
    .from("onboarding_tasks")
    .update({ completed_at: isComplete ? new Date().toISOString() : null })
    .eq("id", taskId)
    .eq("onboarding_id", onboardingId)
    .eq("tenant_id", tenantId);
}
