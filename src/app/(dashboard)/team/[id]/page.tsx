import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getTeamMemberDetail } from "@/services/team-service";
import { TeamMemberDetailView } from "@/components/dashboard/team-member-detail";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Fiche collaborateur" };

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let member;
  try {
    member = await getTeamMemberDetail(id);
  } catch {
    notFound();
  }

  const startDateFmt = member.startDate
    ? new Date(member.startDate).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href={"/team" as never}
          className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy transition-colors"
        >
          <ArrowLeft className="size-4" />
          Retour à l'équipe
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-semibold">{member.name}</h2>
            {member.poste && <Badge variant="soft">{member.poste}</Badge>}
            {member.department && (
              <Badge variant="blue">{member.department}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {member.email}
            {startDateFmt && ` · Arrivée le ${startDateFmt}`}
            {member.manager && ` · Manager : ${member.manager}`}
          </p>
        </div>
      </div>

      {/* Detail view with tabs */}
      <TeamMemberDetailView member={member} />
    </div>
  );
}
