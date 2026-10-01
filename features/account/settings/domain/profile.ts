import type { User } from "@supabase/supabase-js";

export interface ProfileView {
  email: string;
  role: string;
  lastSignIn: string | null;
}

/** Supabase user → what the settings screen shows. */
export function toProfileView(user: Pick<User, "email" | "last_sign_in_at">): ProfileView {
  return {
    email: user.email ?? "Unknown",
    // Roles land in v1.1; every account is staff today.
    role: "Staff",
    lastSignIn: user.last_sign_in_at ?? null,
  };
}
