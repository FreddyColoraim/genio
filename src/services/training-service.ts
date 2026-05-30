import { createAdminClient } from "@/lib/supabase/admin";
import { createClient }      from "@/lib/supabase/server";
export type { TrainingType, TrainingSession, TrainingAssignment } from "./training-config";
export { TRAINING_TYPE_LABELS } from "./training-config";
import type { TrainingType, TrainingSession, TrainingAssignment } from "./training-config";

// ---------------------------------------------------------------------------
// Helpers
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

  if (!membership) throw new Error("Aucun workspace.");
  return { userId: user.id, tenantId: membership.tenant_id as string };
}

// ---------------------------------------------------------------------------
// Sessions CRUD
// ---------------------------------------------------------------------------

export async function getTrainingSessions(): Promise<TrainingSession[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("training_sessions")
    .select("*, training_assignments(count)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id:              row.id,
    title:           row.title,
    type:            row.type as TrainingType,
    description:     row.description ?? null,
    durationMinutes: row.duration_minutes ?? 60,
    materialsUrl:    row.materials_url ?? null,
    isActive:        row.is_active,
    createdAt:       row.created_at,
    assignedCount:   (row.training_assignments as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
}

export async function createTrainingSession(input: {
  title:           string;
  type:            TrainingType;
  description?:    string;
  durationMinutes?:number;
  materialsUrl?:   string;
}): Promise<{ id: string }> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("training_sessions")
    .insert({
      tenant_id:        tenantId,
      title:            input.title,
      type:             input.type,
      description:      input.description ?? null,
      duration_minutes: input.durationMinutes ?? 60,
      materials_url:    input.materialsUrl ?? null,
      created_by:       userId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function assignSessionToEntity(
  sessionId: string,
  entityId:  string,
): Promise<void> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { error } = await admin
    .from("training_assignments")
    .upsert({
      tenant_id:   tenantId,
      session_id:  sessionId,
      entity_id:   entityId,
      assigned_by: userId,
      assigned_at: new Date().toISOString(),
    }, { onConflict: "session_id,entity_id" });

  if (error) throw new Error(error.message);
}

export async function completeAssignment(assignmentId: string): Promise<void> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { error } = await admin
    .from("training_assignments")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
}

export async function getEntityAssignments(entityId: string): Promise<TrainingAssignment[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("training_assignments")
    .select("*, training_sessions(title, type), entities(first_name, last_name)")
    .eq("tenant_id", tenantId)
    .eq("entity_id", entityId)
    .order("assigned_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const session = row.training_sessions as unknown as { title: string; type: string } | null;
    const entity  = row.entities          as unknown as { first_name: string | null; last_name: string | null } | null;
    return {
      id:           row.id,
      sessionId:    row.session_id,
      sessionTitle: session?.title ?? "—",
      sessionType:  (session?.type ?? "other") as TrainingType,
      entityId:     row.entity_id,
      entityName:   [entity?.first_name, entity?.last_name].filter(Boolean).join(" ") || "—",
      assignedAt:   row.assigned_at,
      completedAt:  row.completed_at ?? null,
    };
  });
}
