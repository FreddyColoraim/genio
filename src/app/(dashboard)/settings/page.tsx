import { RoleMatrix } from "@/components/dashboard/role-matrix";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Paramètres de l'espace</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Configurez les accès et responsabilités des RH, managers et collaborateurs.
        </p>
      </div>
      <RoleMatrix />
    </div>
  );
}
