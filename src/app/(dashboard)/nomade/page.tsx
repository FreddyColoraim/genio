export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { MapPin, Users } from "lucide-react";
import { UpgradeGate } from "@/components/dashboard/upgrade-gate";
import { NomadeContactForm } from "@/components/nomade/nomade-contact-form";
import { NomadeContactList } from "@/components/nomade/nomade-contact-list";
import { NomadeTrainerBriefing } from "@/components/nomade/nomade-trainer-briefing";
import { checkAccess } from "@/lib/access";
import { getNomadeContacts } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nomade — terrain & événements | Nexo RH",
};

async function getBriefs() {
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return [];

    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!membership) return [];

    const { data } = await admin
      .from("briefs")
      .select("id, title")
      .eq("tenant_id", membership.tenant_id)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    return (data ?? []).map((b) => ({ id: b.id as string, title: b.title as string }));
  } catch {
    return [];
  }
}

export default async function NomadePage() {
  const allowed = await checkAccess("nomade");
  if (!allowed) return <UpgradeGate feature="nomade" requiredPlan="business" />;

  const [contacts, briefs] = await Promise.all([
    getNomadeContacts().catch(() => []),
    getBriefs(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-blue" />
          <p className="text-sm font-semibold uppercase tracking-wide text-blue">Terrain</p>
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal md:text-3xl">Nomade</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Capturez des contacts en salon, assignez-les à une annonce et briefez votre formateur — tout depuis votre téléphone.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">

        {/* Colonne gauche — formulaire de capture */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-navy">
              <MapPin className="size-4 text-blue" />
              Nouveau contact terrain
            </h3>
            <NomadeContactForm briefs={briefs} />
          </div>

          <NomadeTrainerBriefing contacts={contacts} />
        </div>

        {/* Colonne droite — liste contacts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-navy">
              Contacts capturés
              {contacts.length > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-blue/10 px-2 py-0.5 text-xs font-medium text-blue">
                  {contacts.length}
                </span>
              )}
            </h3>
          </div>
          <NomadeContactList contacts={contacts} />
        </div>
      </div>
    </div>
  );
}
