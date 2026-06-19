"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface LoginState {
  error?: string;
}

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

/** Only allow internal /admin redirects (prevents open-redirect via ?next=). */
function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/admin") && !value.startsWith("//")
    ? value
    : "/admin/appointments";
}

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isSupabaseConfigured) {
    return {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL_ADMIN and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart.",
    };
  }

  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials." };
  }

  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Don't leak which part failed.
    return { error: "Incorrect email or password." };
  }

  // redirect() throws to interrupt — must be outside any try/catch.
  redirect(next);
}
