import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OnboardingStats = {
  total:          number;
  notStarted:     number;
  inProgress:     number;
  complete:       number;
  avgProgress:    number;     // 0-100
  avgDaysToComplete: number;  // jours moyens pour compléter
};

export type DeptStat = {
  department:  string;
  count:       number;
  avgProgress: number;
  complete:    number;
};

export type PipelineFunnel = {
  stage:       string;
  label:       string;
  count:       number;
  convRate:    number; // % par rapport à l'étape précédente
};

export type MonthlyTrend = {
  month:   string; // "2025-01"
  label:   string; // "Jan 25"
  count:   number;
};

export type AnalyticsData = {
  onboarding:    OnboardingStats;
  byDepartment:  DeptStat[];
  pipeline:      PipelineFunnel[];
  trend:         MonthlyTrend[];
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function getTenantContext() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) throw new Error("Non authentifié.");
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

// ---------------------------------------------------------------------------
// getAnalyticsData
// ---------------------------------------------------------------------------

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  // ── Entités ──
  const { data: entities } = await admin
    .from("entities")
    .select("id, metadata, created_at")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  const entityList = entities ?? [];

  // ── Onboardings ──
  const { data: onboardings } = await admin
    .from("onboardings")
    .select("id, entity_id, start_date, created_at, completion_pct")
    .eq("tenant_id", tenantId);

  const obList = onboardings ?? [];
  const obByEntity = new Map(obList.map((o) => [o.entity_id, o]));

  // ── Tasks (for completion detection) ──
  const obIds = obList.map((o) => o.id);
  let taskMap = new Map<string, { total: number; done: number }>();

  if (obIds.length > 0) {
    const { data: tasks } = await admin
      .from("onboarding_tasks")
      .select("onboarding_id, completed_at")
      .in("onboarding_id", obIds)
      .eq("tenant_id", tenantId)
      .neq("category", "document");

    for (const t of tasks ?? []) {
      const cur = taskMap.get(t.onboarding_id) ?? { total: 0, done: 0 };
      taskMap.set(t.onboarding_id, {
        total: cur.total + 1,
        done:  cur.done + (t.completed_at ? 1 : 0),
      });
    }
  }

  // ── Onboarding stats ──
  let notStarted = 0, inProgress = 0, complete = 0, totalProgress = 0;
  let completionDays: number[] = [];

  for (const entity of entityList) {
    const ob = obByEntity.get(entity.id);
    if (!ob) { notStarted++; continue; }

    const tasks = taskMap.get(ob.id) ?? { total: 0, done: 0 };
    const pct   = tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0;
    totalProgress += pct;

    if (pct === 100) {
      complete++;
      // Approximate completion duration
      if (ob.start_date) {
        const days = Math.round(
          (new Date().getTime() - new Date(ob.start_date).getTime()) / 86400000
        );
        if (days > 0 && days < 365) completionDays.push(days);
      }
    } else if (pct > 0) {
      inProgress++;
    } else {
      notStarted++;
    }
  }

  const total      = entityList.length;
  const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;
  const avgDays     = completionDays.length > 0
    ? Math.round(completionDays.reduce((a, b) => a + b, 0) / completionDays.length)
    : 0;

  // ── By department ──
  const deptMap = new Map<string, { count: number; progress: number; complete: number }>();
  for (const entity of entityList) {
    const meta = (entity.metadata ?? {}) as Record<string, unknown>;
    const dept = (meta["departement"] as string) || "Non défini";
    const ob   = obByEntity.get(entity.id);
    const tasks = ob ? (taskMap.get(ob.id) ?? { total: 0, done: 0 }) : { total: 0, done: 0 };
    const pct   = tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0;
    const cur   = deptMap.get(dept) ?? { count: 0, progress: 0, complete: 0 };
    deptMap.set(dept, {
      count:    cur.count + 1,
      progress: cur.progress + pct,
      complete: cur.complete + (pct === 100 ? 1 : 0),
    });
  }

  const byDepartment: DeptStat[] = Array.from(deptMap.entries())
    .map(([department, v]) => ({
      department,
      count:       v.count,
      avgProgress: v.count > 0 ? Math.round(v.progress / v.count) : 0,
      complete:    v.complete,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Pipeline funnel ──
  const { data: pipelineRows } = await admin
    .from("pipeline_stages")
    .select("stage, entity_id, moved_at")
    .eq("tenant_id", tenantId)
    .order("moved_at", { ascending: false });

  // Dedupe: latest stage per entity
  const latestStage = new Map<string, string>();
  for (const row of pipelineRows ?? []) {
    if (!latestStage.has(row.entity_id)) {
      latestStage.set(row.entity_id, row.stage);
    }
  }
  const stageCounts = new Map<string, number>();
  for (const stage of latestStage.values()) {
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
  }

  const stageOrder = ["new", "contacted", "interview", "retained", "refused"];
  const stageLabels: Record<string, string> = {
    new: "Nouveau", contacted: "Contacté", interview: "Entretien",
    retained: "Retenu", refused: "Refusé",
  };

  const pipeline: PipelineFunnel[] = stageOrder.map((stage, i) => {
    const count = stageCounts.get(stage) ?? 0;
    const prev  = i > 0 ? (stageCounts.get(stageOrder[i - 1]!) ?? 0) : count;
    const convRate = prev > 0 && stage !== "new" ? Math.round((count / prev) * 100) : 100;
    return { stage, label: stageLabels[stage] ?? stage, count, convRate };
  });

  // ── Monthly trend (last 6 months) ──
  const now = new Date();
  const months: MonthlyTrend[] = [];
  for (let i = 5; i >= 0; i--) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const count = obList.filter((o) => o.created_at?.startsWith(key)).length;
    months.push({ month: key, label, count });
  }

  return {
    onboarding: { total, notStarted, inProgress, complete, avgProgress, avgDaysToComplete: avgDays },
    byDepartment,
    pipeline,
    trend: months,
  };
}
