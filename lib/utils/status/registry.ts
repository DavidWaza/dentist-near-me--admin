import type { IconName } from "@/lib/utils/icons";
import type { StatusKinds, StatusKind } from "./types";
import type { Tone } from "./palette";

export interface StatusDefinition {
  label: string;
  icon: IconName;
  tone: Tone;
}

type Registry = {
  [K in StatusKind]: Record<StatusKinds[K], StatusDefinition>;
};

/** Canonical status → how it looks. The only place that decides. */
export const STATUS_REGISTRY: Registry = {
  appointment: {
    pending: { label: "Pending", icon: "pending", tone: "pending" },
    confirmed: { label: "Confirmed", icon: "confirmed", tone: "info" },
    rescheduled: { label: "Rescheduled", icon: "rescheduled", tone: "attention" },
    completed: { label: "Completed", icon: "complete", tone: "success" },
    cancelled: { label: "Cancelled", icon: "cancelled", tone: "neutral" },
    no_show: { label: "No-show", icon: "noShow", tone: "danger" },
  },
  response: {
    awaiting_patient: { label: "Awaiting patient", icon: "pending", tone: "pending" },
    patient_confirmed: { label: "Patient confirmed", icon: "patientConfirmed", tone: "info" },
    patient_picked_time: { label: "Patient picked time", icon: "patientConfirmed", tone: "info" },
  },
  flag: {
    returning: { label: "Returning", icon: "returning", tone: "info" },
    needs_attention: { label: "Needs attention", icon: "warning", tone: "pending" },
  },
};

export const UNKNOWN_STATUS: StatusDefinition = {
  label: "Unknown",
  icon: "info",
  tone: "neutral",
};
