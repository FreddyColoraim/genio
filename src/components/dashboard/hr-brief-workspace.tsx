"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowRight, BriefcaseBusiness, CheckCircle2, Clock,
  FilePlus2, FileText, MapPin, Pencil, Plus, QrCode,
} from "lucide-react";
import { BriefQrModal } from "@/components/dashboard/brief-qr-modal";
import {
  createBriefAction,
  updateBriefAction,
  updateBriefStatusAction,
} from "@/app/(dashboard)/briefs/actions";
import type { BriefItem, BriefStatus, BriefUrgency } from "@/services/brief-config";
import { urgencyLabels, statusLabels } from "@/services/brief-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types locaux
// ---------------------------------------------------------------------------

type FormState = {
  title: string;
  description: string;
  missions: string;
  profile: string;
  competences: string;
  notes: string;
  contractType: string;
  location: string;
  urgency: BriefUrgency;
};

const emptyForm: FormState = {
  title: "", description: "", missions: "", profile: "",
  competences: "", notes: "", contractType: "CDI", location: "", urgency: "normal",
};

function briefToForm(b: BriefItem): FormState {
  return {
    title:        b.title,
    description:  b.description,
    missions:     b.missions,
    profile:      b.profile,
    competences:  b.competences,
    notes:        b.notes,
    contractType: b.contractType,
    location:     b.location,
    urgency:      b.urgency,
  };
}

const urgencyVariant: Record<BriefUrgency, "soft" | "success" | "default"> = {
  low:    "soft",
  normal: "soft",
  high:   "success",
  urgent: "default",
};

const statusVariant: Record<BriefStatus, "soft" | "success" | "default"> = {
  draft:    "soft",
  open:     "success",
  closed:   "default",
  archived: "default",
};

const pipelineStages = [
  { key: "new",       label: "Nouveau" },
  { key: "contacted", label: "Contacté" },
  { key: "interview", label: "Entretien" },
  { key: "retained",  label: "Retenu",    cta: "crée l'intégration" },
  { key: "refused",   label: "Refusé" },
] as const;

// ---------------------------------------------------------------------------
// Workspace principal
// ---------------------------------------------------------------------------

