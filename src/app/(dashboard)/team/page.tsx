import type { Metadata } from "next";
import { getTeamMembers, computeTeamOverview } from "@/services/team-service";
import { TeamOverviewCards } from "@/components/dashboard/team-overview-cards";
import { TeamMemberList } from "@/components/dashboard/team-member-list";
import { TeamNewArrivals } from "@/components/dashboard/team-new-arrivals";

export const metadata: Metadata = { title: "Mon équipe" };

export default async function TeamPage() {
  const members  = await getTeamMembers().catch(() => []);
  const overview = computeTeamOverview(members);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Mon équipe</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivi de l'intégration, des documents et des objectifs de vos collaborateurs.
        </p>
      </div>

      <TeamOverviewCards overview={overview} />

      <TeamNewArrivals members={members} />

      <TeamMemberList members={members} />
    </div>
  );
}
