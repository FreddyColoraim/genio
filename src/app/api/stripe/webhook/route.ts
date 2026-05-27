import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanByPriceId } from "@/lib/plans";
import { onUserUpgraded } from "@/lib/brevo";
import type Stripe from "stripe";

// Next.js App Router — désactiver le body parser pour Stripe
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const secret    = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[webhook] Signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {

    // ── Abonnement créé / mis à jour ─────────────────────────────────────────
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub    = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id ?? "";
      const planId  = getPlanByPriceId(priceId)?.id ?? "starter";
      const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "trialing";
      const tenantId: string | undefined = sub.metadata?.tenant_id;

      if (!tenantId) break;

      // Met à jour tenant
      await admin.from("tenants").update({
        stripe_sub_id: sub.id,
        sub_status:    status,
        trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      }).eq("id", tenantId);

      // Met à jour plan dans plans + tenant_config
      const { data: plan } = await admin
        .from("plans")
        .select("id")
        .eq("slug", planId)
        .single();

      if (plan) {
        await admin.from("tenants").update({ plan_id: plan.id }).eq("id", tenantId);
      }

      // Brevo — notifie upgrade
      if (status === "active") {
        const { data: tenant } = await admin.from("tenants").select("name").eq("id", tenantId).single();
        const { data: membership } = await admin.from("memberships").select("user_id").eq("tenant_id", tenantId).eq("is_active", true).order("created_at", { ascending: true }).limit(1).single();
        if (membership) {
          const { data: profile } = await admin.from("profiles").select("email").eq("id", membership.user_id).single();
          if (profile?.email) {
            await onUserUpgraded({ email: profile.email as string, plan: planId }).catch(() => null);
          }
        }
      }
      break;
    }

    // ── Abonnement annulé ─────────────────────────────────────────────────────
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const tenantId: string | undefined = sub.metadata?.tenant_id;
      if (!tenantId) break;

      await admin.from("tenants").update({
        sub_status:    "canceled",
        stripe_sub_id: null,
      }).eq("id", tenantId);
      break;
    }

    // ── Paiement échoué ───────────────────────────────────────────────────────
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await admin.from("tenants").update({ sub_status: "past_due" })
        .eq("stripe_customer_id", customerId);
      break;
    }

    // ── Paiement réussi ───────────────────────────────────────────────────────
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Remet en active si était past_due
      await admin.from("tenants")
        .update({ sub_status: "active" })
        .eq("stripe_customer_id", customerId)
        .eq("sub_status", "past_due");
      break;
    }

    default:
      // Événement non géré — OK
      break;
  }

  return NextResponse.json({ received: true });
}
