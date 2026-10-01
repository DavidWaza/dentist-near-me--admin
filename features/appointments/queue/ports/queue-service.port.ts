import type { AppointmentStatus, Appointment } from "@/lib/types";
import type { DateBounds } from "../domain/queue-date-bounds";
import type { QueueFilterOptions } from "../domain/queue-row";
import type { SortDir, SortKey } from "../domain/queue-filters";

export interface QueueListQuery extends DateBounds {
  statuses: AppointmentStatus[];
  dentistId?: string;
  locationCity?: string;
  search?: string;
  sort: SortKey;
  dir: SortDir;
  offset: number;
  limit: number;
}

export interface QueueListResult {
  rows: Appointment[];
  total: number;
}

/**
 * Server-side reads for the queue. The queue renders in a Server Component,
 * so there is no query (TanStack) port — the page request is the cache unit.
 */
export interface QueueServicePort {
  listAppointments(query: QueueListQuery): Promise<QueueListResult>;
  /** Lower-cased emails with at least one completed visit. Never throws. */
  findReturningEmails(emails: string[]): Promise<Set<string>>;
  /** Never throws — an empty option list just hides choices. */
  listFilterOptions(): Promise<QueueFilterOptions>;
}
