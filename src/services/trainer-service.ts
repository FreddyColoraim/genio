import { createAdminClient } from "@/lib/supabase/admin";
import { createClient }      from "@/lib/supabase/server";
export type { Trainer, TrainerSession } from "./trainer-config";
import type { Trainer, TrainerSession } from "./trainer-config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getTenantContext() {
  const s = await createClient();
  const { data: { user }, error } = await s.auth.getUser();
  if (error || !user) throw new Error("Non authentifié.");

  const admin = createAdminClient();
  const { data: m } = await admin
    .from("memberships").select("tenant_id")
    .eq("user_id", user.id).eq("is_active", true).single();

  if (!m) throw new Error("Aucun workspace.");
  return { userId: user.id, tenantId: m.tenant_id as string };
}

// ---------------------------------------------------------------------------
// CRUD formateurs
// ---------------------------------------------------------------------------

export async function getTrainers(): Promise<Trainer[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("trainers")
    .select("*, session_trainers(count)")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id:           row.id,
    name:         row.name,
    email:        row.email,
    phone:        row.phone        ?? null,
    bio:          row.bio          ?? null,
    avatarUrl:    row.avatar_url   ?? null,
    competences:  (row.competences as string[]) ?? [],
    specialties:  (row.specialties as string[]) ?? [],
    accessToken:  row.access_token,
    isActive:     row.is_active,
    createdAt:    row.created_at,
    sessionCount: (row.session_trainers as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
}

export async function createTrainer(input: {
  name:        string;
  email:       string;
  phone?:      string;
  bio?:        string;
  competences: string[];
  specialties: string[];
}): Promise<{ id: string; accessToken: string }> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("trainers")
    .insert({
      tenant_id:   tenantId,
      name:        input.name,
      email:       input.email,
      phone:       input.phone       ?? null,
      bio:         input.bio         ?? null,
      competences: input.competences,
      specialties: input.specialties,
      created_by:  userId,
    })
    .select("id, access_token")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, accessToken: data.access_token };
}

export async function updateTrainer(id: string, input: {
  name?:        string;
  phone?:       string;
  bio?:         string;
  competences?: string[];
  specialties?: string[];
}): Promise<void> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const patch: Record<string, unknown> = {};
  if (input.name        !== undefined) patch.name        = input.name;
  if (input.phone       !== undefined) patch.phone       = input.phone;
  if (input.bio         !== undefined) patch.bio         = input.bio;
  if (input.competences !== undefined) patch.competences = input.competences;
  if (input.specialties !== undefined) patch.specialties = input.specialties;

  const { error } = await admin
    .from("trainers").update(patch)
    .eq("id", id).eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
}

export async function deactivateTrainer(id: string): Promise<void> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { error } = await admin
    .from("trainers").update({ is_active: false })
    .eq("id", id).eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Liaison session ↔ formateur
// ---------------------------------------------------------------------------

export async function assignTrainerToSession(
  trainerId: string,
  sessionId: string,
  isLead    = true,
): Promise<void> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { error } = await admin
    .from("session_trainers")
    .upsert({
      tenant_id:   tenantId,
      session_id:  sessionId,
      trainer_id:  trainerId,
      assigned_by: userId,
      is_lead:     isLead,
    }, { onConflict: "session_id,trainer_id" });

  if (error) throw new Error(error.message);
}

export async function removeTrainerFromSession(trainerId: string, sessionId: string): Promise<void> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { error } = await admin
    .from("session_trainers")
    .delete()
    .eq("trainer_id", trainerId)
    .eq("session_id",  sessionId)
    .eq("tenant_id",   tenantId);

  if (error) throw new Error(error.message);
}

