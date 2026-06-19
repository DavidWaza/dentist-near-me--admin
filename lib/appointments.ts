import type { AppointmentStatus } from "@/lib/types";

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

interface ActionDef {
  key: ActionKey;
  label: string;
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
    label: "Confirm booking",
    to: "confirmed",
    destructive: false,
    notifiable: true,
    needsTime: false,
    needsReason: false,
  },
  reschedule: {
    key: "reschedule",
    label: "Reschedule",
    to: "rescheduled",
    destructive: false,
    notifiable: true,
    needsTime: true,
    needsReason: false,
  },
  cancel: {
    key: "cancel",
    label: "Cancel",
    to: "cancelled",
    destructive: true,
    notifiable: true,
    needsTime: false,
    needsReason: true,
  },
  complete: {
    key: "complete",
    label: "Mark completed",
    to: "completed",
    destructive: false,
    notifiable: true,
    needsTime: false,
    needsReason: false,
  },
  no_show: {
    key: "no_show",
    label: "Mark no-show",
    to: "no_show",
    destructive: true,
    notifiable: true,
    needsTime: false,
    needsReason: false,
  },
  reopen: {
    key: "reopen",
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

// ── Presentation ────────────────────────────────────────────────────────────

export interface StatusMeta {
  label: string;
  /** Tailwind classes for the badge (text + bg use the brand status tokens). */
  badge: string;
}

export const STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    badge: "text-status-pending bg-status-pending-bg",
  },
  confirmed: {
    label: "Confirmed",
    badge: "text-status-confirmed bg-status-confirmed-bg",
  },
  rescheduled: {
    label: "Rescheduled",
    badge: "text-status-rescheduled bg-status-rescheduled-bg",
  },
  completed: {
    label: "Completed",
    badge: "text-status-completed bg-status-completed-bg",
  },
  cancelled: {
    label: "Cancelled",
    badge: "text-status-cancelled bg-status-cancelled-bg",
  },
  no_show: {
    label: "No-show",
    badge: "text-status-no_show bg-status-no_show-bg",
  },
};

export const ALL_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "rescheduled",
  "completed",
  "cancelled",
  "no_show",
];

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
