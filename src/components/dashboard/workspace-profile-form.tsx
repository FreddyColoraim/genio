import { updateWorkspaceProfileAction } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  workspaceIndustryLabels,
  type WorkspaceIndustry,
  type WorkspaceProfile
} from "@/types/workspace";

const industryOptions = Object.keys(workspaceIndustryLabels) as WorkspaceIndustry[];

export function WorkspaceProfileForm({ profile }: { profile: WorkspaceProfile | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil d'entreprise</CardTitle>
        <CardDescription>
          Ces informations adaptent les scénarios d'onboarding aux réalités terrain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updateWorkspaceProfileAction} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="industry">Secteur</Label>
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
          <div className="md:col-span-3">
            <Button type="submit">Enregistrer le profil</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
