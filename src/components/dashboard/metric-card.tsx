import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "sage" | "lavender" | "navy";
};

const toneConfig: Record<Metric["tone"], { bar: string; value: string; badge: string }> = {
  blue:     { bar: "bg-blue",    value: "text-blue",       badge: "bg-blue/10 text-blue"           },
  sage:     { bar: "bg-green-500", value: "text-green-700", badge: "bg-green-50 text-green-700"     },
  lavender: { bar: "bg-indigo-400", value: "text-indigo-700", badge: "bg-indigo-50 text-indigo-700" },
  navy:     { bar: "bg-navy",    value: "text-navy",       badge: "bg-navy/8 text-navy"            },
};

export function MetricCard({ metric }: { metric: Metric }) {
  const cfg = toneConfig[metric.tone];
  return (
    <Card className="overflow-hidden">
      <div className={cn("h-1 w-full", cfg.bar)} />
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {metric.label}
        </p>
        <p className={cn("mt-2 text-3xl font-bold tracking-tight", cfg.value)}>
          {metric.value}
        </p>
        <p className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium", cfg.badge)}>
          {metric.detail}
        </p>
      </CardContent>
    </Card>
  );
}
