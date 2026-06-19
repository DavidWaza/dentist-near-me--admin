import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 Proxy (formerly "middleware"). Gates every /admin route except the
 * login page and refreshes the Supabase session cookies. RLS remains the real
 * guard — this is an optimistic redirect layer (PRD §6.2).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on all /admin routes and the admin API. The negative lookahead keeps
  // static assets / image optimisation out of the proxy.
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
