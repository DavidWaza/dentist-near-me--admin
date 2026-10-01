import type { UseQueryResult } from "@tanstack/react-query";
import type { ReportMetrics } from "../domain/report-metrics";
import type { ReportRange } from "../domain/report-range";

export interface ReportsMetricsQueryOptions {
  range: ReportRange;
  enabled: boolean;
}

/**
 * TanStack boundary. In React, hooks re-run every render, so reactive inputs
 * cross as plain values (the Vue original passes zero-arg thunks).
 */
export interface ReportsQueryPort {
  useMetricsQuery(options: ReportsMetricsQueryOptions): UseQueryResult<ReportMetrics, Error>;
}
