import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEntityForDocs, getDocKit } from "@/services/onboarding-docs-service";
import { getDocById } from "@/lib/onboarding-docs-catalog";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Kit d'intégration — Impression" };

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let entity;
  try {
    entity = await getEntityForDocs(id);
  } catch {
    notFound();
  }

  const kit  = await getDocKit(id).catch(() => []);
  const docs = kit.filter((k) => k.action === "generate");

  if (docs.length === 0) {
    return (
      <main className="p-10 text-center text-muted-foreground">
        <p>Aucun document à générer pour ce collaborateur.</p>
        <p className="mt-2 text-sm">
          <a href={`/employees/${id}?tab=docs`} className="text-blue underline">
            Configurer le kit de documents
          </a>
        </p>
      </main>
    );
  }

  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      {/* Barre d'actions — masquée à l'impression */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3 print:hidden">
        <div>
          <p className="font-semibold text-navy">Kit d'intégration — {entity.name}</p>
          <p className="text-xs text-muted-foreground">{docs.length} document{docs.length > 1 ? "s" : ""} · généré le {today}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/employees/${id}?tab=docs`}
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-warm transition-colors"
          >
            ← Modifier
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Contenu imprimable */}
      <main className="mx-auto max-w-3xl space-y-0 px-8 py-10 print:px-0 print:py-0">

        {/* Page de garde */}
        <section className="mb-12 print:page-break-after-always">
          <div className="rounded-2xl border-2 border-navy bg-navy p-10 text-white print:rounded-none">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
              {entity.tenantName}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Kit d'intégration
            </h1>
            <h2 className="mt-2 text-2xl font-light text-white/80">
              {entity.name}
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { label: "Poste",          value: entity.poste || "—" },
                { label: "Département",    value: entity.department || "—" },
                { label: "Date d'arrivée", value: entity.startDate ? new Date(entity.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                { label: "Généré le",      value: today },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{label}</p>
                  <p className="mt-1 text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Un document par section */}
        {docs.map((item, index) => {
          const template = getDocById(item.docId);
          const fields   = template?.fields ?? [];
          const custom   = item.customization;

          return (
            <section
              key={item.docId}
              className="mb-12 rounded-xl border bg-white p-8 print:rounded-none print:border-0 print:p-0 print:mb-0 print:page-break-before-always"
            >
              {/* En-tête document */}
              <div className="mb-6 flex items-start justify-between border-b pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Document {index + 1} / {docs.length}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-navy">{item.label}</h2>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-medium">{entity.name}</p>
                  <p>{entity.tenantName}</p>
                </div>
              </div>

              {/* Contenu des champs */}
              {fields.length > 0 ? (
                <div className="space-y-6">
                  {fields.map((field) => {
                    const value = custom[field.name];
                    if (!value) return null;
                    return (
                      <div key={field.name}>
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                          {field.label}
                        </p>
                        <div className="text-sm leading-7 text-navy whitespace-pre-line">
                          {value}
                        </div>
                      </div>
                    );
                  })}
                  {fields.every((f) => !custom[f.name]) && (
                    <p className="text-sm text-muted-foreground italic">
                      Aucun contenu personnalisé. Éditez ce document depuis la page de configuration.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{item.label} — document à compléter.</p>
              )}

              {/* Signature */}
              <div className="mt-10 flex items-end justify-between border-t pt-6 print:mt-16">
                <div>
                  <p className="text-xs text-muted-foreground">Signature du collaborateur</p>
                  <div className="mt-6 w-48 border-b border-dashed border-muted-foreground" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Signature RH / Manager</p>
                  <div className="mt-6 w-48 border-b border-dashed border-muted-foreground" />
                </div>
              </div>
            </section>
          );
        })}
      </main>

      {/* CSS print */}
      <style>{`
        @media print {
          @page { margin: 20mm; }
          .print\\:page-break-before-always { page-break-before: always; }
          .print\\:page-break-after-always  { page-break-after: always; }
        }
      `}</style>
    </>
  );
}
