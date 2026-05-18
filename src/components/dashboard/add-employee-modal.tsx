"use client";

import { UserPlus } from "lucide-react";
import { createEmployeeAction } from "@/app/(dashboard)/employees/actions";
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

export function AddEmployeeModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Ajouter un collaborateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Ajouter un collaborateur</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Créez un parcours d'onboarding dans votre workspace.
          </DialogDescription>
        </DialogHeader>
        <form action={createEmployeeAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input id="fullName" name="fullName" placeholder="Maya Chen" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="maya@company.com"
                required
                type="email"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Poste</Label>
              <Input id="title" name="title" placeholder="Designer produit" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Département</Label>
              <Input id="department" name="department" placeholder="Produit" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="managerName">Manager</Label>
              <Input id="managerName" name="managerName" placeholder="Alex Morgan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Date d'arrivée</Label>
              <Input id="startDate" name="startDate" required type="date" />
            </div>
          </div>
          <Button className="w-full" type="submit">
            Créer le parcours
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
