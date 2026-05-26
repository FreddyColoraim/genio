import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export type UpcomingArrival = {
  id:        string;
  name:      string;
  poste:     string;
  startDate: string;
  daysUntil: number;
  progress:  number;
  onboardingId: string | null;
};

export function DashboardUpcoming({ arrivals }: { arrivals: UpcomingArrival[] }) {
  if (arrivals.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <h3 className="font-semibold text-navy">Arrivées imminentes</h3>
          <Badge variant="blue">{arrivals.length}</Badge>
        </div>
        <Link
          href={"/team" as never}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy transition-colors"
        >
          Voir l'équipe <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {arrivals.map((a) => (
          <Link
            key={a.id}
            href={`/team/${a.id}` as never}
            className="group rounded-xl border bg-white p-4 hover:border-blue/30 hover:shadow-sm transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-navy group-hover:text-blue transition-colors">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.poste || "Poste non défini"}</p>
              </div>
              <Badge variant={a.daysUntil <= 2 ? "default" : a.daysUntil <= 7 ? "blue" : "soft"}>
                {a.daysUntil === 0
                  ? "Aujourd'hui"
                  : a.daysUntil < 0
                    ? `J+${Math.abs(a.daysUntil)}`
                    : `J-${a.daysUntil}`}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Préparation</span>
                <span>{a.progress}%</span>
              </div>
              <Progress value={a.progress} />
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(a.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
