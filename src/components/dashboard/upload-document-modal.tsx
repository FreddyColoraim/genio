"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadDocumentModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4" />
          Ajouter un document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Ajouter un document</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Ajoutez un fichier d'onboarding et associez-le à un collaborateur.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Collaborateur</Label>
            <Input id="employee" placeholder="Maya Chen" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document-type">Type de document</Label>
            <Input id="document-type" placeholder="Contrat de travail" />
          </div>
          <div className="rounded-lg border border-dashed bg-warm p-6 text-center">
            <Upload className="mx-auto size-6 text-blue" />
            <p className="mt-3 text-sm font-medium">Déposez le fichier ici</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, PNG ou DOCX jusqu'à 20 Mo</p>
          </div>
          <Button className="w-full" type="submit">
            Enregistrer dans Supabase Storage
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
