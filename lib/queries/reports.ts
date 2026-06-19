import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { clinicWallTimeToUtcISO } from "@/lib/scheduling";
import { shiftDayKey } from "@/lib/report-dates";

export { parseReportRange, defaultReportRange } from "@/lib/report-dates";

export interface ReportMetrics {
  from: string;
  to: string;
  /** Appointments whose starts_at falls in the selected range. */
  total: number;
  /** Successfully completed visits. */
  completed: number;
  /** Distinct patients with at least one completed visit in range. */
  completedPatients: number;
  /** Appointments currently marked rescheduled. */
  rescheduled: number;
  /** Appointments marked cancelled. */
  cancelled: number;
  /** Appointments marked no-show. */
  noShow: number;
  /** cancelled + no_show combined. */
  failedOrCancelled: number;
  /** Still pending confirmation. */
  pending: number;
  /** Confirmed and upcoming. */
  confirmed: number;
  /** Count per status for breakdown chart. */
  byStatus: Record<AppointmentStatus, number>;
}

function emptyByStatus(): Record<AppointmentStatus, number> {
  return {
    pending: 0,
    confirmed: 0,
    rescheduled: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };
}

type ReportRow = Pick<Appointment, "status" | "patient_email" | "staff_notes">;

/** Pure aggregation — used by the API and tests. */
export function computeReportMetrics(
  rows: ReportRow[],
  from: string,
  to: string,
): ReportMetrics {
  const byStatus = emptyByStatus();
  const completedEmails = new Set<string>();

  for (const row of rows) {
    byStatus[row.status] += 1;
    if (row.status === "completed") {
      completedEmails.add(row.patient_email.toLowerCase());
    }
  }

  const completed = byStatus.completed;
  const cancelled = byStatus.cancelled;
  const noShow = byStatus.no_show;
  const rescheduled = byStatus.rescheduled;

  return {
    from,
    to,
    total: rows.length,
    completed,
    completedPatients: completedEmails.size,
    rescheduled,
    cancelled,
    noShow,
    failedOrCancelled: cancelled + noShow,
    pending: byStatus.pending,
    confirmed: byStatus.confirmed,
    byStatus,
  };
}

/**
 * Aggregate appointment metrics for a clinic-day date range (inclusive).
 * Includes upcoming appointments (starts_at through end of `to` day).
 */
export async function queryReportMetrics(
  supabase: SupabaseClient,
  fromDay: string,
  toDay: string,
): Promise<ReportMetrics> {
  const gte = clinicWallTimeToUtcISO(`${fromDay}T00:00`);
  const lt = clinicWallTimeToUtcISO(`${shiftDayKey(toDay, 1)}T00:00`);

  const { data, error } = await supabase
    .from("appointments")
    .select("status, patient_email, staff_notes")
    .gte("starts_at", gte)
    .lt("starts_at", lt);

  if (error) throw error;

  return computeReportMetrics(
    (data ?? []) as ReportRow[],
    fromDay,
    toDay,
  );
}
