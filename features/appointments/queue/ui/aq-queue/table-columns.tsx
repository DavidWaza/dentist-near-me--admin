import type { NColumnDef, NColumnSort } from "@/components/n";
import { NIcon, NLink, NStatus } from "@/components/n";
import {
  formatShortDate,
  formatTimeRange,
} from "@/lib/utils/date-formatters";
import { AaActions } from "@/features/appointments/actions/ui/aa-actions";
import type { SortKey } from "../../domain/queue-filters";
import type { QueueRow } from "../../domain/queue-row";

export interface QueueColumnHandlers {
  sortFor: (key: SortKey) => NColumnSort;
  detailHref: (id: string) => string;
}

/**
 * Column factory. A factory (not a constant) because cells link and mount the
 * actions island, and the handlers that build those come from the screen.
 */
export function createQueueColumns(
  handlers: QueueColumnHandlers,
): NColumnDef<QueueRow>[] {
  return [
    {
      id: "when",
      header: "When",
      sort: handlers.sortFor("starts_at"),
      cellClassName: "whitespace-nowrap",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-base-900">{formatShortDate(row.startsAt)}</span>
          <span className="text-base-500">{formatTimeRange(row.startsAt, row.endsAt)}</span>
        </div>
      ),
    },
    {
      id: "patient",
      header: "Patient",
      cellClassName: "min-w-52",
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <NLink
            href={handlers.detailHref(row.id)}
            className="font-semibold text-base-900 hover:text-accent-500"
          >
            {row.patientName}
          </NLink>
          <span className="text-base-500">{row.patientPhone}</span>
          <RowSignals row={row} />
        </div>
      ),
    },
    {
      id: "service",
      header: "Service",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-base-900">{row.serviceLabel}</span>
          <span className="text-base-500">{row.durationMin} min</span>
        </div>
      ),
    },
    {
      id: "provider",
      header: "Dentist",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-base-900">{row.dentistName}</span>
          <span className="inline-flex items-center gap-1 text-base-500">
            <NIcon name="location" className="size-3.5" />
            {row.locationCity}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sort: handlers.sortFor("status"),
      cell: (row) => <NStatus status={row.status} kind="appointment" />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (row) => (
        <AaActions
          target={{
            id: row.id,
            status: row.status,
            patientName: row.patientName,
            patientEmail: row.patientEmail,
            startsAt: row.startsAt,
          }}
        />
      ),
    },
  ];
}

/** Flags and the patient's reschedule response, as small status tags. */
export function RowSignals({ row }: { row: QueueRow }) {
  if (row.flags.length === 0 && !row.response) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {row.flags.map((flag) => (
        <NStatus key={flag} status={flag} kind="flag" size="sm" showIcon={false} />
      ))}
      {row.response ? (
        <NStatus status={row.response} kind="response" size="sm" showIcon={false} />
      ) : null}
    </div>
  );
}
