"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const employees = [
  {
    initials: "MR",
    name: "Marie Renault",
    role: "Aide a domicile · J+3",
    progress: 85,
    status: "En cours",
    tone: "indigo"
  },
  {
    initials: "TL",
    name: "Thomas Leroy",
    role: "Chef d'equipe · J+1",
    progress: 40,
    status: "A faire",
    tone: "orange"
  },
  {
    initials: "SB",
    name: "Sophie Bernard",
    role: "Auxiliaire de vie · J+7",
    progress: 100,
    status: "Termine",
    tone: "green"
  }
] as const;

const checklist = [
  { label: "Candidature validee", date: "02/05", status: "done" },
  { label: "Mail candidat envoye", date: "02/05", status: "done" },
  { label: "RDV manager planifie", date: "03/05", status: "done" },
  { label: "Documents d'arrivee demandes", date: "15/05", status: "warning" },
  { label: "Jour d'arrivee prepare", date: "--", status: "todo" }
] as const;

const alerts = [
  {
    icon: AlertTriangle,
    label: "Visite medicale C. Dupont a planifier",
    tone: "amber"
  },
  {
    icon: Clock,
    label: "Documents Thomas Leroy en attente",
    tone: "red"
  },
  {
    icon: Check,
    label: "3 parcours finalises ce mois",
    tone: "green"
  }
] as const;

const toneClasses: Record<(typeof alerts)[number]["tone"], string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  red: "border-red-200 bg-red-50 text-red-700"
};

export function HeroDashboard() {
  const [activeProgress, setActiveProgress] = useState(employees.map(() => 0));
  const [activeEmployeeIndex, setActiveEmployeeIndex] = useState(0);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveProgress(employees.map((employee) => employee.progress));
    }, 350);
    const interval = window.setInterval(() => {
      setActiveEmployeeIndex((current) => (current + 1) % employees.length);
      setActiveAlertIndex((current) => (current + 1) % alerts.length);
    }, 2200);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative rounded-lg border border-white/10 bg-white shadow-[0_40px_90px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex gap-2">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex rounded-md bg-slate-100 p-1 text-[11px] font-semibold text-slate-400">
          <span className="rounded bg-indigo-950 px-3 py-1 text-white">Onboarding</span>
          <span className="px-3 py-1">Documents</span>
          <span className="px-3 py-1">Alertes</span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Onboarding en cours</p>
            <p className="mt-1 text-xs text-slate-400">4 nouveaux arrivants · Mai 2026</p>
          </div>
          <span className="motion-shine rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
            + Nouveau salarie
          </span>
        </div>

        <div className="space-y-3">
          {employees.map((employee, index) => {
            const progress = activeProgress[index] ?? 0;

            return (
              <div
                className={cn(
                  "grid items-center gap-3 rounded-lg border p-3 transition duration-500 sm:grid-cols-[auto_1fr_150px_auto]",
                  activeEmployeeIndex === index
                    ? "translate-x-1 border-orange-200 bg-orange-50/70 shadow-sm"
                    : "border-slate-200 bg-slate-50"
                )}
                key={employee.name}
              >
                <div
                  className={cn(
                    "grid size-9 place-items-center rounded-full text-xs font-bold text-white",
                    employee.tone === "orange" && "bg-orange-600",
                    employee.tone === "green" && "bg-emerald-600",
                    employee.tone === "indigo" && "bg-indigo-700",
                    activeEmployeeIndex === index && "motion-pulse-soft"
                  )}
                >
                  {employee.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{employee.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{employee.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        employee.tone === "orange" && "bg-orange-600",
                        employee.tone === "green" && "bg-emerald-600",
                        employee.tone === "indigo" && "bg-indigo-700"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs font-bold text-slate-600">
                    {progress}%
                  </span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-[11px] font-bold",
                    employee.progress === 100
                      ? "bg-emerald-100 text-emerald-700"
                      : employee.progress < 50
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                  )}
                >
                  {employee.status}
                </span>
              </div>
            );
          })}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Checklist · Marie Renault
          </p>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-4">
            {checklist.map((item, index) => (
              <div
                className={cn(
                  "flex items-center gap-3 py-2.5 text-sm transition duration-500",
                  activeEmployeeIndex === index % employees.length && "translate-x-1"
                )}
                key={item.label}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded text-[11px] font-bold",
                    item.status === "done" && "bg-emerald-600 text-white",
                    item.status === "warning" && "bg-amber-500 text-white",
                    item.status === "todo" && "bg-slate-200 text-slate-400"
                  )}
                >
                  {item.status === "done" ? "✓" : item.status === "warning" ? "!" : ""}
                </span>
                <span
                  className={cn(
                    "flex-1 text-slate-700",
                    item.status === "done" && "text-slate-400 line-through"
                  )}
                >
                  {item.label}
                </span>
                <span className="font-mono text-xs text-slate-400">{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {alerts.map(({ icon: Icon, label, tone }, index) => (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition duration-500",
                toneClasses[tone],
                activeAlertIndex === index && "translate-x-1 shadow-sm"
              )}
              key={label}
            >
              <Icon className={cn("size-4", activeAlertIndex === index && "motion-pulse-soft")} />
              <span className="flex-1 font-medium">{label}</span>
              <span className="font-bold underline">Voir</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
