import type { AppointmentStatus } from "@/lib/types";
import type { ResponseStatusKey } from "@/lib/utils/status";

/*
 * Duplicated from appointments/queue/domain/queue-routes.ts — features don't
 * import each other. Keep both copies in sync.
 */
export const QUEUE_PATH = "/admin/appointments";

/** One parsed line of the staff_notes audit trail. */
export interface AuditEntry {
  /** "Jun 13, 2:02 PM (EDT)" as written by the server, or null if unparsed. */
  stamp: string | null;
  actor: string | null;
  /** "confirm", "cancel — patient requested", or the raw line. */
  text: string;
}

/** The detail screen's read model. Timestamps stay raw ISO. */
export interface AppointmentDetail {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  serviceLabel: string;
  durationMin: number;
  dentistName: string;
  locationCity: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  status: AppointmentStatus;
  response: ResponseStatusKey | null;
  patientNotes: string | null;
  audit: AuditEntry[];
}

const AUDIT_LINE = /^\[(.+?) by (.+?)\]\s*(.*)$/;

/** "[stamp by who] action — detail" per line → entries, newest first. */
export function parseAuditTrail(staffNotes: string | null): AuditEntry[] {
  if (!staffNotes?.trim()) return [];
  return staffNotes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = AUDIT_LINE.exec(line);
      return match
        ? { stamp: match[1], actor: match[2], text: match[3] || "updated" }
        : { stamp: null, actor: null, text: line };
    })
    .reverse();
}
