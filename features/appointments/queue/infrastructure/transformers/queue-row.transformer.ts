import { deriveResponseStatus } from "@/lib/appointments";
import { durationMinutes, prettifySlug } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import type { QueueRow } from "../../domain/queue-row";

/** DB row → queue read model. Flags are added by the application layer. */
export function toQueueRow(appt: Appointment): QueueRow {
  return {
    id: appt.id,
    patientName: appt.patient_name,
    patientEmail: appt.patient_email,
    patientPhone: appt.patient_phone,
    serviceLabel: prettifySlug(appt.service_slug),
    durationMin: durationMinutes(appt.starts_at, appt.ends_at),
    dentistName: appt.dentist_name,
    locationCity: appt.location_city,
    startsAt: appt.starts_at,
    endsAt: appt.ends_at,
    status: appt.status,
    response: deriveResponseStatus(appt),
    flags: [],
  };
}
