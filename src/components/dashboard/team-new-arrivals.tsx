import Link from "next/link";
import { CalendarDays, ChevronRight, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TeamMember } from "@/services/team-service";

type Props = {
  members: TeamMember[];
};

export function TeamNewArrivals({ members }: Props) {
  const now     = new Date();
  const past30  = new Date(now.getTime() - 30 * 86400000);
  const future14 = new Date(now.getTime() + 14 * 86400000);

  const newArrivals = members.filter((m) => {
    if (!m.startDate) return false;
    const d = new Date(m.startDate);
    return d >= past30 && d <= future14;
  });

  if (newArrivals.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="size-4 text-green-600" />
          <h3 className="font-semibold text-navy">Nouvelles arrivées</h3>
          <Badge variant="success">{newArrivals.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">30 derniers jours · 14 prochains jours</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {newArrivals.map((member) => {
          const startDate = new Date(member.startDate!);
          const daysFromNow = Math.round((startDate.getTime() - now.getTime()) / 86400000);
          const isFuture = daysFromNow > 0;
          const isToday  = Math.abs(daysFromNow) === 0;

          let arrivalLabel: string;
          if (isToday)       arrivalLabel = "Aujourd'hui";
          else if (isFuture) arrivalLabel = `Dans ${daysFromNow} jour${daysFromNow > 1 ? "s" : ""}`;
          else               arrivalLabel = `Il y a ${Math.abs(daysFromNow)} jour${Math.abs(daysFromNow) > 1 ? "s" : ""}`;

          return (
            <Link
              key={member.id}
              href={`/team/${member.id}` as never}
              className="group rounded-xl border bg-white p-4 space-y-3 hover:border-blue/30 hover:shadow-sm transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-navy group-hover:text-blue transition-colors leading-snug">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.poste || "Poste non défini"}</p>
                </div>
                <Badge variant={
                  member.status === "complete"    ? "success" :
                  member.status === "in_progress" ? "blue"    : "soft"
                }>
                  {isFuture ? "À venir" : member.status === "complete" ? "Terminé" : "En cours"}
                </Badge>
              </div>

              {/* Progress */}
              {!isFuture && member.totalTasks > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Intégration</span>
                    <span>{member.progress}%</span>
                  </div>
                  <Progress value={member.progress} />
                </div>
              )}

              {/* Arrival info */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  <span>{startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                </div>
                <span className={`font-medium ${
                  isToday        ? "text-green-600" :
                  isFuture       ? "text-blue"      :
                  daysFromNow > -7 ? "text-amber-600" : "text-muted-foreground"
                }`}>
                  {arrivalLabel}
                </span>
              </div>

              {/* Alerts */}
              {member.alerts.length > 0 && (
                <div className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-600">
                  {member.alerts[0]?.label}
                  {member.alerts.length > 1 && ` +${member.alerts.length - 1}`}
                </div>
              )}

              <div className="flex items-center justify-end text-xs text-muted-foreground group-hover:text-blue transition-colors">
                Voir la fiche <ChevronRight className="size-3.5 ml-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
