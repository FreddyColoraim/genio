import Link from "next/link";
import {
  ArrowRight,
  FileCheck2,
  Gauge,
  MousePointerClick,
  Route,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import { BenefitsExplorer } from "@/components/landing/benefits-explorer";
import { HeroDashboard } from "@/components/landing/hero-dashboard";
import { PricingSection } from "@/components/landing/pricing-section";
import { NexoLogo } from "@/components/nexo-logo";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    title: "Parcours guides",
    description: "Centralisez les etapes d'arrivee, les responsables et les dates cles.",
    icon: UsersRound
  },
  {
    title: "Documents sous controle",
    description: "Suivez les pieces manquantes, les validations et les relances RH.",
    icon: FileCheck2
  },
  {
    title: "Pilotage clair",
    description: "Visualisez l'avancement des equipes et les blocages a traiter en priorite.",
    icon: Gauge
  },
  {
    title: "Sources candidats",
    description: "Mesurez les arrivees issues de LinkedIn, du site carriere, des annonces et de la cooptation.",
    icon: MousePointerClick
  },
  {
    title: "Reunion vers onboarding",
    description: "Transformez un brief RH en offre, parcours candidat puis onboarding structure.",
    icon: Route
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-warm text-foreground">
      <header className="border-b border-border/70 bg-white/80 backdrop-blur">
        <div className="container flex h-20 items-center justify-between">
          <NexoLogo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a className="transition hover:text-foreground" href="#solution">
              Solution
            </a>
            <a className="transition hover:text-foreground" href="#pilotage">
              Pilotage
            </a>
            <a className="transition hover:text-foreground" href="#tarifs">
              Tarifs
            </a>
            <a className="transition hover:text-foreground" href="#securite">
              Securite
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Essai gratuit 14 jours
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="surface-grid border-b border-border/70 bg-white">
        <div className="container grid min-h-[calc(100vh-5rem)] items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-warm px-3 py-1 text-sm font-medium text-navy">
              <Sparkles className="size-4 text-blue" />
              Onboarding RH simple, clair, actionnable
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-navy sm:text-5xl lg:text-6xl">
              Nexo transforme une reunion RH en parcours candidat, puis en onboarding structure.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              De la prise de besoin a la publication de l'offre, du suivi des sources candidat a
              l'arrivee du collaborateur : Nexo coordonne chaque etape dans un seul espace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="default" className="h-12 px-6">
                <Link href="/signup">
                  Demarrer l'essai gratuit
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="h-12 px-6">
                <Link href="/login">Voir le tableau de bord</Link>
              </Button>
            </div>
          </div>

          <HeroDashboard />
        </div>
      </section>

      <section id="solution" className="border-b border-border/70 bg-warm py-20">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue">Solution</p>
            <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
              Tout ce qu'il faut pour lancer un collaborateur sans friction.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {pillars.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-lg border border-border bg-white p-6 shadow-sm">
                <div className="grid size-11 place-items-center rounded-lg bg-lavender text-blue">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-navy">{title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pilotage" className="bg-white py-20">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue">Pilotage</p>
            <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
              Priorisez les actions RH au lieu de courir apres l'information.
            </h2>
            <p className="mt-5 leading-8 text-muted-foreground">
              Nexo RH donne une lecture immediate des dossiers sensibles, des documents en attente
              et des prochaines actions a mener avec les managers.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["-42%", "relances manuelles"],
              ["3 min", "pour lire les priorites"],
              ["24/7", "visibilite equipe"],
              ["1 lieu", "pour documents et suivi"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-border bg-warm p-6">
                <p className="text-3xl font-semibold text-navy">{value}</p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-warm py-20">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue">
                Benefices produit
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
                Une base operationnelle pour chaque arrivee.
              </h2>
              <p className="mt-5 leading-8 text-muted-foreground">
                Nexo RH reduit les oublis, clarifie les responsabilites et donne aux equipes RH un
                espace de travail concu pour suivre les parcours dans la duree.
              </p>
            </div>

            <BenefitsExplorer />
          </div>
        </div>
      </section>

      <PricingSection />

      <section id="securite" className="border-t border-border/70 bg-navy py-16 text-white">
        <div className="container flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-white/75">
              <ShieldCheck className="size-5" />
              <p className="text-sm font-semibold uppercase tracking-wide">Espace RH securise</p>
            </div>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              Pret a construire l'experience d'onboarding Nexo ?
            </h2>
          </div>
          <Button asChild variant="secondary" className="h-12 px-6">
            <Link href="/signup">
              Demarrer 14 jours gratuits
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
