/** Report date ranges: clinic calendar days "YYYY-MM-DD", inclusive. */

export interface ReportRange {
  from: string;
  to: string;
}

/** Local calendar day key for a Date. */
export function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDayKey(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** Look-back presets. Each also includes the next 90 days of bookings. */
export const REPORT_LOOKAHEAD_DAYS = 90;

export const REPORT_PRESETS = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
] as const;

export const DEFAULT_PRESET_DAYS = 30;

export function presetRange(days: number, now = new Date()): ReportRange {
  const today = toDayKey(now);
  return {
    from: shiftDayKey(today, -days),
    to: shiftDayKey(today, REPORT_LOOKAHEAD_DAYS),
  };
}

export function defaultReportRange(now = new Date()): ReportRange {
  return presetRange(DEFAULT_PRESET_DAYS, now);
}

export function activePresetDays(range: ReportRange, now = new Date()): number | null {
  const match = REPORT_PRESETS.find((p) => {
    const r = presetRange(p.days, now);
    return r.from === range.from && r.to === range.to;
  });
  return match?.days ?? null;
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Validate a range from the URL; swaps reversed bounds. */
export function parseReportRange(
  params: Record<string, string | string[] | undefined>,
  now = new Date(),
): ReportRange {
  const one = (v: string | string[] | undefined) => {
    const s = (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
    return DAY_KEY.test(s) ? s : "";
  };
  const defaults = defaultReportRange(now);
  const from = one(params.from) || defaults.from;
  const to = one(params.to) || defaults.to;
  return from <= to ? { from, to } : { from: to, to: from };
}
