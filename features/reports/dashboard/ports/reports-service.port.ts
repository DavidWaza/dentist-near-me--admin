import type { ApiResponse } from "@/lib/utils/api-envelope";
import type { ReportMetrics, ReportRow } from "../domain/report-metrics";
import type { ReportRange } from "../domain/report-range";

/** Browser → API. Resolves the raw envelope; the query adapter unwraps it. */
export interface ReportsServicePort {
  getMetrics(range: ReportRange): Promise<{
    httpStatus: number;
    body: ApiResponse<ReportMetrics> | undefined;
  }>;
}

/** Server-side rows for one UTC window [gte, lt). Throws on errors. */
export interface ReportsRepositoryPort {
  listRows(gte: string, lt: string): Promise<ReportRow[]>;
}
