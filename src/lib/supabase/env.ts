export type SupabasePublicEnv = {
  anonKey: string;
  url: string;
};

export type SupabaseAdminEnv = SupabasePublicEnv & {
  serviceRoleKey: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { anonKey, url };
}

export function requireSupabasePublicEnv(): SupabasePublicEnv {
  const env = getSupabasePublicEnv();

  if (!env) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured."
    );
  }

  return env;
}

export function requireSupabaseAdminEnv(): SupabaseAdminEnv {
  const env = requireSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variable: SUPABASE_SERVICE_ROLE_KEY must be configured."
    );
  }

  return { ...env, serviceRoleKey };
}
