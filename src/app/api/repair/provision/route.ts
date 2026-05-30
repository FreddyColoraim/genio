import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionTenant } from "@/services/tenant-service";

/**
 * POST /api/repair/provision
 * Re-déclenche le provisioning pour un utilisateur authentifié sans tenant.
 * Body : { tenantName: string, profile?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase  = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Vérifie si un membership existe déjà
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, message: "Tenant déjà provisionné." });
    }

    const { tenantName, profile } = await req.json();
    if (!tenantName) {
      return NextResponse.json({ error: "tenantName requis." }, { status: 400 });
    }

    const { tenantId } = await provisionTenant({
      userId:     user.id,
      email:      user.email ?? "",
      tenantName: String(tenantName).trim(),
      profile:    profile ?? undefined,
    });

    return NextResponse.json({ ok: true, tenantId });
  } catch (err) {
    console.error("[repair/provision]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur provisioning." },
      { status: 500 }
    );
  }
}
