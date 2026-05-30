export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Assignment = {
  id: string;
  entityName: string;
  sessionTitle: string;
  sessionId: string;
  completedAt: string | null;
  assignedAt: string;
};

async function getParticipants(): Promise<Assignment[]> {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!membership) redirect("/login");

  const { data, error } = await admin
    .from("training_assignments")
    .select("id, assigned_at, completed_at, session_id, entity_id, training_sessions(title), entities(first_name, last_name)")
    .eq("tenant_id", membership.tenant_id)
    .order("assigned_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const session = row.training_sessions as unknown as { title: string } | null;
    const entity = row.entities as unknown as { first_name: string | null; last_name: string | null } | null;
    return {
      id: row.id,
      entityName: [entity?.first_name, entity?.last_name].filter(Boolean).join(" ") || "—",
      sessionTitle: session?.title ?? "—",
      sessionId: row.session_id,
      completedAt: row.completed_at ?? null,
      assignedAt: row.assigned_at,
    };
  });
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

export default async function ParticipantsPage() {
  const assignments = await getParticipants().catch(() => [] as Assignment[]);

  // Group by sessionId -> sessionTitle
  const grouped = new Map<string, { title: string; items: Assignment[] }>();
  for (const a of assignments) {
    if (!grouped.has(a.sessionId)) {
      grouped.set(a.sessionId, { title: a.sessionTitle, items: [] });
    }
    grouped.get(a.sessionId)!.items.push(a);
  }

  const total = assignments.length;

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="bg-[#0B3D2E] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Link href={"/formation" as never} className="text-white/70 hover:text-white">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-xl">Participants</h1>
            <p className="text-white/60 text-xs mt-0.5">
              {total} assignation{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-6">
        {assignments.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm p-8 text-center">
            <p className="font-semibold text-[#0B3D2E]">Aucun participant</p>
            <p className="text-sm text-slate-500 mt-1">Assignez des stagiaires à des sessions depuis Nexo RH.</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([sessionId, group]) => (
            <div key={sessionId}>
              <h2 className="text-xs font-bold text-[#0B3D2E] uppercase tracking-wider mb-3">
                {group.title}
              </h2>
              <div className="flex flex-col gap-2">
                {group.items.map((a) => (
                  <div key={a.id} className="rounded-2xl bg-white shadow-sm p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0B3D2E] text-sm truncate">{a.entityName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Assigné le {formatDate(a.assignedAt)}</p>
                    </div>
                    {a.completedAt ? (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="size-3" /> Complété
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{formatDate(a.completedAt)}</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 shrink-0">
                        <Clock className="size-3" /> En cours
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
