"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, MapPin, Settings, User } from "lucide-react";
import { TOUR_EVENT, TOUR_KEY } from "@/components/onboarding/app-tour";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  name: string;
  email: string;
  initials: string;
  role: string;
};

export function UserMenu({ name, email, initials, role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-white text-navy hover:bg-accent" variant="outline">
          <span className="grid size-6 place-items-center rounded-full bg-sage text-xs font-semibold">
            {initials}
          </span>
          <span className="hidden sm:inline max-w-[140px] truncate">{name}</span>
          <ChevronDown className="size-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          <span className="mt-1 inline-block rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-navy">
            {role}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="size-4" />
            Paramètres
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/settings/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="size-4" />
            Mon profil
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            localStorage.removeItem(TOUR_KEY);
            window.dispatchEvent(new CustomEvent(TOUR_EVENT));
          }}
        >
          <MapPin className="size-4" />
          Visite guidée
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
          disabled={loading}
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          {loading ? "Déconnexion…" : "Se déconnecter"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
