"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Mic, Settings, UserRoundPlus, Users } from "lucide-react";
import { NexoLogo } from "@/components/nexo-logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Tableau",        href: "/dashboard", icon: BarChart3,     roles: ["admin", "hr", "manager"] },
  { label: "Brief RH",       href: "/briefs",    icon: UserRoundPlus, roles: ["admin", "hr", "manager"] },
  { label: "Collaborateurs", href: "/employees", icon: Users,         roles: ["admin", "hr", "manager"] },
  { label: "Documents",      href: "/documents", icon: FileText,      roles: ["admin", "hr", "employee"] },
  { label: "Notes vocales",  href: "/voice",     icon: Mic,           roles: ["admin", "hr", "manager"] },
  { label: "Paramètres",     href: "/settings",  icon: Settings,      roles: ["admin"] },
] as const;

type Props = {
  tenantName?: string;
};

export function AppSidebar({ tenantName }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-white/80 p-4 backdrop-blur lg:block">
      <div className="flex h-full flex-col">
        <div className="px-2 py-3">
          <NexoLogo name={tenantName ?? undefined} />
        </div>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-navy",
                pathname === item.href && "bg-accent text-navy"
              )}
              href={item.href as never}
              key={item.href}
            >
              <span className="flex items-center gap-3">
                <item.icon className="size-4" />
                {item.label}
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em]">
                {item.roles[0]}
              </span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-lg bg-navy p-4 text-white">
          <Badge variant="blue">Premium</Badge>
          <p className="mt-3 text-sm font-medium">Pulse RH</p>
          <p className="mt-1 text-xs leading-5 text-white/65">
            9 événements d'intégration sont à vérifier avant vendredi.
          </p>
        </div>
      </div>
    </aside>
  );
}
