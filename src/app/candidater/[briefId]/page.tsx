export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { CandidatureForm } from "./candidature-form";

// Page publique — accessible sans authentification

type Props = { params: Promise<{ briefId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { briefId } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("briefs")
    .select("title")
    .eq("id", briefId)
    .eq("status", "open")
    .maybeSingle();

  return {
    title: data?.title ? `Postuler — ${data.title}` : "Postuler",
    description: "Déposez votre candidature en quelques secondes.",
  };
}

export default async function CandidaterPage({ params }: Props) {
  const { briefId } = await params;
  const admin = createAdminClient();

  const { data: brief } = await admin
    .from("briefs")
    .select("id, title, description, missions, profile, contract_type, location, urgency, status")
    .eq("id", briefId)
    .eq("status", "open")
    .maybeSingle();

  if (!brief) notFound();

  const urgencyLabel: Record<string, string> = {
    low: "Faible", normal: "Normal", high: "Prioritaire", urgent: "Urgent",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header mobile */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-5 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600">
            <BriefcaseBusiness className="size-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Nexo RH
            </p>
            <p className="text-[11px] text-slate-400">Recrutement & RH</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-8 px-5 py-8">

        {/* Brief card */}
        <section className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
              <BriefcaseBusiness className="size-6 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold leading-snug text-slate-900">
                {brief.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="soft">{brief.contract_type ?? "CDI"}</Badge>
                {brief.urgency && brief.urgency !== "normal" && (
                  <Badge variant={brief.urgency === "urgent" ? "default" : "soft"}>
                    {urgencyLabel[brief.urgency] ?? brief.urgency}
                  </Badge>
                )}
                {brief.location && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="size-3" />
                    {brief.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {brief.description && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Le poste
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {brief.description}
              </p>
            </div>
          )}

          {brief.missions && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Missions
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {brief.missions}
              </p>
            </div>
          )}

          {brief.profile && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Profil recherché
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {brief.profile}
              </p>
            </div>
          )}
        </section>

        {/* Séparateur */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Votre candidature
            </span>
          </div>
        </div>

        {/* Formulaire */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-900">
              Postuler en quelques secondes
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Remplissez le formulaire — l'équipe RH vous contactera rapidement.
            </p>
          </div>
          <CandidatureForm briefId={brief.id} briefTitle={brief.title} />
        </section>

        {/* Footer */}
        <p className="pb-4 text-center text-xs text-slate-400">
          Propulsé par Nexo RH · Gestion RH & Recrutement
        </p>
      </main>
    </div>
  );
}
