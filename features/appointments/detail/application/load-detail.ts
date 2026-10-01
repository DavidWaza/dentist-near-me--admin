import type { AppointmentDetail } from "../domain/appointment-detail";
import type { DetailServicePort } from "../ports/detail-service.port";
import { toAppointmentDetail } from "../infrastructure/transformers/appointment-detail.transformer";

export interface LoadDetailDeps {
  service: DetailServicePort;
}

export type DetailResult =
  | { kind: "found"; detail: AppointmentDetail }
  | { kind: "not_found" };

/** Throws on read failure so the route's error boundary takes over. */
export async function loadDetail(
  deps: LoadDetailDeps,
  id: string,
): Promise<DetailResult> {
  const appt = await deps.service.getAppointment(id);
  return appt
    ? { kind: "found", detail: toAppointmentDetail(appt) }
    : { kind: "not_found" };
}
