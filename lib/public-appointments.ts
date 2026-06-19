import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppointmentStatus, PatientResponse } from "@/lib/types";
import {
  generateOpenSlots,
  type AvailabilityWindow,
  type OpenSlot,
} from "@/lib/availability";

/**
 * Shared helpers for the public (token-gated) patient flow. All DB access goes
 * through the SECURITY DEFINER functions from migration 0006 — never the
 * appointments table directly — so anon RLS stays locked down.
 */

/** How far ahead the self-reschedule page offers slots. */
export const SLOT_WINDOW_DAYS = 21;

/** Minimal, safe projection returned by appt_public_get. */
export interface PublicAppointment {
  id: string;
  patient_name: string;
  service_slug: string;
  dentist_name: string;
  dentist_id: string | null;
  location_city: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  patient_response: PatientResponse | null;
  duration_minutes: number;
  expired: boolean;
}

/** Statuses from which a patient may still confirm or self-reschedule. */
export function isActionable(status: AppointmentStatus): boolean {
  return status === "pending" || status === "rescheduled" || status === "confirmed";
}

/** UUID v4-ish shape check so we fail fast on malformed tokens. */
export function isUuid(token: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    token,
  );
}

/** Fetch the appointment behind a token, or null if the token is unknown. */
export async function getPublicAppointment(
  supabase: SupabaseClient,
  token: string,
): Promise<PublicAppointment | null> {
  const { data, error } = await supabase
    .rpc("appt_public_get", { p_token: token })
    .maybeSingle();

  if (error) {
    console.error("[public appt_public_get]", error);
    throw error;
  }
  return (data as PublicAppointment | null) ?? null;
}

/**
 * The dentist's open slots for a token's appointment over the next
 * `windowDays`, generated in CLINIC_TIMEZONE (the app's single zone). This is
 * the authoritative business-hours gate for both the slots listing and the
 * self-reschedule write — the RPC only enforces token/status/double-book.
 */
export async function openSlotsForToken(
  supabase: SupabaseClient,
  token: string,
  appt: PublicAppointment,
  now: Date,
  windowDays = SLOT_WINDOW_DAYS,
): Promise<OpenSlot[]> {
  if (!appt.dentist_id) return [];
  const to = new Date(now.getTime() + windowDays * 86_400_000);

  // Availability is publicly readable (anon SELECT policy on the catalogue).
  const { data: avail, error: availErr } = await supabase
    .from("dentist_availability")
    .select("weekday,start_time,end_time")
    .eq("dentist_id", appt.dentist_id);
  if (availErr) throw availErr;

  const { data: busy, error: busyErr } = await supabase.rpc(
    "appt_busy_intervals",
    { p_token: token, p_from: now.toISOString(), p_to: to.toISOString() },
  );
  if (busyErr) throw busyErr;

  return generateOpenSlots({
    availability: (avail ?? []) as AvailabilityWindow[],
    busy: (busy ?? []) as { starts_at: string; ends_at: string }[],
    durationMin: appt.duration_minutes,
    from: now,
    to,
    now,
  });
}
