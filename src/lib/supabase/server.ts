import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { requireSupabasePublicEnv } from "./env";

type SupabaseCookieToSet = {
  name: string;
  value: string;
  options?: Partial<ResponseCookie>;
};

export async function createClient() {
  const env = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: SupabaseCookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (options) {
                cookieStore.set(name, value, options);
                return;
              }

              cookieStore.set(name, value);
            });
          } catch {
            // Server Components cannot set cookies. Middleware handles refreshes.
          }
        }
      }
    }
  );
}
