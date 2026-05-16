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
        {employees.map((employee) => (
          <div
            className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr]"
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
