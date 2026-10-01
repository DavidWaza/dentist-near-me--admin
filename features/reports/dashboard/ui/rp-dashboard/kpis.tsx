import {
  NStat,
  NStatHeader,
  NStatHint,
  NStatIcon,
  NStatLabel,
  NStatValue,
} from "@/components/n";
import type { ReportMetrics } from "../../domain/report-metrics";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function RpDashboardKpis({ metrics }: { metrics: ReportMetrics }) {
  const tiles = [
    {
      label: "Completed visits",
      value: metrics.completed,
      hint: `${metrics.completedPatients} unique ${plural(metrics.completedPatients, "patient", "patients")}`,
      icon: "complete",
      tone: "success",
    },
    {
      label: "Rescheduled",
      value: metrics.rescheduled,
      hint: "Moved to a new time",
      icon: "rescheduled",
      tone: "info",
    },
    {
      label: "Cancelled",
      value: metrics.cancelled,
      hint: "Kept on record, status changed",
      icon: "cancelled",
      tone: "neutral",
    },
    {
      label: "No-shows",
      value: metrics.noShow,
      hint: `${metrics.failedOrCancelled} missed or cancelled in total`,
      icon: "noShow",
      tone: "danger",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <NStat key={tile.label}>
          <NStatHeader>
            <NStatLabel>{tile.label}</NStatLabel>
            <NStatIcon name={tile.icon} tone={tile.tone} />
          </NStatHeader>
          <NStatValue>{tile.value}</NStatValue>
          <NStatHint>{tile.hint}</NStatHint>
        </NStat>
      ))}
    </div>
  );
}