export async function getSessionTrainers(sessionId: string): Promise<Trainer[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("session_trainers")
    .select("trainers(*)")
    .eq("session_id", sessionId)
    .eq("tenant_id",  tenantId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const t = row.trainers as unknown as Record<string, unknown>;
    return {
      id:           t.id          as string,
      name:         t.name        as string,
      email:        t.email       as string,
      phone:        (t.phone      as string | null) ?? null,
      bio:          (t.bio        as string | null) ?? null,
      avatarUrl:    (t.avatar_url as string | null) ?? null,
      competences:  (t.competences as string[]) ?? [],
      specialties:  (t.specialties as string[]) ?? [],
      accessToken:  t.access_token as string,
      isActive:     t.is_active   as boolean,
      createdAt:    t.created_at  as string,
      sessionCount: 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Portail formateur public (par token)
// ---------------------------------------------------------------------------

export type TrainerPortalData = {
  trainer: Trainer;
  sessions: {
    id:          string;
    title:       string;
    type:        string;
    description: string | null;
    duration:    number;
    isLead:      boolean;
    rookies: {
      id:          string;
      name:        string;
      assignedAt:  string;
      completedAt: string | null;
    }[];
    quizzes: {
      id:          string;
      title:       string;
      responseCount: number;
      accessToken: string;
    }[];
  }[];
};

export async function getTrainerPortalData(token: string): Promise<TrainerPortalData | null> {
  const admin = createAdminClient();

  const { data: trainerRow, error: te } = await admin
    .from("trainers")
    .select("*")
    .eq("access_token", token)
    .eq("is_active", true)
    .single();

  if (te || !trainerRow) return null;

  const trainer: Trainer = {
    id:           trainerRow.id,
    name:         trainerRow.name,
    email:        trainerRow.email,
    phone:        trainerRow.phone        ?? null,
    bio:          trainerRow.bio          ?? null,
    avatarUrl:    trainerRow.avatar_url   ?? null,
    competences:  (trainerRow.competences as string[]) ?? [],
    specialties:  (trainerRow.specialties as string[]) ?? [],
    accessToken:  trainerRow.access_token,
    isActive:     trainerRow.is_active,
    createdAt:    trainerRow.created_at,
    sessionCount: 0,
  };

  // Sessions assignées à ce formateur
  const { data: stRows } = await admin
    .from("session_trainers")
    .select("session_id, is_lead, training_sessions(id, title, type, description, duration_minutes)")
    .eq("trainer_id", trainerRow.id);

  const sessions = await Promise.all(
    (stRows ?? []).map(async (st) => {
      const s = st.training_sessions as unknown as {
        id: string; title: string; type: string;
        description: string | null; duration_minutes: number;
      } | null;
      if (!s) return null;

      // Rookies assignés à cette session
      const { data: assignments } = await admin
        .from("training_assignments")
        .select("id, assigned_at, completed_at, entity_id, entities(first_name, last_name)")
        .eq("session_id", s.id)
        .eq("tenant_id", trainerRow.tenant_id);

      const rookies = (assignments ?? []).map((a) => {
        const e = a.entities as unknown as { first_name: string | null; last_name: string | null } | null;
        return {
          id:          a.id,
          name:        [e?.first_name, e?.last_name].filter(Boolean).join(" ") || "—",
          assignedAt:  a.assigned_at,
          completedAt: a.completed_at ?? null,
        };
      });

      // Quiz liés à cette session
      const { data: quizRows } = await admin
        .from("questionnaires")
        .select("id, title, access_token, questionnaire_responses(count)")
        .eq("session_id", s.id)
        .eq("tenant_id", trainerRow.tenant_id);

      const quizzes = (quizRows ?? []).map((q) => ({
        id:            q.id,
        title:         q.title,
        responseCount: (q.questionnaire_responses as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
        accessToken:   q.access_token,
      }));

      return {
        id:          s.id,
        title:       s.title,
        type:        s.type,
        description: s.description,
        duration:    s.duration_minutes,
        isLead:      st.is_lead as boolean,
        rookies,
        quizzes,
      };
    })
  );

  return {
    trainer,
    sessions: sessions.filter(Boolean) as TrainerPortalData["sessions"],
  };
}
