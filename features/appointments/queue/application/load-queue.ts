import { hoursUntil } from "@/lib/scheduling";
import type { FlagStatusKey } from "@/lib/utils/status";
import { queueDateBounds } from "../domain/queue-date-bounds";
import { QUEUE_PAGE_SIZE, type QueueFilters } from "../domain/queue-filters";
import {
  NEEDS_ATTENTION_WITHIN_HOURS,
  type QueueFilterOptions,
  type QueueRow,
} from "../domain/queue-row";
import type { QueueServicePort } from "../ports/queue-service.port";
import { toQueueRow } from "../infrastructure/transformers/queue-row.transformer";

export interface LoadQueueDeps {
  service: QueueServicePort;
  now: () => Date;
}

export type QueueView =
  | {
      kind: "list";
      rows: QueueRow[];
      page: number;
      pageCount: number;
      total: number;
      rangeStart: number;
      rangeEnd: number;
    }
  | { kind: "empty" }
  | { kind: "error" };

export interface QueueScreen {
  filters: QueueFilters;
  view: QueueView;
  options: QueueFilterOptions;
}

/** Load one page of the queue plus its filter options. Never throws. */
export async function loadQueue(
  deps: LoadQueueDeps,
  filters: QueueFilters,
): Promise<QueueScreen> {
  const now = deps.now();
  const optionsPromise = deps.service.listFilterOptions();

  let view: QueueView;
  try {
    const offset = (filters.page - 1) * QUEUE_PAGE_SIZE;
    const { rows, total } = await deps.service.listAppointments({
      ...queueDateBounds(filters, now),
      statuses: filters.statuses,
      dentistId: filters.dentistId,
      locationCity: filters.locationCity,
      search: filters.search,
      sort: filters.sort,
      dir: filters.dir,
      offset,
      limit: QUEUE_PAGE_SIZE,
    });

    if (rows.length === 0) {
      view = { kind: "empty" };
    } else {
      // De-dupe case-insensitively but query with the stored casing.
      const byLower = new Map(rows.map((r) => [r.patient_email.toLowerCase(), r.patient_email]));
      const returning = await deps.service.findReturningEmails([...byLower.values()]);

      view = {
        kind: "list",
        rows: rows.map((appt) => {
          const row = toQueueRow(appt);
          const flags: FlagStatusKey[] = [];
          if (returning.has(appt.patient_email.toLowerCase())) flags.push("returning");
          if (
            appt.status === "pending" &&
            hoursUntil(appt.starts_at, now) <= NEEDS_ATTENTION_WITHIN_HOURS
          ) {
            flags.push("needs_attention");
          }
          return { ...row, flags };
        }),
        page: filters.page,
        pageCount: Math.max(1, Math.ceil(total / QUEUE_PAGE_SIZE)),
        total,
        rangeStart: offset + 1,
        rangeEnd: offset + rows.length,
      };
    }
  } catch (err) {
    console.error("[queue] load failed:", err);
    view = { kind: "error" };
  }

  return { filters, view, options: await optionsPromise };
}
