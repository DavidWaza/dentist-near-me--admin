import Link from "next/link";
import type { Appointment } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { AppointmentActions } from "./AppointmentActions";
import {
  formatDate,
  formatTimeRange,
  hoursUntil,
  utcISOToClinicWallInput,
} from "@/lib/scheduling";
import { durationMinutes, prettifySlug } from "@/lib/format";

function Flag({
  tone,
  children,
}: {
  tone: "info" | "warn";
  children: React.ReactNode;
}) {
  const cls =
    tone === "warn"
      ? "bg-status-pending-bg text-status-pending"
      : "bg-status-confirmed-bg text-status-confirmed";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {children}
    </span>
  );
}

function rowFlags(appt: Appointment, returning: boolean, now: Date) {
  const needsAttention =
    appt.status === "pending" && hoursUntil(appt.starts_at, now) <= 24;
  const awaitingPatient =
    appt.status === "rescheduled" &&
    Boolean(appt.confirmation_token) &&
    !appt.patient_response;
  return (
    <>
      {returning ? <Flag tone="info">Returning</Flag> : null}
      {needsAttention ? <Flag tone="warn">Needs attention</Flag> : null}
      {awaitingPatient ? <Flag tone="warn">Awaiting patient</Flag> : null}
      {appt.patient_response === "confirmed" ? (
        <Flag tone="info">Patient confirmed</Flag>
      ) : null}
      {appt.patient_response === "self_rescheduled" ? (
        <Flag tone="info">Patient picked time</Flag>
      ) : null}
    </>
  );
}

export function AppointmentsTable({
  rows,
  returningEmails,
  now = new Date(),
}: {
  rows: Appointment[];
  returningEmails: Set<string>;
  now?: Date;
}) {
  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-xl border border-mint bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mint text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Patient</th>
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 font-semibold">Dentist</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((appt) => {
              const returning = returningEmails.has(
                appt.patient_email.toLowerCase(),
              );
              return (
                <tr
                  key={appt.id}
                  className="border-b border-mint/60 last:border-0 hover:bg-cream/60"
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-ink">
                      {formatDate(appt.starts_at)}
                    </div>
                    <div className="text-ink/60">
                      {formatTimeRange(appt.starts_at, appt.ends_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/appointments/${appt.id}`}
                      className="font-medium text-deep underline-offset-2 hover:underline"
                    >
                      {appt.patient_name}
                    </Link>
                    <div className="text-ink/60">{appt.patient_phone}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {rowFlags(appt, returning, now)}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-ink">{prettifySlug(appt.service_slug)}</div>
                    <div className="text-ink/60">
                      {durationMinutes(appt.starts_at, appt.ends_at)} min
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-ink">
                    {appt.dentist_name}
                  </td>
                  <td className="px-4 py-3 align-top text-ink">
                    {appt.location_city}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={appt.status} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <AppointmentActions
                      appointment={{
                        id: appt.id,
                        status: appt.status,
                        patient_name: appt.patient_name,
                        patient_email: appt.patient_email,
                        rescheduleDefaultWall: utcISOToClinicWallInput(
                          appt.starts_at,
                        ),
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((appt) => {
          const returning = returningEmails.has(
            appt.patient_email.toLowerCase(),
          );
          return (
            <li
              key={appt.id}
              className="rounded-xl border border-mint bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/appointments/${appt.id}`}
                    className="font-semibold text-deep underline-offset-2 hover:underline"
                  >
                    {appt.patient_name}
                  </Link>
                  <div className="text-sm text-ink/60">{appt.patient_phone}</div>
                </div>
                <StatusBadge status={appt.status} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <div className="col-span-2">
                  <dt className="sr-only">When</dt>
                  <dd className="text-ink">
                    {formatDate(appt.starts_at)} ·{" "}
                    {formatTimeRange(appt.starts_at, appt.ends_at)}
                  </dd>
                </div>
                <dd className="text-ink/80">
                  {prettifySlug(appt.service_slug)} (
                  {durationMinutes(appt.starts_at, appt.ends_at)} min)
                </dd>
                <dd className="text-right text-ink/80">{appt.dentist_name}</dd>
                <dd className="text-ink/60">{appt.location_city}</dd>
              </dl>

              <div className="mt-2 flex flex-wrap gap-1">
                {rowFlags(appt, returning, now)}
              </div>

              <div className="mt-3 border-t border-mint/60 pt-3">
                <AppointmentActions
                  appointment={{
                    id: appt.id,
                    status: appt.status,
                    patient_name: appt.patient_name,
                    patient_email: appt.patient_email,
                    rescheduleDefaultWall: utcISOToClinicWallInput(
                      appt.starts_at,
                    ),
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
