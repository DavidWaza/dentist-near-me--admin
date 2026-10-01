import {
  ACTIONS,
  appendAuditLine,
  isActionAllowed,
} from "@/lib/appointments";
import type { Appointment } from "@/lib/types";
import { WALL_TIME_PATTERN, type ActionRequest } from "../domain/action-target";
import type { ApplyActionResult } from "../ports/actions-service.port";
import type {
  AppointmentMailerPort,
  AppointmentRepositoryPort,
} from "../ports/appointment-repository.port";

export interface ApplyAppointmentActionDeps {
  repository: AppointmentRepositoryPort;
  mailer: AppointmentMailerPort;
  /** Clinic wall-clock "YYYY-MM-DDTHH:mm" → UTC ISO. Throws on bad input. */
  wallTimeToUtc: (wall: string) => string;
  /** Audit timestamp label for "now". */
  auditStamp: () => string;
  newToken: () => string;
  actor: string;
}

export type ApplyAppointmentActionOutcome =
  | { ok: true; result: ApplyActionResult }
  | { ok: false; httpStatus: number; message: string };

const fail = (httpStatus: number, message: string) =>
  ({ ok: false, httpStatus, message }) as const;

/**
 * Server-authoritative status change (PRD §7.2): validates the transition,
 * builds the patch and audit line, persists, then notifies the patient
 * best-effort. Framework-free — the route handler only maps the outcome.
 */
export async function applyAppointmentAction(
  deps: ApplyAppointmentActionDeps,
  id: string,
  request: ActionRequest,
): Promise<ApplyAppointmentActionOutcome> {
  const { action } = request;
  const def = ACTIONS[action];

  const current = await deps.repository.findById(id);
  if (!current) return fail(404, "Appointment not found.");

  if (!isActionAllowed(current.status, action)) {
    return fail(
      422,
      `“${def.label}” isn't available for an appointment that is ${current.status.replace("_", "-")}.`,
    );
  }

  const patch: Partial<Appointment> = {};
  if (def.to) patch.status = def.to;

  if (action === "reschedule") {
    const wall = request.starts_at;
    if (!wall || !WALL_TIME_PATTERN.test(wall)) {
      return fail(400, "A valid new date and time is required.");
    }
    let utc: string;
    try {
      utc = deps.wallTimeToUtc(wall);
    } catch {
      return fail(400, "Could not parse the provided time.");
    }
    patch.starts_at = utc;
    // ends_at is recomputed by the DB trigger from the service duration.

    // Fresh token so the patient can confirm / self-reschedule from the email,
    // valid until the new appointment time. Clears any earlier response.
    patch.confirmation_token = deps.newToken();
    patch.token_expires_at = utc;
    patch.patient_response = null;
    patch.patient_responded_at = null;
  } else if (def.to) {
    // Any other status change invalidates outstanding patient links.
    patch.confirmation_token = null;
    patch.token_expires_at = null;
  }

  let line = `[${deps.auditStamp()} by ${deps.actor}] ${action}`;
  if (action === "reschedule" && request.starts_at) {
    line += ` → ${request.starts_at}`;
  }
  if (action === "cancel" && request.reason) line += ` — ${request.reason}`;
  patch.staff_notes = appendAuditLine(current.staff_notes, line);

  const outcome = await deps.repository.update(id, patch);
  if (!outcome.ok) {
    switch (outcome.reason) {
      case "conflict":
        return fail(409, "That slot was just taken. Please pick another time.");
      case "migration_required":
        return fail(
          503,
          "Database migration required. Run supabase/migrations/0004_rescheduled_status.sql, then 0005_rescheduled_slot_index.sql, and try again.",
        );
      default:
        return fail(500, "Failed to update the appointment.");
    }
  }

  const email = def.notifiable
    ? await deps.mailer.notify({
        action,
        appointment: outcome.appointment,
        previous: current,
        reason: request.reason,
      })
    : null;

  return { ok: true, result: { appointment: outcome.appointment, email } };
}
