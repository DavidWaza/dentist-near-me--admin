import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseEnv } from "@/lib/env";

/**
 * Cookie-less anon client for the PUBLIC (un-authenticated) patient flow —
 * confirm / self-reschedule from the reschedule email. It carries no user
 * session: every privileged action goes through the token-gated SECURITY
 * DEFINER functions in migration 0006, so RLS staying locked down is correct.
 */
export function createPublicClient() {
  assertSupabaseEnv();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* no session to persist */
      },
    },
  });
}

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Backed by the request cookies so the *user's* session is used and RLS is
 * enforced. Never uses the service-role key (PRD §3, §13).
 *
 * `cookies()` is async in Next.js 16 — this factory is async accordingly.
 */
export async function createClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` was called from a Server Component, where setting cookies
          // is not allowed. Safe to ignore — the proxy (proxy.ts) refreshes the
          // session cookies on every request, so this only affects token
          // rotation timing, not correctness.
        }
      },
    },
  });
}
