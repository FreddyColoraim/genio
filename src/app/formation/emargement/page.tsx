export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTrainingSessions } from "@/services/training-service";
import type { TrainingSession } from "@/services/training-config";
import { EmargementClient } from "@/components/nomade-formation/emargement-client";

async function getTenantId() {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();
  const { data: m } = await admin
    .from("memberships").select("tenant_id")
    .eq("user_id", user.id).eq("is_active", true).single();
  if (!m) redirect("/login");
  return m.tenant_id as string;
}

async function getSessionParticipants(
  tenantId: string,
  sessionIds: string[],
): Promise<Record<string, { id: string; name: string }[]>> {
  if (sessionIds.length === 0) return {};
  const admin = createAdminClient();
  const { data } = await admin
    .from("training_assignments")
    .select("session_id, entity_id, entities(first_name, last_name)")
    .eq("tenant_id", tenantId)
    .in("session_id", sessionIds);

  const result: Record<string, { id: string; name: string }[]> = {};
  for (const row of data ?? []) {
    const entity = row.entities as unknown as { first_name: string | null; last_name: string | null } | null;
    const name = [entity?.first_name, entity?.last_name].filter(Boolean).join(" ") || "—";
    if (!result[row.session_id]) result[row.session_id] = [];
    (result[row.session_id] as { id: string; name: string }[]).push({ id: row.entity_id, name });
  }
  return result;
}

export default async function EmargementPage() {
  const tenantId = await getTenantId();
  const sessions = await getTrainingSessions().catch(() => [] as TrainingSession[]);
  const participants = await getSessionParticipants(tenantId, sessions.map((s) => s.id));

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="bg-[#0B3D2E] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Link href={"/formation" as never} className="text-white/70 hover:text-white">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-xl">Émargement</h1>
            <p className="text-white/60 text-xs mt-0.5">Feuille de présence &amp; QR</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <EmargementClient sessions={sessions} participants={participants} />
      </div>
    </div>
  );
}
