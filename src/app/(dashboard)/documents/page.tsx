import { UploadDocumentModal } from "@/components/dashboard/upload-document-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const documents = [
  { name: "Contrat de travail", owner: "Maya Chen", status: "Signé" },
  { name: "Pièce d'identité", owner: "Noah Martin", status: "À vérifier" },
  { name: "Formulaire matériel", owner: "Lina Gomez", status: "En attente" }
];

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Documents</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Déposez, vérifiez et stockez les fichiers d'onboarding avec Supabase Storage.
          </p>
        </div>
        <UploadDocumentModal />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Documents récents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.map((document) => (
            <div
              className="flex items-center justify-between rounded-lg border bg-white p-4"
              key={document.name}
            >
              <div>
                <p className="font-medium">{document.name}</p>
                <p className="text-sm text-muted-foreground">{document.owner}</p>
              </div>
              <Badge variant={document.status === "Signé" ? "success" : "soft"}>
                {document.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
