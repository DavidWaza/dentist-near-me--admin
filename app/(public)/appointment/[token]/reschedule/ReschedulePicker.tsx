"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Slot {
  startsAt: string;
  label: string;
}
interface Day {
  dayKey: string;
  label: string;
  slots: Slot[];
}
interface Summary {
  patientName: string;
  service: string;
  dentistName: string;
  locationCity: string;
  currentLabel: string;
}
interface SlotsResponse {
  appointment: Summary | null;
  days?: Day[];
}

type Selected = { slot: Slot; dayLabel: string };

export function ReschedulePicker({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const [selected, setSelected] = useState<Selected | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<Selected | null>(null);

  // Fetch first, then apply — the awaited fetch means no setState runs
  // synchronously inside the mount effect.
  const apply = useCallback(
    (ok: boolean, body: SlotsResponse & { error?: string }) => {
      if (!ok) {
        setLoadError(body.error ?? "Could not load available times.");
        return;
      }
      setLoadError(null);
      setSummary(body.appointment);
      const d = body.days ?? [];
      setDays(d);
      setActiveDay((prev) => prev ?? d[0]?.dayKey ?? null);
    },
    [],
  );

  const fetchSlots = useCallback(async () => {
    const res = await fetch(`/api/public/appointment/${token}/slots`);
    const body = (await res.json().catch(() => ({}))) as SlotsResponse & {
      error?: string;
    };
    return { ok: res.ok, body };
  }, [token]);

  // Manual reload (retry button / post-conflict refresh) — event-driven.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, body } = await fetchSlots();
      apply(ok, body);
    } catch {
      setLoadError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchSlots, apply]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { ok, body } = await fetchSlots();
        if (!cancelled) apply(ok, body);
      } catch {
        if (!cancelled) setLoadError("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchSlots, apply]);

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/public/appointment/${token}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startsAt: selected.slot.startsAt }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 409) {
        setSubmitError(
          body.error ?? "That time was just taken. Please pick another.",
        );
        setSelected(null);
        await load(); // refresh availability
        return;
      }
      if (!res.ok) {
        setSubmitError(body.error ?? "Could not reschedule. Please try again.");
        return;
      }
      setDone(selected);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-mint bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-deep">You’re all set ✓</h1>
        <p className="mt-2 text-sm text-ink/70">
          Your appointment is confirmed for{" "}
          <strong>
            {done.dayLabel} at {done.slot.label}
          </strong>
          . We’ve emailed you a confirmation.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-mint bg-white p-6 text-sm text-ink/60 shadow-sm">
        Loading available times…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-mint bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-deep">We hit a snag</h1>
        <p className="mt-2 text-sm text-ink/70">{loadError}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-xl border border-mint px-4 py-2 text-sm font-semibold text-deep hover:bg-mint/40"
        >
          Try again
        </button>
      </div>
    );
  }

  const active = days.find((d) => d.dayKey === activeDay);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-mint bg-white p-6 shadow-sm">
        <Link
          href={`/appointment/${token}`}
          className="text-sm text-teal underline-offset-2 hover:underline"
        >
          ← Back
        </Link>
        <h1 className="mt-2 text-xl font-bold text-deep">Pick a new time</h1>
        {summary ? (
          <p className="mt-1 text-sm text-ink/60">
            {summary.service} with {summary.dentistName} · {summary.locationCity}
            <br />
            Currently: {summary.currentLabel}
          </p>
        ) : null}
      </div>

      {days.length === 0 ? (
        <div className="rounded-2xl border border-mint bg-white p-6 text-sm text-ink/70 shadow-sm">
          No open times in the next few weeks. Please reply to your appointment
          email and we’ll find a slot for you.
        </div>
      ) : (
        <div className="rounded-2xl border border-mint bg-white p-4 shadow-sm">
          {/* Day tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => (
              <button
                key={d.dayKey}
                type="button"
                onClick={() => setActiveDay(d.dayKey)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  d.dayKey === activeDay
                    ? "bg-deep text-cream"
                    : "border border-mint text-ink hover:bg-mint/40"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Time grid */}
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {active?.slots.map((s) => {
              const isSel = selected?.slot.startsAt === s.startsAt;
              return (
                <button
                  key={s.startsAt}
                  type="button"
                  onClick={() =>
                    setSelected({ slot: s, dayLabel: active.label })
                  }
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                    isSel
                      ? "bg-deep text-cream"
                      : "border border-mint text-ink hover:bg-mint/40"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {submitError ? (
        <p role="alert" className="text-sm text-status-no_show">
          {submitError}
        </p>
      ) : null}

      {selected ? (
        <div className="sticky bottom-4 rounded-2xl border border-mint bg-white p-4 shadow-lg">
          <p className="text-sm text-ink/70">
            New time:{" "}
            <strong className="text-deep">
              {selected.dayLabel} at {selected.slot.label}
            </strong>
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="mt-3 w-full rounded-xl bg-deep px-5 py-3 text-sm font-semibold text-cream hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Confirming…" : "Confirm this time"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
