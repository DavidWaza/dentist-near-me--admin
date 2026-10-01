import type { Appointment } from "@/lib/types";

export interface DetailServicePort {
  /** null when the row doesn't exist (or RLS hides it). Throws on errors. */
  getAppointment(id: string): Promise<Appointment | null>;
}
