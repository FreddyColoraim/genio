// =============================================================================
// Plans Nexo RH — 4 niveaux fixes
// =============================================================================

export type PlanId = "starter" | "team" | "business" | "enterprise";
export type SubStatus = "trialing" | "active" | "past_due" | "canceled";

export type PlanFeature =
  | "onboarding"          // checklist + tâches
  | "documents"           // upload + kit 26 docs
  | "basic_team"          // liste collaborateurs simple
  | "full_team"           // fiche 6 onglets
  | "new_arrivals"        // section nouvelles arrivées
  | "pipeline"            // kanban recrutement
  | "briefs"              // briefs RH
  | "export_csv"          // exports CSV
  | "notifications"       // centre notifications réel
  | "dashboard_advanced"  // arrivées + actions urgentes
  | "workspace_members"   // invitations membres + rôles
  | "voice_notes"         // notes vocales Whisper
  | "ai_actions"          // extraction actions IA Claude
  | "analytics"           // page analytiques
  | "cron_reminders"      // rappels Cron quotidiens
  | "profile_settings";   // profil + mot de passe

export type PlanConfig = {
  id:         PlanId;
  slug:       string;          // = id
  name:       string;
  price:      number;          // €/mois HT
  priceId:    string;          // STRIPE_PRICE_*
  maxMembers: number;          // -1 = illimité
  maxUsers:   number;          // -1 = illimité
  features:   PlanFeature[];
  highlight?: boolean;
  badge?:     string;
};

// ── Stripe Price IDs ── remplacer par vos vrais IDs depuis le dashboard Stripe
const PRICE_IDS: Record<PlanId, string> = {
  starter:    process.env.STRIPE_PRICE_STARTER    ?? "price_starter_placeholder",
  team:       process.env.STRIPE_PRICE_TEAM       ?? "price_team_placeholder",
  business:   process.env.STRIPE_PRICE_BUSINESS   ?? "price_business_placeholder",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "price_enterprise_placeholder",
};

// ── Définition des plans ──────────────────────────────────────────────────────

export const PLANS: Record<PlanId, PlanConfig> = {
  starter: {
    id:         "starter",
    slug:       "starter",
    name:       "Starter",
    price:      19,
    priceId:    PRICE_IDS.starter,
    maxMembers: 15,
    maxUsers:   1,
    features: [
      "onboarding",
      "documents",
      "basic_team",
      "profile_settings",
    ],
  },

  team: {
    id:         "team",
    slug:       "team",
    name:       "Équipe",
    price:      49,
    priceId:    PRICE_IDS.team,
    maxMembers: 50,
    maxUsers:   3,
    highlight:  true,
    badge:      "Le plus populaire",
    features: [
      "onboarding",
      "documents",
      "basic_team",
      "full_team",
      "new_arrivals",
      "pipeline",
      "briefs",
      "export_csv",
      "notifications",
      "dashboard_advanced",
      "workspace_members",
      "profile_settings",
    ],
  },

  business: {
    id:         "business",
    slug:       "business",
    name:       "Business",
    price:      99,
    priceId:    PRICE_IDS.business,
    maxMembers: 200,
    maxUsers:   10,
    features: [
      "onboarding",
      "documents",
      "basic_team",
      "full_team",
      "new_arrivals",
      "pipeline",
      "briefs",
      "export_csv",
      "notifications",
      "dashboard_advanced",
      "workspace_members",
      "voice_notes",
      "ai_actions",
      "analytics",
      "cron_reminders",
      "profile_settings",
    ],
  },

  enterprise: {
    id:         "enterprise",
    slug:       "enterprise",
    name:       "Entreprise",
    price:      249,
    priceId:    PRICE_IDS.enterprise,
    maxMembers: -1,
    maxUsers:   -1,
    features: [
      "onboarding",
      "documents",
      "basic_team",
      "full_team",
      "new_arrivals",
      "pipeline",
      "briefs",
      "export_csv",
      "notifications",
      "dashboard_advanced",
      "workspace_members",
      "voice_notes",
      "ai_actions",
      "analytics",
      "cron_reminders",
      "profile_settings",
    ],
  },
};

export const PLANS_LIST: PlanConfig[] = Object.values(PLANS);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Vérifie si un plan (ou trial) donne accès à une fonctionnalité.
 * - trial     : accès Business complet pendant 14j
 * - null/canceled : accès Starter uniquement
 */
export function canAccess(
  feature:   PlanFeature,
  planSlug:  string | null | undefined,
  subStatus: SubStatus | null | undefined
): boolean {
  // Trial = accès Business complet
  if (subStatus === "trialing") {
    return PLANS.business.features.includes(feature);
  }
  // Annulé / inconnu = accès Starter seulement
  if (!planSlug || subStatus === "canceled") {
    return PLANS.starter.features.includes(feature);
  }
  const plan = PLANS[planSlug as PlanId];
  if (!plan) return false;
  return plan.features.includes(feature);
}

/** Résout un planId depuis un slug Stripe Price ID */
export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return PLANS_LIST.find((p) => p.priceId === priceId);
}

/** Jours restants de trial (0 si expiré ou pas en trial) */
export function trialDaysLeft(trialEndsAt: string | Date | null | undefined): number {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
