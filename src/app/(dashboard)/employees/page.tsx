import { EmployeeList } from "@/components/dashboard/employee-list";
import { mockEmployees } from "@/lib/mock-data";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Collaborateurs</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Une vue par rôle de tous les parcours d'onboarding actifs.
        </p>
      </div>
      <EmployeeList employees={mockEmployees} />
    </div>
  );
}
