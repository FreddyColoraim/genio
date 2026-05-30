import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type UpcomingArrival = {
  id:        string;
  name:      string;
  poste:     string;
  startDate: string;
  daysUntil: number;
  progress:  number;
  onboardingId: string | null;
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue/15 text-blue",
  "bg-indigo-100 text-indigo-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

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
        {arrivals.map((a, i) => {
          const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]!;
          const isImminent  = a.daysUntil >= 0 && a.daysUntil <= 3;
          const dayLabel    = a.daysUntil === 0
            ? "Aujourd'hui"
            : a.daysUntil < 0
              ? `J+${Math.abs(a.daysUntil)}`
              : `J-${a.daysUntil}`;

          return (
            <Link
              key={a.id}
              href={`/team/${a.id}` as never}
              className={cn(
                "group rounded-xl border bg-white p-4 transition-all hover:shadow-sm space-y-3",
                isImminent ? "border-blue/20 hover:border-blue/40" : "hover:border-slate-200"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", avatarColor)}>
                    {getInitials(a.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy group-hover:text-blue transition-colors">
                      {a.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{a.poste || "Poste non défini"}</p>
                  </div>
                </div>
                <Badge
                  variant={a.daysUntil <= 0 ? "default" : a.daysUntil <= 3 ? "blue" : "soft"}
                  className="shrink-0 font-semibold"
                >
                  {dayLabel}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Préparation</span>
                  <span className="font-medium text-navy">{a.progress}%</span>
                </div>
                <Progress value={a.progress} className="h-1.5" />
              </div>

              <p className="text-xs text-muted-foreground">
                {new Date(a.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
