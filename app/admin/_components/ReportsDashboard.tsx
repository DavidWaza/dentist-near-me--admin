"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { STATUS_META } from "@/lib/appointments";
import type { AppointmentStatus } from "@/lib/types";
import type { ReportMetrics } from "@/lib/queries/reports";
import { APPOINTMENTS_CHANGED } from "@/lib/admin-events";
import {
  defaultReportRange,
  formatDayKey,
  shiftDayKey,
} from "@/lib/report-dates";

function StatCard({
  label,
  value,
  hint,
  accent = "deep",
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "deep" | "completed" | "cancelled" | "no_show" | "teal";
}) {
  const accents = {
    deep: "border-deep/20 bg-white",
    completed: "border-status-completed/30 bg-status-completed-bg/30",
    cancelled: "border-status-cancelled/30 bg-status-cancelled-bg/50",
    no_show: "border-status-no_show/30 bg-status-no_show-bg/40",
    teal: "border-teal/30 bg-status-confirmed-bg/40",
  };

  return (
    <div className={`rounded-xl border p-5 ${accents[accent]}`}>
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className="mt-1 text-3xl font-bold text-deep">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}

function StatusBar({
  status,
  count,
  max,
}: {
  status: AppointmentStatus;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const meta = STATUS_META[status];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badge}`}
        >
          {meta.label}
        </span>
        <span className="tabular-nums text-ink/70">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-mint/50">
        <div
          className="h-full rounded-full bg-teal transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const PRESETS = [
  { key: "30", label: "Last 30 days + upcoming" },
  { key: "7", label: "Last 7 days + upcoming" },
  { key: "90", label: "Last 90 days + upcoming" },
] as const;

export function ReportsDashboard() {
  const searchParams = useSearchParams();
  const defaults = defaultReportRange();

  const [from, setFrom] = useState(
    () => searchParams.get("from") ?? defaults.from,
  );
  const [to, setTo] = useState(() => searchParams.get("to") ?? defaults.to);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (rangeFrom: string, rangeTo: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        `/api/admin/reports?from=${encodeURIComponent(rangeFrom)}&to=${encodeURIComponent(rangeTo)}`,
        { cache: "no-store" },
      );
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) throw new Error("fetch failed");
      const body = (await res.json()) as { metrics: ReportMetrics };
      setMetrics(body.metrics);
      setLastUpdated(new Date());
    } catch {
      setError(true);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(from, to);
  }, [from, to, load]);

  useEffect(() => {
    const onChanged = (_e: Event) => {
      void load(from, to);
    };
    window.addEventListener(APPOINTMENTS_CHANGED, onChanged);
    return () => window.removeEventListener(APPOINTMENTS_CHANGED, onChanged);
  }, [from, to, load]);

  const applyPreset = (days: number) => {
    const today = formatDayKey(new Date());
    const newFrom = shiftDayKey(today, -days);
    setFrom(newFrom);
    setTo(shiftDayKey(today, 90));
  };

  const successRate =
    metrics && metrics.total > 0
      ? Math.round((metrics.completed / metrics.total) * 100)
      : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-deep">Reports</h1>
          <p className="text-sm text-ink/60">
            Live metrics for appointments scheduled between{" "}
            <span className="font-medium text-ink">{from}</span> and{" "}
            <span className="font-medium text-ink">{to}</span>.
          </p>
          {lastUpdated ? (
            <p className="mt-1 text-xs text-ink/40">
              Updated {lastUpdated.toLocaleTimeString()} — refreshes automatically
              when you change an appointment.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void load(from, to)}
          disabled={loading}
          className="rounded-lg border border-mint px-3 py-2 text-sm font-medium text-ink hover:bg-mint/40 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh now"}
        </button>
      </div>

      <div
        className="space-y-3 rounded-xl border border-mint bg-white p-3 md:p-4"
        aria-busy={loading}
      >
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const today = formatDayKey(new Date());
            const active =
              from === shiftDayKey(today, -Number(p.key)) &&
              to === shiftDayKey(today, 90);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(Number(p.key))}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-deep text-cream"
                    : "border border-mint text-ink hover:bg-mint/40"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-mint px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-mint px-3 py-2"
            />
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-status-no_show-bg bg-status-no_show-bg/40 p-8 text-center">
          <p className="text-lg font-semibold text-status-no_show">
            Couldn&apos;t load reports
          </p>
          <p className="mt-1 text-sm text-ink/70">
            Check your connection and try again.
          </p>
        </div>
      ) : loading && !metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-mint bg-white"
            />
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Successful visits"
              value={metrics.completed}
              hint={`${metrics.completedPatients} unique patient${metrics.completedPatients === 1 ? "" : "s"}`}
              accent="completed"
            />
            <StatCard
              label="Rescheduled"
              value={metrics.rescheduled}
              hint="Appointments with a new time"
              accent="teal"
            />
            <StatCard
              label="Cancelled"
              value={metrics.cancelled}
              hint="Still stored — status only changed"
              accent="cancelled"
            />
            <StatCard
              label="No-shows"
              value={metrics.noShow}
              hint={`${metrics.failedOrCancelled} failed or cancelled total`}
              accent="no_show"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-mint bg-white p-5">
              <h2 className="font-semibold text-deep">Summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink/60">Total in date range</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {metrics.total}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/60">Pending</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {metrics.pending}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/60">Confirmed</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {metrics.confirmed}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/60">Completion rate</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {successRate !== null ? `${successRate}%` : "—"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-mint bg-white p-5">
              <h2 className="font-semibold text-deep">Status breakdown</h2>
              <div className="mt-4 space-y-3">
                {(
                  [
                    "completed",
                    "confirmed",
                    "rescheduled",
                    "pending",
                    "cancelled",
                    "no_show",
                  ] as AppointmentStatus[]
                ).map((status) => (
                  <StatusBar
                    key={status}
                    status={status}
                    count={metrics.byStatus[status]}
                    max={metrics.total}
                  />
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}