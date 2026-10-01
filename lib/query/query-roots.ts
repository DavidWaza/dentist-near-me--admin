/**
 * Shared query-key roots. Slices own their keys but hang them off a root, so
 * another slice can invalidate by prefix without importing that slice:
 * an appointment mutation invalidates ADMIN_APPOINTMENTS_ROOT and every
 * appointment-derived query (reports, …) refetches.
 */
export const ADMIN_APPOINTMENTS_ROOT = ["admin", "appointments"] as const;
