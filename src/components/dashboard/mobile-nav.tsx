"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, UserRoundPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Accueil", href: "/dashboard", icon: BarChart3 },
  { label: "Brief", href: "/briefs", icon: UserRoundPlus },
  { label: "Équipe", href: "/employees", icon: Users },
  { label: "Docs", href: "/documents", icon: FileText }
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-lg border bg-white/95 p-1 shadow-soft backdrop-blur lg:hidden">
      {navItems.map((item) => (
        <Link
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-navy",
            pathname === item.href && "bg-accent text-navy"
          )}
          href={item.href}
          key={item.href}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
