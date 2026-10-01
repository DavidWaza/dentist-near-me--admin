import "server-only";
import {
  sendCancellationEmail,
  sendCompletedEmail,
  sendConfirmationEmail,
  sendNoShowEmail,
  sendReopenedEmail,
  sendRescheduleEmail,
} from "@/lib/email";
import type { AppointmentMailerPort } from "../../ports/appointment-repository.port";

/** lib/email already logs and never throws; this only picks the template. */
export function createResendMailer(): AppointmentMailerPort {
  return {
    async notify({ action, appointment, previous, reason }) {
      switch (action) {
        case "confirm":
          return sendConfirmationEmail(appointment);
        case "reschedule":
          return sendRescheduleEmail(
            appointment,
            { starts_at: previous.starts_at, ends_at: previous.ends_at },
            appointment.confirmation_token,
          );
        case "cancel":
          return sendCancellationEmail(appointment, reason);
        case "complete":
          return sendCompletedEmail(appointment);
        case "no_show":
          return sendNoShowEmail(appointment);
        case "reopen":
          return sendReopenedEmail(appointment);
        default:
          return null;
      }
    },
  };
}
