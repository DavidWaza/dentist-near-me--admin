/** Shared report date-range helpers (safe for client + server). */

export function formatDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDayKey(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 86_400_000;
  return formatDayKey(new Date(t));
}

/** Default window: 30 days back through 90 days ahead (includes upcoming bookings). */
export function defaultReportRange(now = new Date()): { from: string; to: string } {
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  const to = new Date(now);
  to.setDate(to.getDate() + 90);
  return { from: formatDayKey(from), to: formatDayKey(to) };
}

export function parseReportRange(
  params: Record<string, string | string[] | undefined>,
  now = new Date(),
): { from: string; to: string } {
  const one = (v: string | string[] | undefined) => {
    const s = Array.isArray(v) ? v[0] : v;
    return s?.trim() ?? "";
  };

  const defaults = defaultReportRange(now);
  const from = one(params.from) || defaults.from;
  const to = one(params.to) || defaults.to;

  return from <= to ? { from, to } : { from: to, to: from };
}
