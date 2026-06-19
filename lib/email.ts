import "server-only";
import { Resend } from "resend";
import {
  APP_URL,
  CLINIC_NOTIFY_EMAIL,
  EMAIL_FROM,
  RESEND_API_KEY,
  RESEND_SANDBOX_TO,
  SITE_URL,
} from "@/lib/env";
import type { Appointment, PatientResponse } from "@/lib/types";
import { formatDateTime, formatTimeRange } from "@/lib/scheduling";

/**
 * Resend wrapper for status-change notifications.
 * Email failures are LOGGED, never thrown — they must not block the DB write.
 */

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/** Matches app/globals.css brand tokens (for HTML email clients). */
const BRAND = {
  deep: "#0d3550",
  teal: "#145f82",
  mint: "#b8dcf0",
  cream: "#f0f7fc",
  ink: "#0c1f2e",
  muted: "#5a6b78",
} as const;

type EmailKind =
  | "confirmation"
  | "reschedule"
  | "cancellation"
  | "completed"
  | "no_show"
  | "reopened"
  | "patient_response_admin";

export interface EmailDeliveryResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  /** Address Resend actually sent to. */
  to: string;
  /** Patient address from the appointment record. */
  intendedTo: string;
  sandbox?: boolean;
}

function resolveRecipient(intended: string): { to: string; sandbox: boolean } {
  if (RESEND_SANDBOX_TO && RESEND_SANDBOX_TO.toLowerCase() !== intended.toLowerCase()) {
    return { to: RESEND_SANDBOX_TO, sandbox: true };
  }
  return { to: intended, sandbox: false };
}

async function send(
  intendedTo: string,
  subject: string,
  html: string,
  context: { kind: EmailKind; appointmentId: string },
): Promise<EmailDeliveryResult> {
  const { to, sandbox } = resolveRecipient(intendedTo);
  const finalSubject = sandbox
    ? `[DEV → ${intendedTo}] ${subject}`
    : subject;

  if (!resend) {
    console.info(
      `[email:skipped] RESEND_API_KEY unset — would send "${finalSubject}" to ${to} (patient ${intendedTo}, appointment ${context.appointmentId})`,
    );
    return { ok: false, skipped: true, to, intendedTo, sandbox };
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: finalSubject,
      html: sandbox
        ? `<p style="color:#6b7280;font-size:12px">Dev sandbox — intended recipient: <strong>${escape(intendedTo)}</strong></p>${html}`
        : html,
    });
    if (error) {
      console.error(
        `[email:error] ${context.kind} for appointment ${context.appointmentId} (intended ${intendedTo}):`,
        error,
      );
      return {
        ok: false,
        error: String(error.message ?? error),
        to,
        intendedTo,
        sandbox,
      };
    }
    console.info(
      `[email:sent] ${context.kind} → ${to}${sandbox ? ` (sandbox; patient ${intendedTo})` : ""}`,
    );
    return { ok: true, to, intendedTo, sandbox };
  } catch (err) {
    console.error(
      `[email:throw] ${context.kind} for appointment ${context.appointmentId}:`,
      err,
    );
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      to,
      intendedTo,
      sandbox,
    };
  }
}

