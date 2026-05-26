import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { DocBloc, DocAction } from "@/lib/onboarding-docs-catalog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocKitItem = {
  taskId:        string;
  docId:         string;
  label:         string;
  bloc:          DocBloc;
  action:        DocAction;
  completedAt:   string | null;
  customization: Record<string, string>;
};

export type EntityForDocs = {
  id:           string;
  name:         string;
  email:        string;
  poste:        string;
  department:   string;
  startDate:    string | null;
  onboardingId: string | null;
  tenantName:   string;
};

// ---------------------------------------------------------------------------
// Helpers session
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

// ---------------------------------------------------------------------------
// Charger une entité avec son onboarding
// ---------------------------------------------------------------------------

export async function getEntityForDocs(entityId: string): Promise<EntityForDocs> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data: entity, error } = await admin
    .from("entities")
    .select("id, first_name, last_name, email, metadata, status")
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

  const { data: tenant } = await admin
    .from("tenants")
    .select("name")
    .eq("id", tenantId)
    .single();

  const meta = (entity.metadata ?? {}) as Record<string, string>;

  return {
    id:           entity.id,
    name:         [entity.first_name, entity.last_name].filter(Boolean).join(" ") || "—",
    email:        entity.email ?? "",
    poste:        meta["poste"] ?? "",
    department:   meta["departement"] ?? "",
    startDate:    onboarding?.start_date ?? null,
    onboardingId: onboarding?.id ?? null,
    tenantName:   tenant?.name ?? "Mon workspace",
  };
}

// ---------------------------------------------------------------------------
// Charger le kit de documents existant
// ---------------------------------------------------------------------------

export async function getDocKit(entityId: string): Promise<DocKitItem[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data: entity } = await admin
    .from("entities")
    .select("id")
    .eq("id", entityId)
    .eq("tenant_id", tenantId)
    .single();

  if (!entity) return [];

  const { data: onboarding } = await admin
    .from("onboardings")
    .select("id")
    .eq("entity_id", entityId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!onboarding) return [];

  const { data: tasks } = await admin
    .from("onboarding_tasks")
    .select("id, key, title, category, metadata, completed_at")
    .eq("onboarding_id", onboarding.id)
    .eq("tenant_id", tenantId)
    .eq("category", "document");

  return (tasks ?? []).map((t) => {
    const meta = (t.metadata ?? {}) as Record<string, unknown>;
    return {
      taskId:        t.id,
      docId:         t.key ?? "",
      label:         t.title,
      bloc:          (meta["bloc"] as DocBloc) ?? "administratif",
      action:        (meta["action"] as DocAction) ?? "collect",
      completedAt:   t.completed_at,
      customization: (meta["customization"] as Record<string, string>) ?? {},
    };
  });
}

// ---------------------------------------------------------------------------
// Sauvegarder le kit (remplace l'existant)
// ---------------------------------------------------------------------------

export type SaveDocKitInput = {
  entityId: string;
  docs: {
    docId:         string;
    label:         string;
    bloc:          DocBloc;
    action:        DocAction;
    customization: Record<string, string>;
  }[];
};

export async function saveDocKit({ entityId, docs }: SaveDocKitInput): Promise<void> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  // Récupérer l'onboarding
  const { data: onboarding } = await admin
    .from("onboardings")
    .select("id")
    .eq("entity_id", entityId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!onboarding) throw new Error("Onboarding introuvable pour ce collaborateur.");

  // Supprimer les tâches documents existantes
  await admin
    .from("onboarding_tasks")
    .delete()
    .eq("onboarding_id", onboarding.id)
    .eq("tenant_id", tenantId)
    .eq("category", "document");

  if (docs.length === 0) return;

  // Recréer
  const { error } = await admin.from("onboarding_tasks").insert(
    docs.map((doc, i) => ({
      tenant_id:     tenantId,
      onboarding_id: onboarding.id,
      key:           doc.docId,
      title:         doc.label,
      category:      "document",
      priority:      i + 1,
      metadata:      {
        bloc:          doc.bloc,
        action:        doc.action,
        customization: doc.customization,
      },
    }))
  );

  if (error) throw new Error(`Impossible de sauvegarder le kit : ${error.message}`);
}
