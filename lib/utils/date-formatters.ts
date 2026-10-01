/**
 * The only place display dates are formatted. Two invariants:
 *
 * 1. One display zone — APP_TIME_ZONE. `CLINIC_TIMEZONE` is inlined into client
 *    bundles by next.config.ts `env`, so server and client agree.
 * 2. One time pattern — `appTimePattern()`, resolved at call time. Never write
 *    `h:mm a`, `HH:mm` or a bare `toLocaleTimeString` at a call site.
 *
 * Pass raw ISO timestamps down to the component that prints them; don't bake
 * labels into transformers or cached query data.
 */

import { CLINIC_TIMEZONE } from "@/lib/env";

export const APP_TIME_ZONE = CLINIC_TIMEZONE;

export type TimePattern = "12h" | "24h";

/** Single switch for 12/24-hour display. */
export function appTimePattern(): TimePattern {
  return "12h";
}

const LOCALE = "en-US";

function timeOptions(): Intl.DateTimeFormatOptions {
  return appTimePattern() === "24h"
    ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
    : { hour: "numeric", minute: "2-digit", hour12: true };
}

function fmt(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(new Date(iso));
}

/** "Mon, Jun 15, 2026" */
export function formatDate(iso: string): string {
  return fmt(iso, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Mon, Jun 15" */
export function formatShortDate(iso: string): string {
  return fmt(iso, { weekday: "short", month: "short", day: "numeric" });
}

/** "9:30 AM" (or "09:30") */
export function formatTime(iso: string): string {
  return fmt(iso, timeOptions());
}

/** "9:00 AM – 9:30 AM" for a same-day start/end. */
export function formatTimeRange(startISO: string, endISO: string): string {
  return `${formatTime(startISO)} – ${formatTime(endISO)}`;
}

/** "Mon, Jun 15, 9:30 AM (EDT)" */
export function formatDateTime(iso: string): string {
  const body = fmt(iso, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...timeOptions(),
  });
  return `${body} (${tzAbbrev(iso)})`;
}

/** Short zone label ("EDT") for the display zone at that instant. */
export function tzAbbrev(iso: string): string {
  const parts = new Intl.DateTimeFormat(LOCALE, {
    timeZone: APP_TIME_ZONE,
    timeZoneName: "short",
  }).formatToParts(new Date(iso));
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

/** "YYYY-MM-DD" calendar date → "Jun 15, 2026" (no zone shift: it's a date). */
export function formatDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!y || !m || !d) return dayKey;
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Human label for the display zone, e.g. "America/New York". */
export function appTimeZoneLabel(): string {
  return APP_TIME_ZONE.replace(/_/g, " ");
}
