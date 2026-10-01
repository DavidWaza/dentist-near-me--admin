import {
  NCard,
  NCardContent,
  NCardDescription,
  NCardHeader,
  NCardTitle,
  NProgress,
  NStatus,
} from "@/components/n";
import type { AppointmentStatus } from "@/lib/types";
import { STATUS_REGISTRY } from "@/lib/utils/status";

export function RpDashboardBreakdown({
  breakdown,
  total,
}: {
  breakdown: { status: AppointmentStatus; count: number; percent: number }[];
  total: number;
}) {
  return (
    <NCard>
      <NCardHeader>
        <NCardTitle>Status breakdown</NCardTitle>
        <NCardDescription>
          Share of the {total} {total === 1 ? "appointment" : "appointments"} in this period.
        </NCardDescription>
      </NCardHeader>
      <NCardContent>
        <ul className="flex flex-col gap-4">
          {breakdown.map(({ status, count, percent }) => {
            const def = STATUS_REGISTRY.appointment[status];
            return (
              <li key={status} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <NStatus status={status} kind="appointment" />
                  <span className="text-sm tabular-nums text-base-600">
                    <span className="font-semibold text-base-900">{count}</span>
                    <span className="text-base-500"> · {percent}%</span>
                  </span>
                </div>
                <NProgress value={percent} tone={def.tone} label={`${def.label}: ${percent}%`} />
              </li>
            );
          })}
        </ul>
      </NCardContent>
    </NCard>
  );
}
