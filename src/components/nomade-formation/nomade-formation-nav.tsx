"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Users, Mic, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/formation",              label: "Accueil",      icon: Home         },
  { href: "/formation/sessions",     label: "Sessions",     icon: CalendarDays },
  { href: "/formation/participants", label: "Participants", icon: Users        },
  { href: "/formation/voice",        label: "Notes",        icon: Mic          },
  { href: "/formation/profil",       label: "Profil",       icon: User         },
] as const;

export function NomadeFormationNav() {
  const pathname = usePathname();
  const fabIndex = 2; // FAB entre Sessions et Participants

  return (
    <nav className="sticky bottom-0 z-50 border-t border-green-100 bg-white pb-6 pt-2">
      <div className="flex items-end justify-around">
        {TABS.map((tab, i) => {
          const Icon     = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== "/formation" && pathname.startsWith(tab.href));
          const isFab    = i === fabIndex;

          return (
            <div key={tab.href} className={cn("flex flex-col items-center", isFab && "relative -mt-4")}>
              {isFab && (
                <Link
                  href={"/formation/sessions/new" as never}
                  className="absolute -top-4 flex size-14 items-center justify-center rounded-full bg-[#0B3D2E] shadow-lg border-4 border-[#F0FDF4]"
                  aria-label="Nouvelle session"
                >
                  <svg width="24" height="24" fill="#fff" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                  </svg>
                </Link>
              )}
              <Link
                href={tab.href as never}
                className={cn("flex flex-col items-center gap-1 px-3 py-1 transition-colors", isFab && "mt-10")}
              >
                <Icon className={cn("size-5", isActive ? "text-[#0B3D2E]" : "text-slate-400")} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={cn("text-[10px] font-semibold", isActive ? "text-[#0B3D2E]" : "text-slate-400")}>
                  {tab.label}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
