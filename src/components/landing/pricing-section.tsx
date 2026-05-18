"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

const pricingPlans = [
  {
    name: "Gratuit",
    description: "Pour independants et solopreneurs qui veulent cadrer leurs premiers process.",
    monthly: "0 EUR",
    yearly: "0 EUR",
    note: "Sans engagement",
    features: [
      "1 espace solo",
      "1 checklist d'arrivee",
      "Coffre documentaire de base",
      "Rappels manuels",
      "Tableau de bord simplifie"
    ]
  },
  {
    name: "Starter",
    description: "Pour PME, artisans et petites equipes qui structurent leurs arrivees.",
    monthly: "29 EUR",
    yearly: "290 EUR",
    note: "2 mois offerts",
    features: [
      "Essai gratuit 14 jours",
      "Jusqu'a 20 salaries",
      "Onboarding structure",
      "Collecte documentaire",
      "Checklists intelligentes",
      "Relances automatiques"
    ]
  },
  {
    name: "Pro",
    description: "Pour PME structurees qui veulent piloter documents, rappels et managers.",
    monthly: "79 EUR",
    yearly: "790 EUR",
    note: "2 mois offerts",
    featured: true,
    features: [
      "Essai gratuit 14 jours",
      "Jusqu'a 60 salaries",
      "Parcours personnalises",
      "Brief RH vers offre d'emploi",
      "Coffre documentaire salarie",
      "Alertes expiration",
      "Roles manager et RH",
      "Dashboard manager"
    ]
  },
  {
    name: "Business",
    description: "Pour ETI, groupements et equipes multi-sites avec API, monitoring et pilotage avance.",
    monthly: "249 EUR",
    yearly: "2 490 EUR",
    note: "2 mois offerts",
    features: [
      "Essai gratuit 14 jours",
      "Jusqu'a 150 salaries",
      "Reunion RH vers parcours candidat",
      "API sources & jobboards",
      "Monitoring acquisition",
      "Dashboard recrutement complet",
      "Formations obligatoires",
      "Score de conformite",
      "Mode multi-site",
      "Support prioritaire"
    ]
  }
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState("Pro");

  return (
    <section id="tarifs" className="border-t border-border/70 bg-white py-20">
      <div className="container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue">Tarification</p>
            <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
              Choisissez le rythme qui correspond a votre equipe.
            </h2>
            <p className="mt-5 leading-8 text-muted-foreground">
              Une option gratuite pour les independants et solopreneurs, puis trois formules
              payantes selon votre volume RH. Business ajoute le module premium de conversion
              reunion RH, offre d'emploi, sources candidat et onboarding avec API et monitoring.
            </p>
          </div>
          <div className="inline-flex w-fit rounded-lg border border-border bg-warm p-1 text-sm font-medium text-muted-foreground">
            {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                className={cn(
                  "rounded-md px-4 py-2 transition",
                  billingCycle === cycle && "bg-white text-navy shadow-sm"
                )}
                type="button"
                onClick={() => setBillingCycle(cycle)}
              >
                {cycle === "monthly" ? "Mensuel" : "Annuel"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {pricingPlans.map((plan) => {
            const isFeatured = Boolean(plan.featured);
            const isSelected = selectedPlan === plan.name;
            const price = billingCycle === "monthly" ? plan.monthly : plan.yearly;
            const cadence = billingCycle === "monthly" ? "par mois" : "par an";

            return (
              <article
                key={plan.name}
                className={cn(
                  "rounded-lg border p-6 transition",
                  isFeatured
                    ? "border-blue bg-navy text-white shadow-soft"
                    : "border-border bg-warm",
                  isSelected && !isFeatured && "border-blue shadow-sm"
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={isFeatured ? "text-xl font-semibold text-white" : "text-xl font-semibold text-navy"}>
                      {plan.name}
                    </p>
                    <p className={isFeatured ? "mt-2 text-white/70" : "mt-2 text-muted-foreground"}>
                      {plan.description}
                    </p>
                  </div>
                  {isFeatured ? (
                    <span className="w-fit rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-white">
                      Recommande
                    </span>
                  ) : null}
                </div>

                <button
                  className={cn(
                    "mt-8 w-full rounded-md border p-4 text-left transition",
                    isFeatured
                      ? "border-white/15 bg-white/10 hover:bg-white/15"
                      : "border-border bg-white hover:border-blue"
                  )}
                  type="button"
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  <p className={isFeatured ? "text-sm text-white/65" : "text-sm text-muted-foreground"}>
                    {cadence}
                  </p>
                  <p className={isFeatured ? "mt-2 text-3xl font-semibold" : "mt-2 text-3xl font-semibold text-navy"}>
                    {price}
                  </p>
                  <p className={isFeatured ? "mt-1 text-sm text-white/65" : "mt-1 text-sm text-muted-foreground"}>
                    {billingCycle === "yearly" ? plan.note : "Facturation mensuelle"}
                  </p>
                </button>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={isFeatured ? "flex items-center gap-3 text-white/80" : "flex items-center gap-3 text-muted-foreground"}
                    >
                      <CheckCircle2 className={isFeatured ? "size-5 text-sage" : "size-5 text-blue"} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={isFeatured ? "secondary" : "default"}
                  className="mt-8 h-12 w-full"
                >
                  <Link href="/signup">
                    {plan.name === "Gratuit" ? "Commencer gratuit" : `Essayer ${plan.name}`}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-warm p-4 text-sm text-muted-foreground">
          Plan selectionne : <span className="font-semibold text-navy">{selectedPlan}</span>. Changez
          de carte ou de rythme de facturation pour comparer l'offre.
        </div>
      </div>
    </section>
  );
}
