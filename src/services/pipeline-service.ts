import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PipelineStage, AcquisitionSource } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Types UI
// ---------------------------------------------------------------------------

export type { PipelineStage, AcquisitionSource };

export type CandidateCard = {
  pipelineId: string;
  entityId: string;
  name: string;
  email: string;
  stage: PipelineStage;
  source: AcquisitionSource | null;
  notes: string | null;
  score: number | null;
  briefId: string | null;
  briefTitle: string | null;
  movedAt: string;
};

export type PipelineColumn = {
  stage: PipelineStage;
  label: string;
  cards: CandidateCard[];
};

export type PipelineData = {
  columns: PipelineColumn[];
  briefs: { id: string; title: string }[];
};

// Étapes RH dans l'ordre
export const RH_STAGES: { stage: PipelineStage; label: string; description: string }[] = [
  { stage: "new",       label: "Nouveau",   description: "Candidatures reçues" },
  { stage: "contacted", label: "Contacté",  description: "Premier contact établi" },
  { stage: "interview", label: "Entretien", description: "Entretien planifié ou passé" },
  { stage: "retained",  label: "Retenu",    description: "Candidat sélectionné" },
  { stage: "refused",   label: "Refusé",    description: "Candidature non retenue" },
];

export const SOURCE_LABELS: Record<AcquisitionSource, string> = {
  linkedin:   "LinkedIn",
  website:    "Site carrière",
  ad:         "Annonce",
  referral:   "Référence",
  cooptation: "Cooptation",
  event:      "Événement",
  other:      "Autre",
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
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (memberError || !membership) throw new Error("Aucun tenant associé.");

  return { userId: user.id, tenantId: membership.tenant_id as string };
}

// ---------------------------------------------------------------------------
// Lecture pipeline
// ---------------------------------------------------------------------------

export async function getPipelineData(briefId?: string): Promise<PipelineData> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  // Charger les briefs ouverts pour le filtre
  const { data: briefRows } = await admin
    .from("briefs")
    .select("id, title")
    .eq("tenant_id", tenantId)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const briefs = (briefRows ?? []).map((b) => ({ id: b.id, title: b.title }));

  // Pipeline stages avec les entités jointes
  let query = admin
    .from("pipeline_stages")
    .select(`
      id,
      entity_id,
      stage,
      source,
      notes,
      score,
      brief_id,
      moved_at,
      entities!inner(first_name, last_name, email, entity_type),
      briefs(title)
    `)
    .eq("tenant_id", tenantId)
    .in("stage", RH_STAGES.map((s) => s.stage))
    .order("moved_at", { ascending: false });

  if (briefId) {
    query = query.eq("brief_id", briefId);
  }

  const { data: rows, error } = await query;

  if (error) throw new Error(`Impossible de charger le pipeline : ${error.message}`);

  // Dé-dupliquer — garder uniquement le dernier mouvement par entity_id
  const seen = new Set<string>();
  const latest: CandidateCard[] = [];

  for (const row of rows ?? []) {
    if (seen.has(row.entity_id)) continue;
    seen.add(row.entity_id);

    const entity = row.entities as unknown as { first_name: string | null; last_name: string | null; email: string | null; entity_type: string } | null;
    const brief  = row.briefs  as unknown as { title: string } | null;

    latest.push({
      pipelineId: row.id,
      entityId:   row.entity_id,
      name: [entity?.first_name, entity?.last_name].filter(Boolean).join(" ") || "—",
      email:      entity?.email ?? "",
      stage:      row.stage as PipelineStage,
      source:     (row.source as AcquisitionSource | null) ?? null,
      notes:      row.notes ?? null,
      score:      row.score ?? null,
      briefId:    row.brief_id ?? null,
      briefTitle: brief?.title ?? null,
      movedAt:    row.moved_at,
    });
  }

  // Regrouper par colonne
  const columns = RH_STAGES.map((col) => ({
    ...col,
    cards: latest.filter((c) => c.stage === col.stage),
  }));

  return { columns, briefs };
}

// ---------------------------------------------------------------------------
// Déplacer un candidat vers une nouvelle étape
// ---------------------------------------------------------------------------

export async function moveCandidateStage(
  entityId: string,
  newStage: PipelineStage,
  briefId: string | null
): Promise<void> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { error } = await admin.from("pipeline_stages").insert({
    tenant_id: tenantId,
    entity_id: entityId,
    stage:     newStage,
    brief_id:  briefId ?? null,
    moved_by:  userId,
    moved_at:  new Date().toISOString(),
  });

  if (error) throw new Error(`Impossible de déplacer le candidat : ${error.message}`);
}

// ---------------------------------------------------------------------------
// Ajouter un candidat au pipeline
// ---------------------------------------------------------------------------

export async function addCandidateToPipeline(formData: FormData): Promise<CandidateCard> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName  = String(formData.get("lastName")  ?? "").trim();
  const email     = String(formData.get("email")     ?? "").trim();
  const source    = (formData.get("source") ?? "other") as AcquisitionSource;
  const briefId   = String(formData.get("briefId") ?? "").trim() || null;
  const notes     = String(formData.get("notes")  ?? "").trim() || null;

  if (!firstName && !lastName) throw new Error("Le nom du candidat est obligatoire.");

  // Créer l'entité candidate
  const { data: entity, error: entityError } = await admin
    .from("entities")
    .insert({
      tenant_id:   tenantId,
      entity_type: "candidate" as const,
      first_name:  firstName || null,
      last_name:   lastName  || null,
      email:       email || null,
      status:      "active" as const,
    })
    .select("id")
    .single();

  if (entityError) throw new Error(`Impossible de créer le candidat : ${entityError.message}`);

  // Créer l'entrée pipeline
  const { data: pipeline, error: pipelineError } = await admin
    .from("pipeline_stages")
    .insert({
      tenant_id: tenantId,
      entity_id: entity.id,
      stage:     "new" as PipelineStage,
      source,
      brief_id:  briefId,
      notes,
      moved_by:  userId,
      moved_at:  new Date().toISOString(),
    })
    .select("id, moved_at")
    .single();

  if (pipelineError) {
    await admin.from("entities").delete().eq("id", entity.id);
    throw new Error(`Impossible d'ajouter au pipeline : ${pipelineError.message}`);
  }

  // Charger le brief title si besoin
  let briefTitle: string | null = null;
  if (briefId) {
    const { data: brief } = await admin.from("briefs").select("title").eq("id", briefId).maybeSingle();
    briefTitle = brief?.title ?? null;
  }

  return {
    pipelineId: pipeline.id,
    entityId:   entity.id,
    name:       [firstName, lastName].filter(Boolean).join(" ") || "—",
    email,
    stage:      "new",
    source,
    notes,
    score:      null,
    briefId,
    briefTitle,
    movedAt:    pipeline.moved_at,
  };
}