export function HrBriefWorkspace({ initialBriefs }: { initialBriefs: BriefItem[] }) {
  const [briefs, setBriefs]         = useState<BriefItem[]>(initialBriefs);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialBriefs[0]?.id ?? null
  );
  const [isNew, setIsNew]           = useState(initialBriefs.length === 0);
  const [form, setForm]             = useState<FormState>(
    initialBriefs[0] ? briefToForm(initialBriefs[0]) : emptyForm
  );
  const [error, setError]           = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [qrBrief, setQrBrief]       = useState<{ id: string; title: string } | null>(null);

  const selectedBrief = briefs.find((b) => b.id === selectedId) ?? null;

  const generatedOffer = useMemo(() => ({
    title:    form.title     || "Intitulé du poste",
    context:  form.description || "Besoin RH à préciser.",
    missions: form.missions  || "Missions à compléter.",
    profile:  form.profile   || "Profil recherché à compléter.",
  }), [form]);

  function selectBrief(brief: BriefItem) {
    setSelectedId(brief.id);
    setIsNew(false);
    setForm(briefToForm(brief));
    setError(null);
  }

  function startNew() {
    setSelectedId(null);
    setIsNew(true);
    setForm(emptyForm);
    setError(null);
  }

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    (Object.entries(form) as [keyof FormState, string][]).forEach(([k, v]) => fd.set(k, v));

    startTransition(async () => {
      setError(null);
      const result = isNew
        ? await createBriefAction(fd)
        : await updateBriefAction(selectedId!, fd);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (isNew) {
        setBriefs((prev) => [result.brief, ...prev]);
        setSelectedId(result.brief.id);
        setIsNew(false);
      } else {
        setBriefs((prev) => prev.map((b) => b.id === result.brief.id ? result.brief : b));
      }
      setForm(briefToForm(result.brief));
    });
  }

  function handleStatusChange(id: string, status: BriefStatus) {
    startTransition(async () => {
      const result = await updateBriefStatusAction(id, status);
      if (!result.success) { setError(result.error); return; }
      setBriefs((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    });
  }

  return (
    <>
    {qrBrief && (
      <BriefQrModal
        briefId={qrBrief.id}
        briefTitle={qrBrief.title}
        onClose={() => setQrBrief(null)}
      />
    )}
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr_0.9fr]">

      {/* ── Colonne 1 : liste des briefs ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Briefs ({briefs.length})
          </h3>
          <Button onClick={startNew} size="sm" type="button" variant="outline">
            <Plus className="size-3.5" />
            Nouveau
          </Button>
        </div>

        {briefs.length === 0 && !isNew && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <FilePlus2 className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Aucun brief pour l'instant.</p>
              <Button onClick={startNew} size="sm" type="button" variant="outline">
                Créer le premier brief
              </Button>
            </CardContent>
          </Card>
        )}

        {isNew && (
          <div className="rounded-xl border-2 border-blue/40 bg-blue/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Pencil className="size-3.5 text-blue" />
              <p className="text-sm font-medium text-blue">Nouveau brief</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {form.title || "Intitulé à compléter…"}
            </p>
          </div>
        )}

        {briefs.map((brief) => (
          <div
            key={brief.id}
            className={cn(
              "rounded-xl border bg-white transition",
              selectedId === brief.id && !isNew && "border-blue/40 bg-blue/5"
            )}
          >
            <button
              onClick={() => selectBrief(brief)}
              type="button"
              className="w-full px-4 pb-2 pt-3 text-left hover:bg-blue/5 rounded-t-xl transition"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug text-navy line-clamp-2">
                  {brief.title}
                </p>
                <Badge variant={statusVariant[brief.status]} className="shrink-0 text-[10px]">
                  {statusLabels[brief.status]}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={urgencyVariant[brief.urgency]} className="text-[10px]">
                  {urgencyLabels[brief.urgency]}
                </Badge>
                <span className="text-xs text-muted-foreground">{brief.contractType}</span>
                {brief.location && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />{brief.location}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(brief.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </button>

            {/* Bouton QR Code Salon — visible uniquement si brief ouvert */}
            {brief.status === "open" && (
              <div className="border-t border-slate-100 px-4 py-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQrBrief({ id: brief.id, title: brief.title });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                >
                  <QrCode className="size-3.5 shrink-0" />
                  QR Code Salon
                </button>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* ── Colonne 2 : formulaire ── */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>{isNew ? "Nouveau brief" : "Modifier le brief"}</CardTitle>
            <CardDescription>
              Cadrez le besoin avant de générer l'offre et le pipeline candidat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Intitulé du poste">
                  <Input
                    id="title"
                    name="title"
                    required
                    value={form.title}
                    onChange={set("title")}
                  />
                </Field>
                <Field label="Localisation">
                  <Input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={set("location")}
                  />
                </Field>
                <Field label="Urgence">
                  <NativeSelect value={form.urgency} onChange={set("urgency")} name="urgency">
                    <option value="low">Faible</option>
                    <option value="normal">Normal</option>
                    <option value="high">Prioritaire</option>
                    <option value="urgent">Urgent</option>
                  </NativeSelect>
                </Field>
                <Field label="Contrat">
                  <NativeSelect value={form.contractType} onChange={set("contractType")} name="contractType">
                    <option>CDI</option>
                    <option>CDD</option>
                    <option>Extra</option>
                    <option>Alternance</option>
                    <option>Freelance</option>
                  </NativeSelect>
                </Field>
              </div>

              <Field label="Besoin">
                <Textarea name="description" value={form.description} onChange={set("description")} />
              </Field>
              <Field label="Missions">
                <Textarea name="missions" value={form.missions} onChange={set("missions")} />
              </Field>
              <Field label="Profil recherché">
                <Textarea name="profile" value={form.profile} onChange={set("profile")} />
              </Field>
              <Field label="Compétences clés">
                <Textarea name="competences" value={form.competences} onChange={set("competences")} />
              </Field>
              <Field label="Notes">
                <Textarea name="notes" value={form.notes} onChange={set("notes")} />
              </Field>

              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 rounded-lg border bg-warm p-4">
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {isNew ? "Prêt à créer" : "Enregistrer les modifications"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Le brief prépare l'offre, le pipeline et l'intégration.
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isNew && selectedBrief?.status === "draft" && (
                    <Button
                      disabled={isPending}
                      onClick={() => handleStatusChange(selectedId!, "open")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Ouvrir
                    </Button>
                  )}
                  {!isNew && selectedBrief?.status === "open" && (
                    <Button
                      disabled={isPending}
                      onClick={() => handleStatusChange(selectedId!, "closed")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Clôturer
                    </Button>
                  )}
                  <Button disabled={isPending} type="submit">
                    {isPending ? "Enregistrement…" : isNew ? "Créer le brief" : "Sauvegarder"}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* ── Colonne 3 : prévisualisation + pipeline ── */}
      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Offre générée</CardTitle>
            <CardDescription>Prévisualisation depuis le brief.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-warm p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-navy">{generatedOffer.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="soft">{form.contractType}</Badge>
                    <Badge variant={urgencyVariant[form.urgency]}>
                      {urgencyLabels[form.urgency]}
                    </Badge>
                    {form.location && <Badge variant="blue">{form.location}</Badge>}
                  </div>
                </div>
                <BriefcaseBusiness className="size-5 text-blue" />
              </div>
              <PreviewBlock title="Contexte"  value={generatedOffer.context} />
              <PreviewBlock title="Missions"  value={generatedOffer.missions} />
              <PreviewBlock title="Profil"    value={generatedOffer.profile} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline candidat</CardTitle>
            <CardDescription>Étapes de qualification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pipelineStages.map((stage, index) => (
              <div
                key={stage.key}
                className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-lavender text-xs font-semibold text-navy">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-navy">{stage.label}</span>
                </div>
                {"cta" in stage && (
                  <span className="text-xs font-medium text-blue">{stage.cta}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {!isNew && selectedBrief && (
          <div className="rounded-lg border bg-navy p-5 text-white">
            <div className="flex items-center gap-3">
              {selectedBrief.status === "open"
                ? <CheckCircle2 className="size-5 text-sage" />
                : <Clock className="size-5 text-white/60" />
              }
              <p className="font-semibold">
                {statusLabels[selectedBrief.status]}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {selectedBrief.status === "open"
                ? "Brief ouvert — candidatures en cours."
                : selectedBrief.status === "draft"
                ? "Brouillon — publiez-le pour ouvrir le pipeline."
                : "Brief clôturé."}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <FileText className="size-4 text-white/60" />
              <p className="text-xs text-white/60">
                Créé le {new Date(selectedBrief.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            </div>
          </div>
        )}
      </aside>
    </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = label.toLowerCase().replace(/[\s']/g, "-");
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
      className="min-h-20 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      {...props}
    />
  );
}

function NativeSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      {...props}
    >
      {children}
    </select>
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
