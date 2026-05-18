"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const checklist = [
  { label: "Preparation avant l'arrivee", progress: 100 },
  { label: "Collecte des documents RH", progress: 86 },
  { label: "Suivi manager et administratif", progress: 74 },
  { label: "Tableau de bord collaborateur", progress: 61 }
];

const metrics = [
  { label: "Documents", value: 18 },
  { label: "Managers", value: 7 },
  { label: "Contrats", value: 12 }
];

const acquisitionSources = [
  { label: "LinkedIn", value: 42 },
  { label: "Site", value: 28 },
  { label: "Annonce", value: 19 },
  { label: "Cooptation", value: 11 }
];

export function HeroDashboard() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % checklist.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-soft">
      <div className="rounded-md border border-border bg-warm p-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tableau de bord</p>
            <h2 className="mt-1 text-xl font-semibold text-navy">Onboardings actifs</h2>
          </div>
          <span className="rounded-full bg-sage px-3 py-1 text-sm font-semibold text-navy">
            92%
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {metrics.map((metric) => (
            <button
              key={metric.label}
              className="rounded-md border border-border bg-white p-4 text-left transition hover:border-blue hover:shadow-sm"
              type="button"
            >
              <p className="text-xs font-medium uppercase text-muted-foreground">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold text-navy">{metric.value}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {checklist.map((item, index) => (
            <button
              key={item.label}
              className={cn(
                "w-full rounded-md border bg-white px-4 py-3 text-left transition",
                activeIndex === index ? "border-blue shadow-sm" : "border-border hover:border-blue/60"
              )}
              type="button"
              onClick={() => setActiveIndex(index)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-blue" />
                  <span className="text-sm font-medium text-navy">{item.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.progress}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue transition-all duration-700"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-md border border-border bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Sources candidats
              </p>
              <p className="mt-1 text-sm font-semibold text-navy">Canaux d'acquisition</p>
            </div>
            <span className="text-sm font-medium text-blue">+18%</span>
          </div>
          <div className="mt-4 space-y-3">
            {acquisitionSources.map((source) => (
              <div key={source.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-navy">{source.label}</span>
                  <span className="text-muted-foreground">{source.value}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue transition-all duration-700"
                    style={{ width: `${source.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
