"use client";

import { useState } from "react";
import { Check, CreditCard, Loader2, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanConfig, PlanId, SubStatus } from "@/lib/plans";

const STATUS_LABELS: Record<SubStatus, { label: string; className: string }> = {
  trialing:  { label: "Essai gratuit",  className: "border-blue-200   bg-blue-50   text-blue-700"   },
  active:    { label: "Actif",          className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  past_due:  { label: "Paiement en retard", className: "border-red-200 bg-red-50 text-red-700"     },
  canceled:  { label: "Annulé",         className: "border-slate-200  bg-slate-50  text-slate-500"  },
};

type Props = {
  currentPlanSlug: string;
  subStatus:       SubStatus;
  trialDaysLeft:   number;
  hasCustomer:     boolean;
  plans:           PlanConfig[];
  flash:           "success" | "canceled" | null;
};

export function BillingClient({
  currentPlanSlug,
  subStatus,
  trialDaysLeft,
  hasCustomer,
  plans,
  flash,
}: Props) {
  const [loading, setLoading] = useState<PlanId | "portal" | null>(null);

  async function checkout(planId: PlanId) {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ planId }),
      });
      const { url, error } = await res.json();
      if (error) { alert(error); return; }
      window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (error) { alert(error); return; }
      window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  const statusInfo = STATUS_LABELS[subStatus];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Facturation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez votre abonnement et vos informations de paiement.
          </p>
        </div>
        {hasCustomer && (
          <Button
            disabled={loading === "portal"}
            variant="outline"
            onClick={openPortal}
          >
            {loading === "portal"
              ? <Loader2 className="size-4 animate-spin" />
              : <CreditCard className="size-4" />}
            Gérer la facturation
          </Button>
        )}
      </div>

      {/* Flash messages */}
      {flash === "success" && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <Check className="size-4 shrink-0" />
          Abonnement activé — merci pour votre confiance !
        </div>
      )}
      {flash === "canceled" && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Paiement annulé. Votre plan actuel reste inchangé.
        </div>
      )}

      {/* Statut actuel */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plan actuel</p>
            <p className="mt-1 text-2xl font-black text-slate-950 capitalize">
              {plans.find((p) => p.id === currentPlanSlug)?.name ?? currentPlanSlug}
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>

        {subStatus === "trialing" && trialDaysLeft > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <Zap className="size-4 shrink-0" />
            <span>
              Il vous reste <strong>{trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""}</strong> d'essai gratuit — accès Business complet.
            </span>
          </div>
        )}

        {subStatus === "past_due" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Votre paiement a échoué. Mettez à jour votre moyen de paiement pour continuer.</span>
            <Button
              className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
              disabled={loading === "portal"}
              size="sm"
              variant="outline"
              onClick={openPortal}
            >
              Mettre à jour
            </Button>
          </div>
        )}
      </div>

      {/* Plans */}
      <div>
        <h3 className="mb-4 text-base font-semibold">Changer de plan</h3>
        <div className="grid gap-4 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanSlug && subStatus !== "canceled";
            const isLoading = loading === plan.id;

            return (
              <div
                className={`relative rounded-xl border-2 p-5 transition ${
                  plan.highlight
                    ? "border-indigo-500 bg-indigo-950 text-white"
                    : isCurrent
                    ? "border-emerald-400 bg-white"
                    : "border-slate-200 bg-white"
                }`}
                key={plan.id}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-3 py-0.5 text-[10px] font-black uppercase text-white">
                    {plan.badge}
                  </span>
                )}

                <p className={`text-xs font-black uppercase tracking-wide ${plan.highlight ? "text-white/40" : "text-slate-400"}`}>
                  {plan.name}
                </p>
                <div className="mt-2 flex items-end gap-1">
                  <span className={`text-3xl font-black ${plan.highlight ? "text-white" : "text-slate-950"}`}>
                    {plan.price}€
                  </span>
                  <span className={`mb-0.5 text-xs ${plan.highlight ? "text-white/40" : "text-slate-400"}`}>
                    /mois HT
                  </span>
                </div>
                <p className={`mt-1 text-xs ${plan.highlight ? "text-white/50" : "text-slate-400"}`}>
                  {plan.maxMembers === -1 ? "Illimité" : `${plan.maxMembers} collaborateurs`}
                  {" · "}
                  {plan.maxUsers === -1 ? "∞" : plan.maxUsers} utilisateur{plan.maxUsers > 1 ? "s" : ""}
                </p>

                <div className={`my-4 h-px ${plan.highlight ? "bg-white/10" : "bg-slate-100"}`} />

                <ul className="space-y-1.5">
                  {plan.features.slice(0, 5).map((f) => (
                    <li className={`flex items-center gap-2 text-xs ${plan.highlight ? "text-white/70" : "text-slate-600"}`} key={f}>
                      <Check className="size-3 shrink-0 text-emerald-400" />
                      {featureLabel(f)}
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className={`text-xs ${plan.highlight ? "text-white/40" : "text-slate-400"}`}>
                      + {plan.features.length - 5} fonctionnalités…
                    </li>
                  )}
                </ul>

                <Button
                  className={`mt-5 w-full ${
                    isCurrent
                      ? "border-emerald-400 text-emerald-700"
                      : plan.highlight
                      ? "bg-white text-indigo-950 hover:bg-white/90"
                      : ""
                  }`}
                  disabled={isCurrent || isLoading}
                  variant={isCurrent ? "outline" : plan.highlight ? "default" : "outline"}
                  onClick={() => !isCurrent && checkout(plan.id as PlanId)}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isCurrent ? (
                    "Plan actuel"
                  ) : (
                    "Choisir ce plan"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <p className="text-center text-xs text-slate-400">
        Paiement sécurisé par Stripe · Résiliable à tout moment · Facturation mensuelle HT · TVA non incluse
      </p>
    </div>
  );
}

// ── Labels lisibles des features ─────────────────────────────────────────────
function featureLabel(f: string): string {
  const map: Record<string, string> = {
    onboarding:         "Onboarding + checklist",
    documents:          "Kit 26 documents",
    basic_team:         "Liste collaborateurs",
    full_team:          "Fiches 6 onglets",
    new_arrivals:       "Nouvelles arrivées",
    pipeline:           "Pipeline recrutement",
    briefs:             "Briefs RH",
    export_csv:         "Export CSV",
    notifications:      "Centre de notifications",
    dashboard_advanced: "Dashboard avancé",
    workspace_members:  "Invitations & rôles",
    voice_notes:        "Notes vocales (Whisper)",
    ai_actions:         "Extraction actions IA",
    analytics:          "Analytiques",
    cron_reminders:     "Rappels automatiques",
    profile_settings:   "Profil & paramètres",
  };
  return map[f] ?? f;
}
