"use client";

import { useState } from "react";
import Link from "next/link";
import {
  NButton,
  NCard,
  NDescriptionDetails,
  NDescriptionItem,
  NDescriptionList,
  NDescriptionTerm,
  NFieldError,
  NIcon,
} from "@/components/n";

interface Details {
  service: string;
  dentist: string;
  location: string;
  whenLong: string;
  whenRange: string;
  dateLine: string;
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
      <NCard className="items-start px-6 py-6 shadow-sm">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-green-100 text-green-500">
          <NIcon name="complete" weight="fill" className="size-6" />
        </span>
        <h1 className="text-xl font-bold text-base-900">You’re all set</h1>
        <p className="text-sm text-base-600">
          Thanks, {patientName}. Your appointment is confirmed for{" "}
          <strong className="text-base-900">{details.whenLong}</strong>. We’ve emailed
          you a confirmation.
        </p>
      </NCard>
    );
  }

  return (
    <NCard className="px-6 py-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-base-900">
          Does this new time work, {patientName}?
        </h1>
        <p className="text-sm text-base-500">
          Your appointment was rescheduled. Please confirm the new time below.
        </p>
      </div>

      <NDescriptionList layout="rows" className="rounded-xl bg-base-50 px-4 py-1">
        <NDescriptionItem>
          <NDescriptionTerm>When</NDescriptionTerm>
          <NDescriptionDetails>{details.dateLine}</NDescriptionDetails>
        </NDescriptionItem>
        <NDescriptionItem>
          <NDescriptionTerm>Service</NDescriptionTerm>
          <NDescriptionDetails>{details.service}</NDescriptionDetails>
        </NDescriptionItem>
        <NDescriptionItem>
          <NDescriptionTerm>Dentist</NDescriptionTerm>
          <NDescriptionDetails>{details.dentist}</NDescriptionDetails>
        </NDescriptionItem>
        <NDescriptionItem>
          <NDescriptionTerm>Location</NDescriptionTerm>
          <NDescriptionDetails>{details.location}</NDescriptionDetails>
        </NDescriptionItem>
      </NDescriptionList>

      {error ? <NFieldError>{error}</NFieldError> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <NButton size="lg" onClick={confirm} disabled={busy}>
          <NIcon name="complete" />
          {busy ? "Confirming…" : "Yes, this time works"}
        </NButton>
        <NButton asChild size="lg" color="secondary" variant="outline">
          <Link href={`/appointment/${token}/reschedule`}>Pick another time</Link>
        </NButton>
      </div>
    </NCard>
  );
}
