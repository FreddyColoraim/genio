export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";
import { redirect }          from "next/navigation";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NomadeRhNav }       from "@/components/nomade-rh/nomade-rh-nav";
import { RegisterSW }        from "@/components/pwa/register-sw";
import { InstallPrompt }     from "@/components/pwa/install-prompt";

// ── PWA metadata ──────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title:       "Nomade RH",
  description: "Capture terrain · Pipeline candidats · Notes vocales IA",
  manifest:    "/manifest-terrain.json",
  appleWebApp: {
    capable:       true,
    title:         "Nomade RH",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/nomade-rh.svg",
    icon:  "/icons/nomade-rh.svg",
  },
  other: {
    "mobile-web-app-capable":         "yes",
    "apple-mobile-web-app-capable":   "yes",
    "application-name":               "Nomade RH",
  },
};

export const viewport: Viewport = {
  width:               "device-width",
  initialScale:        1,
  maximumScale:        1,
  userScalable:        false,
  themeColor:          "#1B2A4A",
  viewportFit:         "cover",
};

// ── Auth guard ────────────────────────────────────────────────────────────
async function getUser() {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return null;
    const admin = createAdminClient();
    const { data: m } = await admin
      .from("memberships").select("tenant_id")
      .eq("user_id", user.id).eq("is_active", true).single();
    if (!m) return null;
    return { id: user.id, tenantId: m.tenant_id as string };
  } catch { return null; }
}

export default async function TerrainLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  return (
    <div className="flex min-h-screen flex-col bg-[#EEF2FF]">
      <RegisterSW />
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col" style={{ minHeight: "100dvh" }}>
        {children}
        <NomadeRhNav />
      </div>
      <InstallPrompt appName="Nomade RH" appColor="#1B2A4A" />
    </div>
  );
}
