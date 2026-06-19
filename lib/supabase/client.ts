"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Supabase client for Client Components (browser). Reads the same anon key;
 * the session lives in cookies shared with the server. Used for the few
 * interactions that need a client (e.g. signing in from the login form could
 * also go through a Server Action — see app/admin/login/actions.ts).
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
