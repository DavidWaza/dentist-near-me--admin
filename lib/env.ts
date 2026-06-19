/**
 * Centralised environment access. Reads are lazy so a missing value produces a
 * clear error at the call site (and lets pages render a friendly "not
 * configured" state) instead of crashing the whole module graph at import time.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_ADMIN ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True only when both public Supabase values are present. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** IANA timezone the dashboard renders times in (PRD §16 — single zone for v1). */
export const CLINIC_TIMEZONE =
  process.env.CLINIC_TIMEZONE?.trim() || "America/New_York";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

/**
 * Origin of THIS admin app — used to build the patient confirm/reschedule links
 * embedded in reschedule emails. Distinct from SITE_URL (the separate booking
 * site); the patient pages live in this repo as public routes.
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

/** Email config (server-only). Absence is non-fatal — emails fall back to logs. */
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const EMAIL_FROM =
  process.env.EMAIL_FROM?.trim() ||
  process.env.RESEND_FROM_EMAIL?.trim() ||
  "DentistNearMe <onboarding@resend.dev>";
/**
 * When using Resend's sandbox sender (onboarding@resend.dev), outbound mail
 * only delivers to your Resend account email unless a domain is verified.
 * Set this to that inbox so cancel/reschedule emails reach you during dev.
 */
export const RESEND_SANDBOX_TO = process.env.RESEND_SANDBOX_TO?.trim() || "";

/**
 * Where clinic-facing notifications go (front desk inbox) — e.g. a patient
 * confirming or self-rescheduling. Reuses the existing ADMIN_EMAIL convention;
 * falls back to the sandbox inbox so the clinic still hears about responses
 * during local dev. Empty ⇒ admin notification is skipped (logged).
 */
export const CLINIC_NOTIFY_EMAIL =
  process.env.ADMIN_EMAIL?.trim() ||
  process.env.RESEND_SANDBOX_TO?.trim() ||
  "";

/**
 * Throws if the Supabase public env vars are missing. Call from the Supabase
 * client factories so the error message is actionable.
 */
export function assertSupabaseEnv(): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL_ADMIN and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).",
    );
  }
}
