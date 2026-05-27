import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { NexoLogo } from "@/components/nexo-logo";
import { Button } from "@/components/ui/button";
import { SECTORS } from "@/config/sectors";

export const metadata: Metadata = {
  title: "Nexo RH par secteur — Services à la personne, BTP, Santé, Commerce, Associations, HCR, Transport, Tech",
  description: "Découvrez Nexo RH adapté à votre secteur métier. Documents réglementaires, rôles, jargon et procédures spécifiques à chaque industrie.",
};

export default function SecteursPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <NexoLogo />
          <div className="flex items-center gap-2">
            <Button asChild className="hidden bg-white text-slate-700 hover:bg-slate-100 sm:inline-flex" variant="ghost">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild className="group bg-indigo-950 text-white hover:bg-indigo-900">
              <Link href="/signup">
                Essai gratuit
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="pt-16">
        {/* ── Hero ── */}
        <section className="bg-indigo-950 px-5 py-24 text-center text-white lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center justify-center gap-2 text-xs text-white/40">
            <Link className="hover:text-white/70" href="/">Nexo RH</Link>
            <ChevronRight className="size-3" />
            <span className="text-white/70">Secteurs</span>
          </nav>
          <p className="inline-flex rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
            8 secteurs · Docs natifs · Conformité intégrée
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-normal sm:text-6xl">
            Nexo RH adapté à
            <span className="block text-orange-500">votre secteur.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/55">
            Chaque secteur a ses réglementations, son jargon, ses documents obligatoires.
            Nexo s'adapte — pas vous.
          </p>
        </section>

        {/* ── Grille secteurs ── */}
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SECTORS.map((sector) => (
              <Link
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                href={`/secteurs/${sector.slug}` as never}
                key={sector.id}
                style={{ "--sector-color": sector.colors.primary } as React.CSSProperties}
              >
                {/* Accent bar */}
                <div
                  className="absolute inset-x-0 top-0 h-1 transition-all duration-300 group-hover:h-1.5"
                  style={{ backgroundColor: sector.colors.primary }}
                />

                <div className="mb-5 text-4xl">{sector.emoji}</div>

                <h2 className="text-lg font-black text-slate-950">{sector.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{sector.tagline}</p>

                {/* Roles preview */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sector.roles.slice(0, 3).map((role) => (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      key={role.key}
                      style={{ backgroundColor: sector.colors.secondary, color: sector.colors.accent }}
                    >
                      {role.label}
                    </span>
                  ))}
                </div>

                {/* Docs count */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    {sector.documents.length} documents · {sector.regulations.length} réglementations
                  </span>
                  <ArrowRight
                    className="size-4 text-slate-400 transition group-hover:translate-x-1"
                    style={{ color: sector.colors.primary }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-slate-100 bg-slate-50 px-5 py-20 text-center lg:px-8">
          <h2 className="text-4xl font-black tracking-normal text-slate-950">
            Votre secteur, votre plateforme RH.
          </h2>
          <p className="mt-4 text-slate-500">14 jours d'essai gratuit. Sans carte bancaire.</p>
          <Button asChild className="group mt-8 h-12 bg-indigo-950 px-8 text-white hover:-translate-y-0.5 hover:bg-indigo-900">
            <Link href="/signup">
              Choisir mon secteur
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
          </Button>
        </section>

        <footer className="bg-slate-950 px-5 py-12 text-white lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <NexoLogo />
            <p className="text-sm text-white/30">© 2026 Nexo. Made in France.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
