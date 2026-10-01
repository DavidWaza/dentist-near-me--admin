"use client";

import { useCallback, useEffect, useState } from "react";
import { NButton, NCard, NFieldError, NIcon, NLink } from "@/components/n";
import { cn } from "@/lib/utils/cn";

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
      <NCard className="items-start px-6 py-6 shadow-sm">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-green-100 text-green-500">
          <NIcon name="complete" weight="fill" className="size-6" />
        </span>
        <h1 className="text-xl font-bold text-base-900">You’re all set</h1>
        <p className="text-sm text-base-600">
          Your appointment is confirmed for{" "}
          <strong className="text-base-900">
            {done.dayLabel} at {done.slot.label}
          </strong>
          . We’ve emailed you a confirmation.
        </p>
      </NCard>
    );
  }

  if (loading) {
    return (
      <NCard className="px-6 py-6 text-sm text-base-500 shadow-sm" aria-busy="true">
        <span className="inline-flex items-center gap-2">
          <NIcon name="refresh" className="size-4 animate-spin" />
          Loading available times…
        </span>
      </NCard>
    );
  }

  if (loadError) {
    return (
      <NCard className="items-start px-6 py-6 shadow-sm">
        <h1 className="text-xl font-bold text-base-900">We hit a snag</h1>
        <p className="text-sm text-base-600">{loadError}</p>
        <NButton color="secondary" variant="outline" onClick={() => void load()}>
          <NIcon name="refresh" />
          Try again
        </NButton>
      </NCard>
    );
  }

  const active = days.find((d) => d.dayKey === activeDay);

  return (
    <div className="flex flex-col gap-4">
      <NCard className="gap-2 px-6 py-6 shadow-sm">
        <NLink
          href={`/appointment/${token}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium"
        >
          <NIcon name="back" className="size-4" />
          Back
        </NLink>
        <h1 className="text-xl font-bold text-base-900">Pick a new time</h1>
        {summary ? (
          <p className="text-sm text-base-500">
            {summary.service} with {summary.dentistName} · {summary.locationCity}
            <br />
            Currently: {summary.currentLabel}
          </p>
        ) : null}
      </NCard>

      {days.length === 0 ? (
        <NCard className="px-6 py-6 text-sm text-base-600 shadow-sm">
          No open times in the next few weeks. Please reply to your appointment
          email and we’ll find a slot for you.
        </NCard>
      ) : (
        <NCard className="gap-3 p-4 shadow-sm">
          {/* Day tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Day">
            {days.map((d) => (
              <button
                key={d.dayKey}
                type="button"
                aria-pressed={d.dayKey === activeDay}
                onClick={() => setActiveDay(d.dayKey)}
                className={cn(
                  "shrink-0 cursor-pointer whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                  d.dayKey === activeDay
                    ? "border-accent-600 bg-accent-600 text-base-0"
                    : "border-base-150 text-base-900 hover:bg-base-50",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Time">
            {active?.slots.map((s) => {
              const isSel = selected?.slot.startsAt === s.startsAt;
              return (
                <button
                  key={s.startsAt}
                  type="button"
                  aria-pressed={isSel}
                  onClick={() => setSelected({ slot: s, dayLabel: active.label })}
                  className={cn(
                    "cursor-pointer rounded-lg border px-2 py-2 text-sm font-medium tabular-nums transition-colors",
                    isSel
                      ? "border-accent-500 bg-accent-500 text-base-0"
                      : "border-base-150 text-base-900 hover:border-accent-150 hover:bg-accent-50",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </NCard>
      )}

      {submitError ? <NFieldError>{submitError}</NFieldError> : null}

      {selected ? (
        <NCard className="sticky bottom-4 gap-3 p-4 shadow-lg">
          <p className="text-sm text-base-600">
            New time:{" "}
            <strong className="text-base-900">
              {selected.dayLabel} at {selected.slot.label}
            </strong>
          </p>
          <NButton size="lg" block onClick={submit} disabled={submitting}>
            {submitting ? "Confirming…" : "Confirm this time"}
          </NButton>
        </NCard>
      ) : null}
    </div>
  );
}
