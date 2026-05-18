import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdminEnv } from "./env";

export function createAdminClient() {
  const env = requireSupabaseAdminEnv();

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
