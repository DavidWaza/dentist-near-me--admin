import { useMemo } from "react";
import { useReportsDashboard } from "../application/use-reports-dashboard";
import type { ReportRange } from "../domain/report-range";
import { createReportsQueryAdapter } from "../adapters/use-reports-query-adapter";
import { createHttpReportsService } from "../infrastructure/services/http-reports-service-adapter";

/**
 * Client composition root — the only place adapters are named. Swap the HTTP
 * service for a mock (with fake latency) in one line here.
 */
export function useRpDashboard(initialRange: ReportRange) {
  const queryPort = useMemo(
    () => createReportsQueryAdapter(createHttpReportsService()),
    [],
  );
  return useReportsDashboard({
    initialRange,
    deps: {
      queryPort,
      onRangeChange: (range) => {
        // Keep the URL shareable without a server round-trip.
        const url = new URL(window.location.href);
        url.searchParams.set("from", range.from);
        url.searchParams.set("to", range.to);
        window.history.replaceState(null, "", url);
      },
    },
  });
}
