import Link from "next/link";
import { signUp } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? signupErrorMessages[error] : null;

  return (
    <AuthCard
      title="Créer votre espace"
      description="Configurez un hub d'onboarding moderne pour votre équipe."
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
        <div className="space-y-2">
          <Label htmlFor="workspace">Espace de travail</Label>
          <Input id="workspace" name="workspace" placeholder="Acme People" required />
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
