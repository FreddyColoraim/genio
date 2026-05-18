import type { Employee } from "@/types/employee";
import { onboardingStatusLabels } from "@/types/employee";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function EmployeeOnboardingCards({ employees }: { employees: Employee[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cartes d'onboarding</h3>
        <p className="text-sm text-muted-foreground">{employees.length} parcours actifs</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {employees.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Aucun parcours d'onboarding n'est encore disponible.
            </CardContent>
          </Card>
        ) : null}
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{employee.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{employee.role}</p>
                </div>
                <Badge variant={employee.status === "Complete" ? "success" : "soft"}>
                  {onboardingStatusLabels[employee.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={employee.progress} />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-warm p-3">
                  <p className="text-muted-foreground">Date d'arrivée</p>
                  <p className="mt-1 font-medium">{employee.startDate}</p>
                </div>
                <div className="rounded-lg bg-warm p-3">
                  <p className="text-muted-foreground">Documents</p>
                  <p className="mt-1 font-medium">{employee.pendingDocuments} en attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
