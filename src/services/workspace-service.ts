import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceIndustry, WorkspaceProfile } from "@/types/workspace";

// ---------------------------------------------------------------------------
// Helpers session
// ---------------------------------------------------------------------------

async function getTenantContext(allowedRoles = ["owner", "admin", "rh", "manager"]) {
  const sessionClient = await createClient();
  const { data: userData, error } = await sessionClient.auth.getUser();
  if (error || !userData.user) throw new Error("Vous devez être connecté.");

  const admin = createAdminClient();
  const { data: membership, error: memberError } = await admin
    .from("memberships")
    .select("tenant_id, role")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .single();

  if (memberError || !membership) throw new Error("Aucun tenant associé à votre compte.");

  if (!allowedRoles.includes(membership.role as string)) {
    throw new Error("Votre rôle ne permet pas de modifier ces paramètres.");
  }

  return { tenantId: membership.tenant_id as string, role: membership.role as string };
}

// ---------------------------------------------------------------------------
// Lecture du profil tenant
// ---------------------------------------------------------------------------

export async function getWorkspaceProfile(): Promise<WorkspaceProfile | null> {
  const { tenantId } = await getTenantContext(["owner", "admin", "rh", "manager", "member", "readonly"]);
  const admin = createAdminClient();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("id, name")
    .eq("id", tenantId)
    .single();

  if (tenantError) throw new Error(`Impossible de charger le tenant : ${tenantError.message}`);

  const { data: config } = await admin
    .from("tenant_config")
    .select("vocab")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const vocab = (config?.vocab ?? {}) as Record<string, string>;

  return {
    id:            tenant.id,
    name:          tenant.name,
    industry:      (vocab["industry"] as WorkspaceIndustry) ?? "services",
    teamSize:      vocab["team_size"] ?? "",
    operatingMode: vocab["operating_mode"] ?? "",
  };
}

// ---------------------------------------------------------------------------
// Mise à jour du profil tenant
// ---------------------------------------------------------------------------

export async function updateWorkspaceProfile(formData: FormData) {
  const { tenantId } = await getTenantContext(["owner", "admin"]);
  const industry      = String(formData.get("industry") ?? "services");
  const teamSize      = String(formData.get("teamSize") ?? "").trim();
  const operatingMode = String(formData.get("operatingMode") ?? "").trim();

  const admin = createAdminClient();

  // Lire le vocab existant pour ne pas écraser les clés GeniO
  const { data: config } = await admin
    .from("tenant_config")
    .select("vocab")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const currentVocab = (config?.vocab ?? {}) as Record<string, string>;

  const updatedVocab = {
    ...currentVocab,
    industry,
    team_size:      teamSize,
    operating_mode: operatingMode,
  };

  const { error } = await admin
    .from("tenant_config")
    .update({ vocab: updatedVocab })
    .eq("tenant_id", tenantId);

  if (error) throw new Error(`Impossible de mettre à jour le profil : ${error.message}`);
}

// ---------------------------------------------------------------------------
// Export de compatibilité (utilisé dans services/index.ts)
// ---------------------------------------------------------------------------

export async function provisionSignupWorkspace() {
  throw new Error("Deprecated — utiliser provisionTenant() depuis tenant-service");
}
