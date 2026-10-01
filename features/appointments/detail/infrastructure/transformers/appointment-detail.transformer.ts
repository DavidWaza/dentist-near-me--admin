import { deriveResponseStatus } from "@/lib/appointments";
import { durationMinutes, prettifySlug } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import {
  parseAuditTrail,
  type AppointmentDetail,
} from "../../domain/appointment-detail";

export function toAppointmentDetail(appt: Appointment): AppointmentDetail {
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
    createdAt: appt.created_at,
    status: appt.status,
    response: deriveResponseStatus(appt),
    patientNotes: appt.notes?.trim() || null,
    audit: parseAuditTrail(appt.staff_notes),
  };
}
