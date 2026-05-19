import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarCheck2,
  Check,
  ClipboardCheck,
  FileCheck2,
  HeartHandshake,
  Hotel,
  ShieldCheck,
  Store,
  Truck,
  UsersRound,
  Wrench
} from "lucide-react";
import { HeroDashboard } from "@/components/landing/hero-dashboard";
import { NexoLogo } from "@/components/nexo-logo";
import { Button } from "@/components/ui/button";

const metrics = [
  ["10 min", "pour configurer votre espace"],
  ["1 lieu", "pour suivre onboarding et documents"],
  ["8 secteurs", "avec scenarios adaptes"],
  ["0 friction", "pour lancer une V1 simple"]
];

const useCases = [
  {
    icon: CalendarCheck2,
    step: "01 · Candidature validee",
    phase: "Profil",
    progress: "25%",
    title: "Declencher le parcours d'arrivee",
    description:
      "Passez d'un profil candidat a une fiche collaborateur avec les premieres actions a suivre.",
    tags: ["Profil candidat", "Manager implique", "Progression"]
  },
  {
    icon: FileCheck2,
    step: "02 · Documents",
    phase: "Pieces",
    progress: "50%",
    title: "Collecter les pieces utiles",
    description:
      "Associez chaque document au bon collaborateur, suivez son statut et gardez une lecture simple des manquants.",
    tags: ["Upload", "Recu", "Valide"]
  },
  {
    icon: UsersRound,
    step: "03 · Premier jour",
    phase: "Arrivee",
    progress: "75%",
    title: "Preparer l'arrivee terrain",
    description:
      "Planning, manager, materiel, consignes: chaque secteur garde ses etapes essentielles sans outil lourd.",
    tags: ["J-7", "Jour J", "J+7"]
  },
  {
    icon: BarChart3,
    step: "04 · Pilotage",
    phase: "Suivi",
    progress: "100%",
    title: "Voir ce qui bloque",
    description:
      "Le dashboard remonte les onboardings actifs, la progression moyenne et les documents encore a traiter.",
    tags: ["Priorites", "Dashboard", "Suivi"]
  }
];

const features = [
  {
    icon: ClipboardCheck,
    tone: "orange",
    title: "Scenarios d'onboarding",
    description: "Des etapes simples, validables une par une, adaptees au secteur de l'entreprise."
  },
  {
    icon: FileCheck2,
    tone: "emerald",
    title: "Documents d'arrivee",
    description: "Upload, association collaborateur et statuts en attente, recu ou valide."
  },
  {
    icon: UsersRound,
    tone: "indigo",
    title: "Profil candidat",
    description: "Une fiche claire pour garder les infos utiles avant et pendant l'arrivee."
  },
  {
    icon: Building2,
    tone: "sky",
    title: "Profil entreprise",
    description: "Secteur, taille et organisation pour mieux preparer les parcours d'arrivee."
  },
  {
    icon: BarChart3,
    tone: "amber",
    title: "Dashboard clair",
    description: "Une vue courte des arrivees actives, documents et prochaines actions."
  }
];

const sectors = [
  { icon: HeartHandshake, slug: "services-a-la-personne", name: "Services a la personne", detail: "Interventions, planning, suivi terrain" },
  { icon: Wrench, slug: "industrie-btp", name: "Industrie & BTP", detail: "Habilitations, materiel, securite" },
  { icon: ShieldCheck, slug: "sante-medico-social", name: "Sante & medico-social", detail: "Dossiers, contraintes, roulements" },
  { icon: Store, slug: "commerce-distribution", name: "Commerce & distribution", detail: "Turnover, magasins, equipes" },
  { icon: BadgeCheck, slug: "associations", name: "Associations", detail: "Salaries, benevoles, missions" },
  { icon: Hotel, slug: "hotellerie-restauration", name: "Hotellerie & restauration", detail: "Saisonniers, shifts, tenues" },
  { icon: Truck, slug: "transport-logistique", name: "Transport & logistique", detail: "Permis, depot, tournees" },
  { icon: Building2, slug: "tech-startup", name: "Tech & startup", detail: "Acces, outils, objectifs 30 jours" }
];

const featureToneClasses: Record<(typeof features)[number]["tone"], string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700 group-hover:bg-amber-100",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100",
  orange: "border-orange-200 bg-orange-50 text-orange-700 group-hover:bg-orange-100",
  sky: "border-sky-200 bg-sky-50 text-sky-700 group-hover:bg-sky-100"
};

