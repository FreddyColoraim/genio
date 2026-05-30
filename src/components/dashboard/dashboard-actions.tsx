import Link from "next/link";
import { AlertTriangle, ChevronRight, Clock, FileText, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type UrgentAction = {
  id:         string;
  entityId:   string;
  entityName: string;
  type:       "pending_doc" | "no_onboarding" | "stalled";
  label:      string;
  detail:     string;
  href:       string;
};

const ACTION_CONFIG = {
  pending_doc:    { icon: FileText,      bg: "bg-amber-50",  text: "text-amber-600", badge: "Urgent"   },
  no_onboarding:  { icon: AlertTriangle, bg: "bg-red-50",    text: "text-red-600",   badge: "Critique" },
  stalled:        { icon: Clock,         bg: "bg-orange-50", text: "text-orange-600", badge: "À traiter" },
} satisfies Record<UrgentAction["type"], { icon: React.ElementType; bg: string; text: string; badge: string }>;

const BADGE_CLASSES: Record<UrgentAction["type"], string> = {
  pending_doc:   "bg-amber-50 text-amber-700 border border-amber-200",
  no_onboarding: "bg-red-50 text-red-700 border border-red-200",
  stalled:       "bg-orange-50 text-orange-700 border border-orange-200",
};

export function DashboardActions({ actions }: { actions: UrgentAction[] }) {
  if (actions.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-amber-500" />
        <h3 className="font-semibold text-navy">Actions requises</h3>
        <Badge variant="default">{actions.length}</Badge>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white divide-y">
        {actions.map((action) => {
          const cfg = ACTION_CONFIG[action.type];
          const Icon = cfg.icon;
          return (
            <Link
              key={action.id}
              href={action.href as never}
              className="flex items-center gap-4 px-4 py-3.5 hover:bg-warm/40 transition-colors group"
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
                <Icon className={cn("size-4", cfg.text)} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy">{action.entityName}</p>
                <p className="text-xs text-muted-foreground truncate">{action.detail}</p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", BADGE_CLASSES[action.type])}>
                {cfg.badge}
              </span>
              <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-navy transition-all shrink-0" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
