import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Returns the signed-in user (re-verified against Supabase Auth, not just the
 * cookie) or null. Use in Server Components / Route Handlers — never rely on
 * the proxy alone for data access (PRD §6.2).
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Like getUser, but redirects to the login page when unauthenticated. */
export async function requireUser(next?: string): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect(
      next ? `/admin/login?next=${encodeURIComponent(next)}` : "/admin/login",
    );
  }
  return user;
}