function shell(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:560px;margin:0 auto;color:${BRAND.ink}">
    <div style="background:${BRAND.deep};color:${BRAND.cream};padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:18px">DentistNearMe</h1>
    </div>
    <div style="border:1px solid ${BRAND.mint};border-top:0;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="margin:0 0 12px;font-size:20px;color:${BRAND.deep}">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:24px;font-size:12px;color:${BRAND.muted}">
        Questions? Just reply to this email and our front desk will help.
      </p>
    </div>
  </div>`;
}

function appointmentDetails(appt: Appointment): string {
  return `
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:4px 0;color:${BRAND.muted}">Service</td><td style="padding:4px 0;text-align:right">${escape(appt.service_slug)}</td></tr>
    <tr><td style="padding:4px 0;color:${BRAND.muted}">Dentist</td><td style="padding:4px 0;text-align:right">${escape(appt.dentist_name)}</td></tr>
    <tr><td style="padding:4px 0;color:${BRAND.muted}">Location</td><td style="padding:4px 0;text-align:right">${escape(appt.location_city)}</td></tr>
    <tr><td style="padding:4px 0;color:${BRAND.muted}">When</td><td style="padding:4px 0;text-align:right">${formatDateTime(appt.starts_at)}<br>${formatTimeRange(appt.starts_at, appt.ends_at)}</td></tr>
  </table>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

/** Branded call-to-action button (table-based for email-client support). */
function button(href: string, label: string, variant: "primary" | "secondary"): string {
  const bg = variant === "primary" ? BRAND.deep : "#ffffff";
  const color = variant === "primary" ? BRAND.cream : BRAND.deep;
  const border = variant === "primary" ? BRAND.deep : BRAND.mint;
  return `<a href="${href}" style="display:inline-block;padding:11px 18px;margin:6px 8px 6px 0;border-radius:10px;background:${bg};color:${color};border:1px solid ${border};font-weight:600;font-size:14px;text-decoration:none">${label}</a>`;
}

export function sendConfirmationEmail(appt: Appointment) {
  const html = shell(
    "Your appointment is confirmed",
    `<p>Hi ${escape(appt.patient_name)}, your appointment is confirmed. We look forward to seeing you.</p>
     ${appointmentDetails(appt)}`,
  );
  return send(appt.patient_email, "Your appointment is confirmed", html, {
    kind: "confirmation",
    appointmentId: appt.id,
  });
}

export function sendRescheduleEmail(
  appt: Appointment,
  previous?: Pick<Appointment, "starts_at" | "ends_at">,
  /** When present, the email offers confirm / pick-another-time actions. */
  token?: string | null,
) {
  const previousHtml = previous
    ? `<p style="margin-top:12px;color:${BRAND.muted}">Previous time: ${formatDateTime(previous.starts_at)} · ${formatTimeRange(previous.starts_at, previous.ends_at)}</p>`
    : "";

  const actionHtml = token
    ? `<p style="margin-top:18px">Does this new time work for you?</p>
       <div style="margin-top:8px">
         ${button(`${APP_URL}/appointment/${token}`, "Yes, this time works", "primary")}
         ${button(`${APP_URL}/appointment/${token}/reschedule`, "Pick another time", "secondary")}
       </div>
       <p style="margin-top:14px;font-size:12px;color:${BRAND.muted}">These links work until your appointment time. You can also just reply to this email.</p>`
    : `<p style="margin-top:16px">If this no longer works, reply to this email and we'll find another slot.</p>`;

  const html = shell(
    "Your appointment has been rescheduled",
    `<p>Hi ${escape(appt.patient_name)}, your appointment has been moved to a new time:</p>
     ${appointmentDetails(appt)}
     ${previousHtml}
     ${actionHtml}`,
  );
  return send(appt.patient_email, "Your appointment has been rescheduled", html, {
    kind: "reschedule",
    appointmentId: appt.id,
  });
}

/**
 * Notify the clinic front desk that a patient acted on a reschedule email —
 * either confirmed the proposed time or picked a new one themselves (both
 * auto-confirm the appointment). Best-effort; skipped if no inbox is configured.
 */
export function sendPatientResponseAdminEmail(
  appt: Appointment,
  kind: PatientResponse,
): Promise<EmailDeliveryResult> {
  if (!CLINIC_NOTIFY_EMAIL) {
    console.info(
      `[email:skipped] CLINIC_NOTIFY_EMAIL (ADMIN_EMAIL) unset — patient ${kind} for appointment ${appt.id} not announced to staff.`,
    );
    return Promise.resolve({
      ok: false,
      skipped: true,
      to: "",
      intendedTo: "",
    });
  }

  const headline =
    kind === "self_rescheduled"
      ? `${appt.patient_name} picked a new time and confirmed`
      : `${appt.patient_name} confirmed their appointment`;
  const lead =
    kind === "self_rescheduled"
      ? "The patient chose a new slot from the reschedule page. The appointment is now confirmed at:"
      : "The patient confirmed the proposed time. The appointment is now confirmed for:";

  const html = shell(
    headline,
    `<p>${lead}</p>
     ${appointmentDetails(appt)}
     <div style="margin-top:16px">
       ${button(`${APP_URL}/admin/appointments/${appt.id}`, "Open in dashboard", "primary")}
     </div>`,
  );
  return send(CLINIC_NOTIFY_EMAIL, headline, html, {
    kind: "patient_response_admin",
    appointmentId: appt.id,
  });
}

export function sendCancellationEmail(appt: Appointment, reason?: string) {
  const reasonHtml = reason
    ? `<p style="margin-top:12px;color:${BRAND.muted}">Reason: ${escape(reason)}</p>`
    : "";
  const html = shell(
    "Your appointment was cancelled",
    `<p>Hi ${escape(appt.patient_name)}, your scheduled appointment has been cancelled:</p>
     ${appointmentDetails(appt)}
     ${reasonHtml}
     <p style="margin-top:16px">
       To book again, visit <a href="${SITE_URL}" style="color:${BRAND.teal}">our booking page</a> or reply to this email.
     </p>`,
  );
  return send(appt.patient_email, "Your appointment was cancelled", html, {
    kind: "cancellation",
    appointmentId: appt.id,
  });
}

export function sendCompletedEmail(appt: Appointment) {
  const html = shell(
    "Thank you for your visit",
    `<p>Hi ${escape(appt.patient_name)}, thank you for visiting us. Your appointment has been marked as completed.</p>
     ${appointmentDetails(appt)}`,
  );
  return send(appt.patient_email, "Thank you for your visit", html, {
    kind: "completed",
    appointmentId: appt.id,
  });
}

export function sendNoShowEmail(appt: Appointment) {
  const html = shell(
    "We missed you at your appointment",
    `<p>Hi ${escape(appt.patient_name)}, we had you scheduled for the following appointment but you did not attend:</p>
     ${appointmentDetails(appt)}`,
  );
  return send(appt.patient_email, "We missed you at your appointment", html, {
    kind: "no_show",
    appointmentId: appt.id,
  });
}

export function sendReopenedEmail(appt: Appointment) {
  const html = shell(
    "Your appointment is back on the schedule",
    `<p>Hi ${escape(appt.patient_name)}, your appointment has been reinstated and is pending confirmation:</p>
     ${appointmentDetails(appt)}`,
  );
  return send(appt.patient_email, "Your appointment is back on the schedule", html, {
    kind: "reopened",
    appointmentId: appt.id,
  });
}
