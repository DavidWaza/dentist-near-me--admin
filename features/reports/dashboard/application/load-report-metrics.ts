import { computeReportMetrics, type ReportMetrics } from "../domain/report-metrics";
import { shiftDayKey, type ReportRange } from "../domain/report-range";
import type { ReportsRepositoryPort } from "../ports/reports-service.port";

export interface LoadReportMetricsDeps {
  repository: ReportsRepositoryPort;
  /** Clinic wall-clock "YYYY-MM-DDTHH:mm" → UTC ISO. */
  wallTimeToUtc: (wall: string) => string;
}

/** Aggregate metrics for an inclusive clinic-day range. Throws on read errors. */
export async function loadReportMetrics(
  deps: LoadReportMetricsDeps,
  range: ReportRange,
): Promise<ReportMetrics> {
  const gte = deps.wallTimeToUtc(`${range.from}T00:00`);
  const lt = deps.wallTimeToUtc(`${shiftDayKey(range.to, 1)}T00:00`);
  const rows = await deps.repository.listRows(gte, lt);
  return computeReportMetrics(rows, range.from, range.to);
}
