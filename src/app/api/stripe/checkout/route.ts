import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, APP_URL } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  planId: z.enum(["starter", "team", "business", "enterprise"]),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const body = await req.json();
    const { planId } = schema.parse(body);
    const plan = PLANS[planId as PlanId];

    // Récupère le tenant + stripe_customer_id existant
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
      .select("id, name, stripe_customer_id")
      .eq("id", membership.tenant_id)
      .single();

    if (!tenant) return NextResponse.json({ error: "Tenant introuvable." }, { status: 400 });

    // Crée ou réutilise le customer Stripe
    let customerId = tenant.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        ...(user.email ? { email: user.email } : {}),
        name:     tenant.name as string,
        metadata: { tenant_id: tenant.id as string, user_id: user.id },
      });
      customerId = customer.id;
      await admin.from("tenants").update({ stripe_customer_id: customerId }).eq("id", tenant.id);
    }

    // Checkout session
    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price:    plan.priceId,
        quantity: 1,
      }],
      subscription_data: {
        metadata: { tenant_id: tenant.id as string },
      },
      success_url: `${APP_URL}/settings/billing?success=1`,
      cancel_url:  `${APP_URL}/settings/billing?canceled=1`,
      locale:      "fr",
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Erreur Stripe." }, { status: 500 });
  }
}
