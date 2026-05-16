import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { rolePermissions, type UserRole } from "@/types/roles";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  hr: "HR",
  manager: "Manager",
  employee: "Collaborateur"
};

export function RoleMatrix() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accès par rôle</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {(Object.keys(rolePermissions) as UserRole[]).map((role) => (
          <div className="rounded-lg border bg-white p-4" key={role}>
            <div className="flex items-center justify-between">
              <p className="font-medium">{roleLabels[role]}</p>
              <Badge variant={role === "admin" ? "blue" : "soft"}>{role}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {rolePermissions[role].map((permission) => (
                <Badge key={permission} variant="success">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
