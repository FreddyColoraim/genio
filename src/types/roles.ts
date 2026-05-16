export type UserRole = "admin" | "hr" | "manager" | "employee";

export type Permission =
  | "workspace.manage"
  | "employees.read"
  | "employees.write"
  | "documents.read"
  | "documents.write"
  | "notifications.manage";

export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    "workspace.manage",
    "employees.read",
    "employees.write",
    "documents.read",
    "documents.write",
    "notifications.manage"
  ],
  hr: [
    "employees.read",
    "employees.write",
    "documents.read",
    "documents.write",
    "notifications.manage"
  ],
  manager: ["employees.read", "documents.read"],
  employee: ["documents.read", "documents.write"]
};
