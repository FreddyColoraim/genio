import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types UI
// ---------------------------------------------------------------------------

export type BriefUrgency = "low" | "normal" | "high" | "urgent";
export type BriefStatus  = "draft" | "open" | "closed" | "archived";

export type BriefItem = {
  id: string;
  title: string;
  description: string;
  missions: string;
  profile: string;
  competences: string;
  notes: string;
  contractType: string;
  location: string;
  urgency: BriefUrgency;
  status: BriefStatus;
  createdAt: string;
  updatedAt: string;
};

export const urgencyLabels: Record<BriefUrgency, string> = {
  low:    "Faible",
  normal: "Normal",
  high:   "Prioritaire",
  urgent: "Urgent",
};

export const statusLabels: Record<BriefStatus, string> = {
  draft:    "Brouillon",
  open:     "Ouvert",
  closed:   "Clôturé",
  archived: "Archivé",
};

// ---------------------------------------------------------------------------
// Helpers session
// ---------------------------------------------------------------------------

async function getTenantContext() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) throw new Error("Vous devez être connecté.");

  const admin = createAdminClient();
  const { data: membership, error: memberError } = await admin
    .from("memberships")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (memberError || !membership) throw new Error("Aucun tenant associé à votre compte.");

  return { userId: user.id, tenantId: membership.tenant_id as string, role: membership.role as string };
}

// ---------------------------------------------------------------------------
// Helpers de mapping
// ---------------------------------------------------------------------------

type AiStructured = {
  missions?: string;
  profile?: string;
  competences?: string;
  notes?: string;
};

function rowToItem(row: {
  id: string;
  title: string;
  description: string | null;
  contract_type: string | null;
  location: string | null;
  urgency: BriefUrgency;
  status: BriefStatus;
  ai_structured: unknown;
  created_at: string;
  updated_at: string;
}): BriefItem {
  const ai = (row.ai_structured ?? {}) as AiStructured;
  return {
    id:           row.id,
    title:        row.title,
    description:  row.description ?? "",
    missions:     ai.missions ?? "",
    profile:      ai.profile ?? "",
    competences:  ai.competences ?? "",
    notes:        ai.notes ?? "",
    contractType: row.contract_type ?? "CDI",
    location:     row.location ?? "",
    urgency:      row.urgency,
    status:       row.status,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

export async function getBriefs(): Promise<BriefItem[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("briefs")
    .select("id, title, description, contract_type, location, urgency, status, ai_structured, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Impossible de charger les briefs : ${error.message}`);

  return (data ?? []).map(rowToItem);
}

// ---------------------------------------------------------------------------
// Création
// ---------------------------------------------------------------------------

export async function createBrief(formData: FormData): Promise<BriefItem> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const title        = String(formData.get("title") ?? "").trim();
  const description  = String(formData.get("description") ?? "").trim();
  const contractType = String(formData.get("contractType") ?? "CDI").trim();
  const location     = String(formData.get("location") ?? "").trim();
  const urgency      = (formData.get("urgency") ?? "normal") as BriefUrgency;
  const missions     = String(formData.get("missions") ?? "").trim();
  const profile      = String(formData.get("profile") ?? "").trim();
  const competences  = String(formData.get("competences") ?? "").trim();
  const notes        = String(formData.get("notes") ?? "").trim();

  if (!title) throw new Error("L'intitulé du poste est obligatoire.");

  const { data, error } = await admin
    .from("briefs")
    .insert({
      tenant_id:     tenantId,
      title,
      description:   description || null,
      contract_type: contractType,
      location:      location || null,
      urgency,
      status:        "draft" as const,
      ai_structured: { missions, profile, competences, notes },
      created_by:    userId,
    })
    .select("id, title, description, contract_type, location, urgency, status, ai_structured, created_at, updated_at")
    .single();

  if (error) throw new Error(`Impossible de créer le brief : ${error.message}`);

  return rowToItem(data);
}

// ---------------------------------------------------------------------------
// Mise à jour
// ---------------------------------------------------------------------------

export async function updateBrief(id: string, formData: FormData): Promise<BriefItem> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const title        = String(formData.get("title") ?? "").trim();
  const description  = String(formData.get("description") ?? "").trim();
  const contractType = String(formData.get("contractType") ?? "CDI").trim();
  const location     = String(formData.get("location") ?? "").trim();
  const urgency      = (formData.get("urgency") ?? "normal") as BriefUrgency;
  const missions     = String(formData.get("missions") ?? "").trim();
  const profile      = String(formData.get("profile") ?? "").trim();
  const competences  = String(formData.get("competences") ?? "").trim();
  const notes        = String(formData.get("notes") ?? "").trim();

  if (!title) throw new Error("L'intitulé du poste est obligatoire.");

  const { data, error } = await admin
    .from("briefs")
    .update({
      title,
      description:   description || null,
      contract_type: contractType,
      location:      location || null,
      urgency,
      ai_structured: { missions, profile, competences, notes },
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select("id, title, description, contract_type, location, urgency, status, ai_structured, created_at, updated_at")
    .single();

  if (error) throw new Error(`Impossible de mettre à jour le brief : ${error.message}`);

  return rowToItem(data);
}

// ---------------------------------------------------------------------------
// Changement de statut
// ---------------------------------------------------------------------------

export async function updateBriefStatus(id: string, status: BriefStatus): Promise<void> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { error } = await admin
    .from("briefs")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(`Impossible de mettre à jour le statut : ${error.message}`);
}
