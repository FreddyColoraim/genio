import type { Metadata } from "next";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS_LIST, trialDaysLeft, type SubStatus } from "@/lib/plans";
import { BillingClient } from "./billing-client";

export const metadata: Metadata = { title: "Facturation" };
export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user?.id ?? "")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const { data: tenant } = membership
    ? await admin
        .from("tenants")
        .select("sub_status, trial_ends_at, stripe_customer_id, plan_id, plans(slug, name)")
        .eq("id", membership.tenant_id)
        .single()
    : { data: null };

  const currentPlanSlug = (tenant?.plans as unknown as { slug: string } | null)?.slug ?? "starter";
  const subStatus       = (tenant?.sub_status as SubStatus) ?? "trialing";
  const trialLeft       = trialDaysLeft(tenant?.trial_ends_at as string | null);
  const hasCustomer     = Boolean(tenant?.stripe_customer_id);

  return (
    <BillingClient
      currentPlanSlug={currentPlanSlug}
      subStatus={subStatus}
      trialDaysLeft={trialLeft}
      hasCustomer={hasCustomer}
      plans={PLANS_LIST}
      flash={params.success ? "success" : params.canceled ? "canceled" : null}
    />
  );
}
