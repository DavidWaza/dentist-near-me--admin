import type { Appointment, AppointmentStatus } from "@/lib/types";

export interface ReportMetrics {
  from: string;
  to: string;
  /** Appointments whose start falls in the range. */
  total: number;
  completed: number;
  /** Distinct patients with at least one completed visit in range. */
  completedPatients: number;
  rescheduled: number;
  cancelled: number;
  noShow: number;
  /** cancelled + no-show. */
  failedOrCancelled: number;
  pending: number;
  confirmed: number;
  byStatus: Record<AppointmentStatus, number>;
}

/** Order of the breakdown bars — outcomes first, then open work. */
export const BREAKDOWN_ORDER: AppointmentStatus[] = [
  "completed",
  "confirmed",
  "rescheduled",
  "pending",
  "cancelled",
  "no_show",
];

export type ReportRow = Pick<Appointment, "status" | "patient_email">;

/** Pure aggregation. */
export function computeReportMetrics(
  rows: ReportRow[],
  from: string,
  to: string,
): ReportMetrics {
  const byStatus: Record<AppointmentStatus, number> = {
    pending: 0,
    confirmed: 0,
    rescheduled: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };
  const completedEmails = new Set<string>();

  for (const row of rows) {
    byStatus[row.status] += 1;
    if (row.status === "completed") {
      completedEmails.add(row.patient_email.toLowerCase());
    }
  }

  return {
    from,
    to,
    total: rows.length,
    completed: byStatus.completed,
    completedPatients: completedEmails.size,
    rescheduled: byStatus.rescheduled,
    cancelled: byStatus.cancelled,
    noShow: byStatus.no_show,
    failedOrCancelled: byStatus.cancelled + byStatus.no_show,
    pending: byStatus.pending,
    confirmed: byStatus.confirmed,
    byStatus,
  };
}

/** Share of `part` in `total` as a whole percent, or null when total is 0. */
export function percentOf(part: number, total: number): number | null {
  return total > 0 ? Math.round((part / total) * 100) : null;
}