const plans = [
  {
    name: "Starter",
    price: "0€",
    period: "pour tester",
    description: "Pour valider le besoin avec une petite equipe.",
    features: ["1 workspace", "Collaborateurs", "Checklist onboarding", "Documents simples"]
  },
  {
    name: "PME",
    price: "29€",
    period: "/ mois HT",
    description: "Pour les structures qui recrutent regulierement.",
    features: ["Tout Starter", "Scenarios sectoriels", "Dashboard equipe", "Support email"],
    featured: true
  },
  {
    name: "Croissance",
    price: "69€",
    period: "/ mois HT",
    description: "Pour les PME multi-equipes avec managers impliques.",
    features: ["Tout PME", "Multi-sites", "Modeles avances", "Support prioritaire"]
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <NexoLogo />
          <nav className="hidden items-center gap-1 md:flex">
            {[
              ["Cas d'usage", "#cas-usage"],
              ["Fonctionnalites", "#fonctionnalites"],
              ["Tarifs", "#tarifs"],
              ["Secteurs", "#secteurs"]
            ].map(([label, href]) => (
              <a
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                href={href}
                key={href}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden bg-white text-slate-700 hover:bg-slate-100 sm:inline-flex" variant="ghost">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild className="group bg-indigo-950 text-white transition hover:-translate-y-0.5 hover:bg-indigo-900">
              <Link href="/signup">
                Demarrer
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-indigo-950 pt-16 text-white">
        <div className="motion-line pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/5" />
        <div className="motion-line pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/5 [animation-delay:1.8s]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <div>
            <div className="motion-rise mb-7 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
              <span className="motion-pulse-soft size-1.5 rounded-full bg-orange-500" />
              Le cockpit d'arrivee pour les PME
            </div>
            <h1 className="motion-rise max-w-3xl text-5xl font-black leading-[0.95] tracking-normal [animation-delay:120ms] sm:text-6xl lg:text-7xl">
              Optimisez chaque
              <span className="block text-orange-500">recrutement</span>
              <span className="block font-light text-white/65">par une integration maitrisee.</span>
            </h1>
            <p className="motion-rise mt-6 max-w-xl text-lg leading-8 text-white/60 [animation-delay:220ms]">
              Nexo centralise le profil candidat, l'arrivee collaborateur, les documents,
              les etapes manager et le suivi dans un espace simple.
            </p>
            <div className="motion-rise mt-9 flex flex-col gap-3 [animation-delay:320ms] sm:flex-row">
              <Button asChild className="group h-12 bg-orange-600 px-7 text-white shadow-[0_12px_30px_rgba(234,88,12,0.35)] transition hover:-translate-y-0.5 hover:bg-orange-700">
                <Link href="/signup">
                  Essai gratuit
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild className="h-12 border-white/15 bg-transparent px-7 text-white/75 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white" variant="outline">
                <a href="#cas-usage">Voir une demo</a>
              </Button>
            </div>
            <div className="motion-rise mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/50 [animation-delay:430ms]">
              {["Sans carte bancaire", "Config en 10 min", "Support FR", "Hebergement Europe"].map(
                (item) => (
                  <span className="inline-flex items-center gap-2 transition hover:text-white/80" key={item}>
                    <Check className="size-4 text-orange-500" />
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="motion-slide-left [animation-delay:180ms]">
            <div className="motion-float">
              <HeroDashboard />
            </div>
          </div>
        </div>
      </section>

      <section className="grid bg-slate-950 text-white md:grid-cols-4">
        {metrics.map(([value, label], index) => (
          <div
            className="motion-rise border-b border-white/10 px-6 py-8 text-center md:border-b-0 md:border-r"
            key={label}
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <p className="text-4xl font-black tracking-normal text-orange-500">{value}</p>
            <p className="mt-2 text-sm font-medium text-white/45">{label}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8" id="cas-usage">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="inline-flex rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
            Cas d'usage
          </p>
          <h2 className="mt-5 text-4xl font-black tracking-normal text-slate-950">
            De la candidature validee au premier jour reussi.
          </h2>
          <p className="mt-4 leading-7 text-slate-500">
            Nexo garde le parcours volontairement simple: une action, un responsable, un statut.
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-6 right-6 top-8 hidden h-1 overflow-hidden rounded-full bg-slate-100 md:block">
            <div className="motion-shine h-full w-4/5 rounded-full bg-orange-500" />
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {useCases.map(({ icon: Icon, step, phase, progress, title, description, tags }, index) => (
              <article
                className="group motion-rise relative rounded-lg border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
                key={title}
                style={{ animationDelay: `${index * 110}ms` }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="grid size-14 place-items-center rounded-full border-4 border-white bg-orange-600 text-lg font-black text-white shadow-lg transition duration-300 group-hover:scale-110">
                    {index + 1}
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                    {progress}
                  </span>
                </div>
                <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-700 group-hover:bg-indigo-700"
                    style={{ width: progress }}
                  />
                </div>
                <Icon className="size-7 text-orange-600 transition duration-300 group-hover:scale-110" />
                <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-wide text-orange-600">
                  {step} · {phase}
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 leading-7 text-slate-500">{description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-950 transition group-hover:border-orange-200" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-5 py-24 lg:px-8" id="fonctionnalites">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="inline-flex rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
              Fonctionnalites
            </p>
            <h2 className="mt-5 text-4xl font-black tracking-normal text-slate-950">
              Tout ce qu'il faut pour accueillir quelqu'un, rien de superflu.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {features.map(({ title, tone }) => (
                <span
                  className={`motion-rise rounded-full border px-3 py-1 text-xs font-bold ${featureToneClasses[tone]}`}
                  key={title}
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {features.map(({ icon: Icon, tone, title, description }, index) => (
              <article
                className="group motion-rise overflow-hidden rounded-lg border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md"
                key={title}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={`mb-5 h-1.5 rounded-full ${featureToneClasses[tone]}`} />
                <div className={`grid size-12 place-items-center rounded-lg border transition duration-300 ${featureToneClasses[tone]}`}>
                  <Icon className="size-6 transition duration-300 group-hover:scale-110" />
                </div>
                <h3 className="mt-5 font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24 lg:px-8" id="tarifs">
        <div className="mb-12 text-center">
          <p className="inline-flex rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
            Tarifs
          </p>
          <h2 className="mt-5 text-4xl font-black tracking-normal text-slate-950">
            Simple, transparent, sans mauvaise surprise.
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              className={plan.featured ? "motion-rise relative rounded-lg bg-indigo-950 p-7 text-white shadow-xl transition duration-300 hover:-translate-y-1" : "motion-rise rounded-lg border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-md"}
              key={plan.name}
            >
              {plan.featured ? (
                <span className="motion-shine absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 px-4 py-1 text-xs font-black uppercase text-white">
                  Le plus populaire
                </span>
              ) : null}
              <p className={plan.featured ? "text-xs font-black uppercase tracking-wide text-white/45" : "text-xs font-black uppercase tracking-wide text-slate-400"}>
                {plan.name}
              </p>
              <p className={plan.featured ? "mt-3 text-5xl font-black text-white" : "mt-3 text-5xl font-black text-slate-950"}>
                {plan.price}
              </p>
              <p className={plan.featured ? "mt-1 text-sm text-white/45" : "mt-1 text-sm text-slate-400"}>
                {plan.period}
              </p>
              <p className={plan.featured ? "mt-5 leading-7 text-white/55" : "mt-5 leading-7 text-slate-500"}>
                {plan.description}
              </p>
              <div className={plan.featured ? "my-6 h-px bg-white/10" : "my-6 h-px bg-slate-200"} />
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li className={plan.featured ? "flex gap-3 text-sm text-white/80" : "flex gap-3 text-sm text-slate-600"} key={feature}>
                    <Check className="size-4 shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className={plan.featured ? "mt-8 w-full bg-orange-600 text-white transition hover:-translate-y-0.5 hover:bg-orange-700" : "mt-8 w-full transition hover:-translate-y-0.5"} variant={plan.featured ? "default" : "outline"}>
                <Link href="/signup">Commencer</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-indigo-950 px-5 py-20 text-white lg:px-8" id="secteurs">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-black tracking-normal">
              Nexo s'adapte a <span className="text-orange-500">votre secteur.</span>
            </h2>
            <p className="mt-4 text-white/50">
              Pour les entreprises qui recrutent, forment et doivent vite rendre les arrivees lisibles.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sectors.map(({ icon: Icon, slug, name, detail }) => (
              <Link
                className="group motion-rise rounded-lg border border-white/10 bg-white/5 p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:bg-white/10"
                href={`/signup?profile=${slug}`}
                key={name}
              >
                <Icon className="mx-auto size-8 text-orange-500 transition duration-300 group-hover:scale-110" />
                <h3 className="mt-4 font-bold">{name}</h3>
                <p className="mt-2 text-sm text-white/45">{detail}</p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-950 transition group-hover:bg-orange-500 group-hover:text-white">
                  Creer mon profil
                  <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 text-center lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">
          Pret a simplifier vos arrivees ?
        </p>
        <h2 className="mx-auto mt-5 max-w-3xl text-5xl font-black tracking-normal text-indigo-950">
          Transformez chaque recrutement en arrivee claire.
        </h2>
        <p className="mt-5 text-slate-500">Essai gratuit. Sans carte bancaire. Configuration en 10 minutes.</p>
        <div className="mt-8 flex justify-center">
          <Button asChild className="group h-12 bg-indigo-950 px-8 text-white transition hover:-translate-y-0.5 hover:bg-indigo-900">
            <Link href="/signup">
              Demarrer gratuitement
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="bg-slate-950 px-5 py-12 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <NexoLogo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/40">
              Le cockpit simple pour les PME qui veulent structurer l'arrivee collaborateur.
            </p>
          </div>
          <p className="text-sm text-white/30">© 2026 Nexo. Made in France.</p>
        </div>
      </footer>
    </main>
  );
}
