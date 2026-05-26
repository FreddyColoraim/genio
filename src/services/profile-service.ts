import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  id:        string;
  fullName:  string;
  email:     string;
  avatarUrl: string | null;
  role:      string;
};

// ---------------------------------------------------------------------------
// getProfile
// ---------------------------------------------------------------------------

export async function getProfile(): Promise<UserProfile> {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) throw new Error("Non authentifié.");

  const admin = createAdminClient();

  const [profileResult, membershipResult] = await Promise.all([
    admin.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
    admin.from("memberships").select("role").eq("user_id", user.id).eq("is_active", true).single(),
  ]);

  return {
    id:        user.id,
    fullName:  profileResult.data?.full_name ?? user.email?.split("@")[0] ?? "Utilisateur",
    email:     user.email ?? "",
    avatarUrl: profileResult.data?.avatar_url ?? null,
    role:      (membershipResult.data?.role as string) ?? "member",
  };
}

// ---------------------------------------------------------------------------
// updateProfileName
// ---------------------------------------------------------------------------

export async function updateProfileName(fullName: string): Promise<void> {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) throw new Error("Non authentifié.");

  const trimmed = fullName.trim();
  if (!trimmed || trimmed.length < 2) throw new Error("Le nom doit faire au moins 2 caractères.");

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("profiles")
    .upsert({ id: user.id, full_name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) throw new Error(`Impossible de mettre à jour le nom : ${updateError.message}`);
}

// ---------------------------------------------------------------------------
// updatePassword
// ---------------------------------------------------------------------------

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error("Le nouveau mot de passe doit faire au moins 8 caractères.");
  }

  const sessionClient = await createClient();

  // Verify current password by re-signing in
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user?.email) throw new Error("Non authentifié.");

  const { error: verifyError } = await sessionClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) throw new Error("Mot de passe actuel incorrect.");

  const { error } = await sessionClient.auth.updateUser({ password: newPassword });
  if (error) throw new Error(`Impossible de changer le mot de passe : ${error.message}`);
}

// ---------------------------------------------------------------------------
// uploadAvatar
// ---------------------------------------------------------------------------

export async function uploadAvatar(file: File): Promise<string> {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) throw new Error("Non authentifié.");

  if (file.size > 2 * 1024 * 1024) throw new Error("L'image ne doit pas dépasser 2 Mo.");
  if (!file.type.startsWith("image/")) throw new Error("Format non supporté (PNG, JPEG, WebP).");

  const admin = createAdminClient();
  const ext   = file.name.split(".").pop() ?? "jpg";
  const path  = `avatars/${user.id}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("documents")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(`Upload échoué : ${uploadError.message}`);

  const { data: { publicUrl } } = admin.storage.from("documents").getPublicUrl(path);

  await admin
    .from("profiles")
    .upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  return publicUrl;
}
