import type { Metadata } from "next";

export const dynamic = "force-dynamic";

import { getPipelineData } from "@/services/pipeline-service";
import { PipelineKanban } from "@/components/dashboard/pipeline-kanban";
import { UpgradeGate } from "@/components/dashboard/upgrade-gate";
import { checkAccess } from "@/lib/access";

export const metadata: Metadata = {
  title: "Pipeline candidats | GeniO",
};

export default async function PipelinePage() {
  const allowed = await checkAccess("pipeline");
  if (!allowed) return <UpgradeGate feature="pipeline" requiredPlan="team" />;
  const { columns, briefs } = await getPipelineData().catch(() => ({
    columns: [],
    briefs: [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue">
          Recrutement
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal md:text-3xl">
          Pipeline candidats
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Suivez chaque candidat de la candidature jusqu'à l'intégration.
        </p>
      </div>

      <PipelineKanban initialColumns={columns} briefs={briefs} />
    </div>
  );
}
