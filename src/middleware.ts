import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicRoutes = new Set(["/", "/login", "/signup"]);

export async function middleware(request: NextRequest) {
  if (publicRoutes.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
