"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  NButton,
  NEmptyState,
  NEmptyStateActions,
  NEmptyStateDescription,
  NEmptyStateIcon,
  NEmptyStateTitle,
  NIcon,
  NPageActions,
  NPageContainer,
  NPageContent,
  NPageDescription,
  NPageHeader,
  NPageHeading,
  NPageTitle,
} from "@/components/n";
import { ApiError } from "@/lib/utils/api-envelope";
import { cn } from "@/lib/utils/cn";
import { formatDayKey, formatTime } from "@/lib/utils/date-formatters";
import { useRpDashboard } from "../../composition/use-rp-dashboard";
import { parseReportRange } from "../../domain/report-range";
import { REPORTS_LOGIN_PATH } from "../../domain/report-routes";
import { RpDashboardKpis } from "./kpis";
import { RpDashboardRangeBar } from "./range-bar";
import { RpDashboardBreakdown } from "./breakdown";
import { RpDashboardSummary } from "./summary";
import { RpDashboardSkeleton } from "./skeleton";

/** Reports — feature root (client; mount inside <NClientOnly>). */
export function RpDashboard() {
  const searchParams = useSearchParams();
  const state = useRpDashboard(parseReportRange(Object.fromEntries(searchParams.entries())));
  const { range, metrics } = state;

  const expired = state.error instanceof ApiError && state.error.httpStatus === 401;

  return (
    <NPageContainer>
      <NPageContent>
        <NPageHeader>
          <NPageHeading>
            <NPageTitle>Reports</NPageTitle>
            <NPageDescription>
              Appointments scheduled from{" "}
              <span className="font-medium text-base-900">{formatDayKey(range.from)}</span> to{" "}
              <span className="font-medium text-base-900">{formatDayKey(range.to)}</span>.
              Figures refresh when an appointment changes.
            </NPageDescription>
          </NPageHeading>
          <NPageActions>
            {state.updatedAt ? (
              <span className="text-xs text-base-500">
                Updated {formatTime(new Date(state.updatedAt).toISOString())}
              </span>
            ) : null}
            <NButton
              color="secondary"
              variant="outline"
              size="sm"
              onClick={state.refresh}
              disabled={state.isRefreshing}
            >
              <NIcon name="refresh" className={cn(state.isRefreshing && "animate-spin")} />
              {state.isRefreshing ? "Refreshing…" : "Refresh"}
            </NButton>
          </NPageActions>
        </NPageHeader>

        <RpDashboardRangeBar
          range={range}
          activePreset={state.activePreset}
          onPreset={state.applyPreset}
          onFrom={state.setFrom}
          onTo={state.setTo}
        />

        {state.error && !metrics ? (
          <NEmptyState tone="danger">
            <NEmptyStateIcon name="error" tone="danger" />
            <NEmptyStateTitle>
              {expired ? "Your session has expired" : "Couldn’t load reports"}
            </NEmptyStateTitle>
            <NEmptyStateDescription>
              {expired ? "Sign in again to see the latest figures." : state.error.message}
            </NEmptyStateDescription>
            <NEmptyStateActions>
              {expired ? (
                <NButton asChild size="sm">
                  <Link href={REPORTS_LOGIN_PATH}>Sign in</Link>
                </NButton>
              ) : (
                <NButton size="sm" color="secondary" variant="outline" onClick={state.refresh}>
                  <NIcon name="refresh" />
                  Try again
                </NButton>
              )}
            </NEmptyStateActions>
          </NEmptyState>
        ) : !metrics ? (
          <RpDashboardSkeleton bare />
        ) : (
          <div
            className={cn(
              "flex flex-col gap-5 transition-opacity",
              state.isStale && "opacity-60",
            )}
            aria-busy={state.isRefreshing}
          >
            <RpDashboardKpis metrics={metrics} />
            <div className="grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
              <RpDashboardSummary metrics={metrics} completionRate={state.completionRate} />
              <RpDashboardBreakdown breakdown={state.breakdown} total={metrics.total} />
            </div>
          </div>
        )}
      </NPageContent>
    </NPageContainer>
  );
}
