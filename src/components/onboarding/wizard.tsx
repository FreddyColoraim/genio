"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, CheckCircle2, Loader2, PartyPopper,
  SkipForward, Sparkles, Users,
} from "lucide-react";
import {
  saveTeamProfileAction,
  addFirstEmployeeAction,
  completeWizardAction,
} from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3 | 4;

type Props = {
  workspaceName: string;
  vertical: string;
  role: string;
};

const VERTICAL_LABELS: Record<string, string> = {
  rh:    "RH & Entreprise",
  care:  "Santé & Médico-social",
  craft: "Artisan & BTP",
  field: "Services terrain",
  vet:   "Vétérinaire",
};

const TEAM_SIZES = [
  "1–5 personnes",
  "6–20 personnes",
  "21–50 personnes",
  "51–200 personnes",
  "200+ personnes",
];

const OPERATING_MODES = [
  { value: "présentiel",  label: "Présentiel" },
  { value: "distanciel",  label: "Distanciel" },
  { value: "hybride",     label: "Hybride" },
  { value: "terrain",     label: "Terrain / itinérant" },
];

// ---------------------------------------------------------------------------
// Barre de progression
// ---------------------------------------------------------------------------

function ProgressBar({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Bienvenue" },
    { n: 2, label: "Équipe" },
    { n: 3, label: "Collaborateur" },
    { n: 4, label: "Prêt !" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  s.n < step  && "bg-sage text-navy",
                  s.n === step && "bg-blue text-white shadow-sm ring-4 ring-blue/20",
                  s.n > step  && "bg-white border border-border text-muted-foreground"
                )}
              >
                {s.n < step ? <CheckCircle2 className="size-4" /> : s.n}
              </div>
              <span className={cn(
                "hidden text-xs font-medium sm:block",
                s.n === step ? "text-navy" : "text-muted-foreground"
              )}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "mx-2 mb-5 h-0.5 flex-1 transition-colors",
                s.n < step ? "bg-sage" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wizard principal
// ---------------------------------------------------------------------------

export function OnboardingWizard({ workspaceName, vertical }: Props) {
  const router = useRouter();
  const [step, setStep]           = useState<Step>(1);
  const [teamSize, setTeamSize]   = useState("");
  const [opMode, setOpMode]       = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function nextStep() {
    setError(null);
    setStep((s) => Math.min(s + 1, 4) as Step);
  }

  // ── Étape 1 : Bienvenue ──────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="flex flex-1 flex-col">
        <ProgressBar step={1} />
        <div className="flex flex-1 flex-col items-center justify-center text-center space-y-6 py-10">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-blue/10">
            <PartyPopper className="size-10 text-blue" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-navy">
              Bienvenue sur {workspaceName} !
            </h1>
            <p className="text-lg text-muted-foreground">
              Votre espace GeniO est prêt. Configurons-le en 2 minutes.
            </p>
          </div>
          <div className="rounded-xl border bg-white px-6 py-4 text-left w-full max-w-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-blue shrink-0" />
              <div>
                <p className="text-sm font-semibold text-navy">Vertical détecté</p>
                <p className="text-sm text-muted-foreground">
                  {VERTICAL_LABELS[vertical] ?? vertical}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-sm pt-4">
            <Button className="w-full" onClick={nextStep} size="default" type="button">
              Commencer la configuration
              <ArrowRight className="size-5" />
            </Button>
            <button
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-navy transition-colors"
              onClick={() => startTransition(() => completeWizardAction())}
              type="button"
            >
              <SkipForward className="size-4" />
              Passer et aller au dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Étape 2 : Profil équipe ──────────────────────────────────────────────

  if (step === 2) {
    function handleTeamSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      startTransition(async () => {
        const result = await saveTeamProfileAction(fd);
        if (!result.success) { setError(result.error); return; }
        nextStep();
      });
    }

    return (
      <div className="flex flex-1 flex-col">
        <ProgressBar step={2} />
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue/10">
              <Users className="size-5 text-blue" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-navy">Votre équipe</h2>
              <p className="text-sm text-muted-foreground">Ces informations personnalisent vos scénarios.</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleTeamSubmit}>
            <div className="space-y-3">
              <Label>Taille de l'équipe</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TEAM_SIZES.map((size) => (
                  <button
                    key={size}
                    name="teamSize"
                    onClick={() => setTeamSize(size)}
                    type="button"
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-medium transition text-left",
                      teamSize === size
                        ? "border-blue bg-blue text-white"
                        : "border-border bg-white text-muted-foreground hover:border-blue/40 hover:text-navy"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <input name="teamSize" type="hidden" value={teamSize} />
            </div>

            <div className="space-y-3">
              <Label>Mode de fonctionnement</Label>
              <div className="grid grid-cols-2 gap-2">
                {OPERATING_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setOpMode(mode.value)}
                    type="button"
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-medium transition text-left",
                      opMode === mode.value
                        ? "border-blue bg-blue text-white"
                        : "border-border bg-white text-muted-foreground hover:border-blue/40 hover:text-navy"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <input name="operatingMode" type="hidden" value={opMode} />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-navy transition-colors"
                onClick={nextStep}
                type="button"
              >
                <SkipForward className="size-4" />
                Passer
              </button>
              <Button disabled={isPending} type="submit">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Continuer
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Étape 3 : Premier collaborateur ─────────────────────────────────────

  if (step === 3) {
    function handleEmployeeSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      startTransition(async () => {
        setError(null);
        const result = await addFirstEmployeeAction(fd);
        if (!result.success) { setError(result.error); return; }
        nextStep();
      });
    }

    return (
      <div className="flex flex-1 flex-col">
        <ProgressBar step={3} />
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-navy">Premier collaborateur</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajoutez un premier profil pour tester le parcours d'onboarding.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleEmployeeSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" name="firstName" placeholder="Maya" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" name="lastName" placeholder="Chen" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" placeholder="maya@company.com" required type="email" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Poste</Label>
                <Input id="title" name="title" placeholder="Designer produit" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Date d'arrivée</Label>
                <Input id="startDate" name="startDate" required type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Département</Label>
              <Input id="department" name="department" placeholder="Produit" />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-navy transition-colors"
                onClick={nextStep}
                type="button"
              >
                <SkipForward className="size-4" />
                Passer cette étape
              </button>
              <Button disabled={isPending} type="submit">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Ajouter et continuer
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Étape 4 : Prêt ! ────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col">
      <ProgressBar step={4} />
      <div className="flex flex-1 flex-col items-center justify-center space-y-8 py-10 text-center">
        <div className="flex size-24 items-center justify-center rounded-2xl bg-sage/20">
          <CheckCircle2 className="size-12 text-sage" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-navy">Tout est prêt !</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            {workspaceName} est configuré et opérationnel. Bienvenue sur GeniO.
          </p>
        </div>

        <div className="grid gap-3 w-full max-w-sm text-left">
          {[
            "Parcours d'onboarding activé",
            "Pipeline candidats disponible",
            "Briefs RH et notes vocales prêts",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
              <CheckCircle2 className="size-4 shrink-0 text-sage" />
              <p className="text-sm font-medium text-navy">{item}</p>
            </div>
          ))}
        </div>

        <Button
          className="w-full max-w-sm"
          disabled={isPending}
          onClick={() => startTransition(() => completeWizardAction())}
          size="default"
          type="button"
        >
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
          Accéder à mon dashboard
        </Button>
      </div>
    </div>
  );
}
