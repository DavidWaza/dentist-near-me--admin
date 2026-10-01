import type { Appointment } from "@/lib/types";
import type { EmailDelivery } from "../domain/action-feedback";
import type { ActionRequest } from "../domain/action-target";

export interface ApplyActionResult {
  appointment: Appointment;
  email: EmailDelivery | null;
}

/**
 * Browser → API. Implementations throw `ApiError` (with `httpStatus`) for any
 * failure, including `status: false` envelopes on HTTP 200.
 */
export interface ActionsServicePort {
  applyAction(id: string, body: ActionRequest): Promise<ApplyActionResult>;
}
