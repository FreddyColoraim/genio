import { EmployeeOnboardingCards } from "@/components/dashboard/employee-onboarding-cards";
import { EmployeeList } from "@/components/dashboard/employee-list";
import { UploadDocumentModal } from "@/components/dashboard/upload-document-modal";
import { MetricCard } from "@/components/dashboard/metric-card";
import { mockEmployees, onboardingMetrics } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Tableau de bord onboarding
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Suivez les parcours collaborateurs, les documents en attente et les
            moments qui demandent une attention RH.
          </p>
        </div>
        <UploadDocumentModal />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {onboardingMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
      <EmployeeOnboardingCards employees={mockEmployees} />
      <EmployeeList employees={mockEmployees} />
    </div>
  );
}
