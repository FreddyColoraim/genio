import Link from "next/link";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanFeature } from "@/lib/plans";

const FEATURE_LABELS: Partial<Record<PlanFeature, string>> = {
  analytics:    "Analytiques RH",
  voice_notes:  "Notes vocales IA",
  ai_actions:   "Extraction actions IA",
  pipeline:     "Pipeline recrutement",
  briefs:       "Briefs RH",
  export_csv:   "Export CSV",
  workspace_members: "Invitations & rôles",
  cron_reminders:    "Rappels automatiques",
};

const PLAN_LABELS: Record<string, { name: string; color: string }> = {
  team:       { name: "Équipe",    color: "text-indigo-600" },
  business:   { name: "Business",  color: "text-blue" },
  enterprise: { name: "Entreprise",color: "text-navy" },
};

type Props = {
  feature:      PlanFeature;
  requiredPlan: "team" | "business" | "enterprise";
};

export function UpgradeGate({ feature, requiredPlan }: Props) {
  const featureLabel = FEATURE_LABELS[feature] ?? feature;
  const plan         = PLAN_LABELS[requiredPlan] ?? PLAN_LABELS.business!;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-white p-8 text-center shadow-soft">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-indigo-50">
          <Lock className="size-6 text-indigo-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-navy">
            {featureLabel} — plan supérieur requis
          </h2>
          <p className="text-sm text-muted-foreground">
            Cette fonctionnalité est disponible à partir du plan{" "}
            <span className={`font-semibold ${plan.color}`}>{plan.name}</span>.
            Passez au niveau supérieur pour en bénéficier.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={"/settings/billing" as never}>
              <Zap className="mr-2 size-4" />
              Voir les plans
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={"/dashboard" as never}>Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
