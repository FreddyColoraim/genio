import Link from "next/link";
import { signUp } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
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
        <div className="space-y-2">
          <Label htmlFor="workspace">Espace de travail</Label>
          <Input id="workspace" name="workspace" placeholder="Acme People" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel</Label>
          <Input id="email" name="email" placeholder="people@company.com" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" placeholder="********" type="password" />
        </div>
        <Button className="w-full" type="submit">
          Démarrer l'onboarding
        </Button>
      </form>
    </AuthCard>
  );
}
