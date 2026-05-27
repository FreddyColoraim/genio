import { NextResponse } from "next/server";
import { getStripe, APP_URL } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!membership) return NextResponse.json({ error: "Workspace introuvable." }, { status: 400 });

    const { data: tenant } = await admin
      .from("tenants")
      .select("stripe_customer_id")
      .eq("id", membership.tenant_id)
      .single();

    if (!tenant?.stripe_customer_id) {
      return NextResponse.json({ error: "Aucun abonnement actif." }, { status: 400 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer:   tenant.stripe_customer_id as string,
      return_url: `${APP_URL}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.json({ error: "Erreur Stripe." }, { status: 500 });
  }
}
