"use client";

import Link from "next/link";
import { AlertTriangle, Bell, CalendarClock, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/services/notification-service";

// ---------------------------------------------------------------------------
// Icon + color per type
// ---------------------------------------------------------------------------

const TYPE_META: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  reminder:         { icon: Clock,          color: "text-blue",      bg: "bg-blue/10" },
  pending_doc:      { icon: FileText,       color: "text-amber-600", bg: "bg-amber-50" },
  upcoming_arrival: { icon: CalendarClock,  color: "text-green-600", bg: "bg-green-50" },
  overdue_task:     { icon: AlertTriangle,  color: "text-red-600",   bg: "bg-red-50" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  notifications: AppNotification[];
  count:         number;
};

export function NotificationCenter({ notifications, count }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button aria-label="Ouvrir les notifications" size="icon" variant="outline" className="relative">
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-8">
            <DialogTitle className="text-xl font-semibold">Notifications</DialogTitle>
            {count > 0 && <Badge variant="blue">{count} actives</Badge>}
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Rappels, arrivées imminentes et documents en attente.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
          {notifications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Tout est à jour — aucune action requise.
            </div>
          ) : (
            notifications.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Individual item
// ---------------------------------------------------------------------------

function NotificationItem({ notification: n }: { notification: AppNotification }) {
  const meta = TYPE_META[n.type];
  const Icon = meta.icon;

  const dateStr = new Date(n.date).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short",
  });

  const content = (
    <div className={cn(
      "flex items-start gap-3 rounded-xl border p-3 transition-colors",
      n.urgent ? "border-red-200 bg-red-50/50" : "bg-warm/50 hover:bg-warm"
    )}>
      <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", meta.bg)}>
        <Icon className={cn("size-3.5", meta.color)} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy leading-snug">{n.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{n.description}</p>
      </div>
      <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">{dateStr}</span>
    </div>
  );

  if (n.entityId && (n.type === "pending_doc" || n.type === "upcoming_arrival")) {
    return (
      <Link href={`/team/${n.entityId}` as never}>
        {content}
      </Link>
    );
  }

  return content;
}
