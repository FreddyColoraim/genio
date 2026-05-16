import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  return (
    <Button className="bg-white text-navy hover:bg-accent" variant="outline">
      <span className="grid size-6 place-items-center rounded-full bg-sage text-xs font-semibold">
        HR
      </span>
      <span className="hidden sm:inline">Sarah Lee</span>
      <ChevronDown className="size-4" />
    </Button>
  );
}
