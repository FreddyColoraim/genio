// =============================================================================
// Sector Service
// Résout la config secteur d'un tenant et fournit les labels adaptés
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { getSectorByIndustry, getSectorById, SECTORS, type SectorConfig } from "@/config/sectors";

/**
 * Retourne la config secteur du tenant connecté.
 * Fallback : config Tech si aucun secteur défini.
 */
export async function getCurrentTenantSector(): Promise<SectorConfig | undefined> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return undefined;

  const { data: membership } = await supabase
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!membership) return undefined;

  const { data: config } = await supabase
    .from("tenant_config")
    .select("industry")
    .eq("tenant_id", membership.tenant_id)
    .single();

  return getSectorByIndustry(config?.industry ?? undefined);
}

/**
 * Retourne la config secteur pour un tenant_id donné.
 */
export async function getSectorForTenant(tenantId: string): Promise<SectorConfig | undefined> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("tenant_config")
    .select("industry")
    .eq("tenant_id", tenantId)
    .single();

  return getSectorByIndustry(data?.industry ?? undefined);
}

/**
 * Met à jour l'industrie (secteur) du tenant.
 */
export async function updateTenantSector(
  tenantId: string,
  sectorId: string
): Promise<{ success: boolean; error?: string }> {
  const sector = getSectorById(sectorId);
  if (!sector) {
    return { success: false, error: "Secteur inconnu." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tenant_config")
    .update({ industry: sectorId })
    .eq("tenant_id", tenantId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Retourne la liste des documents obligatoires pour un secteur,
 * utilisée pour initialiser le kit d'onboarding d'un nouveau tenant.
 */
export function getSectorMandatoryDocuments(sectorId: string) {
  const sector = getSectorById(sectorId);
  if (!sector) return [];
  return sector.documents.filter((d) => d.isMandatory);
}

/**
 * Retourne les labels sectoriels (membre, équipe, onboarding…)
 * pour adapter l'interface. Fallback générique si pas de secteur.
 */
export function getSectorLabels(sectorId?: string | null) {
  const sector = sectorId ? getSectorById(sectorId) : undefined;
  return (
    sector?.labels ?? {
      member:          "collaborateur",
      memberPlural:    "collaborateurs",
      memberFeminine:  "collaboratrice",
      team:            "équipe",
      teamPlural:      "équipes",
      onboarding:      "Onboarding",
      arrival:         "Nouvelle arrivée",
      manager:         "manager",
      managerPlural:   "managers",
      brief:           "Brief RH",
      pipeline:        "Pipeline recrutement",
    }
  );
}

/**
 * Retourne la liste de tous les secteurs disponibles (pour les selects).
 */
export function getAllSectors() {
  return SECTORS.map((s) => ({
    id:     s.id,
    slug:   s.slug,
    label:  s.label,
    emoji:  s.emoji,
    colors: s.colors,
  }));
}
