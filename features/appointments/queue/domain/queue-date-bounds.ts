import { clinicDayKey, clinicWallTimeToUtcISO } from "@/lib/scheduling";
import type { QueueFilters } from "./queue-filters";

export interface DateBounds {
  /** Inclusive UTC ISO lower bound. */
  gte?: string;
  /** Exclusive UTC ISO upper bound. */
  lt?: string;
}

function addDays(dayKey: string, n: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86_400_000);
  return dt.toISOString().slice(0, 10);
}

/** [gte, lt) bounds for the selected range, computed in clinic time. */
export function queueDateBounds(filters: QueueFilters, now: Date): DateBounds {
  const today = clinicDayKey(now.toISOString());
  const startOf = (day: string) => clinicWallTimeToUtcISO(`${day}T00:00`);

  switch (filters.range) {
    case "today":
      return { gte: startOf(today), lt: startOf(addDays(today, 1)) };
    case "tomorrow":
      return { gte: startOf(addDays(today, 1)), lt: startOf(addDays(today, 2)) };
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
      return { gte: startOf(today) };
  }
}
