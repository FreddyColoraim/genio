import Link from "next/link";
import { FileText } from "lucide-react";
import type { Employee } from "@/types/employee";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function EmployeeList({ employees }: { employees: Employee[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des collaborateurs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {employees.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white p-6 text-sm text-muted-foreground">
            Aucun collaborateur visible pour le moment. Ajoutez des employés dans Supabase pour
            alimenter cette vue.
          </div>
        ) : null}
        {employees.map((employee) => (
          <div
            className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]"
            key={employee.id}
          >
            <div>
              <p className="font-medium">{employee.name}</p>
              <p className="text-sm text-muted-foreground">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{employee.department}</p>
              <p className="text-sm text-muted-foreground">Manager : {employee.manager}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progression</span>
                <span>{employee.progress}%</span>
              </div>
              <Progress value={employee.progress} />
            </div>
            <div className="flex items-center md:justify-end">
              <Badge variant={employee.accessRole === "hr" ? "blue" : "soft"}>
                {employee.accessRole}
              </Badge>
            </div>
            <div className="flex items-center justify-end">
              <Link
                href={`/employees/${employee.id}?tab=docs` as never}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-blue/40 hover:text-navy transition-colors"
                title="Kit de documents"
              >
                <FileText className="size-3.5" />
                Docs
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
