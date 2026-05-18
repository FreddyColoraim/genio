import { RoleMatrix } from "@/components/dashboard/role-matrix";
import { WorkspaceProfileForm } from "@/components/dashboard/workspace-profile-form";
import { getWorkspaceProfile } from "@/services/workspace-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const workspaceProfile = await getWorkspaceProfile();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Paramètres de l'espace</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Configurez les accès et responsabilités des RH, managers et collaborateurs.
        </p>
      </div>
      <WorkspaceProfileForm profile={workspaceProfile} />
      <RoleMatrix />
    </div>
  );
}
