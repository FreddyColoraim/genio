import type { Metadata } from "next";
import { BarChart3, Clock, TrendingUp, Users } from "lucide-react";
import { getAnalyticsData } from "@/services/analytics-service";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Analytiques" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData().catch(() => null);

  if (!data) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
        Impossible de charger les analytiques.
      </div>
    );
  }

  const { onboarding, byDepartment, pipeline, trend } = data;
  const maxTrend = Math.max(...trend.map((t) => t.count), 1);
  const pipelineMax = Math.max(...pipeline.filter(s => s.stage !== "refused").map(s => s.count), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Analytiques</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue d'ensemble de l'intégration, du pipeline et des tendances.
          </p>
        </div>
        <ExportCsvButton href="/api/export/team" label="Exporter l'équipe" />
      </div>

      {/* ── Section 1 — Vue globale onboarding ── */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-navy">
          <Users className="size-4 text-muted-foreground" />
          Onboarding — Vue globale
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Collaborateurs",     value: onboarding.total,      color: "text-navy",      sub: "total" },
            { label: "Non démarrés",       value: onboarding.notStarted, color: "text-muted-foreground", sub: "sans onboarding actif" },
            { label: "En cours",           value: onboarding.inProgress, color: "text-blue",      sub: "intégration active" },
            { label: "Terminés",           value: onboarding.complete,   color: "text-green-600", sub: "parcours complet" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4">
              <p className="text-3xl font-bold text-navy">{s.value}</p>
              <p className="text-sm font-medium mt-0.5">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-navy">Progression moyenne</span>
              <span className="font-bold text-blue">{onboarding.avgProgress}%</span>
            </div>
            <Progress value={onboarding.avgProgress} />
            <p className="text-xs text-muted-foreground">Sur l'ensemble des collaborateurs actifs</p>
          </div>
          <div className="rounded-xl border bg-white p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-50">
              <Clock className="size-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-navy">{onboarding.avgDaysToComplete || "—"}</p>
              <p className="text-sm text-muted-foreground">
                {onboarding.avgDaysToComplete ? "jours en moyenne pour compléter" : "Pas encore de données"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2 — Par département ── */}
      {byDepartment.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold text-navy">
            <BarChart3 className="size-4 text-muted-foreground" />
            Progression par département
          </h3>
          <div className="rounded-xl border bg-white divide-y overflow-hidden">
            {byDepartment.map((dept) => (
              <div key={dept.department} className="flex items-center gap-4 px-4 py-3">
                <div className="w-36 shrink-0">
                  <p className="text-sm font-medium text-navy truncate">{dept.department}</p>
                  <p className="text-xs text-muted-foreground">{dept.count} collaborateur{dept.count > 1 ? "s" : ""}</p>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{dept.complete} terminé{dept.complete > 1 ? "s" : ""}</span>
                    <span className="font-medium text-navy">{dept.avgProgress}%</span>
                  </div>
                  <Progress value={dept.avgProgress} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 3 — Pipeline recrutement ── */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-navy">
          <TrendingUp className="size-4 text-muted-foreground" />
          Funnel recrutement
        </h3>
        <div className="rounded-xl border bg-white p-5 space-y-3">
          {pipeline.map((stage) => {
            const isRefused = stage.stage === "refused";
            const barPct = isRefused
              ? (stage.count / Math.max(pipeline[0]?.count ?? 1, 1)) * 100
              : (stage.count / pipelineMax) * 100;

            return (
              <div key={stage.stage} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-muted-foreground">{stage.label}</span>
                <div className="flex-1 h-7 rounded-lg bg-warm overflow-hidden">
                  <div
                    className={`h-full rounded-lg flex items-center px-2 transition-all ${
                      isRefused
                        ? "bg-red-100"
                        : stage.stage === "retained"
                          ? "bg-green-100"
                          : "bg-blue/15"
                    }`}
                    style={{ width: `${Math.max(barPct, 2)}%` }}
                  >
                    <span className="text-xs font-semibold text-navy whitespace-nowrap">
                      {stage.count}
                    </span>
                  </div>
                </div>
                {stage.stage !== "new" && stage.stage !== "refused" && (
                  <Badge variant={stage.convRate >= 50 ? "success" : "soft"} className="shrink-0 text-xs">
                    {stage.convRate}%
                  </Badge>
                )}
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground pt-1">
            Le % indique le taux de conversion par rapport à l'étape précédente.
          </p>
        </div>
      </section>

      {/* ── Section 4 — Tendance mensuelle ── */}
      <section className="space-y-4">
        <h3 className="font-semibold text-navy">Onboardings créés — 6 derniers mois</h3>
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-end gap-3 h-40">
            {trend.map((t) => {
              const heightPct = (t.count / maxTrend) * 100;
              return (
                <div key={t.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold text-navy">{t.count > 0 ? t.count : ""}</span>
                  <div className="w-full rounded-t-lg bg-blue/15 relative overflow-hidden" style={{ height: "100px" }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg bg-blue/60 transition-all"
                      style={{ height: `${Math.max(heightPct, t.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{t.label}</span>
                </div>
              );
            })}
          </div>
          {trend.every((t) => t.count === 0) && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Aucun onboarding créé sur cette période.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
