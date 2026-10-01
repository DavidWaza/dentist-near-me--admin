import {
  NCard,
  NCardContent,
  NCardHeader,
  NCardTitle,
  NDescriptionDetails,
  NDescriptionItem,
  NDescriptionList,
  NDescriptionTerm,
  NProgress,
} from "@/components/n";
import type { ReportMetrics } from "../../domain/report-metrics";

export function RpDashboardSummary({
  metrics,
  completionRate,
}: {
  metrics: ReportMetrics;
  completionRate: number | null;
}) {
  return (
    <NCard>
      <NCardHeader>
        <NCardTitle>Summary</NCardTitle>
      </NCardHeader>
      <NCardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 rounded-lg bg-base-50 p-4">
          <span className="text-sm text-base-500">Completion rate</span>
          <span className="text-3xl font-bold tabular-nums text-base-900">
            {completionRate !== null ? `${completionRate}%` : "—"}
          </span>
          <NProgress
            value={completionRate ?? 0}
            tone="success"
            label="Completion rate"
          />
        </div>
        <NDescriptionList layout="rows">
          <NDescriptionItem>
            <NDescriptionTerm>Total in period</NDescriptionTerm>
            <NDescriptionDetails className="tabular-nums">{metrics.total}</NDescriptionDetails>
          </NDescriptionItem>
          <NDescriptionItem>
            <NDescriptionTerm>Awaiting confirmation</NDescriptionTerm>
            <NDescriptionDetails className="tabular-nums">{metrics.pending}</NDescriptionDetails>
          </NDescriptionItem>
          <NDescriptionItem>
            <NDescriptionTerm>Confirmed</NDescriptionTerm>
            <NDescriptionDetails className="tabular-nums">{metrics.confirmed}</NDescriptionDetails>
          </NDescriptionItem>
        </NDescriptionList>
      </NCardContent>
    </NCard>
  );
}
