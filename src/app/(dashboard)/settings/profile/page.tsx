import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProfile } from "@/services/profile-service";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata: Metadata = { title: "Mon profil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getProfile().catch(() => null);

  if (!profile) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
        Impossible de charger le profil. Veuillez vous reconnecter.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link
          href={"/settings" as never}
          className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy transition-colors"
        >
          <ArrowLeft className="size-4" />
          Paramètres
        </Link>
        <div>
          <h2 className="text-2xl font-semibold">Mon profil</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifiez vos informations personnelles et votre mot de passe.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
