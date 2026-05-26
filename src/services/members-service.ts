import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemberItem = {
  membershipId: string;
  userId:       string;
  name:         string;
  email:        string;
  role:         MemberRole;
  joinedAt:     string;
  isOwner:      boolean;
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner:       "Propriétaire",
  admin:       "Administrateur",
  rh:          "RH",
  manager:     "Manager",
  member:      "Membre",
  readonly:    "Lecture seule",
  field_agent: "Agent terrain",
  nurse:       "Infirmier",
  vet:         "Vétérinaire",
  craftsman:   "Artisan",
};

export const EDITABLE_ROLES: MemberRole[] = ["admin", "rh", "manager", "member", "readonly"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getTenantContext() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) throw new Error("Non authentifié.");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!membership) throw new Error("Aucun tenant associé.");
  return { userId: user.id, tenantId: membership.tenant_id as string, role: membership.role as MemberRole };
}

// ---------------------------------------------------------------------------
// getMembers
// ---------------------------------------------------------------------------

export async function getMembers(): Promise<MemberItem[]> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("memberships")
    .select("id, user_id, role, joined_at")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("joined_at", { ascending: true });

  if (!memberships?.length) return [];

  const userIds = memberships.map((m) => m.user_id);

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? null])
  );

  // Fetch auth user emails in parallel
  const authResults = await Promise.all(
    userIds.map(async (uid) => {
      try {
        const { data } = await admin.auth.admin.getUserById(uid);
        return { id: uid, email: data?.user?.email ?? "" };
      } catch {
        return { id: uid, email: "" };
      }
    })
  );
  const emailMap = Object.fromEntries(authResults.map((u) => [u.id, u.email]));

  return memberships.map((m) => {
    const email = emailMap[m.user_id] ?? "";
    const name  = profileMap[m.user_id] || email.split("@")[0] || "Utilisateur";
    return {
      membershipId: m.id,
      userId:       m.user_id,
      name,
      email,
      role:         m.role as MemberRole,
      joinedAt:     m.joined_at,
      isOwner:      m.role === "owner",
    };
  });
}

// ---------------------------------------------------------------------------
// inviteMember
// ---------------------------------------------------------------------------

export async function inviteMember(email: string, role: MemberRole): Promise<void> {
  const { tenantId, role: myRole } = await getTenantContext();
  if (myRole !== "owner" && myRole !== "admin") {
    throw new Error("Droits insuffisants pour inviter un membre.");
  }

  const admin  = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${appUrl}/dashboard` }
  );

  if (inviteError || !inviteData.user) {
    throw new Error(inviteError?.message ?? "Impossible d'envoyer l'invitation.");
  }

  // Idempotent: skip if already member
  const { data: existing } = await admin
    .from("memberships")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", inviteData.user.id)
    .maybeSingle();

  if (existing) return;

  const { error: memberError } = await admin.from("memberships").insert({
    tenant_id: tenantId,
    user_id:   inviteData.user.id,
    role,
    is_active: true,
    joined_at: new Date().toISOString(),
  });

  if (memberError) throw new Error(`Impossible de créer le membership : ${memberError.message}`);
}

// ---------------------------------------------------------------------------
// updateMemberRole
// ---------------------------------------------------------------------------

export async function updateMemberRole(membershipId: string, role: MemberRole): Promise<void> {
  const { tenantId, role: myRole } = await getTenantContext();
  if (myRole !== "owner" && myRole !== "admin") throw new Error("Droits insuffisants.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("memberships")
    .update({ role })
    .eq("id", membershipId)
    .eq("tenant_id", tenantId)
    .neq("role", "owner"); // Le rôle owner ne peut pas être modifié

  if (error) throw new Error(`Impossible de modifier le rôle : ${error.message}`);
}

// ---------------------------------------------------------------------------
// removeMember
// ---------------------------------------------------------------------------

export async function removeMember(membershipId: string): Promise<void> {
  const { tenantId, role: myRole, userId } = await getTenantContext();
  if (myRole !== "owner" && myRole !== "admin") throw new Error("Droits insuffisants.");

  const admin = createAdminClient();

  // Verify it's not the current user and not the owner
  const { data: target } = await admin
    .from("memberships")
    .select("user_id, role")
    .eq("id", membershipId)
    .eq("tenant_id", tenantId)
    .single();

  if (!target) throw new Error("Membre introuvable.");
  if (target.role === "owner") throw new Error("Impossible de retirer le propriétaire.");
  if (target.user_id === userId) throw new Error("Impossible de se retirer soi-même.");

  const { error } = await admin
    .from("memberships")
    .update({ is_active: false })
    .eq("id", membershipId)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(`Impossible de retirer le membre : ${error.message}`);
}
