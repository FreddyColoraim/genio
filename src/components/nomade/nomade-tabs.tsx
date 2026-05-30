"use client";

import Link from "next/link";
import { BookOpen, ClipboardList, MapPin, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "contacts",      label: "Contacts",      icon: MapPin         },
  { id: "formations",    label: "Formations",    icon: BookOpen       },
  { id: "formateurs",    label: "Formateurs",    icon: UserCheck      },
  { id: "questionnaires",label: "Questionnaires",icon: ClipboardList  },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Props = {
  activeTab: string;
  counts:    Record<TabId, number>;
};

export function NomadeTabs({ activeTab, counts }: Props) {
  return (
    <div className="flex gap-1 rounded-xl border bg-warm/50 p-1 w-fit">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const count = counts[tab.id];
        return (
          <Link
            key={tab.id}
            href={`/nomade?tab=${tab.id}` as never}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-white shadow-sm text-navy"
                : "text-muted-foreground hover:text-navy"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {tab.label}
            {count > 0 && (
              <span className={cn(
                "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                isActive ? "bg-blue/10 text-blue" : "bg-slate-200 text-slate-600"
              )}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
