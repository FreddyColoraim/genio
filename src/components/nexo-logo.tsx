import { cn } from "@/lib/utils";

type Props = {
  variant?: "dark" | "light";
  name?: string | undefined;
  subtitle?: string | undefined;
};

export function NexoLogo({ variant = "dark", name = "Nexo RH", subtitle = "OS d'onboarding" }: Props) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-lg bg-blue text-sm font-semibold text-white">
        {initial}
      </div>
      <div>
        <p className={cn("text-sm font-semibold", variant === "light" && "text-white")}>
          {name}
        </p>
        <p className={cn("text-xs text-muted-foreground", variant === "light" && "text-white/55")}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
