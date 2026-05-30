export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, ChevronRight, Clock, MapPin, RefreshCw } from "lucide-react";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNomadeContacts } from "@/app/(dashboard)/nomade/actions";

async function getHomeData() {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return null;
    const admin = createAdminClient();
    const { data: m } = await admin
      .from("memberships").select("tenant_id, tenants(name)")
      .eq("user_id", user.id).eq("is_active", true).single();
    if (!m) return null;

    const firstName = user.email?.split("@")[0] ?? "Recruteur";
    const contacts  = await getNomadeContacts().catch(() => []);
    const today     = new Date().toISOString().slice(0, 10);
    const todayC    = contacts.filter((c) => c.capturedAt.startsWith(today));
    const eventMap  = new Map<string, number>();
    for (const c of todayC) if (c.eventName) eventMap.set(c.eventName, (eventMap.get(c.eventName) ?? 0) + 1);
    const activeEvent = eventMap.size > 0
      ? [...eventMap.entries()].sort((a, b) => b[1] - a[1])[0]![0]
      : null;

    return {
      firstName,
      kpis: {
        captured:   todayC.length,
        toQualify:  todayC.filter((c) => !c.briefSent).length,
        toSend:     todayC.filter((c) => c.briefId && !c.briefSent).length,
        integrated: contacts.filter((c) => c.briefSent).length,
      },
      activeEvent,
      recentContacts: todayC.slice(0, 3),
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
  { href: "/terrain/capture",  label: "Nouveau\ncontact",    emoji: "👤", bg: "bg-indigo-100" },
  { href: "/terrain/contacts", label: "Liste\ncandidats",   emoji: "👥", bg: "bg-orange-100" },
  { href: "/terrain/pipeline", label: "Pipeline",            emoji: "📊", bg: "bg-teal-100"   },
  { href: "/terrain/transfer", label: "Envoyer\nonboarding", emoji: "🚀", bg: "bg-red-100"    },
  { href: "/terrain/voice",    label: "Note\nvocale",        emoji: "🎤", bg: "bg-purple-100" },
  { href: "/terrain/events",   label: "Événements\n& salons",emoji: "🏢", bg: "bg-green-100"  },
] as const;

export default async function TerrainHome() {
  const data = await getHomeData();
  if (!data) redirect("/login");
  const { firstName, kpis, activeEvent, recentContacts } = data;

  return (
    <div className="flex flex-col pb-24">
      {/* Header navy */}
      <div className="bg-[#1B2A4A] px-5 pb-6 pt-3">
        <div className="flex items-center justify-between mb-5">
          <button className="space-y-1.5 p-1">
            <span className="block h-0.5 w-5 rounded bg-white/80" />
            <span className="block h-0.5 w-3.5 rounded bg-white/50" />
            <span className="block h-0.5 w-4.5 rounded bg-white/70" />
          </button>
          <div className="text-center">
            <p className="text-xs font-black tracking-wider text-white">NOMADE</p>
            <p className="text-[10px] text-white/50">Recruteur Terrain</p>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-white/70" />
            <div className="relative">
              <div className="size-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-sm font-bold text-white">
                {firstName[0]?.toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-400 border-2 border-[#1B2A4A]" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-black text-white mb-1">
          👋 Bienvenue {firstName.charAt(0).toUpperCase() + firstName.slice(1)} !
        </h1>
        <p className="text-sm text-white/55 mb-3">Prête à capturer de nouveaux talents</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/15 px-3 py-1 text-[11px] font-semibold text-green-300">
          <span className="size-1.5 rounded-full bg-green-400" />Hors ligne · Données locales
        </span>
        {/* Mission du jour */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/20">
            <span className="text-lg">🎯</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45 mb-1">Mission du jour</p>
            <p className="text-sm font-bold text-white truncate">{activeEvent ?? "Aucun événement actif"}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-white/55"><Clock className="size-3" />09:00–18:00</span>
              <span className="flex items-center gap-1 text-[10px] text-white/55"><MapPin className="size-3" />Lyon (69)</span>
            </div>
          </div>
          <ChevronRight className="size-4 text-white/30 shrink-0" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 p-4">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <KpiChip value={kpis.captured}   label="Contacts\ncaptés"   bg="bg-blue-50"   val="text-blue-700"   lbl="text-blue-500"   />
          <KpiChip value={kpis.toQualify}  label="À\nqualifier"       bg="bg-amber-50"  val="text-amber-700"  lbl="text-amber-500"  />
          <KpiChip value={kpis.toSend}     label="À\nenvoyer"         bg="bg-cyan-50"   val="text-cyan-700"   lbl="text-cyan-500"   />
          <KpiChip value={kpis.integrated} label="Intégrés\nNexo"     bg="bg-green-50"  val="text-green-700"  lbl="text-green-500"  />
        </div>
        {/* Accès rapides */}
        <div>
          <p className="mb-3 text-sm font-bold text-[#1B2A4A]">Accès rapides</p>
          <div className="grid grid-cols-3 gap-2.5">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.href} href={a.href as never} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
                <div className={`${a.bg} flex size-10 items-center justify-center rounded-xl text-lg`}>{a.emoji}</div>
                <span className="text-center text-[10px] font-bold leading-tight text-[#1B2A4A] whitespace-pre-line">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
        {/* Contacts récents */}
        {recentContacts.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-bold text-[#1B2A4A]">Contacts récents</p>
            <div className="space-y-2">
              {recentContacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {c.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1B2A4A] truncate">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.poste ?? "—"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.briefSent ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {c.briefSent ? "Brief ✓" : "À envoyer"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Offline */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-base">⚠️</span>
            <div>
              <p className="text-[11px] font-bold text-amber-800">Vous travaillez hors ligne</p>
              <p className="text-[10px] text-amber-600">Sync dès le retour du réseau.</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-xl bg-[#1B2A4A] px-3 py-2 text-[11px] font-bold text-white shrink-0">
            <RefreshCw className="size-3" />Sync
          </button>
        </div>
      </div>
    </div>
  );
}
