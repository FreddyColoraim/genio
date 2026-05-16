import Link from "next/link";
import { BarChart3, FileText, Settings, Users } from "lucide-react";

const navItems = [
  { label: "Accueil", href: "/dashboard", icon: BarChart3 },
  { label: "Équipe", href: "/employees", icon: Users },
  { label: "Docs", href: "/documents", icon: FileText },
  { label: "Réglages", href: "/settings", icon: Settings }
] as const;

export function MobileNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-lg border bg-white/95 p-1 shadow-soft backdrop-blur lg:hidden">
      {navItems.map((item) => (
        <Link
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-navy"
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
