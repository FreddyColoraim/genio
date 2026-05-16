import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { NextResponse, type NextRequest } from "next/server";

type SupabaseCookieToSet = {
  name: string;
  value: string;
  options?: Partial<ResponseCookie>;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: SupabaseCookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            if (options) {
              response.cookies.set(name, value, options);
              return;
            }

            response.cookies.set(name, value);
          });
        }
      }
    }
  );

  await supabase.auth.getUser();

  return response;
}
