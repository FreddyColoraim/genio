import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, FileText, FolderOpen, Upload } from "lucide-react";
import { UploadDocumentModal } from "@/components/dashboard/upload-document-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateDocumentStatusAction } from "@/app/(dashboard)/documents/actions";
import {
  documentStatusLabels,
  getDocumentsData,
  type DocumentStatus,
} from "@/services/document-service";
import { getTeamMembers } from "@/services/team-service";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

const statusOptions: DocumentStatus[] = ["pending", "review", "signed"];

export default async function DocumentsPage() {
  const [{ documents, employees }, teamMembers] = await Promise.all([
    getDocumentsData().catch(() => ({ documents: [], employees: [] })),
    getTeamMembers().catch(() => []),
  ]);

  // Agréger les kit docs (onboarding_tasks category=document) depuis teamMembers
  type KitDoc = {
    id: string;
    entityId: string;
    entityName: string;
    name: string;
    action: "collect" | "generate";
    completedAt: string | null;
    bloc: string;
  };

  const kitDocsList: KitDoc[] = [];
  for (const member of teamMembers) {
    if (!member.onboardingId) continue;
    // We don't have tasks here directly — we rely on member.pendingDocuments
  }

  // Stats
  const totalUploaded = documents.length;
  const pendingDocs   = documents.filter((d) => d.status !== "signed").length;
  const signedDocs    = documents.filter((d) => d.status === "signed").length;
  const kitDocsPending = teamMembers.reduce((acc, m) => acc + m.pendingDocuments, 0);

  const stats = [
    { label: "Documents uploadés", value: totalUploaded, icon: FileText,    color: "text-blue",      bg: "bg-blue/5" },
    { label: "En attente",         value: pendingDocs,   icon: Clock,       color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Validés",            value: signedDocs,    icon: CheckCircle2,color: "text-green-600", bg: "bg-green-50" },
    { label: "Kit docs à collecter", value: kitDocsPending, icon: FolderOpen, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Déposez, vérifiez et suivez les fichiers d'onboarding.
          </p>
        </div>
        <UploadDocumentModal employees={employees} />
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
            <span className={`flex size-9 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon className={`size-5 ${s.color}`} />
            </span>
            <div>
              <p className="text-2xl font-bold text-navy">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kit docs en attente section */}
      {kitDocsPending > 0 && (
        <div className="rounded-xl border bg-amber-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-900">
              <FolderOpen className="inline size-4 mr-1.5 -mt-0.5" />
              {kitDocsPending} document{kitDocsPending > 1 ? "s" : ""} de kit à collecter
            </p>
            <Link href={"/team" as never} className="text-xs text-amber-700 hover:underline">
              Voir l'équipe →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers
              .filter((m) => m.pendingDocuments > 0)
              .slice(0, 6)
              .map((m) => (
                <Link
                  key={m.id}
                  href={`/team/${m.id}` as never}
                  className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm hover:border-amber-300 transition-colors"
                >
                  <span className="truncate font-medium text-navy">{m.name}</span>
                  <Badge variant="soft">
                    {m.pendingDocuments} doc{m.pendingDocuments > 1 ? "s" : ""}
                  </Badge>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Uploaded documents list */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-warm/30">
          <p className="text-sm font-semibold text-navy flex items-center gap-2">
            <Upload className="size-4" />
            Documents uploadés ({totalUploaded})
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucun document déposé. Utilisez le bouton "Ajouter" pour uploader un fichier.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {documents.map((document) => (
              <div
                className="grid gap-4 px-4 py-3.5 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-center hover:bg-warm/20 transition-colors"
                key={document.id}
              >
                <div>
                  <p className="font-medium text-navy">{document.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(document.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <Link
                    href={`/team/${document.entityId}` as never}
                    className="text-sm text-blue hover:underline"
                  >
                    {document.entityName}
                  </Link>
                </div>
                <div>
                  <Badge variant={document.status === "signed" ? "success" : "soft"}>
                    {documentStatusLabels[document.status]}
                  </Badge>
                </div>
                <form
                  action={updateDocumentStatusAction}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <input name="documentId" type="hidden" value={document.id} />
                  <select
                    className="h-8 rounded-lg border border-input bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={document.status}
                    name="status"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {documentStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" type="submit" variant="outline" className="h-8 text-xs">
                    Mettre à jour
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
