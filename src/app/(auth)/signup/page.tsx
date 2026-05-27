export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signUp } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkspaceIndustry } from "@/types/workspace";

const signupErrorMessages: Record<string, string> = {
  auth_database_error: "Supabase Auth n'arrive pas à enregistrer l'utilisateur. Vérifiez les logs Supabase/Auth.",
  email_already_registered: "Cet email est déjà associé à un compte.",
  invalid_email: "L'adresse email n'est pas valide.",
  invalid_signup_fields: "Renseignez un workspace, un email valide et un mot de passe de 6 caractères minimum.",
  rate_limit: "Trop de tentatives d'inscription. Réessayez dans quelques minutes.",
  signup_disabled: "Les inscriptions sont désactivées côté Supabase Auth.",
  signup_failed: "L'inscription a échoué. Vérifiez les paramètres Supabase Auth.",
  weak_password: "Le mot de passe doit contenir au moins 6 caractères.",
  workspace_setup_failed: "Le compte a été créé, mais la création du workspace a échoué."
};

const signupProfiles: Record<
  string,
  {
    description: string;
    industry: WorkspaceIndustry;
    label: string;
    workspacePlaceholder: string;
  }
> = {
  associations: {
    description: "Un masque d'inscription pour suivre salaries, benevoles et missions.",
    industry: "services",
    label: "Associations",
    workspacePlaceholder: "Association Horizon"
  },
  "commerce-distribution": {
    description: "Un masque d'inscription adapte aux magasins, equipes et recrutements recurrents.",
    industry: "retail",
    label: "Commerce & distribution",
    workspacePlaceholder: "Maison Retail"
  },
  "hotellerie-restauration": {
    description: "Un masque d'inscription adapte aux saisonniers, shifts et arrivees terrain.",
    industry: "restaurant",
    label: "Hotellerie & restauration",
    workspacePlaceholder: "Restaurant Le Central"
  },
  "industrie-btp": {
    description: "Un masque d'inscription adapte aux habilitations, materiel et consignes terrain.",
    industry: "services",
    label: "Industrie & BTP",
    workspacePlaceholder: "Atelier Martin"
  },
  "sante-medico-social": {
    description: "Un masque d'inscription adapte aux dossiers, contraintes et roulements.",
    industry: "services",
    label: "Sante & medico-social",
    workspacePlaceholder: "Centre Sainte Claire"
  },
  "services-a-la-personne": {
    description: "Un masque d'inscription adapte aux interventions, plannings et suivis terrain.",
    industry: "services",
    label: "Services a la personne",
    workspacePlaceholder: "Aide & Presence"
  },
  "tech-startup": {
    description: "Un masque d'inscription adapte aux acces, outils et objectifs des 30 premiers jours.",
    industry: "office",
    label: "Tech & startup",
    workspacePlaceholder: "Nexo Studio"
  },
  "transport-logistique": {
    description: "Un masque d'inscription adapte aux permis, depots et tournees.",
    industry: "transport",
    label: "Transport & logistique",
    workspacePlaceholder: "Logispeed"
  }
};

const signupProfileOptions = Object.entries(signupProfiles).map(([value, profile]) => ({
  label: profile.label,
  value
}));

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; profile?: string }>;
}) {
  // Redirige les utilisateurs déjà connectés
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { error, profile } = await searchParams;
  const errorMessage = error ? signupErrorMessages[error] : null;
  const selectedProfile = profile ? signupProfiles[profile] : null;
  const defaultProfile = selectedProfile && profile ? profile : "services-a-la-personne";

  return (
    <AuthCard
      title={selectedProfile ? `Créer un profil ${selectedProfile.label}` : "Créer votre espace"}
      description={
        selectedProfile
          ? selectedProfile.description
          : "Configurez un hub d'onboarding moderne pour votre équipe."
      }
      footer={
        <p className="text-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <Link className="font-medium text-blue" href="/login">
            Se connecter
          </Link>
        </p>
      }
    >
      <form action={signUp} className="space-y-4">
        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        {selectedProfile ? (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
            <p className="font-semibold">Profil sélectionné : {selectedProfile.label}</p>
            <p className="mt-1 text-orange-700">
              Le compte sera préparé avec ce secteur pour proposer les bons scénarios d'arrivée.
            </p>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="workspace">Espace de travail</Label>
          <Input
            id="workspace"
            name="workspace"
            placeholder={selectedProfile?.workspacePlaceholder ?? "Acme People"}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile">Secteur d'activité</Label>
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            defaultValue={defaultProfile}
            id="profile"
            name="profile"
          >
            {signupProfileOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input name="industry" type="hidden" value={selectedProfile?.industry ?? "services"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel</Label>
          <Input id="email" name="email" placeholder="people@company.com" required type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            minLength={6}
            name="password"
            placeholder="********"
            required
            type="password"
          />
        </div>
        <Button className="w-full" type="submit">
          Démarrer l'onboarding
        </Button>
      </form>
    </AuthCard>
  );
}
