import type { AppointmentStatus } from "@/lib/types";
import type { FlagStatusKey, ResponseStatusKey } from "@/lib/utils/status";

/**
 * The queue's own read model — only what a row shows. Timestamps stay raw ISO
 * so the cell that prints them owns the format.
 */
export interface QueueRow {
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
  status: AppointmentStatus;
  response: ResponseStatusKey | null;
  flags: FlagStatusKey[];
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface QueueFilterOptions {
  dentists: FilterOption[];
  locations: FilterOption[];
}

/** Pending bookings this close to their start need a human. */
export const NEEDS_ATTENTION_WITHIN_HOURS = 24;
