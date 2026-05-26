import { AlertTriangle, CheckCircle2, Clock, Users, Zap } from "lucide-react";
import type { TeamOverview } from "@/services/team-service";

const cards = (overview: TeamOverview) => [
  {
    label: "Collaborateurs",
    value: overview.total,
    sub:   "dans l'équipe",
    icon:  Users,
    color: "text-navy",
    bg:    "bg-navy/5",
  },
  {
    label: "En cours d'intégration",
    value: overview.inProgress,
    sub:   `sur ${overview.total} total`,
    icon:  Clock,
    color: "text-blue",
    bg:    "bg-blue/5",
  },
  {
    label: "Intégrations terminées",
    value: overview.complete,
    sub:   `${overview.total > 0 ? Math.round((overview.complete / overview.total) * 100) : 0}% de l'équipe`,
    icon:  CheckCircle2,
    color: "text-green-600",
    bg:    "bg-green-50",
  },
  {
    label: "Tâches en attente",
    value: overview.pendingActions,
    sub:   "à traiter",
    icon:  Zap,
    color: "text-amber-600",
    bg:    "bg-amber-50",
  },
  {
    label: "Alertes actives",
    value: overview.alertCount,
    sub:   "à vérifier",
    icon:  AlertTriangle,
    color: overview.alertCount > 0 ? "text-red-600" : "text-green-600",
    bg:    overview.alertCount > 0 ? "bg-red-50" : "bg-green-50",
  },
] as const;

export function TeamOverviewCards({ overview }: { overview: TeamOverview }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards(overview).map((card) => (
        <div key={card.label} className="rounded-xl border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-3xl font-bold text-navy">{card.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
            </div>
            <span className={`rounded-lg p-2 ${card.bg}`}>
              <card.icon className={`size-5 ${card.color}`} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
