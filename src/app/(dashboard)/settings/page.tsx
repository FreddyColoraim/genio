import type { Metadata } from "next";
import { Building2, Shield, Users } from "lucide-react";
import { RoleMatrix } from "@/components/dashboard/role-matrix";
import { WorkspaceProfileForm } from "@/components/dashboard/workspace-profile-form";
import { MembersSettings } from "@/components/dashboard/members-settings";
import { getWorkspaceProfile } from "@/services/workspace-service";
import { getMembers } from "@/services/members-service";

export const metadata: Metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [workspaceProfile, members] = await Promise.all([
    getWorkspaceProfile().catch(() => null),
    getMembers().catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Paramètres</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurez votre workspace, vos membres et les niveaux d'accès.
        </p>
      </div>

      {/* Section 1 — Informations générales */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-navy">Informations générales</h3>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <WorkspaceProfileForm profile={workspaceProfile} />
        </div>
      </section>

      {/* Section 2 — Membres */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-navy">Membres de l'équipe</h3>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <MembersSettings initialMembers={members} />
        </div>
      </section>

      {/* Section 3 — Rôles et permissions */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-navy">Rôles et permissions</h3>
        </div>
        <RoleMatrix />
      </section>
    </div>
  );
}
