"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACTIONS,
  actionsFor,
  type ActionKey,
} from "@/lib/appointments";
import { notifyAppointmentsChanged } from "@/lib/admin-events";
import type { AppointmentStatus } from "@/lib/types";

export interface ActionAppointment {
  id: string;
  status: AppointmentStatus;
  patient_name: string;
  patient_email: string;
  /** Pre-computed clinic wall-clock value ("YYYY-MM-DDTHH:mm") for the picker. */
  rescheduleDefaultWall: string;
}

type Layout = "row" | "detail";

interface PatchBody {
  action: ActionKey;
  starts_at?: string;
  reason?: string;
}

interface EmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  to: string;
  intendedTo: string;
  sandbox?: boolean;
}

function emailFeedback(action: ActionKey, email: EmailResult): string {
  const where = email.sandbox
    ? `sandbox inbox (${email.to})`
    : email.intendedTo;

  if (email.ok) {
    if (action === "confirm") {
      return `Booking confirmed — confirmation email sent to ${where}.`;
    }
    return `Patient emailed at ${where}.`;
  }
  if (email.skipped) {
    return "Saved. Set RESEND_API_KEY in .env to send emails.";
  }
  return `Saved, but email failed${email.error ? `: ${email.error}` : "."}`;
}

export function AppointmentActions({
  appointment,
  layout = "row",
}: {
  appointment: ActionAppointment;
  layout?: Layout;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<ActionKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const available = actionsFor(appointment.status);
  if (available.length === 0) {
    return layout === "detail" ? (
      <p className="text-sm text-ink/60">No actions available for this status.</p>
    ) : (
      <span className="text-xs text-ink/40">—</span>
    );
  }

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }

  async function run(action: ActionKey, extra?: Omit<PatchBody, "action">) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra } satisfies PatchBody),
      });

      if (res.status === 409) {
        setError("That slot was just taken. Please pick another time.");
        return;
      }
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }

      const body = (await res.json()) as {
        email?: EmailResult | null;
      };

      if (body.email) {
        const msg = emailFeedback(action, body.email);
        setNotice(msg);
        showToast(msg);
      } else if (action === "confirm") {
        const msg = "Booking confirmed.";
        setNotice(msg);
        showToast(msg);
      }

      notifyAppointmentsChanged({ appointmentId: appointment.id, action });
      setOpen(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const btnBase =
    "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

  return (
    <>
      <div
        className={
          layout === "detail"
            ? "flex flex-wrap gap-2"
            : "flex flex-wrap justify-end gap-1.5"
        }
      >
        {available.map((a) => {
          const danger = a.destructive;
          // Confirm & complete need no extra input — one click runs the action + email.
          const direct = a.key === "complete" || a.key === "confirm";
          return (
            <button
              key={a.key}
              type="button"
              disabled={busy}
              onClick={() => (direct ? run(a.key) : setOpen(a.key))}
              className={`${btnBase} ${
                danger
                  ? "bg-status-no_show-bg text-status-no_show hover:brightness-95"
                  : a.key === "confirm"
                    ? "bg-deep text-cream hover:opacity-90"
                    : "border border-mint text-ink hover:bg-mint/40"
              }`}
              title={
                a.key === "confirm"
                  ? `Confirm booking and email ${appointment.patient_email}`
                  : undefined
              }
            >
              {a.key === "confirm" ? "Confirm booking" : a.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-status-no_show">
          {error}
        </p>
      ) : null}

      {notice && layout === "detail" ? (
        <p className="mt-2 text-sm text-status-confirmed">{notice}</p>
      ) : null}

      {open ? (
        <ActionDialog
          actionKey={open}
          appointment={appointment}
          busy={busy}
          error={error}
          onClose={() => {
            setOpen(null);
            setError(null);
          }}
          onSubmit={(extra) => run(open, extra)}
        />
      ) : null}

      {toast ? (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-[60] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-mint bg-white px-4 py-3 text-sm font-medium text-deep shadow-lg md:bottom-6"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}

function ActionDialog({
  actionKey,
  appointment,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  actionKey: ActionKey;
  appointment: ActionAppointment;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (extra: Omit<PatchBody, "action">) => void;
}) {
  const def = ACTIONS[actionKey];
  const [reason, setReason] = useState("");
  const [wall, setWall] = useState(appointment.rescheduleDefaultWall);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const titles: Record<ActionKey, string> = {
    confirm: "Confirm booking",
    cancel: "Cancel appointment",
    reschedule: "Reschedule appointment",
    complete: "Mark completed",
    no_show: "Mark as no-show",
    reopen: "Reopen appointment",
  };

  const submit = () => {
    const extra: Omit<PatchBody, "action"> = {};
    if (def.needsReason) extra.reason = reason.trim() || undefined;
    if (def.needsTime) extra.starts_at = wall;
    onSubmit(extra);
  };

  const canSubmit = def.needsTime ? Boolean(wall) : true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={titles[actionKey]}
        tabIndex={-1}
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl outline-none sm:rounded-2xl"
      >
        <h2 className="text-lg font-bold text-deep">{titles[actionKey]}</h2>
        <p className="mt-1 text-sm text-ink/70">
          Patient: <span className="font-medium">{appointment.patient_name}</span>
          <br />
          <span className="text-ink/50">{appointment.patient_email}</span>
        </p>

        <div className="mt-4 space-y-3">
          {def.needsTime ? (
            <label className="block text-sm">
              <span className="mb-1 block text-ink/80">New date &amp; time</span>
              <input
                type="datetime-local"
                value={wall}
                onChange={(e) => setWall(e.target.value)}
                className="w-full rounded-lg border border-mint px-3 py-2"
              />
              <span className="mt-1 block text-xs text-ink/50">
                Shown in the clinic timezone. Saving re-checks for double-booking.
              </span>
            </label>
          ) : null}

          {def.needsReason ? (
            <label className="block text-sm">
              <span className="mb-1 block text-ink/80">
                Cancellation reason <span className="text-ink/40">(optional)</span>
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-mint px-3 py-2"
                placeholder="e.g. patient requested, clinic closure…"
              />
            </label>
          ) : null}

          {def.notifiable ? (
            <p className="rounded-lg bg-status-confirmed-bg px-3 py-2 text-xs text-status-confirmed">
              A notification email will be sent to{" "}
              <strong>{appointment.patient_email}</strong>.
            </p>
          ) : null}

          {def.destructive ? (
            <p className="rounded-lg bg-status-no_show-bg px-3 py-2 text-xs text-status-no_show">
              This action can’t be undone from here.
              {actionKey === "cancel"
                ? " The appointment stays in the list with a Cancelled status. The time slot is freed."
                : ""}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-status-no_show">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-mint px-3 py-2 text-sm font-medium text-ink hover:bg-cream disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !canSubmit}
            className={`rounded-lg px-3 py-2 text-sm font-semibold text-cream disabled:opacity-50 ${
              def.destructive ? "bg-status-no_show" : "bg-deep"
            }`}
          >
            {busy ? "Working…" : def.label}
          </button>
        </div>
      </div>
    </div>
  );
}
