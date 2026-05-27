import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { NexoLogo } from "@/components/nexo-logo";
import { Button }   from "@/components/ui/button";
import { SectorLeadForm } from "@/components/landing/sector-lead-form";
import type { SectorConfig } from "@/config/sectors";

// ── Icônes inline (pas de dépendance externe pour les pain points) ─────────────
const PAIN_ICONS: Record<string, string> = {
  AlertTriangle: "⚠️", FileX: "🗂️", Clock: "⏱️", AlertCircle: "🔔",
  FileWarning: "📄", ShieldAlert: "🛡️", Clipboard: "📋", UserMinus: "👤",
  Shuffle: "🔀", Users: "👥", Calendar: "📅", Laptop: "💻", Target: "🎯",
  UserX: "❌",
};

const BENEFIT_ICONS: Record<string, string> = {
  ShieldCheck: "✅", Bell: "🔔", BarChart3: "📊", ClipboardCheck: "📋",
  Users: "👥", Heart: "❤️", Zap: "⚡", TrendingDown: "📉", FileCheck: "📄",
  TrendingUp: "📈", Lock: "🔒", Truck: "🚛", Calendar: "📅",
};

type Props = {
  sector: SectorConfig;
};

export function SectorLanding({ sector }: Props) {
  const { colors, marketing } = sector;

  return (
    <main className="min-h-screen bg-white text-slate-950">

      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <NexoLogo />
          <nav className="hidden items-center gap-1 md:flex">
            {[
              ["Fonctionnalités", "#features"],
              ["Documents", "#documents"],
              ["Secteurs", "/secteurs"],
            ].map(([label, href]) => (
              <a
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                href={href as never}
                key={label}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden bg-white text-slate-700 hover:bg-slate-100 sm:inline-flex" variant="ghost">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild className="group bg-indigo-950 text-white hover:bg-indigo-900">
              <Link href={`/signup?profile=${sector.id}`}>
                Essai gratuit
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden pt-16 text-white"
        style={{ backgroundColor: colors.accent }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-xs text-white/50">
              <Link className="hover:text-white/80" href="/">Nexo RH</Link>
              <ChevronRight className="size-3" />
              <Link className="hover:text-white/80" href={"/secteurs" as never}>Secteurs</Link>
              <ChevronRight className="size-3" />
              <span className="text-white/80">{sector.label}</span>
            </nav>

            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em]"
            >
              <span className="text-base">{sector.emoji}</span>
              {sector.label}
            </div>

            <h1 className="text-5xl font-black leading-[0.95] tracking-normal sm:text-6xl lg:text-7xl">
              {marketing.headline}
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-8 text-white/70">
              {marketing.subheadline}
            </p>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {["Sans carte bancaire", "14 jours d'essai", "Configuration en 10 min"].map((item) => (
                <span className="inline-flex items-center gap-2 text-sm text-white/60" key={item}>
                  <Check className="size-4 text-white/80" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Lead form */}
          <div className="rounded-2xl border border-white/20 bg-white p-8 shadow-2xl">
            <p className="mb-1 text-lg font-black text-slate-950">
              Commencer l'essai gratuit
            </p>
            <p className="mb-6 text-sm text-slate-500">
              {sector.tagline}
            </p>
            <SectorLeadForm
              ctaLabel={marketing.cta}
              sectorId={sector.id}
            />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="grid bg-slate-950 text-white md:grid-cols-3">
        {marketing.stats.map(({ value, label }, i) => (
          <div
            className="border-b border-white/10 px-6 py-8 text-center md:border-b-0 md:border-r"
            key={i}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <p className="text-4xl font-black" style={{ color: colors.primary }}>{value}</p>
            <p className="mt-2 text-sm font-medium text-white/45">{label}</p>
          </div>
        ))}
      </section>

      {/* ── Pain points ── */}
      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <div className="mb-12 text-center">
          <p
            className="inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
            style={{ backgroundColor: colors.secondary, color: colors.accent }}
          >
            Problèmes reconnus
          </p>
          <h2 className="mt-5 text-4xl font-black tracking-normal">
            Ce que votre secteur subit sans outil RH adapté.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {marketing.painPoints.map(({ icon, title, description }) => (
            <article className="rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md" key={title}>
              <div
                className="mb-4 grid size-12 place-items-center rounded-xl text-2xl"
                style={{ backgroundColor: colors.secondary }}
              >
                {PAIN_ICONS[icon] ?? "⚠️"}
              </div>
              <h3 className="font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Benefits / Features ── */}
      <section className="border-y border-slate-100 bg-slate-50 px-5 py-20 lg:px-8" id="features">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p
              className="inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ backgroundColor: colors.secondary, color: colors.accent }}
            >
              Ce que Nexo résout
            </p>
            <h2 className="mt-5 text-4xl font-black tracking-normal">
              Conçu pour {sector.labels.memberPlural}, opérationnel en 10 minutes.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {marketing.benefits.map(({ icon, title, description }) => (
              <article
                className="group rounded-xl border-2 bg-white p-6 transition hover:-translate-y-1"
                key={title}
                style={{ borderColor: colors.secondary }}
              >
                <div
                  className="mb-4 grid size-12 place-items-center rounded-xl text-2xl transition group-hover:scale-110"
                  style={{ backgroundColor: colors.secondary }}
                >
                  {BENEFIT_ICONS[icon] ?? "✅"}
                </div>
                <h3 className="font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Documents & Réglementations ── */}
      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8" id="documents">
        <div className="mb-12 text-center">
          <p
            className="inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
            style={{ backgroundColor: colors.secondary, color: colors.accent }}
          >
            Documents & conformité
          </p>
          <h2 className="mt-5 text-4xl font-black tracking-normal">
            Les documents de votre secteur, intégrés nativement.
          </h2>
          <p className="mt-3 text-slate-500">
            Nexo gère le cycle de vie complet de chaque document réglementaire.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sector.documents.map((doc) => (
            <div
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4"
              key={doc.id}
            >
              <div
                className="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: doc.isMandatory ? colors.secondary : "#f1f5f9",
                  color: doc.isMandatory ? colors.accent : "#64748b",
                }}
              >
                {doc.isMandatory ? "Obligatoire" : "Optionnel"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{doc.description}</p>
                {doc.regulation && (
                  <p className="mt-1 text-[10px] font-mono text-slate-400">{doc.regulation}</p>
                )}
                {doc.renewalMonths && (
                  <p className="mt-1 text-[10px] text-orange-600">
                    ↻ Renouvellement {doc.renewalMonths >= 12 ? `${doc.renewalMonths / 12} an${doc.renewalMonths / 12 > 1 ? "s" : ""}` : `${doc.renewalMonths} mois`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Rôles ── */}
      <section className="border-y border-slate-100 bg-slate-50 px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p
              className="inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ backgroundColor: colors.secondary, color: colors.accent }}
            >
              Profils & rôles
            </p>
            <h2 className="mt-5 text-4xl font-black tracking-normal">
              Un accès adapté à chaque profil de votre organisation.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {sector.roles.map((role) => (
              <div
                className="flex items-start gap-4 rounded-xl border-2 bg-white p-5"
                key={role.key}
                style={{ borderColor: role.isAdmin ? colors.primary : colors.secondary }}
              >
                <div
                  className="shrink-0 rounded-lg p-2.5 text-sm font-black"
                  style={{
                    backgroundColor: role.isAdmin ? colors.primary : colors.secondary,
                    color: role.isAdmin ? "white" : colors.accent,
                  }}
                >
                  {role.isAdmin ? "Admin" : "User"}
                </div>
                <div>
                  <p className="font-black text-slate-950">{role.label}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <section className="mx-auto max-w-5xl px-5 py-20 lg:px-8" id="tarifs">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black tracking-normal">
            Choisissez votre plan.
          </h2>
          <p className="mt-3 text-slate-500">14 jours d'essai gratuit sur tous les plans.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-4">
          {[
            { name: "Starter",    price: "19€",  desc: "Solo RH / TPE",          features: ["15 collaborateurs", "1 utilisateur", "Onboarding + documents", "Kit 26 modèles"] },
            { name: "Équipe",     price: "49€",  desc: "PME en croissance",       features: ["50 collaborateurs", "3 utilisateurs", "Fiches 6 onglets", "Pipeline recrutement", "Export CSV"], featured: true },
            { name: "Business",   price: "99€",  desc: "ETI, équipe RH complète", features: ["200 collaborateurs", "10 utilisateurs", "Notes vocales IA", "Analytics", "Cron automatique"] },
            { name: "Entreprise", price: "249€", desc: "Grand compte",            features: ["Illimité", "Utilisateurs illimités", "Support dédié", "SLA 99,9%"] },
          ].map((plan) => (
            <article
              className={`rounded-xl p-6 ${plan.featured ? "text-white shadow-xl" : "border border-slate-200 bg-white"}`}
              key={plan.name}
              style={plan.featured ? { backgroundColor: colors.accent } : {}}
            >
              <p className={`text-xs font-black uppercase tracking-wide ${plan.featured ? "text-white/50" : "text-slate-400"}`}>
                {plan.name}
              </p>
              <p className={`mt-3 text-4xl font-black ${plan.featured ? "text-white" : "text-slate-950"}`}>
                {plan.price}
              </p>
              <p className={`mt-0.5 text-xs ${plan.featured ? "text-white/40" : "text-slate-400"}`}>/mois HT</p>
              <p className={`mt-3 text-sm ${plan.featured ? "text-white/60" : "text-slate-500"}`}>{plan.desc}</p>
              <div className={`my-5 h-px ${plan.featured ? "bg-white/15" : "bg-slate-200"}`} />
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li className={`flex gap-2 text-xs ${plan.featured ? "text-white/75" : "text-slate-600"}`} key={f}>
                    <Check className="size-3.5 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-6 w-full transition hover:-translate-y-0.5"
                variant={plan.featured ? "default" : "outline"}
                style={plan.featured ? { backgroundColor: "white", color: colors.accent } : {}}
              >
                <Link href={`/signup?profile=${sector.id}&plan=${plan.name.toLowerCase()}`}>
                  Commencer
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section
        className="px-5 py-20 text-center text-white lg:px-8"
        style={{ backgroundColor: colors.accent }}
      >
        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">
          Prêt à structurer votre RH {sector.label.toLowerCase()} ?
        </p>
        <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-black">
          {marketing.headline}
        </h2>
        <p className="mt-4 text-white/60">{marketing.description}</p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild className="group h-12 bg-white px-8 hover:-translate-y-0.5" style={{ color: colors.accent }}>
            <Link href={`/signup?profile=${sector.id}`}>
              {marketing.cta}
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild className="h-12 border-white/30 bg-transparent px-8 text-white hover:-translate-y-0.5 hover:bg-white/10" variant="outline">
            <Link href={"/secteurs" as never}>Voir tous les secteurs</Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 px-5 py-12 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <NexoLogo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/40">
              Le cockpit RH pour les PME qui veulent structurer l'arrivée collaborateur.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-white/30">
            <Link className="hover:text-white/60" href="/">Accueil</Link>
            <Link className="hover:text-white/60" href={"/secteurs" as never}>Secteurs</Link>
            <Link className="hover:text-white/60" href="/signup">Essai gratuit</Link>
          </div>
          <p className="text-sm text-white/30">© 2026 Nexo. Made in France.</p>
        </div>
      </footer>
    </main>
  );
}
