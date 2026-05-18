import Link from "next/link";
import { signIn } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginErrorMessages: Record<string, string> = {
  email_not_confirmed: "Votre email n'est pas encore confirmé. Vérifiez votre boîte mail ou désactivez la confirmation email dans Supabase Auth pour la V1.",
  invalid_credentials: "Email ou mot de passe incorrect.",
  invalid_email: "L'adresse email n'est pas valide.",
  missing_credentials: "Renseignez votre email et votre mot de passe.",
  signin_failed: "La connexion a échoué. Vérifiez les paramètres Supabase Auth."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? loginErrorMessages[error] : null;

  return (
    <AuthCard
      title="Connexion a Nexo RH"
      description="Pilotez l'onboarding, les documents et la progression des collaborateurs."
      footer={
        <p className="text-sm text-muted-foreground">
          Nouveau sur Nexo RH ?{" "}
          <Link className="font-medium text-blue" href="/signup">
            Créer un espace
          </Link>
        </p>
      }
    >
      <form action={signIn} className="space-y-4">
        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel</Label>
          <Input id="email" name="email" placeholder="hr@nexo-rh.com" required type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" placeholder="********" required type="password" />
        </div>
        <Button className="w-full" type="submit">
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
