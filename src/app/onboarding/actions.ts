"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createCandidate } from "@/services/entity-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getTenantContext() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) redirect("/login");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!membership) redirect("/login");

  return { userId: user.id, tenantId: membership.tenant_id as string };
}

async function mergeVocab(tenantId: string, patch: Record<string, string>) {
  const admin = createAdminClient();

  const { data: config } = await admin
    .from("tenant_config")
    .select("vocab")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const current = (config?.vocab ?? {}) as Record<string, string>;

  await admin
    .from("tenant_config")
    .update({ vocab: { ...current, ...patch } })
    .eq("tenant_id", tenantId);
}

// ---------------------------------------------------------------------------
// Étape 2 — sauvegarder profil équipe
// ---------------------------------------------------------------------------

export type SaveTeamProfileResult =
  | { success: true }
  | { success: false; error: string };

export async function saveTeamProfileAction(
  formData: FormData
): Promise<SaveTeamProfileResult> {
  try {
    const { tenantId } = await getTenantContext();
    const teamSize      = String(formData.get("teamSize")      ?? "").trim();
    const operatingMode = String(formData.get("operatingMode") ?? "").trim();

    await mergeVocab(tenantId, { team_size: teamSize, operating_mode: operatingMode });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

// ---------------------------------------------------------------------------
// Étape 3 — ajouter premier collaborateur (optionnel)
// ---------------------------------------------------------------------------

export type AddFirstEmployeeResult =
  | { success: true }
  | { success: false; error: string };

export async function addFirstEmployeeAction(
  formData: FormData
): Promise<AddFirstEmployeeResult> {
  try {
    await createCandidate(formData);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

// ---------------------------------------------------------------------------
// Étape 4 — marquer le wizard comme terminé → redirect dashboard
// ---------------------------------------------------------------------------

export async function completeWizardAction() {
  const { tenantId } = await getTenantContext();
  await mergeVocab(tenantId, { wizard_completed: "true" });
  redirect("/dashboard");
}
