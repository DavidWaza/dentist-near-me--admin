import type { AppointmentStatus } from "@/lib/types";
import { ALL_STATUSES } from "@/lib/appointments";

export const QUEUE_PAGE_SIZE = 25;

export type RangeKey = "upcoming" | "today" | "tomorrow" | "week" | "all" | "custom";
export type SortKey = "starts_at" | "created_at" | "status";
export type SortDir = "asc" | "desc";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface QueueFilters {
  range: RangeKey;
  /** Clinic calendar day "YYYY-MM-DD" (custom range). */
  from?: string;
  to?: string;
  /** Empty ⇒ every status (cancelled rows stay in the list). */
  statuses: AppointmentStatus[];
  dentistId?: string;
  locationCity?: string;
  search?: string;
  sort: SortKey;
  dir: SortDir;
  page: number;
}

export const DEFAULT_RANGE: RangeKey = "upcoming";
export const DEFAULT_SORT: SortKey = "starts_at";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "Next 7 days" },
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom" },
];

/** URL param names — the URL is this screen's filter state. */
export const QUEUE_PARAM = {
  range: "range",
  from: "from",
  to: "to",
  status: "status",
  dentist: "dentist",
  location: "location",
  search: "q",
  sort: "sort",
  dir: "dir",
  page: "page",
} as const;

/** Params that count as "a filter is applied" (for the Clear button). */
export const FILTER_PARAMS = [
  QUEUE_PARAM.range,
  QUEUE_PARAM.from,
  QUEUE_PARAM.to,
  QUEUE_PARAM.status,
  QUEUE_PARAM.dentist,
  QUEUE_PARAM.location,
  QUEUE_PARAM.search,
] as const;

const RANGES = new Set<string>(RANGE_OPTIONS.map((r) => r.key));
const SORTS = new Set<string>(["starts_at", "created_at", "status"]);

export function firstParam(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t ? t : undefined;
}

/** Normalise raw URL search params into validated filters. */
export function parseQueueFilters(params: RawSearchParams): QueueFilters {
  const range = firstParam(params[QUEUE_PARAM.range]);
  const sort = firstParam(params[QUEUE_PARAM.sort]);
  const statusRaw = firstParam(params[QUEUE_PARAM.status]);
  const page = Number.parseInt(firstParam(params[QUEUE_PARAM.page]) ?? "1", 10);

  const statuses = statusRaw
    ? statusRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is AppointmentStatus =>
          ALL_STATUSES.includes(s as AppointmentStatus),
        )
    : [];

  return {
    range: range && RANGES.has(range) ? (range as RangeKey) : DEFAULT_RANGE,
    from: firstParam(params[QUEUE_PARAM.from]),
    to: firstParam(params[QUEUE_PARAM.to]),
    statuses,
    dentistId: firstParam(params[QUEUE_PARAM.dentist]),
    locationCity: firstParam(params[QUEUE_PARAM.location]),
    search: firstParam(params[QUEUE_PARAM.search]),
    sort: sort && SORTS.has(sort) ? (sort as SortKey) : DEFAULT_SORT,
    dir: firstParam(params[QUEUE_PARAM.dir]) === "desc" ? "desc" : "asc",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function hasActiveFilters(params: RawSearchParams): boolean {
  return FILTER_PARAMS.some((key) => {
    const value = firstParam(params[key]);
    return key === QUEUE_PARAM.range ? Boolean(value && value !== DEFAULT_RANGE) : Boolean(value);
  });
}
