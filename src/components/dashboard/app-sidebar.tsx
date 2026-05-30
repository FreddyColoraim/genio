"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, KanbanSquare, LineChart, Mic, MapPin, Settings, UserRoundPlus, Users, UsersRound } from "lucide-react";
import { NexoLogo } from "@/components/nexo-logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Tableau",        href: "/dashboard", icon: BarChart3,     roles: ["admin", "hr", "manager"], tourId: "tour-dashboard"  },
  { label: "Brief RH",       href: "/briefs",    icon: UserRoundPlus, roles: ["admin", "hr", "manager"], tourId: "tour-briefs"     },
  { label: "Pipeline",       href: "/pipeline",  icon: KanbanSquare,  roles: ["admin", "hr", "manager"], tourId: "tour-pipeline"   },
  { label: "Mon équipe",     href: "/team",      icon: UsersRound,    roles: ["admin", "hr", "manager"], tourId: "tour-team"       },
  { label: "Collaborateurs", href: "/employees", icon: Users,         roles: ["admin", "hr", "manager"], tourId: "tour-employees"  },
  { label: "Documents",      href: "/documents", icon: FileText,      roles: ["admin", "hr", "employee"],tourId: "tour-documents"  },
  { label: "Analytiques",    href: "/analytics", icon: LineChart,     roles: ["admin", "hr", "manager"], tourId: "tour-analytics"  },
  { label: "Notes vocales",  href: "/voice",     icon: Mic,           roles: ["admin", "hr", "manager"], tourId: undefined         },
  { label: "Nomade",         href: "/nomade",    icon: MapPin,        roles: ["admin", "hr", "manager"], tourId: undefined         },
  { label: "Paramètres",     href: "/settings",  icon: Settings,      roles: ["admin"],                  tourId: "tour-settings"   },
] as const;

type Props = {
  tenantName?: string;
  urgentCount?: number;
};

export function AppSidebar({ tenantName, urgentCount = 0 }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-white/80 p-4 backdrop-blur lg:block">
      <div className="flex h-full flex-col">
        <div className="px-2 py-3">
          <NexoLogo name={tenantName ?? undefined} />
        </div>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                id={item.tourId ?? undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-navy",
                  isActive && "border-l-2 border-blue bg-accent pl-[10px] text-navy"
                )}
                href={item.href as never}
                key={item.href}
              >
                <item.icon className={cn("size-4 shrink-0", isActive && "text-blue")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div id="tour-pulse" className="mt-auto rounded-lg bg-navy p-4 text-white">
          <Badge variant="blue">Premium</Badge>
          <p className="mt-3 text-sm font-medium">Pulse RH</p>
          <p className="mt-1 text-xs leading-5 text-white/65">
            {urgentCount > 0
              ? `${urgentCount} événement${urgentCount > 1 ? "s" : ""} à traiter en priorité.`
              : "Tout est à jour — aucune action urgente."}
          </p>
        </div>
      </div>
    </aside>
  );
}
