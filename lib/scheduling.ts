import { CLINIC_TIMEZONE } from "@/lib/env";

/**
 * Timezone-aware date helpers. v1 renders everything in a single clinic-wide
 * zone (CLINIC_TIMEZONE) per the PRD §16 decision; per-location zones are a
 * v1.1 enhancement. All persisted timestamps are UTC (timestamptz); these
 * helpers convert to/from the clinic wall-clock for display and for the
 * reschedule <input type="datetime-local">.
 */

const tz = CLINIC_TIMEZONE;

/** Offset (ms) of `timeZone` at the given instant. */
function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUTC - date.getTime();
}

/**
 * Interpret a wall-clock string ("YYYY-MM-DDTHH:mm", as produced by a
 * datetime-local input) as a time in the clinic zone, and return the UTC ISO
 * instant. Handles DST except within the ~1h spring-forward gap (acceptable
 * for v1; staff pick valid availability slots).
 */
export function clinicWallTimeToUtcISO(wall: string): string {
  const [datePart, timePart = "00:00"] = wall.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi);
  const offset = tzOffsetMs(new Date(utcGuess), tz);
  return new Date(utcGuess - offset).toISOString();
}

/** Convert a UTC ISO instant to a clinic-zone "YYYY-MM-DDTHH:mm" input value. */
export function utcISOToClinicWallInput(iso: string): string {
  const date = new Date(iso);
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: tz,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: tz,
  hour: "numeric",
  minute: "2-digit",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: tz,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${dateTimeFmt.format(new Date(iso))} (${tzAbbrev(iso)})`;
}

/** "9:00 – 9:30 AM"-style range for same-day start/end. */
export function formatTimeRange(startISO: string, endISO: string): string {
  return `${timeFmt.format(new Date(startISO))} – ${timeFmt.format(new Date(endISO))}`;
}

/** Short timezone label (e.g. "EDT") for the configured clinic zone. */
export function tzAbbrev(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "short",
  }).formatToParts(new Date(iso));
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

/** Whole-day key ("YYYY-MM-DD") in the clinic zone — used for grouping/filters. */
export function clinicDayKey(iso: string): string {
  return utcISOToClinicWallInput(iso).slice(0, 10);
}

/** True if the instant is in the future relative to `now`. */
export function isUpcoming(iso: string, now = new Date()): boolean {
  return new Date(iso).getTime() >= now.getTime();
}

/** Hours from `now` until the instant (negative if past). */
export function hoursUntil(iso: string, now = new Date()): number {
  return (new Date(iso).getTime() - now.getTime()) / 3_600_000;
}
