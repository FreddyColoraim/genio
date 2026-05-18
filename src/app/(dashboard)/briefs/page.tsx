import { HrBriefWorkspace } from "@/components/dashboard/hr-brief-workspace";

export default function BriefsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue">
            Recrutement vers intégration
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal md:text-3xl">
            Interface Brief RH
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Validez le flux V1 : un besoin RH devient une offre, un pipeline candidat, puis une
            intégration structurée.
          </p>
        </div>
      </div>

      <HrBriefWorkspace />
    </div>
  );
}
