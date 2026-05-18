import { UploadDocumentModal } from "@/components/dashboard/upload-document-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateDocumentStatusAction } from "@/app/(dashboard)/documents/actions";
import {
  documentStatusLabels,
  getDocumentsData,
  type DocumentStatus
} from "@/services/document-service";

export const dynamic = "force-dynamic";

const statusOptions: DocumentStatus[] = ["pending", "review", "signed"];

export default async function DocumentsPage() {
  const { documents, employees } = await getDocumentsData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Documents</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Déposez, vérifiez et stockez les fichiers d'onboarding avec Supabase Storage.
          </p>
        </div>
        <UploadDocumentModal employees={employees} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Documents récents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-white p-6 text-sm text-muted-foreground">
              Aucun document n'a encore été déposé. Ajoutez un collaborateur, puis associez-lui un
              fichier d'onboarding.
            </div>
          ) : null}
          {documents.map((document) => (
            <div
              className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-[1.3fr_1fr_auto]"
              key={document.id}
            >
              <div>
                <p className="font-medium">{document.name}</p>
                <p className="text-sm text-muted-foreground">{document.employeeName}</p>
              </div>
              <div className="flex items-center">
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
                  className="h-9 rounded-lg border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  defaultValue={document.status}
                  name="status"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {documentStatusLabels[status]}
                    </option>
                  ))}
                </select>
                <Button size="sm" type="submit" variant="outline">
                  Mettre à jour
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
