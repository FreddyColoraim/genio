export const dynamic = "force-dynamic";

import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/app/(auth)/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Saisissez votre email professionnel — vous recevrez un lien de réinitialisation."
      footer={
        <p className="text-sm text-muted-foreground">
          Vous vous souvenez ?{" "}
          <Link className="font-medium text-blue" href="/login">
            Se connecter
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Email envoyé — vérifiez votre boîte de réception et vos spams.
        </div>
      ) : (
        <form action={forgotPassword} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error === "invalid_email"
                ? "Adresse email invalide."
                : "Une erreur est survenue. Réessayez."}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel</Label>
            <Input
              id="email"
              name="email"
              placeholder="hr@entreprise.com"
              required
              type="email"
            />
          </div>
          <Button className="w-full" type="submit">
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
