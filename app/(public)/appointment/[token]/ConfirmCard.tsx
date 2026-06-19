"use client";

import { useState } from "react";
import Link from "next/link";

interface Details {
  service: string;
  dentist: string;
  location: string;
  whenLong: string;
  whenRange: string;
  dateLine: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-mint/60 py-2 last:border-0">
      <dt className="text-ink/55">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

export function ConfirmCard({
  token,
  patientName,
  details,
}: {
  token: string;
  patientName: string;
  details: Details;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/appointment/${token}/confirm`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-mint bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-deep">You’re all set ✓</h1>
        <p className="mt-2 text-sm text-ink/70">
          Thanks, {patientName}. Your appointment is confirmed for{" "}
          <strong>{details.whenLong}</strong>. We’ve emailed you a confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-mint bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-deep">
        Does this new time work, {patientName}?
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Your appointment was rescheduled. Please confirm the new time below.
      </p>

      <dl className="mt-4 rounded-xl bg-cream px-4 py-2 text-sm">
        <Row label="When" value={details.dateLine} />
        <Row label="Service" value={details.service} />
        <Row label="Dentist" value={details.dentist} />
        <Row label="Location" value={details.location} />
      </dl>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-status-no_show">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="rounded-xl bg-deep px-5 py-3 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Confirming…" : "Yes, this time works"}
        </button>
        <Link
          href={`/appointment/${token}/reschedule`}
          className="rounded-xl border border-mint px-5 py-3 text-center text-sm font-semibold text-deep transition-colors hover:bg-mint/40"
        >
          Pick another time
        </Link>
      </div>
    </div>
  );
}
