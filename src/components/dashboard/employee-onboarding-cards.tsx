import type { Employee } from "@/types/employee";
import { onboardingStatusLabels } from "@/types/employee";
import { completeOnboardingStepAction } from "@/app/(dashboard)/employees/onboarding-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
              <div className="space-y-2">
                {employee.onboardingSteps.length === 0 ? (
                  <p className="rounded-lg bg-warm p-3 text-sm text-muted-foreground">
                    Aucun scénario d'onboarding n'est encore créé pour ce collaborateur.
                  </p>
                ) : null}
                {employee.onboardingSteps.map((step) => (
                  <div
                    className="rounded-lg border bg-white p-3"
                    key={step.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                      <Badge variant={step.status === "done" ? "success" : "soft"}>
                        {step.status === "done" ? "Fait" : "À faire"}
                      </Badge>
                    </div>
                    {step.status === "todo" ? (
                      <form action={completeOnboardingStepAction} className="mt-3">
                        <input name="stepId" type="hidden" value={step.id} />
                        <Button size="sm" type="submit" variant="outline">
                          Valider
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
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
