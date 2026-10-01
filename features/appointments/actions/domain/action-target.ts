import type { ActionKey } from "@/lib/appointments";
import type { AppointmentStatus } from "@/lib/types";

/** The narrow projection the actions UI needs — screens map into this. */
export interface ActionTarget {
  id: string;
  status: AppointmentStatus;
  patientName: string;
  patientEmail: string;
  /** Raw ISO start; the reschedule picker converts it to clinic wall time. */
  startsAt: string;
}

/** Body of PATCH /api/admin/appointments/[id]. */
export interface ActionRequest {
  action: ActionKey;
  /** Clinic wall-clock "YYYY-MM-DDTHH:mm" (reschedule only). */
  starts_at?: string;
  reason?: string;
}

export const WALL_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
