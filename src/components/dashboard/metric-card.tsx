import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "sage" | "lavender" | "navy";
};

const toneClasses: Record<Metric["tone"], string> = {
  blue: "bg-blue text-white",
  sage: "bg-sage text-navy",
  lavender: "bg-lavender text-navy",
  navy: "bg-navy text-white"
};

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={cn("mb-4 h-1.5 w-12 rounded-full", toneClasses[metric.tone])} />
        <p className="text-sm text-muted-foreground">{metric.label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-normal">{metric.value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
      </CardContent>
    </Card>
  );
}
