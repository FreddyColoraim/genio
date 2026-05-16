import Link from "next/link";
import { signIn } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
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
        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel</Label>
          <Input id="email" name="email" placeholder="hr@nexo-rh.com" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" placeholder="********" type="password" />
        </div>
        <Button className="w-full" type="submit">
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
