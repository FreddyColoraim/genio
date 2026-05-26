import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | "reminder"
  | "pending_doc"
  | "upcoming_arrival"
  | "overdue_task";

export type AppNotification = {
  id:          string;
  type:        NotificationType;
  title:       string;
  description: string;
  entityName:  string;
  entityId:    string | null;
  date:        string;
  urgent:      boolean;
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
// getNotifications
// ---------------------------------------------------------------------------

export async function getNotifications(): Promise<AppNotification[]> {
  const { tenantId } = await getTenantContext();
  const admin  = createAdminClient();
  const now    = new Date();
  const in7    = new Date(now.getTime() + 7  * 86400000).toISOString();
  const in14   = new Date(now.getTime() + 14 * 86400000).toISOString();

  const notifications: AppNotification[] = [];

  // ── 1. Pending reminders ──
  const { data: reminders } = await admin
    .from("reminders")
    .select("id, title, body, due_at, entity_id")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .lte("due_at", in7)
    .order("due_at", { ascending: true })
    .limit(10);

  for (const r of reminders ?? []) {
    const dueAt  = r.due_at ? new Date(r.due_at) : null;
    const isNow  = dueAt && dueAt <= now;
    notifications.push({
      id:          `reminder-${r.id}`,
      type:        "reminder",
      title:       r.title ?? "Rappel",
      description: r.body ?? "Action à traiter.",
      entityName:  "",
      entityId:    r.entity_id ?? null,
      date:        r.due_at ?? now.toISOString(),
      urgent:      isNow ?? false,
    });
  }

  // ── 2. Upcoming arrivals (onboardings with start_date in next 14 days) ──
  const { data: upcomingOnboardings } = await admin
    .from("onboardings")
    .select("id, entity_id, start_date")
    .eq("tenant_id", tenantId)
    .gte("start_date", now.toISOString().slice(0, 10))
    .lte("start_date", in14.slice(0, 10))
    .order("start_date", { ascending: true })
    .limit(10);

  if (upcomingOnboardings?.length) {
    const entityIds = upcomingOnboardings.map((o) => o.entity_id);
    const { data: entities } = await admin
      .from("entities")
      .select("id, first_name, last_name")
      .in("id", entityIds);

    const nameMap = Object.fromEntries(
      (entities ?? []).map((e) => [
        e.id,
        [e.first_name, e.last_name].filter(Boolean).join(" ") || "—",
      ])
    );

    for (const ob of upcomingOnboardings) {
      const name     = nameMap[ob.entity_id] ?? "Collaborateur";
      const dateStr  = ob.start_date
        ? new Date(ob.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
        : "—";
      const daysLeft = ob.start_date
        ? Math.ceil((new Date(ob.start_date).getTime() - now.getTime()) / 86400000)
        : 99;

      notifications.push({
        id:          `arrival-${ob.id}`,
        type:        "upcoming_arrival",
        title:       `Arrivée de ${name}`,
        description: `Prévue le ${dateStr} — dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
        entityName:  name,
        entityId:    ob.entity_id,
        date:        ob.start_date ?? now.toISOString(),
        urgent:      daysLeft <= 2,
      });
    }
  }

  // ── 3. Pending collect documents (kit docs not yet received) ──
  const { data: onboardings } = await admin
    .from("onboardings")
    .select("id, entity_id")
    .eq("tenant_id", tenantId);

  if (onboardings?.length) {
    const onbIds    = onboardings.map((o) => o.id);
    const entityMap = Object.fromEntries(onboardings.map((o) => [o.id, o.entity_id]));

    // Fetch all entity names
    const entityIds = [...new Set(onboardings.map((o) => o.entity_id))];
    const { data: entities } = await admin
      .from("entities")
      .select("id, first_name, last_name")
      .in("id", entityIds);
    const nameMap = Object.fromEntries(
      (entities ?? []).map((e) => [
        e.id,
        [e.first_name, e.last_name].filter(Boolean).join(" ") || "—",
      ])
    );

    const { data: pendingDocs } = await admin
      .from("onboarding_tasks")
      .select("id, onboarding_id, title")
      .in("onboarding_id", onbIds)
      .eq("tenant_id", tenantId)
      .eq("category", "document")
      .is("completed_at", null)
      .limit(20);

    // Group by entity — only emit one notification per entity
    const byEntity = new Map<string, string[]>();
    for (const task of pendingDocs ?? []) {
      const entityId = entityMap[task.onboarding_id] ?? "";
      const list     = byEntity.get(entityId) ?? [];
      list.push(task.title);
      byEntity.set(entityId, list);
    }

    for (const [entityId, docTitles] of byEntity.entries()) {
      const name = nameMap[entityId] ?? "Collaborateur";
      notifications.push({
        id:          `docs-${entityId}`,
        type:        "pending_doc",
        title:       `${docTitles.length} document${docTitles.length > 1 ? "s" : ""} en attente`,
        description: `${name} — ${docTitles.slice(0, 2).join(", ")}${docTitles.length > 2 ? "…" : ""}`,
        entityName:  name,
        entityId,
        date:        now.toISOString(),
        urgent:      docTitles.length >= 3,
      });
    }
  }

  // Sort: urgent first, then by date
  return notifications
    .sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .slice(0, 20);
}

export async function getNotificationCount(): Promise<number> {
  try {
    const notifications = await getNotifications();
    return notifications.length;
  } catch {
    return 0;
  }
}
