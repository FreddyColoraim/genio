import type { Metadata } from "next";
import { getBriefs } from "@/services/brief-service";
import { HrBriefWorkspace } from "@/components/dashboard/hr-brief-workspace";
import { UpgradeGate } from "@/components/dashboard/upgrade-gate";
import { checkAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Briefs RH | GeniO",
};

export default async function BriefsPage() {
  const allowed = await checkAccess("briefs");
  if (!allowed) return <UpgradeGate feature="briefs" requiredPlan="team" />;

  const briefs = await getBriefs().catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue">
            Recrutement vers intégration
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal md:text-3xl">
            Briefs RH
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cadrez un besoin RH, générez l'offre, ouvrez le pipeline candidat puis déclenchez l'intégration.
          </p>
        </div>
      </div>

      <HrBriefWorkspace initialBriefs={briefs} />
    </div>
  );
}
