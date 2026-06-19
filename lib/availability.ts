import { clinicDayKey, clinicWallTimeToUtcISO } from "@/lib/scheduling";

/**
 * Open-slot generation for the patient self-reschedule page.
 *
 * Turns a dentist's weekly availability windows (in clinic wall-clock time)
 * minus their already-booked intervals into concrete, bookable UTC instants.
 * Pure and deterministic (inject `now`) so it can be unit-tested and reused on
 * the server.
 *
 * Timezone note: like the rest of v1 (PRD §16) this works in the single
 * CLINIC_TIMEZONE via the shared scheduling helpers. The DB-side authoritative
 * check in `appt_self_reschedule` uses `locations.timezone`; seed data must keep
 * the two equal (per-location zones are a v1.1 enhancement).
 */

export interface AvailabilityWindow {
  weekday: number; // 0 = Sunday … 6 = Saturday (matches dentist_availability)
  start_time: string; // "HH:MM[:SS]" clinic wall-clock
  end_time: string; // "HH:MM[:SS]" clinic wall-clock
}

export interface BusyInterval {
  starts_at: string; // ISO
  ends_at: string; // ISO
}

export interface OpenSlot {
  startsAt: string; // ISO (UTC)
  endsAt: string; // ISO (UTC)
}

export interface GenerateOpenSlotsArgs {
  availability: AvailabilityWindow[];
  busy: BusyInterval[];
  durationMin: number;
  from: Date; // window start (inclusive)
  to: Date; // window end (exclusive)
  now?: Date; // for lead-time filtering / testing
  leadHours?: number; // earliest bookable distance from now (default 2h)
  stepMin?: number; // grid granularity (default = durationMin)
}

/** "YYYY-MM-DD" + day offset, staying on the calendar grid. */
function addDayKey(dayKey: string, n: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86_400_000);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

/** Weekday (0=Sun) of a calendar date — independent of timezone. */
function weekdayOf(dayKey: string): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "HH:MM[:SS]" → minutes past midnight. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Generate bookable slots in [from, to), de-duplicated and sorted ascending.
 * A slot survives only if it sits fully inside an availability window, starts at
 * least `leadHours` from `now`, falls within the window bounds, and does not
 * overlap any busy interval.
 */
export function generateOpenSlots({
  availability,
  busy,
  durationMin,
  from,
  to,
  now = new Date(),
  leadHours = 2,
  stepMin,
}: GenerateOpenSlotsArgs): OpenSlot[] {
  if (durationMin <= 0 || availability.length === 0) return [];
  const step = stepMin && stepMin > 0 ? stepMin : durationMin;

  const fromMs = from.getTime();
  const toMs = to.getTime();
  const earliestMs = now.getTime() + leadHours * 3_600_000;

  const busyMs = busy.map((b) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }));

  // Group availability windows by weekday for quick lookup.
  const byWeekday = new Map<number, AvailabilityWindow[]>();
  for (const w of availability) {
    const list = byWeekday.get(w.weekday) ?? [];
    list.push(w);
    byWeekday.set(w.weekday, list);
  }

  const out: OpenSlot[] = [];
  const seen = new Set<string>();

  // Iterate clinic-zone calendar days spanned by [from, to].
  const endKey = clinicDayKey(to.toISOString());
  for (
    let key = clinicDayKey(from.toISOString());
    key <= endKey;
    key = addDayKey(key, 1)
  ) {
    const windows = byWeekday.get(weekdayOf(key));
    if (!windows) continue;

    for (const w of windows) {
      const winStart = toMinutes(w.start_time);
      const winEnd = toMinutes(w.end_time);

      for (let t = winStart; t + durationMin <= winEnd; t += step) {
        const wall = `${key}T${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
        const startIso = clinicWallTimeToUtcISO(wall);
        const startMs = new Date(startIso).getTime();
        const endMs = startMs + durationMin * 60_000;

        if (startMs < fromMs || startMs >= toMs) continue;
        if (startMs < earliestMs) continue;

        const clashes = busyMs.some((b) => startMs < b.end && endMs > b.start);
        if (clashes) continue;

        if (seen.has(startIso)) continue;
        seen.add(startIso);
        out.push({ startsAt: startIso, endsAt: new Date(endMs).toISOString() });
      }
    }
  }

  out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return out;
}
