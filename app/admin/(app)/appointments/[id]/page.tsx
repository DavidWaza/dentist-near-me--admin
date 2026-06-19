import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "../../../_components/StatusBadge";
import { AppointmentActions } from "../../../_components/AppointmentActions";
import {
  formatDate,
  formatTimeRange,
  utcISOToClinicWallInput,
} from "@/lib/scheduling";
import { durationMinutes, prettifySlug } from "@/lib/format";
import type { Appointment } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Appointment · Staff console" };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}

export default async function AppointmentDetailPage({
  params,
}: PageProps<"/admin/appointments/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`[appointment detail ${id}]`, error);
    throw new Error("Failed to load appointment");
  }
  if (!data) notFound();

  const appt = data as Appointment;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link
          href="/admin/appointments"
          className="text-sm text-teal underline-offset-2 hover:underline"
        >
          ← Back to appointments
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-deep">{appt.patient_name}</h1>
          <p className="text-sm text-ink/60">
            {formatDate(appt.starts_at)} ·{" "}
            {formatTimeRange(appt.starts_at, appt.ends_at)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={appt.status} />
          {appt.patient_response === "confirmed" ? (
            <span className="inline-flex items-center rounded-full bg-status-confirmed-bg px-2.5 py-0.5 text-xs font-semibold text-status-confirmed">
              ✓ Patient confirmed
            </span>
          ) : appt.patient_response === "self_rescheduled" ? (
            <span className="inline-flex items-center rounded-full bg-status-confirmed-bg px-2.5 py-0.5 text-xs font-semibold text-status-confirmed">
              ✓ Patient picked this time
            </span>
          ) : appt.status === "rescheduled" && appt.confirmation_token ? (
            <span className="inline-flex items-center rounded-full bg-status-pending-bg px-2.5 py-0.5 text-xs font-semibold text-status-pending">
              Awaiting patient response
            </span>
          ) : null}
        </div>
      </div>

      {/* Actions */}
      <section className="rounded-xl border border-mint bg-white p-5">
        <h2 className="mb-3 font-semibold text-deep">Actions</h2>
        <AppointmentActions
          appointment={{
            id: appt.id,
            status: appt.status,
            patient_name: appt.patient_name,
            patient_email: appt.patient_email,
            rescheduleDefaultWall: utcISOToClinicWallInput(appt.starts_at),
          }}
          layout="detail"
        />
      </section>

      {/* Details */}
      <section className="rounded-xl border border-mint bg-white p-5">
        <h2 className="mb-4 font-semibold text-deep">Details</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field
            label="Service"
            value={`${prettifySlug(appt.service_slug)} · ${durationMinutes(appt.starts_at, appt.ends_at)} min`}
          />
          <Field label="Dentist" value={appt.dentist_name} />
          <Field label="Location" value={appt.location_city} />
          <Field
            label="Email"
            value={
              <a
                href={`mailto:${appt.patient_email}`}
                className="text-teal hover:underline"
              >
                {appt.patient_email}
              </a>
            }
          />
          <Field
            label="Phone"
            value={
              <a
                href={`tel:${appt.patient_phone}`}
                className="text-teal hover:underline"
              >
                {appt.patient_phone}
              </a>
            }
          />
          <Field
            label="Booked"
            value={formatDate(appt.created_at)}
          />
        </dl>

        {appt.notes ? (
          <div className="mt-4 border-t border-mint/60 pt-4">
            <dt className="text-xs uppercase tracking-wide text-ink/50">
              Patient notes
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-ink">{appt.notes}</dd>
          </div>
        ) : null}
      </section>

      {/* Audit trail */}
      <section className="rounded-xl border border-mint bg-white p-5">
        <h2 className="mb-3 font-semibold text-deep">Staff notes &amp; audit</h2>
        {appt.staff_notes ? (
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-cream p-3 font-mono text-xs leading-relaxed text-ink/80">
            {appt.staff_notes}
          </pre>
        ) : (
          <p className="text-sm text-ink/50">No staff notes yet.</p>
        )}
      </section>
    </div>
  );
}
