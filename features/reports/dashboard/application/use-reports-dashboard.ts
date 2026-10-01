import { useState } from "react";
import { BREAKDOWN_ORDER, percentOf } from "../domain/report-metrics";
import {
  activePresetDays,
  presetRange,
  type ReportRange,
} from "../domain/report-range";
import type { ReportsQueryPort } from "../ports/reports-query.port";

export interface UseReportsDashboardDeps {
  queryPort: ReportsQueryPort;
  /** Persist the range somewhere shareable (the URL). */
  onRangeChange: (range: ReportRange) => void;
}

export interface UseReportsDashboardOptions {
  deps: UseReportsDashboardDeps;
  initialRange: ReportRange;
}

/** Screen state for the reports dashboard. No router, no fetch. */
export function useReportsDashboard({ deps, initialRange }: UseReportsDashboardOptions) {
  const [range, setRangeState] = useState<ReportRange>(initialRange);

  const query = deps.queryPort.useMetricsQuery({
    range,
    enabled: Boolean(range.from && range.to),
  });

  function setRange(next: ReportRange) {
    const ordered = next.from <= next.to ? next : { from: next.to, to: next.from };
    setRangeState(ordered);
    deps.onRangeChange(ordered);
  }

  const metrics = query.data ?? null;

  return {
    range,
    setFrom: (from: string) => from && setRange({ ...range, from }),
    setTo: (to: string) => to && setRange({ ...range, to }),
    applyPreset: (days: number) => setRange(presetRange(days)),
    activePreset: activePresetDays(range),

    metrics,
    completionRate: metrics ? percentOf(metrics.completed, metrics.total) : null,
    breakdown: metrics
      ? BREAKDOWN_ORDER.map((status) => ({
          status,
          count: metrics.byStatus[status],
          percent: percentOf(metrics.byStatus[status], metrics.total) ?? 0,
        }))
      : [],

    isInitialLoading: query.isPending,
    isRefreshing: query.isFetching,
    /** Showing the previous range's numbers while the new range loads. */
    isStale: query.isPlaceholderData,
    error: query.error,
    updatedAt: query.dataUpdatedAt || null,
    refresh: () => void query.refetch(),
  };
}
