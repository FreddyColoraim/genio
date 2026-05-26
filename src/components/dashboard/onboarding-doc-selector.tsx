"use client";

import { useRef, useState, useTransition } from "react";
import {
  ChevronDown, ChevronRight, Download, FilePlus, Loader2,
  Package, UploadCloud, X,
} from "lucide-react";
import { saveDocKitAction } from "@/app/(dashboard)/employees/[id]/actions";
import {
  DOC_CATALOG, BLOCS, BLOC_META, getDocsByBloc,
} from "@/lib/onboarding-docs-catalog";
import type { DocTemplate, DocBloc } from "@/lib/onboarding-docs-catalog";
import type { DocKitItem } from "@/services/onboarding-docs-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types locaux
// ---------------------------------------------------------------------------

type CustomizationMap = Record<string, Record<string, string>>;

type Props = {
  entityId:   string;
  entityName: string;
  initialKit: DocKitItem[];
};

// ---------------------------------------------------------------------------
// Sélecteur principal
// ---------------------------------------------------------------------------

export function OnboardingDocSelector({ entityId, entityName, initialKit }: Props) {
  const [selected, setSelected]         = useState<Set<string>>(
    new Set(initialKit.map((k) => k.docId))
  );
  const [customizations, setCustomizations] = useState<CustomizationMap>(
    Object.fromEntries(initialKit.map((k) => [k.docId, k.customization]))
  );
  const [expanded, setExpanded]         = useState<Set<DocBloc>>(new Set(["poste"]));
  const [openDoc, setOpenDoc]           = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [saved, setSaved]               = useState(false);
  const [isPending, startTransition]    = useTransition();

  const generateDocs = Array.from(selected)
    .map((id) => DOC_CATALOG.find((d) => d.id === id))
    .filter((d): d is DocTemplate => d?.action === "generate");

  const collectDocs = Array.from(selected)
    .map((id) => DOC_CATALOG.find((d) => d.id === id))
    .filter((d): d is DocTemplate => d?.action === "collect");

  function toggleBloc(bloc: DocBloc) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(bloc) ? next.delete(bloc) : next.add(bloc);
      return next;
    });
  }

  function toggleDoc(doc: DocTemplate) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(doc.id) ? next.delete(doc.id) : next.add(doc.id);
      return next;
    });
    if (!selected.has(doc.id) && doc.action === "generate") {
      setOpenDoc(doc.id);
    }
  }

  function setField(docId: string, fieldName: string, value: string) {
    setCustomizations((prev) => ({
      ...prev,
      [docId]: { ...(prev[docId] ?? {}), [fieldName]: value },
    }));
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const docs = Array.from(selected).map((docId) => {
        const template = DOC_CATALOG.find((d) => d.id === docId)!;
        return {
          docId,
          label:         template.label,
          bloc:          template.bloc,
          action:        template.action,
          customization: customizations[docId] ?? {},
        };
      });
      const result = await saveDocKitAction(entityId, docs);
      if (!result.success) { setError(result.error); return; }
      setSaved(true);
    });
  }

  function openPrint() {
    const printUrl = `/employees/${entityId}/docs/print`;
    window.open(printUrl, "_blank");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

      {/* ── Colonne gauche : catalogue ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sélectionnez les documents à inclure dans le kit de{" "}
            <span className="font-semibold text-navy">{entityName}</span>.
          </p>
          <Badge variant="blue">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</Badge>
        </div>

        {BLOCS.map((bloc) => {
          const meta = BLOC_META[bloc];
          const docs = getDocsByBloc(bloc);
          const isOpen = expanded.has(bloc);
          const selectedInBloc = docs.filter((d) => selected.has(d.id)).length;

          return (
            <div key={bloc} className="overflow-hidden rounded-xl border bg-white">
              {/* Bloc header */}
              <button
                className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-warm/50 transition-colors"
                onClick={() => toggleBloc(bloc)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-lg border px-2.5 py-0.5 text-xs font-semibold", meta.color)}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {selectedInBloc > 0 && (
                    <span className="rounded-full bg-blue/10 px-2 py-0.5 text-xs font-semibold text-blue">
                      {selectedInBloc}
                    </span>
                  )}
                  {isOpen
                    ? <ChevronDown className="size-4 text-muted-foreground" />
                    : <ChevronRight className="size-4 text-muted-foreground" />
                  }
                </div>
              </button>

              {/* Docs list */}
              {isOpen && (
                <div className="border-t divide-y">
                  {docs.map((doc) => {
                    const isSelected = selected.has(doc.id);
                    const isOpen_ = openDoc === doc.id;
                    return (
                      <div key={doc.id}>
                        <div
                          className={cn(
                            "flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer",
                            isSelected ? "bg-blue/5" : "hover:bg-warm/40"
                          )}
                          onClick={() => toggleDoc(doc)}
                        >
                          {/* Checkbox */}
                          <div className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                            isSelected ? "border-blue bg-blue" : "border-border"
                          )}>
                            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-navy">{doc.label}</p>
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                doc.action === "generate"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                              )}>
                                {doc.action === "generate"
                                  ? <><FilePlus className="size-2.5" /> Générer</>
                                  : <><UploadCloud className="size-2.5" /> Collecter</>
                                }
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">{doc.description}</p>
                          </div>

                          {/* Expand customization */}
                          {isSelected && doc.action === "generate" && doc.fields && (
                            <button
                              className="shrink-0 text-muted-foreground hover:text-navy"
                              onClick={(e) => { e.stopPropagation(); setOpenDoc(isOpen_ ? null : doc.id); }}
                              type="button"
                            >
                              <ChevronDown className={cn("size-4 transition-transform", isOpen_ && "rotate-180")} />
                            </button>
                          )}
                        </div>

                        {/* Customization form */}
                        {isSelected && doc.action === "generate" && doc.fields && isOpen_ && (
                          <div className="border-t bg-slate-50/60 px-4 py-4 space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Personnaliser — {doc.label}
                            </p>
                            {doc.fields.map((field) => (
                              <div key={field.name} className="space-y-1.5">
                                <label className="text-xs font-medium text-navy">
                                  {field.label}
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </label>
                                {field.type === "textarea" ? (
                                  <textarea
                                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                                    placeholder={field.placeholder}
                                    value={customizations[doc.id]?.[field.name] ?? ""}
                                    onChange={(e) => setField(doc.id, field.name, e.target.value)}
                                  />
                                ) : (
                                  <input
                                    type={field.type}
                                    className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder={field.placeholder}
                                    value={customizations[doc.id]?.[field.name] ?? ""}
                                    onChange={(e) => setField(doc.id, field.name, e.target.value)}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Colonne droite : récap + actions ── */}
      <div className="space-y-4">
        <div className="sticky top-24 space-y-4">
          {/* Kit summary */}
          <div className="rounded-xl border bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-blue" />
              <p className="font-semibold text-navy">Kit d'intégration</p>
            </div>

            {selected.size === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sélectionnez des documents dans le catalogue.
              </p>
            ) : (
              <div className="space-y-3">
                {generateDocs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      À générer ({generateDocs.length})
                    </p>
                    <div className="space-y-1.5">
                      {generateDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 text-sm">
                          <FilePlus className="size-3.5 text-green-600 shrink-0" />
                          <span className="truncate text-navy">{doc.label}</span>
                          <button onClick={() => setSelected((p) => { const n = new Set(p); n.delete(doc.id); return n; })} type="button">
                            <X className="size-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {collectDocs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      À collecter ({collectDocs.length})
                    </p>
                    <div className="space-y-1.5">
                      {collectDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 text-sm">
                          <UploadCloud className="size-3.5 text-amber-600 shrink-0" />
                          <span className="truncate text-navy">{doc.label}</span>
                          <button onClick={() => setSelected((p) => { const n = new Set(p); n.delete(doc.id); return n; })} type="button">
                            <X className="size-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {saved && (
              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                ✓ Kit sauvegardé dans l'onboarding.
              </p>
            )}

            <div className="space-y-2 pt-2">
              <Button
                className="w-full"
                disabled={selected.size === 0 || isPending}
                onClick={handleSave}
                type="button"
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isPending ? "Sauvegarde…" : "Valider le kit"}
              </Button>

              {generateDocs.length > 0 && (
                <Button
                  className="w-full"
                  disabled={isPending}
                  onClick={openPrint}
                  type="button"
                  variant="outline"
                >
                  <Download className="size-4" />
                  Générer les PDF
                </Button>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-xl border bg-warm p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-navy text-sm">Conseils</p>
            <p>• <span className="text-green-700 font-medium">Générer</span> = documents à remettre au collaborateur.</p>
            <p>• <span className="text-amber-700 font-medium">Collecter</span> = documents à demander au collaborateur.</p>
            <p>• Chaque document crée une tâche dans l'onboarding.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
