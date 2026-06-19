import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/server";
import { getPublicAppointment, isActionable, isUuid } from "@/lib/public-appointments";
import { formatDate, formatDateTime, formatTimeRange } from "@/lib/scheduling";
import { prettifySlug } from "@/lib/format";
import type { PublicAppointment } from "@/lib/public-appointments";
import { ConfirmCard } from "./ConfirmCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Confirm your appointment · DentistNearMe",
  robots: { index: false, follow: false },
};

function Notice({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-mint bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-deep">{title}</h1>
      {children ? <div className="mt-2 text-sm text-ink/70">{children}</div> : null}
    </div>
  );
}

export default async function ConfirmAppointmentPage({
  params,
}: PageProps<"/appointment/[token]">) {
  const { token } = await params;

  if (!isUuid(token)) {
    return (
      <Notice title="This link isn't valid">
        Please use the link from your most recent appointment email.
      </Notice>
    );
  }

  const supabase = createPublicClient();
  let appt: PublicAppointment | null = null;
  try {
    appt = await getPublicAppointment(supabase, token);
  } catch {
    return (
      <Notice title="Something went wrong">
        We couldn’t load your appointment. Please try again shortly.
      </Notice>
    );
  }

  if (!appt) {
    return (
      <Notice title="This link isn't valid">
        It may have already been used or replaced. Please use the link from your
        most recent appointment email.
      </Notice>
    );
  }

  if (appt.expired) {
    return (
      <Notice title="This link has expired">
        Your appointment time has passed or the link is no longer active. Reply to
        your appointment email and we’ll help.
      </Notice>
    );
  }

  const details = {
    service: `${prettifySlug(appt.service_slug)} · ${appt.duration_minutes} min`,
    dentist: appt.dentist_name,
    location: appt.location_city,
    whenLong: `${formatDateTime(appt.starts_at)}`,
    whenRange: formatTimeRange(appt.starts_at, appt.ends_at),
    dateLine: `${formatDate(appt.starts_at)} · ${formatTimeRange(appt.starts_at, appt.ends_at)}`,
  };

  // Terminal states — nothing for the patient to do.
  if (!isActionable(appt.status)) {
    const labels: Record<string, string> = {
      cancelled: "This appointment was cancelled",
      completed: "This appointment is complete",
      no_show: "This appointment is closed",
    };
    return (
      <Notice title={labels[appt.status] ?? "No action needed"}>
        {details.dateLine}
      </Notice>
    );
  }

  // Already responded — show the confirmed state (idempotent revisit).
  if (appt.status === "confirmed" && appt.patient_response) {
    return (
      <Notice title="You're all set ✓">
        <p>
          Your appointment is confirmed for <strong>{details.whenLong}</strong>.
        </p>
        <p className="mt-3 text-ink/60">{details.service} with {details.dentist}</p>
      </Notice>
    );
  }

  return (
    <ConfirmCard
      token={token}
      patientName={appt.patient_name}
      details={details}
    />
  );
}
