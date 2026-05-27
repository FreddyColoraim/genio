import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, LayoutList, User } from "lucide-react";
import { getEntityForDocs, getDocKit } from "@/services/onboarding-docs-service";
import { getEmployeeById } from "@/services/dashboard-service";
import { OnboardingDocSelector } from "@/components/dashboard/onboarding-doc-selector";
import { EmployeeOnboardingCards } from "@/components/dashboard/employee-onboarding-cards";
import { Badge } from "@/components/ui/badge";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id }  = await params;
  const { tab } = await searchParams;
  const activeTab = tab ?? "onboarding";

  let entity;
  try {
    entity = await getEntityForDocs(id);
  } catch {
    notFound();
  }

  // Chargement parallèle selon l'onglet actif
  const [docKit, employeeData] = await Promise.all([
    getDocKit(id).catch(() => []),
    activeTab === "onboarding" ? getEmployeeById(id).catch(() => null) : Promise.resolve(null),
  ]);

  const tabs = [
    { key: "onboarding", label: "Onboarding",              icon: LayoutList },
    { key: "docs",       label: "Documents d'intégration", icon: FileText   },
    { key: "profil",     label: "Profil",                  icon: User       },
  ];

  const returnTo = `/employees/${id}?tab=onboarding`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/employees"
          className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy transition-colors"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-semibold">{entity.name}</h2>
            <Badge variant="soft">{entity.poste || "Poste non défini"}</Badge>
            {docKit.length > 0 && (
              <Badge variant="success">
                {docKit.length} doc{docKit.length > 1 ? "s" : ""} sélectionné{docKit.length > 1 ? "s" : ""}
              </Badge>
            )}
            {employeeData && (
              <Badge variant={employeeData.status === "Complete" ? "success" : "soft"}>
                {employeeData.progress}%
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {entity.email}
            {entity.startDate && ` · Arrivée le ${new Date(entity.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`}
            {entity.department && ` · ${entity.department}`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => {
          const Icon = t.icon;
          const href = `/employees/${id}?tab=${t.key}`;
          const isActive = activeTab === t.key;
          return (
            <Link
              key={t.key}
              href={href as never}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
                isActive
                  ? "border-blue text-navy"
                  : "border-transparent text-muted-foreground hover:text-navy"
              }`}
            >
              <Icon className="size-4" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* ── Onglet Onboarding ── */}
      {activeTab === "onboarding" && (
        employeeData ? (
          <EmployeeOnboardingCards
            employees={[employeeData]}
            returnTo={returnTo}
          />
        ) : (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
            <p className="font-medium text-navy">Aucun parcours d'onboarding configuré</p>
            <p className="mt-1">Créez un parcours depuis le tableau de bord principal ou ajoutez des tâches manuellement.</p>
          </div>
        )
      )}

      {/* ── Onglet Documents ── */}
      {activeTab === "docs" && (
        <OnboardingDocSelector
          entityId={id}
          entityName={entity.name}
          initialKit={docKit}
        />
      )}

      {/* ── Onglet Profil ── */}
      {activeTab === "profil" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Nom complet",    value: entity.name },
            { label: "Email",          value: entity.email },
            { label: "Poste",          value: entity.poste || "—" },
            { label: "Département",    value: entity.department || "—" },
            { label: "Date d'arrivée", value: entity.startDate
                ? new Date(entity.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                : "—" },
            { label: "Workspace",      value: entity.tenantName },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-medium text-navy">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
