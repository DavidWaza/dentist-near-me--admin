import type { Appointment, AppointmentStatus } from "@/lib/types";
import type { IconName } from "@/lib/utils/icons";
import {
  APPOINTMENT_STATUSES,
  resolveStatus,
  type ResponseStatusKey,
} from "@/lib/utils/status";

/**
 * Status lifecycle, allowed transitions, and presentation metadata.
 * Single source of truth shared by the queue UI, the detail page, and the
 * PATCH route handler (PRD §7.2). Keeping the rules here means the server
 * validates exactly what the UI offers.
 */

export type ActionKey =
  | "confirm"
  | "reschedule"
  | "cancel"
  | "complete"
  | "no_show"
  | "reopen";

export interface ActionDef {
  key: ActionKey;
  /** Button label. */
  label: string;
  /** Dialog title / confirmation heading. */
  title: string;
  icon: IconName;
  /** Runs on click without a dialog (no extra input, not destructive). */
  direct: boolean;
  /** Status the appointment moves to. */
  to: AppointmentStatus | null;
  /** Destructive actions require an explicit confirm step (PRD §12). */
  destructive: boolean;
  /** Whether a "notify patient" email is offered for this action. */
  notifiable: boolean;
  /** Requires a new `starts_at`. */
  needsTime: boolean;
  /** Requires a free-text reason. */
  needsReason: boolean;
}

export const ACTIONS: Record<ActionKey, ActionDef> = {
  confirm: {
    key: "confirm",
    title: "Confirm booking",
    icon: "confirmed",
    direct: true,
    label: "Confirm booking",
    to: "confirmed",
    destructive: false,
    notifiable: true,
    needsTime: false,
    needsReason: false,
  },
  reschedule: {
    key: "reschedule",
    title: "Reschedule appointment",
    icon: "rescheduled",
    direct: false,
    label: "Reschedule",
    to: "rescheduled",
    destructive: false,
    notifiable: true,
    needsTime: true,
    needsReason: false,
  },
  cancel: {
    key: "cancel",
    title: "Cancel appointment",
    icon: "cancelled",
    direct: false,
    label: "Cancel",
    to: "cancelled",
    destructive: true,
    notifiable: true,
    needsTime: false,
    needsReason: true,
  },
  complete: {
    key: "complete",
    title: "Mark completed",
    icon: "complete",
    direct: true,
    label: "Mark completed",
    to: "completed",
    destructive: false,
    notifiable: true,
    needsTime: false,
    needsReason: false,
  },
  no_show: {
    key: "no_show",
    title: "Mark as no-show",
    icon: "noShow",
    direct: false,
    label: "Mark no-show",
    to: "no_show",
    destructive: true,
    notifiable: true,
    needsTime: false,
    needsReason: false,
  },
  reopen: {
    key: "reopen",
    title: "Reopen appointment",
    icon: "reopen",
    direct: false,
    label: "Reopen",
    to: "pending",
    destructive: false,
    notifiable: true,
    needsTime: false,
    needsReason: false,
  },
};

/** Allowed actions per current status (PRD §7.2). */
const TRANSITIONS: Record<AppointmentStatus, ActionKey[]> = {
  pending: ["confirm", "reschedule", "cancel"],
  confirmed: ["complete", "no_show", "reschedule", "cancel"],
  rescheduled: ["confirm", "complete", "no_show", "reschedule", "cancel"],
  completed: [],
  cancelled: ["reopen"],
  no_show: [],
};

export function actionsFor(status: AppointmentStatus): ActionDef[] {
  return TRANSITIONS[status].map((k) => ACTIONS[k]);
}

export function isActionAllowed(
  status: AppointmentStatus,
  action: ActionKey,
): boolean {
  return TRANSITIONS[status]?.includes(action) ?? false;
}

/** Status the row should optimistically show after an action (null = unchanged). */
export function resultingStatus(action: ActionKey): AppointmentStatus | null {
  return ACTIONS[action].to;
}

// ── Shared read helpers ─────────────────────────────────────────────────────

export const ALL_STATUSES: AppointmentStatus[] = [...APPOINTMENT_STATUSES];

/**
 * The patient's side of a reschedule, as a canonical response status (or null
 * when there is nothing to show). Shared by the queue and the detail screen.
 */
export function deriveResponseStatus(
  appt: Pick<
    Appointment,
    "status" | "patient_response" | "confirmation_token"
  >,
): ResponseStatusKey | null {
  const answered = resolveStatus(appt.patient_response, "response");
  if (answered) return answered;
  if (appt.status === "rescheduled" && appt.confirmation_token) {
    return "awaiting_patient";
  }
  return null;
}

/**
 * Append a structured audit line to staff_notes (PRD §7.2 audit).
 * e.g. "[2026-06-13 14:02 EDT by jane@clinic] confirmed — slot taken".
 */
export function appendAuditLine(
  existing: string | null,
  line: string,
): string {
  const trimmed = (existing ?? "").trimEnd();
  return trimmed ? `${trimmed}\n${line}` : line;
}
