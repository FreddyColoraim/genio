export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, ChevronRight, Clock, MapPin, RefreshCw, Users } from "lucide-react";
import { createClient }        from "@/lib/supabase/server";
import { createAdminClient }   from "@/lib/supabase/admin";
import { getTrainingSessions }  from "@/services/training-service";

async function getFormationData() {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return null;
    const admin = createAdminClient();
    const { data: m } = await admin
      .from("memberships").select("tenant_id")
      .eq("user_id", user.id).eq("is_active", true).single();
    if (!m) return null;

    const tenantId  = m.tenant_id as string;
    const firstName = user.email?.split("@")[0] ?? "Formateur";
    const sessions  = await getTrainingSessions().catch(() => []);

    const { count: pendingEmargement } = await admin
      .from("training_assignments").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).is("completed_at", null);

    const { data: toCorrectData } = await admin
      .from("questionnaire_responses").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).is("corrected_at", null);

    return {
      firstName,
      kpis: {
        sessions:   sessions.length,
        emargement: pendingEmargement ?? 0,
        toCorrect:  (toCorrectData as unknown as { count: number } | null)?.count ?? 0,
        transfer:   0,
      },
      nextSession: sessions[0] ?? null,
    };
  } catch { return null; }
}

function KpiChip({ value, label, bg, val, lbl }: { value: number; label: string; bg: string; val: string; lbl: string }) {
  return (
    <div className={`${bg} rounded-2xl p-3 flex flex-col items-center gap-1`}>
      <p className={`text-2xl font-black leading-none ${val}`}>{value}</p>
      <p className={`text-[10px] font-semibold text-center leading-tight ${lbl}`}>{label}</p>
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: "/formation/sessions",     label: "Mes\nsessions",        emoji: "📅", bg: "bg-green-100"  },
  { href: "/formation/participants", label: "Liste\nparticipants",  emoji: "👥", bg: "bg-orange-100" },
  { href: "/formation/emargement",   label: "Émar-\ngement",        emoji: "📋", bg: "bg-red-100"    },
  { href: "/formation/exercises",    label: "Exercices",             emoji: "📚", bg: "bg-blue-100"   },
  { href: "/formation/voice",        label: "Note\nvocale",         emoji: "🎤", bg: "bg-purple-100" },
  { href: "/formation/transfer",     label: "Rapports\n& transfert",emoji: "📤", bg: "bg-indigo-100" },
] as const;

export default async function FormationHome() {
  const data = await getFormationData();
  if (!data) redirect("/login");
  const { firstName, kpis, nextSession } = data;

  return (
    <div className="flex flex-col pb-24">
      {/* Header forest green */}
      <div className="bg-[#0B3D2E] px-5 pb-6 pt-3">
        <div className="flex items-center justify-between mb-5">
          <button className="space-y-1.5 p-1">
            <span className="block h-0.5 w-5 rounded bg-white/80" />
            <span className="block h-0.5 w-3.5 rounded bg-white/50" />
            <span className="block h-0.5 w-4.5 rounded bg-white/70" />
          </button>
          <div className="text-center">
            <p className="text-xs font-black tracking-wider text-white">NOMADE</p>
            <p className="text-[10px] text-white/50">Formateur Interne</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="size-5 text-white/70" />
              {kpis.emargement > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {kpis.emargement}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="size-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-sm font-bold text-white">
                {firstName[0]?.toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-400 border-2 border-[#0B3D2E]" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-black text-white mb-1">
          👋 Bienvenu {firstName.charAt(0).toUpperCase() + firstName.slice(1)} !
        </h1>
        <p className="text-sm text-white/55 mb-3">Préparez et animez vos formations</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/15 px-3 py-1 text-[11px] font-semibold text-green-300">
          <span className="size-1.5 rounded-full bg-green-400" />Hors ligne · Données locales
        </span>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-400/20">
            <span className="text-lg">🎓</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45 mb-1">Mission du jour</p>
            <p className="text-sm font-bold text-white truncate">{nextSession?.title ?? "Aucune session planifiée"}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-white/55"><Clock className="size-3" />09:30–16:30</span>
              <span className="flex items-center gap-1 text-[10px] text-white/55"><MapPin className="size-3" />Salle A – Lyon</span>
            </div>
          </div>
          <ChevronRight className="size-4 text-white/30 shrink-0" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 p-4">
        <div className="grid grid-cols-4 gap-2">
          <KpiChip value={kpis.sessions}   label="Sessions\nà venir"     bg="bg-green-50"  val="text-green-700"  lbl="text-green-500"  />
          <KpiChip value={kpis.emargement} label="Émargt.\nen attente"   bg="bg-orange-50" val="text-orange-700" lbl="text-orange-500" />
          <KpiChip value={kpis.toCorrect}  label="Exercices\nà corriger" bg="bg-blue-50"   val="text-blue-700"   lbl="text-blue-500"   />
          <KpiChip value={kpis.transfer}   label="Transfert\nNexo RH"    bg="bg-purple-50" val="text-purple-700" lbl="text-purple-500" />
        </div>

        {nextSession && (
          <div>
            <p className="mb-3 text-sm font-bold text-[#0B3D2E]">Prochaine session</p>
            <Link href={"/formation/sessions" as never} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#0B3D2E]">
                <span className="text-lg font-black leading-none text-white">12</span>
                <span className="text-[9px] font-bold uppercase text-white/60">MAI</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0B3D2E]">{nextSession.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="size-3" />09:30–16:30</span>
                  <span className="flex items-center gap-1"><MapPin className="size-3" />Salle A</span>
                </div>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                  <Users className="size-2.5" />{nextSession.assignedCount} participants
                </span>
              </div>
              <ChevronRight className="size-4 text-slate-300 shrink-0 mt-1" />
            </Link>
          </div>
        )}

        <div>
          <p className="mb-3 text-sm font-bold text-[#0B3D2E]">Accès rapides</p>
          <div className="grid grid-cols-3 gap-2.5">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.href} href={a.href as never} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
                <div className={`${a.bg} flex size-10 items-center justify-center rounded-xl text-lg`}>{a.emoji}</div>
                <span className="text-center text-[10px] font-bold leading-tight text-[#0B3D2E] whitespace-pre-line">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {kpis.emargement > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-base">🔴</div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-red-800">Feuilles d'émargement en attente</p>
              <p className="text-[10px] text-red-600">{kpis.emargement} session{kpis.emargement > 1 ? "s" : ""} à finaliser.</p>
            </div>
            <span className="flex size-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shrink-0">{kpis.emargement}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-base">⚠️</span>
            <div>
              <p className="text-[11px] font-bold text-amber-800">Vous travaillez hors ligne</p>
              <p className="text-[10px] text-amber-600">Sync dès le retour du réseau.</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-xl bg-[#0B3D2E] px-3 py-2 text-[11px] font-bold text-white shrink-0">
            <RefreshCw className="size-3" />Sync
          </button>
        </div>
      </div>
    </div>
  );
}
