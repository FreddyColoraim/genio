export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { BookOpen, ClipboardList, MapPin } from "lucide-react";
import { UpgradeGate }            from "@/components/dashboard/upgrade-gate";
import { NomadeContactForm }      from "@/components/nomade/nomade-contact-form";
import { NomadeContactList }      from "@/components/nomade/nomade-contact-list";
import { NomadeTrainerBriefing }  from "@/components/nomade/nomade-trainer-briefing";
import { NomadeSessions }         from "@/components/nomade/nomade-sessions";
import { NomadeQuestionnaires }   from "@/components/nomade/nomade-questionnaires";
import { NomadeTabs }             from "@/components/nomade/nomade-tabs";
import { checkAccess }            from "@/lib/access";
import { getNomadeContacts }      from "./actions";
import { getTrainingSessions }    from "@/services/training-service";
import { getQuestionnaires }      from "@/services/questionnaire-service";
import { createAdminClient }      from "@/lib/supabase/admin";
import { createClient }           from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nomade — terrain & formations | Nexo RH",
};

async function getBriefs() {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return [];
    const admin = createAdminClient();
    const { data: m } = await admin.from("memberships").select("tenant_id").eq("user_id", user.id).eq("is_active", true).single();
    if (!m) return [];
    const { data } = await admin.from("briefs").select("id, title").eq("tenant_id", m.tenant_id).eq("status", "open").order("created_at", { ascending: false });
    return (data ?? []).map((b) => ({ id: b.id as string, title: b.title as string }));
  } catch { return []; }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function NomadePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const allowed = await checkAccess("nomade");
  if (!allowed) return <UpgradeGate feature="nomade" requiredPlan="business" />;

  const { tab = "contacts" } = await searchParams;

  const [contacts, briefs, sessions, questionnaires] = await Promise.all([
    getNomadeContacts().catch(() => []),
    getBriefs(),
    getTrainingSessions().catch(() => []),
    getQuestionnaires().catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-blue" />
          <p className="text-sm font-semibold uppercase tracking-wide text-blue">Terrain</p>
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal md:text-3xl">Nomade</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture terrain · Pipeline auto · Formations rookies · Questionnaires offline
        </p>
      </div>

      {/* Onglets navigation (client) */}
      <NomadeTabs activeTab={tab} counts={{ contacts: contacts.length, formations: sessions.length, questionnaires: questionnaires.length }} />

      {/* Onglet Contacts */}
      {tab === "contacts" && (
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-navy">
                <MapPin className="size-4 text-blue" />Nouveau contact terrain
              </h3>
              <NomadeContactForm briefs={briefs} />
            </div>
            <NomadeTrainerBriefing contacts={contacts} />
          </div>
          <NomadeContactList contacts={contacts} />
        </div>
      )}

      {/* Onglet Formations */}
      {tab === "formations" && (
        <NomadeSessions sessions={sessions} />
      )}

      {/* Onglet Questionnaires */}
      {tab === "questionnaires" && (
        <NomadeQuestionnaires
          questionnaires={questionnaires}
          sessions={sessions}
          appUrl={APP_URL}
        />
      )}
    </div>
  );
}
