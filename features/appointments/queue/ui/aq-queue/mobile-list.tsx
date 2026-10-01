import Link from "next/link";
import { NIcon, NStatus } from "@/components/n";
import { formatShortDate, formatTimeRange } from "@/lib/utils/date-formatters";
import { AaActions } from "@/features/appointments/actions/ui/aa-actions";
import type { QueueRow } from "../../domain/queue-row";
import { RowSignals } from "./table-columns";

/** Card list for narrow screens; the table takes over from `md`. */
export function AqQueueMobileList({
  rows,
  detailHref,
}: {
  rows: QueueRow[];
  detailHref: (id: string) => string;
}) {
  return (
    <ul className="flex flex-col gap-3 md:hidden">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex flex-col gap-3 rounded-xl border border-base-150 bg-base-0 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={detailHref(row.id)}
                className="font-semibold text-base-900 hover:text-accent-500"
              >
                {row.patientName}
              </Link>
              <p className="text-sm text-base-500">{row.patientPhone}</p>
            </div>
            <NStatus status={row.status} kind="appointment" />
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg bg-base-50 px-3 py-2.5 text-sm">
            <span className="col-span-2 inline-flex items-center gap-1.5 font-medium text-base-900">
              <NIcon name="appointments" className="size-4 text-base-500" />
              {formatShortDate(row.startsAt)} · {formatTimeRange(row.startsAt, row.endsAt)}
            </span>
            <span className="text-base-600">
              {row.serviceLabel} · {row.durationMin} min
            </span>
            <span className="text-right text-base-600">{row.dentistName}</span>
            <span className="inline-flex items-center gap-1 text-base-500">
              <NIcon name="location" className="size-3.5" />
              {row.locationCity}
            </span>
          </div>

          <RowSignals row={row} />

          <div className="border-t border-base-100 pt-3">
            <AaActions
              target={{
                id: row.id,
                status: row.status,
                patientName: row.patientName,
                patientEmail: row.patientEmail,
                startsAt: row.startsAt,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
