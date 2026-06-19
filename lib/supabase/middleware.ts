import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

const LOGIN_PATH = "/admin/login";

/**
 * Runs in the proxy (proxy.ts) on every matched request. It:
 *  1. Refreshes the Supabase auth tokens and writes the rotated cookies onto
 *     the response (required for SSR auth to stay valid).
 *  2. Redirects unauthenticated users away from protected /admin routes to the
 *     login page, preserving the intended destination in `?next=`.
 *
 * IMPORTANT (Supabase SSR contract): do not run code between creating the
 * client and calling `getUser()`, and always return the `supabaseResponse`
 * object as-is (only copying cookies if you build a new response), or sessions
 * will desync. This is an optimistic check only — Server Components/Route
 * Handlers re-verify with `getUser()` before touching data (PRD §6.2).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const isLogin = path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}/`);
  // API routes enforce auth themselves and return JSON 401s — never redirect
  // them to the HTML login page.
  const isApi = path.startsWith("/api/");

  // If Supabase isn't configured yet, don't trap the user in a redirect loop —
  // let the page render its "not configured" guidance.
  if (!isSupabaseConfigured) {
    return supabaseResponse;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-in user visiting the login page → send them into the dashboard.
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/appointments";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Unauthenticated user on a protected /admin *page* → bounce to login.
  if (!user && !isLogin && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
