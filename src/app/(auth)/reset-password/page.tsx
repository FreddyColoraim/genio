export const dynamic = "force-dynamic";

import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/app/(auth)/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthCard
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe sécurisé d'au moins 8 caractères."
      footer={
        <p className="text-sm text-muted-foreground">
          <Link className="font-medium text-blue" href="/login">
            Retour à la connexion
          </Link>
        </p>
      }
    >
      <form action={resetPassword} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error === "password_mismatch"
              ? "Les mots de passe ne correspondent pas."
              : error === "weak_password"
              ? "Mot de passe trop court — 8 caractères minimum."
              : "Une erreur est survenue. Réessayez."}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input
            id="password"
            minLength={8}
            name="password"
            placeholder="••••••••"
            required
            type="password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <Input
            id="confirm"
            minLength={8}
            name="confirm"
            placeholder="••••••••"
            required
            type="password"
          />
        </div>
        <Button className="w-full" type="submit">
          Définir le mot de passe
        </Button>
      </form>
    </AuthCard>
  );
}
