import type { ActionKey } from "@/lib/appointments";

/** What the server reports about the patient email that followed an action. */
export interface EmailDelivery {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  /** Address the mail was actually sent to (the sandbox inbox in dev). */
  to: string;
  /** The patient's address on the record. */
  intendedTo: string;
  sandbox?: boolean;
}

export type FeedbackTone = "success" | "info" | "error";

export interface ActionFeedback {
  tone: FeedbackTone;
  title: string;
  description?: string;
}

const DONE_TITLES: Record<ActionKey, string> = {
  confirm: "Booking confirmed",
  reschedule: "Appointment rescheduled",
  cancel: "Appointment cancelled",
  complete: "Marked as completed",
  no_show: "Marked as no-show",
  reopen: "Appointment reopened",
};

/** Turn an action result into the toast the user sees. */
export function describeActionFeedback(
  action: ActionKey,
  email: EmailDelivery | null,
): ActionFeedback {
  const title = DONE_TITLES[action];
  if (!email) return { tone: "success", title };

  if (email.ok) {
    const where = email.sandbox
      ? `the sandbox inbox (${email.to})`
      : email.intendedTo;
    return { tone: "success", title, description: `Patient emailed at ${where}.` };
  }
  if (email.skipped) {
    return {
      tone: "info",
      title,
      description: "No email sent — set RESEND_API_KEY to notify patients.",
    };
  }
  return {
    tone: "error",
    title: `${title}, but the email failed`,
    description: email.error,
  };
}
