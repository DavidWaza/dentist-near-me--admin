import { z } from "zod";

export const DEFAULT_AFTER_LOGIN = "/admin/appointments";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface LoginState {
  error?: string;
  /** Echoed back so the email survives a failed attempt. */
  email?: string;
}

/** Only internal /admin paths (prevents open redirects via ?next=). */
export function safeNextPath(raw: unknown): string {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/admin") && !value.startsWith("//")
    ? value
    : DEFAULT_AFTER_LOGIN;
}

export const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart.";
