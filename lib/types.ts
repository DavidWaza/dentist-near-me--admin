/**
 * Hand-written DB row types mirroring supabase/schema.sql + migrations.
 * (For a larger project, generate these with `supabase gen types typescript`.)
 */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  service_id: string | null;
  dentist_id: string | null;
  location_id: string | null;
  service_slug: string;
  dentist_name: string;
  location_city: string;
  starts_at: string; // ISO timestamptz
  ends_at: string;
  status: AppointmentStatus;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  notes: string | null;
  staff_notes: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  // Patient self-service confirm/reschedule (migration 0006). Token + expiry are
  // set when an admin reschedules; patient_response records the patient's action.
  confirmation_token: string | null;
  token_expires_at: string | null;
  patient_response: PatientResponse | null;
  patient_responded_at: string | null;
}

/** How the patient responded to a reschedule email (migration 0006). */
export type PatientResponse = "confirmed" | "self_rescheduled";

export interface Dentist {
  id: string;
  name: string;
  location_id: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  city: string;
  name: string;
  address: string | null;
  timezone: string;
  created_at: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  created_at: string;
}

export type WaitlistStatus = "waiting" | "offered" | "booked" | "expired";

export interface WaitlistEntry {
  id: string;
  service_slug: string;
  dentist_name: string | null;
  location_city: string;
  preferred_from: string | null;
  preferred_to: string | null;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  notes: string | null;
  status: WaitlistStatus;
  created_at: string;
}
