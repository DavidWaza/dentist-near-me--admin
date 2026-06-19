import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIONS,
  appendAuditLine,
  isActionAllowed,
  type ActionKey,
} from "@/lib/appointments";
import {
  clinicWallTimeToUtcISO,
  formatDateTime,
} from "@/lib/scheduling";
import {
  sendCancellationEmail,
  sendCompletedEmail,
  sendConfirmationEmail,
  sendNoShowEmail,
  sendReopenedEmail,
  sendRescheduleEmail,
} from "@/lib/email";
import type { Appointment } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WALL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const bodySchema = z.object({
  action: z.enum([
    "confirm",
    "reschedule",
    "cancel",
    "complete",
    "no_show",
    "reopen",
  ]),
  starts_at: z.string().optional(), // clinic wall-clock "YYYY-MM-DDTHH:mm"
  reason: z.string().max(2000).optional(),
  notify: z.boolean().optional(),
});

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/admin/appointments/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`[GET appointment ${id}]`, error);
    return json({ error: "Failed to load appointment" }, 500);
  }
  if (!data) return json({ error: "Not found" }, 404);
  return json({ appointment: data });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/admin/appointments/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  // 1. Authn — RLS is the real guard, but fail fast with a clean 401.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  // 2. Validate body.
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  const action = parsed.action as ActionKey;
  const def = ACTIONS[action];

  // 3. Load the current row (under the user session / RLS).
  const { data: current, error: loadErr } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) {
    console.error(`[PATCH appointment ${id}] load`, loadErr);
    return json({ error: "Failed to load appointment" }, 500);
  }
  if (!current) return json({ error: "Not found" }, 404);

  const appt = current as Appointment;

  // 4. Validate the transition against the current status (server-authoritative).
  if (!isActionAllowed(appt.status, action)) {
    return json(
      {
        error: `Cannot ${action} an appointment that is ${appt.status}.`,
      },
      422,
    );
  }

  // 5. Build the update payload.
  const update: Partial<Appointment> = {};

  if (def.to) update.status = def.to;

  if (action === "reschedule") {
    if (!parsed.starts_at || !WALL_RE.test(parsed.starts_at)) {
      return json({ error: "A valid new date and time is required." }, 400);
    }
    let utc: string;
    try {
      utc = clinicWallTimeToUtcISO(parsed.starts_at);
    } catch {
      return json({ error: "Could not parse the provided time." }, 400);
    }
    update.starts_at = utc;
    // ends_at is recomputed by the DB trigger from the service duration.

    // Issue a fresh token so the patient can confirm / self-reschedule from the
    // email. Valid until the (new) appointment time. Clears any prior response.
    update.confirmation_token = crypto.randomUUID();
    update.token_expires_at = utc;
    update.patient_response = null;
    update.patient_responded_at = null;
  } else if (def.to) {
    // Any other status change invalidates outstanding patient links.
    update.confirmation_token = null;
    update.token_expires_at = null;
  }

  // 6. Audit line (PRD §7.2) — appended to staff_notes on every change.
  const stamp = formatDateTime(new Date().toISOString());
  const who = user.email ?? user.id;
  let line = `[${stamp} by ${who}] ${action}`;
  if (action === "reschedule" && parsed.starts_at) {
    line += ` → ${parsed.starts_at}`;
  }
  if (action === "cancel" && parsed.reason) {
    line += ` — ${parsed.reason}`;
  }
  update.staff_notes = appendAuditLine(appt.staff_notes, line);

  // 7. Persist. The partial unique index raises 23505 on a double-book.
  const { data: updated, error: updErr } = await supabase
    .from("appointments")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (updErr) {
    if (updErr.code === "23505") {
      return json(
        { error: "That slot was just taken. Please pick another time." },
        409,
      );
    }
    if (
      updErr.code === "22P02" &&
      String(updErr.message).includes("rescheduled")
    ) {
      return json(
        {
          error:
            "Database migration required. In the Supabase SQL editor, run " +
            "supabase/migrations/0004_rescheduled_status.sql, then " +
            "0005_rescheduled_slot_index.sql, and try again.",
        },
        503,
      );
    }
    console.error(`[PATCH appointment ${id}] update`, updErr);
    return json({ error: "Failed to update appointment" }, 500);
  }

  const result = updated as Appointment;

  // 8. Always notify the patient for client-facing actions (best-effort — never blocks the write).
  let email: Awaited<ReturnType<typeof sendConfirmationEmail>> | undefined;
  if (def.notifiable) {
    if (action === "confirm") email = await sendConfirmationEmail(result);
    else if (action === "reschedule")
      email = await sendRescheduleEmail(
        result,
        { starts_at: appt.starts_at, ends_at: appt.ends_at },
        result.confirmation_token,
      );
    else if (action === "cancel")
      email = await sendCancellationEmail(result, parsed.reason);
    else if (action === "complete") email = await sendCompletedEmail(result);
    else if (action === "no_show") email = await sendNoShowEmail(result);
    else if (action === "reopen") email = await sendReopenedEmail(result);
  }

  return json({ appointment: result, email: email ?? null });
}
