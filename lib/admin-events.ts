/** Fired after a successful appointment mutation so reports refresh immediately. */
export const APPOINTMENTS_CHANGED = "admin:appointments-changed";

export interface AppointmentsChangedDetail {
  appointmentId: string;
  action: string;
}

export function notifyAppointmentsChanged(detail: AppointmentsChangedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(APPOINTMENTS_CHANGED, { detail }),
  );
}
