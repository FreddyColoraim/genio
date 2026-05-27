import Stripe from "stripe";

// Singleton Stripe côté serveur uniquement
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-04-22.dahlia",
  typescript:  true,
});

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
