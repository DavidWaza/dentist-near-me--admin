import { fetchEnvelope } from "@/lib/utils/api-envelope";
import type { ReportMetrics } from "../../domain/report-metrics";
import type { ReportsServicePort } from "../../ports/reports-service.port";

export function createHttpReportsService(): ReportsServicePort {
  return {
    getMetrics(range) {
      const qs = new URLSearchParams({ from: range.from, to: range.to });
      return fetchEnvelope<ReportMetrics>(`/api/admin/reports?${qs}`, {
        cache: "no-store",
      });
    },
  };
}
