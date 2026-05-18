import { AddEmployeeModal } from "@/components/dashboard/add-employee-modal";
import { EmployeeList } from "@/components/dashboard/employee-list";
import { getDashboardData } from "@/services/dashboard-service";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const { employees } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Collaborateurs</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Une vue par rôle de tous les parcours d'onboarding actifs.
          </p>
        </div>
        <AddEmployeeModal />
      </div>
      <EmployeeList employees={employees} />
    </div>
  );
}
