import { createAdminClient } from "@/lib/supabase/admin";
import { createClient }      from "@/lib/supabase/server";
import { canAccess, type PlanFeature, type SubStatus } from "@/lib/plans";

export type TenantAccess = {
  planSlug:  string;
  subStatus: SubStatus;
};

/**
 * Récupère le plan et le statut d'abonnement du tenant connecté.
 * Retourne null si l'utilisateur n'est pas authentifié ou n'a pas de tenant.
 */
export async function getTenantAccess(): Promise<TenantAccess | null> {
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return null;

    const admin = createAdminClient();

    const { data: membership } = await admin
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!membership) return null;

    const { data: tenant } = await admin
      .from("tenants")
      .select("sub_status, plans(slug)")
      .eq("id", membership.tenant_id)
      .single();

    if (!tenant) return null;

    const planSlug  = (tenant.plans as unknown as { slug: string } | null)?.slug ?? "starter";
    const subStatus = (tenant.sub_status as SubStatus) ?? "trialing";

    return { planSlug, subStatus };
  } catch {
    return null;
  }
}

/**
 * Vérifie si le tenant connecté a accès à une feature.
 * En cas d'erreur de lecture, accorde le bénéfice du doute (trialing).
 */
export async function checkAccess(feature: PlanFeature): Promise<boolean> {
  const access = await getTenantAccess();
  if (!access) return false;
  return canAccess(feature, access.planSlug, access.subStatus);
}
