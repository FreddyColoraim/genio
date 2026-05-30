export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NomadeRhNav }       from "@/components/nomade-rh/nomade-rh-nav";

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
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col" style={{ minHeight: "100dvh" }}>
        {children}
        <NomadeRhNav />
      </div>
    </div>
  );
}
