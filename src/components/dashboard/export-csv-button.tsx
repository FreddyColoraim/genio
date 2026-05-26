"use client";

import { Download } from "lucide-react";

type Props = {
  href:  string;   // e.g. "/api/export/team"
  label: string;   // e.g. "Exporter CSV"
  variant?: "outline" | "ghost";
};

export function ExportCsvButton({ href, label, variant = "outline" }: Props) {
  const base =
    variant === "ghost"
      ? "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-navy hover:bg-warm transition-colors"
      : "flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-blue/40 hover:text-navy transition-colors";

  return (
    <a href={href} download className={base}>
      <Download className="size-3.5" />
      {label}
    </a>
  );
}
