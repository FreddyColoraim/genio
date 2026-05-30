export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { RepairTenantForm } from "@/components/onboarding/repair-tenant-form";

async function getOnboardingContext(repair: boolean) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id, role, tenants(name, vertical)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  // Pas de membership → mode réparation
  if (!membership) {
    if (!repair) redirect("/login");
    return null; // signale qu'on est en mode repair
  }

  const tenantId = membership.tenant_id as string;
  const tenant   = membership.tenants as unknown as { name: string; vertical: string } | null;

  // Si wizard déjà terminé → dashboard directement
  const { data: config } = await admin
    .from("tenant_config")
    .select("vocab")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const vocab = (config?.vocab ?? {}) as Record<string, string>;
  if (vocab["wizard_completed"] === "true") redirect("/dashboard");

  return {
    workspaceName: tenant?.name ?? "Mon workspace",
    vertical:      tenant?.vertical ?? "rh",
    role:          membership.role as string,
  };
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ repair?: string }>;
}) {
  const { repair } = await searchParams;
  const isRepair = repair === "1";

  const ctx = await getOnboardingContext(isRepair);

  // Mode réparation : l'utilisateur est authentifié mais n'a pas de tenant
  if (ctx === null) {
    return <RepairTenantForm />;
  }

  return <OnboardingWizard {...ctx} />;
}
