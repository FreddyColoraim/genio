export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";

async function getOnboardingContext() {
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

  if (!membership) redirect("/login");

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

export default async function OnboardingPage() {
  const ctx = await getOnboardingContext();
  return <OnboardingWizard {...ctx} />;
}
