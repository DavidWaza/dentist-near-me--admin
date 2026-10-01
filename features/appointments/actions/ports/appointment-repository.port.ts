import type { ActionKey } from "@/lib/appointments";
import type { Appointment } from "@/lib/types";
import type { EmailDelivery } from "../domain/action-feedback";

export type UpdateOutcome =
  | { ok: true; appointment: Appointment }
  | { ok: false; reason: "conflict" | "migration_required" | "failed" };

/** Server-side persistence, under the signed-in user's session (RLS). */
export interface AppointmentRepositoryPort {
  findById(id: string): Promise<Appointment | null>;
  update(id: string, patch: Partial<Appointment>): Promise<UpdateOutcome>;
}

export interface ActionMailContext {
  action: ActionKey;
  appointment: Appointment;
  previous: Appointment;
  reason?: string;
}

/** Patient notification. Must never throw — delivery problems are reported. */
export interface AppointmentMailerPort {
  notify(context: ActionMailContext): Promise<EmailDelivery | null>;
}
