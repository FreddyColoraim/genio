"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const notifications = [
  "Noah Martin a déposé une pièce d'identité",
  "Maya Chen a 2 tâches attendues aujourd'hui",
  "Lina Gomez a terminé la revue manager"
];

export function NotificationCenter() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button aria-label="Ouvrir les notifications" size="icon" variant="outline">
          <Bell className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-8">
            <DialogTitle className="text-xl font-semibold">Notifications</DialogTitle>
            <Badge variant="blue">{notifications.length} nouvelles</Badge>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Activités qui demandent une attention RH.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div className="rounded-lg border bg-warm p-4 text-sm" key={notification}>
              {notification}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
