import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { ALL_STATUSES } from "@/lib/appointments";
import { clinicDayKey, clinicWallTimeToUtcISO } from "@/lib/scheduling";

export const PAGE_SIZE = 25;

export type RangeKey = "upcoming" | "today" | "tomorrow" | "week" | "all" | "custom";
export type SortKey = "starts_at" | "created_at" | "status";
export type SortDir = "asc" | "desc";

export interface AppointmentFilters {
  range: RangeKey;
  from?: string; // clinic day "YYYY-MM-DD" (custom)
  to?: string; // clinic day "YYYY-MM-DD" (custom)
  statuses: AppointmentStatus[]; // empty ⇒ all statuses (cancelled rows stay in the table)
  dentistId?: string;
  locationCity?: string;
  q?: string;
  sort: SortKey;
  dir: SortDir;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t ? t : undefined;
}

const RANGES: ReadonlySet<RangeKey> = new Set([
  "upcoming",
  "today",
  "tomorrow",
  "week",
  "all",
  "custom",
]);
const SORTS: ReadonlySet<SortKey> = new Set(["starts_at", "created_at", "status"]);

/** Normalise raw URL search params into a validated filter object. */
export function parseFilters(params: RawParams): AppointmentFilters {
  const range = (one(params.range) as RangeKey) ?? "upcoming";
  const sort = (one(params.sort) as SortKey) ?? "starts_at";
  const dir: SortDir = one(params.dir) === "desc" ? "desc" : "asc";

  const statusRaw = one(params.status);
  const statuses = statusRaw
    ? (statusRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is AppointmentStatus =>
          ALL_STATUSES.includes(s as AppointmentStatus),
        ) as AppointmentStatus[])
    : [];

  const pageNum = Number.parseInt(one(params.page) ?? "1", 10);

  return {
    range: RANGES.has(range) ? range : "upcoming",
    from: one(params.from),
    to: one(params.to),
    statuses,
    dentistId: one(params.dentist),
    locationCity: one(params.location),
    q: one(params.q),
    sort: SORTS.has(sort) ? sort : "starts_at",
    dir,
    page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
  };
}

function addDays(dayKey: string, n: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + n * 86_400_000;
  const dt = new Date(t);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

/** Compute [gte, lt) UTC ISO bounds for the selected range, in clinic time. */
function dateBounds(
  filters: AppointmentFilters,
  now: Date,
): { gte?: string; lt?: string } {
  const today = clinicDayKey(now.toISOString());
  const startOf = (day: string) => clinicWallTimeToUtcISO(`${day}T00:00`);

  switch (filters.range) {
    case "today":
      return { gte: startOf(today), lt: startOf(addDays(today, 1)) };
    case "tomorrow":
      return {
        gte: startOf(addDays(today, 1)),
        lt: startOf(addDays(today, 2)),
      };
    case "week":
      return { gte: startOf(today), lt: startOf(addDays(today, 7)) };
    case "all":
      return {};
    case "custom":
      return {
        gte: filters.from ? startOf(filters.from) : undefined,
        lt: filters.to ? startOf(addDays(filters.to, 1)) : undefined,
      };
    case "upcoming":
    default:
      return { gte: startOf(today) }; // today + everything after
  }
}

export interface QueryResult {
  rows: Appointment[];
  total: number;
  page: number;
  pageCount: number;
}

/**
 * Run the filtered, paginated appointments query under the caller's Supabase
 * session (RLS-enforced). `now` is injectable for testing.
 */
export async function queryAppointments(
  supabase: SupabaseClient,
  filters: AppointmentFilters,
  now: Date = new Date(),
): Promise<QueryResult> {
  const { gte, lt } = dateBounds(filters, now);

  let query = supabase
    .from("appointments")
    .select("*", { count: "exact" });

  if (gte) query = query.gte("starts_at", gte);
  if (lt) query = query.lt("starts_at", lt);

  if (filters.statuses.length > 0) {
    query = query.in("status", filters.statuses);
  }

  if (filters.dentistId) query = query.eq("dentist_id", filters.dentistId);
  if (filters.locationCity)
    query = query.eq("location_city", filters.locationCity);

  if (filters.q) {
    // Free-text over name / email / phone. Escape PostgREST `or` delimiters.
    const safe = filters.q.replace(/[(),*]/g, " ").trim();
    if (safe) {
      query = query.or(
        `patient_name.ilike.%${safe}%,patient_email.ilike.%${safe}%,patient_phone.ilike.%${safe}%`,
      );
    }
  }

  query = query.order(filters.sort, { ascending: filters.dir === "asc" });
  // Stable tiebreaker so pagination is deterministic.
  if (filters.sort !== "starts_at") {
    query = query.order("starts_at", { ascending: true });
  }
  query = query.order("id", { ascending: true });

  const total = 0;
  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  const resolvedTotal = count ?? total;
  return {
    rows: (data ?? []) as Appointment[],
    total: resolvedTotal,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(resolvedTotal / PAGE_SIZE)),
  };
}

/**
 * Returns the set of patient emails (lowercased) that have ≥1 prior COMPLETED
 * appointment — used to flag returning patients (PRD §7.1). One extra query
 * scoped to just the emails on the current page.
 */
export async function findReturningEmails(
  supabase: SupabaseClient,
  rows: Appointment[],
): Promise<Set<string>> {
  // De-dupe case-insensitively but query with the stored casing.
  const byLower = new Map<string, string>();
  for (const r of rows) byLower.set(r.patient_email.toLowerCase(), r.patient_email);
  const emails = Array.from(byLower.values());
  if (emails.length === 0) return new Set();

  const { data, error } = await supabase
    .from("appointments")
    .select("patient_email")
    .eq("status", "completed")
    .in("patient_email", emails);

  if (error) {
    console.error("[returning-patients] lookup failed:", error);
    return new Set();
  }
  return new Set(
    (data ?? []).map((r: { patient_email: string }) =>
      r.patient_email.toLowerCase(),
    ),
  );
}
