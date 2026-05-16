import { cn } from "@/lib/utils";

export function NexoLogo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-lg bg-blue text-sm font-semibold text-white">
        N
      </div>
      <div>
        <p className={cn("text-sm font-semibold", variant === "light" && "text-white")}>
          Nexo RH
        </p>
        <p className={cn("text-xs text-muted-foreground", variant === "light" && "text-white/55")}>
          OS d'onboarding
        </p>
      </div>
    </div>
  );
}
