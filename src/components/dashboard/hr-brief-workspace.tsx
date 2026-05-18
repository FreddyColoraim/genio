"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, FileText, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const statuses = ["Nouveau", "Contacté", "Entretien", "Retenu", "Refusé"] as const;

const roleScopes = ["RH", "Admin", "Manager"] as const;

const candidateSources = ["LinkedIn", "Site carrière", "Annonce", "Cooptation"] as const;

export function HrBriefWorkspace() {
  const [roleScope, setRoleScope] = useState<(typeof roleScopes)[number]>("RH");
  const [brief, setBrief] = useState({
    title: "Responsable de salle",
    need: "Remplacer un départ et stabiliser l'équipe du soir.",
    missions: "Accueil client, coordination service, suivi planning, remontées manager.",
    profile: "Expérience restauration, leadership terrain, disponibilité week-end.",
    urgency: "Urgent",
    location: "Bordeaux",
    contract: "CDI",
    notes: "Brief issu de la réunion manager. Priorité à une personne autonome rapidement."
  });

  const generatedOffer = useMemo(() => {
    return {
      title: brief.title || "Intitulé du poste",
      intro: brief.need || "Besoin RH à préciser.",
      missions: brief.missions || "Missions principales à compléter.",
      profile: brief.profile || "Profil recherché à compléter."
    };
  }, [brief]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Brief RH</CardTitle>
                <CardDescription>
                  Cadrez le besoin avant de générer l'offre et le pipeline candidat.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {roleScopes.map((scope) => (
                  <button
                    key={scope}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition",
                      roleScope === scope
                        ? "border-blue bg-blue text-white"
                        : "border-border bg-white text-muted-foreground hover:text-navy"
                    )}
                    type="button"
                    onClick={() => setRoleScope(scope)}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Intitulé du poste">
                <Input
                  value={brief.title}
                  onChange={(event) => setBrief({ ...brief, title: event.target.value })}
                />
              </Field>
              <Field label="Localisation">
                <Input
                  value={brief.location}
                  onChange={(event) => setBrief({ ...brief, location: event.target.value })}
                />
              </Field>
              <Field label="Urgence">
                <select
                  className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={brief.urgency}
                  onChange={(event) => setBrief({ ...brief, urgency: event.target.value })}
                >
                  <option>Normal</option>
                  <option>Prioritaire</option>
                  <option>Urgent</option>
                </select>
              </Field>
              <Field label="Contrat">
                <select
                  className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={brief.contract}
                  onChange={(event) => setBrief({ ...brief, contract: event.target.value })}
                >
                  <option>CDI</option>
                  <option>CDD</option>
                  <option>Extra</option>
                  <option>Alternance</option>
                  <option>Freelance</option>
                </select>
              </Field>
            </div>

            <Field label="Besoin">
              <Textarea
                value={brief.need}
                onChange={(event) => setBrief({ ...brief, need: event.target.value })}
              />
            </Field>
            <Field label="Missions">
              <Textarea
                value={brief.missions}
                onChange={(event) => setBrief({ ...brief, missions: event.target.value })}
              />
            </Field>
            <Field label="Profil recherché">
              <Textarea
                value={brief.profile}
                onChange={(event) => setBrief({ ...brief, profile: event.target.value })}
              />
            </Field>
            <Field label="Notes de réunion">
              <Textarea
                value={brief.notes}
                onChange={(event) => setBrief({ ...brief, notes: event.target.value })}
              />
            </Field>

            <div className="flex flex-col gap-3 rounded-lg border bg-warm p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-navy">Rôle actif : {roleScope}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ce brief prépare l'offre, le pipeline candidat et l'intégration.
                </p>
              </div>
              <Button type="button">
                Préparer le pipeline
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Offre générée</CardTitle>
            <CardDescription>Prévisualisation structurée depuis le brief.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-warm p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-navy">{generatedOffer.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="soft">{brief.contract}</Badge>
                    <Badge variant="success">{brief.urgency}</Badge>
                    <Badge variant="blue">{brief.location}</Badge>
                  </div>
                </div>
                <BriefcaseBusiness className="size-5 text-blue" />
              </div>
              <PreviewBlock title="Contexte" value={generatedOffer.intro} />
              <PreviewBlock title="Missions" value={generatedOffer.missions} />
              <PreviewBlock title="Profil" value={generatedOffer.profile} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline candidat</CardTitle>
            <CardDescription>Structure V1 prête à valider.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statuses.map((status, index) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-lavender text-xs font-semibold text-navy">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-navy">{status}</span>
                </div>
                {status === "Retenu" ? (
                  <span className="text-xs font-medium text-blue">crée l'intégration</span>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sources candidat</CardTitle>
            <CardDescription>Mesure simple pour la V1.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {candidateSources.map((source) => (
              <div key={source} className="rounded-lg border bg-warm p-4">
                <div className="flex items-center gap-2">
                  {source === "Site carrière" ? (
                    <MapPin className="size-4 text-blue" />
                  ) : (
                    <FileText className="size-4 text-blue" />
                  )}
                  <p className="text-sm font-semibold text-navy">{source}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-navy p-5 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-sage" />
            <p className="font-semibold">Validation V1</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Le flux reste volontairement simple : brief, offre, candidats, intégration.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-24 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      {...props}
    />
  );
}

function PreviewBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}
