import { notFound } from "next/navigation";
import {
  NCard,
  NCardContent,
  NCardDescription,
  NCardHeader,
  NCardTitle,
  NDescriptionDetails,
  NDescriptionItem,
  NDescriptionList,
  NDescriptionTerm,
  NIcon,
  NLink,
  NPageContainer,
  NPageContent,
  NPageHeader,
  NPageHeading,
  NPageTitle,
  NStatus,
} from "@/components/n";
import {
  formatDate,
  formatTimeRange,
  tzAbbrev,
} from "@/lib/utils/date-formatters";
import { AaActions } from "@/features/appointments/actions/ui/aa-actions";
import { getAdDetail } from "../../composition/get-ad-detail";
import { QUEUE_PATH } from "../../domain/appointment-detail";
import { AdAuditTrail } from "./audit-trail";

/** Appointment detail — feature root (Server Component). */
export async function AdDetail({ id }: { id: string }) {
  const result = await getAdDetail(id);
  if (result.kind === "not_found") notFound();
  const appt = result.detail;

  return (
    <NPageContainer>
      <NPageContent className="max-w-5xl">
        <NLink
          href={QUEUE_PATH}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium"
        >
          <NIcon name="back" className="size-4" />
          Back to appointments
        </NLink>

        <NPageHeader className="items-start">
          <NPageHeading>
            <NPageTitle>{appt.patientName}</NPageTitle>
            <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-base-600">
              <NIcon name="appointments" className="size-4 text-base-500" />
              <span className="font-medium text-base-900">{formatDate(appt.startsAt)}</span>
              <span aria-hidden className="text-base-400">·</span>
              <span>
                {formatTimeRange(appt.startsAt, appt.endsAt)} {tzAbbrev(appt.startsAt)}
              </span>
            </p>
          </NPageHeading>
          <div className="flex flex-wrap items-center gap-2">
            <NStatus status={appt.status} kind="appointment" />
            {appt.response ? <NStatus status={appt.response} kind="response" /> : null}
          </div>
        </NPageHeader>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-5">
            <NCard>
              <NCardHeader>
                <NCardTitle>Appointment</NCardTitle>
              </NCardHeader>
              <NCardContent>
                <NDescriptionList>
                  <NDescriptionItem>
                    <NDescriptionTerm>Service</NDescriptionTerm>
                    <NDescriptionDetails>
                      {appt.serviceLabel} · {appt.durationMin} min
                    </NDescriptionDetails>
                  </NDescriptionItem>
                  <NDescriptionItem>
                    <NDescriptionTerm>Dentist</NDescriptionTerm>
                    <NDescriptionDetails>{appt.dentistName}</NDescriptionDetails>
                  </NDescriptionItem>
                  <NDescriptionItem>
                    <NDescriptionTerm>Location</NDescriptionTerm>
                    <NDescriptionDetails>{appt.locationCity}</NDescriptionDetails>
                  </NDescriptionItem>
                  <NDescriptionItem>
                    <NDescriptionTerm>Booked</NDescriptionTerm>
                    <NDescriptionDetails>{formatDate(appt.createdAt)}</NDescriptionDetails>
                  </NDescriptionItem>
                </NDescriptionList>
              </NCardContent>
            </NCard>

            <NCard>
              <NCardHeader>
                <NCardTitle>Patient</NCardTitle>
              </NCardHeader>
              <NCardContent className="flex flex-col gap-4">
                <NDescriptionList>
                  <NDescriptionItem>
                    <NDescriptionTerm>Email</NDescriptionTerm>
                    <NDescriptionDetails>
                      <a
                        href={`mailto:${appt.patientEmail}`}
                        className="inline-flex items-center gap-1.5 text-accent-500 hover:underline"
                      >
                        <NIcon name="email" className="size-4" />
                        {appt.patientEmail}
                      </a>
                    </NDescriptionDetails>
                  </NDescriptionItem>
                  <NDescriptionItem>
                    <NDescriptionTerm>Phone</NDescriptionTerm>
                    <NDescriptionDetails>
                      <a
                        href={`tel:${appt.patientPhone}`}
                        className="inline-flex items-center gap-1.5 text-accent-500 hover:underline"
                      >
                        <NIcon name="phone" className="size-4" />
                        {appt.patientPhone}
                      </a>
                    </NDescriptionDetails>
                  </NDescriptionItem>
                </NDescriptionList>
                <div className="flex flex-col gap-1.5 border-t border-base-100 pt-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-base-500">
                    Patient notes
                  </span>
                  {appt.patientNotes ? (
                    <p className="whitespace-pre-wrap text-sm text-base-900">
                      {appt.patientNotes}
                    </p>
                  ) : (
                    <p className="text-sm text-base-500">No notes from the patient.</p>
                  )}
                </div>
              </NCardContent>
            </NCard>

            <NCard>
              <NCardHeader>
                <NCardTitle>Activity</NCardTitle>
                <NCardDescription>
                  Every status change is recorded here, newest first.
                </NCardDescription>
              </NCardHeader>
              <NCardContent>
                <AdAuditTrail entries={appt.audit} />
              </NCardContent>
            </NCard>
          </div>

          <NCard className="lg:sticky lg:top-24">
            <NCardHeader>
              <NCardTitle>Actions</NCardTitle>
              <NCardDescription>
                The patient is emailed after each change.
              </NCardDescription>
            </NCardHeader>
            <NCardContent>
              <AaActions
                layout="panel"
                target={{
                  id: appt.id,
                  status: appt.status,
                  patientName: appt.patientName,
                  patientEmail: appt.patientEmail,
                  startsAt: appt.startsAt,
                }}
              />
            </NCardContent>
          </NCard>
        </div>
      </NPageContent>
    </NPageContainer>
  );
}
