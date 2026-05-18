"use client";

import { Upload } from "lucide-react";
import { createDocumentAction } from "@/app/(dashboard)/documents/actions";
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
import type { DocumentEmployeeOption } from "@/services/document-service";

export function UploadDocumentModal({ employees }: { employees: DocumentEmployeeOption[] }) {
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
        <form action={createDocumentAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Collaborateur</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={employees.length === 0}
              id="employeeId"
              name="employeeId"
              required
            >
              <option value="">Choisir un collaborateur</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nom du document</Label>
            <Input id="name" name="name" placeholder="Contrat de travail" required />
          </div>
          <div className="rounded-lg border border-dashed bg-warm p-6 text-center">
            <Upload className="mx-auto size-6 text-blue" />
            <Label className="mt-3 block text-sm font-medium" htmlFor="file">
              Fichier à déposer
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">PDF, PNG ou DOCX jusqu'à 20 Mo</p>
            <Input
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="mt-4"
              id="file"
              name="file"
              required
              type="file"
            />
          </div>
          <Button className="w-full" disabled={employees.length === 0} type="submit">
            Enregistrer dans Supabase Storage
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
