"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { updateWorkspaceProfileAction, updateTenantNameAction } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  workspaceIndustryLabels,
  type WorkspaceIndustry,
  type WorkspaceProfile,
} from "@/types/workspace";

const industryOptions = Object.keys(workspaceIndustryLabels) as WorkspaceIndustry[];

export function WorkspaceProfileForm({ profile }: { profile: WorkspaceProfile | null }) {
  const [nameValue, setNameValue]     = useState(profile?.name ?? "");
  const [nameSaved, setNameSaved]     = useState(false);
  const [nameError, setNameError]     = useState<string | null>(null);
  const [isPendingName, startName]    = useTransition();
  const [isPendingProfile, startProfile] = useTransition();
  const [profileSaved, setProfileSaved] = useState(false);

  function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    startName(async () => {
      setNameError(null);
      setNameSaved(false);
      const fd = new FormData();
      fd.set("name", nameValue);
      const result = await updateTenantNameAction(fd);
      if (!result.success) { setNameError(result.error ?? "Erreur"); return; }
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    });
  }

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startProfile(async () => {
      setProfileSaved(false);
      await updateWorkspaceProfileAction(fd);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Nom de l'entreprise */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-navy">Nom de l'entreprise</Label>
        <form onSubmit={handleNameSave} className="flex gap-2 max-w-sm">
          <Input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder="Nom de votre organisation"
            className="flex-1"
          />
          <Button type="submit" variant="outline" disabled={isPendingName}>
            {isPendingName ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {nameSaved ? "Sauvegardé ✓" : "Sauvegarder"}
          </Button>
        </form>
        {nameError && (
          <p className="text-sm text-destructive">{nameError}</p>
        )}
      </div>

      <div className="border-t" />

      {/* Industry + team size + operating mode */}
      <form onSubmit={handleProfileSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="industry">Secteur d'activité</Label>
            <select
              className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={profile?.industry ?? "services"}
              id="industry"
              name="industry"
            >
              {industryOptions.map((industry) => (
                <option key={industry} value={industry}>
                  {workspaceIndustryLabels[industry]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamSize">Taille d'équipe</Label>
            <Input
              defaultValue={profile?.teamSize}
              id="teamSize"
              name="teamSize"
              placeholder="1-10, 11-50, 50+"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operatingMode">Organisation</Label>
            <Input
              defaultValue={profile?.operatingMode}
              id="operatingMode"
              name="operatingMode"
              placeholder="Horaires, équipes, sites..."
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPendingProfile}>
            {isPendingProfile ? <Loader2 className="size-4 animate-spin" /> : null}
            {isPendingProfile ? "Sauvegarde…" : "Enregistrer le profil"}
          </Button>
          {profileSaved && (
            <span className="text-sm text-green-700">✓ Profil mis à jour</span>
          )}
        </div>
      </form>
    </div>
  );
}
