import Link from "next/link";
import { AlertTriangle, ChevronRight, FileText, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type UrgentAction = {
  id:         string;
  entityId:   string;
  entityName: string;
  type:       "pending_doc" | "no_onboarding" | "stalled";
  label:      string;
  detail:     string;
  href:       string;
};

export function DashboardActions({ actions }: { actions: UrgentAction[] }) {
  if (actions.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-amber-600" />
        <h3 className="font-semibold text-navy">Actions requises</h3>
        <Badge variant="default">{actions.length}</Badge>
      </div>

      <div className="rounded-xl border bg-white divide-y overflow-hidden">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href as never}
            className="flex items-center gap-3 px-4 py-3 hover:bg-warm/40 transition-colors group"
          >
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
              action.type === "pending_doc" ? "bg-amber-50" : "bg-red-50"
            }`}>
              {action.type === "pending_doc"
                ? <FileText className="size-4 text-amber-600" />
                : <AlertTriangle className="size-4 text-red-600" />
              }
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy">{action.label}</p>
              <p className="text-xs text-muted-foreground truncate">{action.detail}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{action.entityName}</span>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-navy transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
