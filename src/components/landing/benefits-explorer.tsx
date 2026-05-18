"use client";

import { useState } from "react";
import { Clock3, LifeBuoy, MousePointerClick, Route, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  {
    title: "Moins de temps perdu",
    description: "Les relances, documents et validations restent visibles dans un seul flux.",
    detail: "Les RH voient les dossiers incomplets et les prochaines actions sans fouiller dans les mails.",
    icon: Clock3
  },
  {
    title: "Experience collaborateur nette",
    description: "Chaque nouvel arrivant sait quoi faire, quand le faire et qui contacter.",
    detail: "Le parcours d'arrivee devient lisible, rassurant et partageable des le premier jour.",
    icon: Sparkles
  },
  {
    title: "Suivi RH mesurable",
    description: "Les responsables identifient les retards, les risques et les priorites.",
    detail: "Scores, alertes et statuts rendent les blocages visibles avant qu'ils deviennent urgents.",
    icon: TrendingUp
  },
  {
    title: "Sources d'acquisition",
    description: "Mesurez l'origine des candidats integres : LinkedIn, site, annonce, cooptation.",
    detail: "Nexo relie chaque arrivee a sa source pour comprendre quels canaux apportent les meilleurs profils.",
    icon: MousePointerClick
  },
  {
    title: "Reunion RH vers onboarding",
    description: "Passez du resume de reunion a l'offre, au suivi candidat puis a l'arrivee.",
    detail: "Le module premium transforme un brief RH en annonce exploitable, suit les sources candidat et lance l'onboarding des qu'un profil est retenu.",
    icon: Route
  },
  {
    title: "Accompagnement equipe",
    description: "Les managers gardent le contexte sans multiplier les messages internes.",
    detail: "Chaque manager sait ce qui est attendu, ce qui est fait et ce qui reste a valider.",
    icon: LifeBuoy
  }
];

export function BenefitsExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeBenefit = benefits[activeIndex] ?? benefits[0]!;
  const ActiveIcon = activeBenefit.icon;

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-3">
        {benefits.map(({ title, description, icon: Icon }, index) => (
          <button
            key={title}
            className={cn(
              "w-full rounded-lg border p-5 text-left transition",
              activeIndex === index
                ? "border-blue bg-white shadow-sm"
                : "border-border bg-white/70 hover:bg-white"
            )}
            type="button"
            onClick={() => setActiveIndex(index)}
          >
            <div className="flex items-start gap-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-sage text-navy">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">{title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-lg bg-lavender text-blue">
            <ActiveIcon className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Benefice actif</p>
            <h3 className="text-xl font-semibold text-navy">{activeBenefit.title}</h3>
          </div>
        </div>
        <p className="mt-6 leading-8 text-muted-foreground">{activeBenefit.detail}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {["Collecter", "Relancer", "Suivre"].map((step, index) => (
            <div key={step} className="rounded-md border border-border bg-warm p-4">
              <p className="text-sm font-semibold text-navy">{step}</p>
              <div className="mt-3 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue"
                  style={{ width: `${90 - index * 16}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
