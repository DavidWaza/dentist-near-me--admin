/**
 * Canonical statuses, grouped by kind. Screens render these through
 * <NStatus>; raw backend strings reach them only via `resolveStatus`.
 */

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "rescheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;

/** How the patient answered a reschedule email. */
export const RESPONSE_STATUSES = [
  "awaiting_patient",
  "patient_confirmed",
  "patient_picked_time",
] as const;

/** Row-level flags the queue raises. */
export const FLAG_STATUSES = ["returning", "needs_attention"] as const;

export type AppointmentStatusKey = (typeof APPOINTMENT_STATUSES)[number];
export type ResponseStatusKey = (typeof RESPONSE_STATUSES)[number];
export type FlagStatusKey = (typeof FLAG_STATUSES)[number];

export interface StatusKinds {
  appointment: AppointmentStatusKey;
  response: ResponseStatusKey;
  flag: FlagStatusKey;
}

export type StatusKind = keyof StatusKinds;
export type CanonicalStatus = StatusKinds[StatusKind];
