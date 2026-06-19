import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import {
  getPublicAppointment,
  isActionable,
  isUuid,
  openSlotsForToken,
} from "@/lib/public-appointments";
import {
  sendConfirmationEmail,
  sendPatientResponseAdminEmail,
} from "@/lib/email";
import type { Appointment } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/public/appointment/[token]/reschedule">,
) {
  const { token } = await ctx.params;
  if (!isUuid(token)) return json({ error: "Invalid link." }, 400);

  // Body: { startsAt: ISO } — the exact slot the patient chose from /slots.
  let startsAt: string;
  try {
    const body = (await req.json()) as { startsAt?: unknown };
    if (typeof body.startsAt !== "string") throw new Error("missing");
    const t = Date.parse(body.startsAt);
    if (Number.isNaN(t) || t <= Date.now()) throw new Error("invalid");
    startsAt = new Date(t).toISOString();
  } catch {
    return json({ error: "Please choose a valid time." }, 400);
  }

  const supabase = createPublicClient();

  let appt;
  try {
    appt = await getPublicAppointment(supabase, token);
  } catch {
    return json({ error: "Could not load this appointment." }, 500);
  }
  if (!appt) return json({ error: "This link is not valid." }, 404);
  if (appt.expired) return json({ error: "This link has expired." }, 410);
  if (!isActionable(appt.status)) {
    return json(
      { error: `This appointment can no longer be changed (${appt.status}).` },
      409,
    );
  }

  // Authoritative business-hours gate: the requested instant must be one of the
  // slots we'd actually offer (in CLINIC_TIMEZONE). The RPC then enforces the
  // token/status/double-book invariants.
  try {
    const slots = await openSlotsForToken(supabase, token, appt, new Date());
    if (!slots.some((s) => s.startsAt === startsAt)) {
      return json(
        { error: "That time isn't available. Please pick another slot." },
        422,
      );
    }
  } catch (err) {
    console.error("[public reschedule] availability", err);
    return json({ error: "Could not reschedule. Please try again." }, 500);
  }

  const { data, error } = await supabase
    .rpc("appt_self_reschedule", { p_token: token, p_starts_at: startsAt })
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return json(
        { error: "That slot was just taken. Please pick another time." },
        409,
      );
    }
    if (error.code === "23514") {
      return json(
        { error: "That time isn't available. Please pick another slot." },
        422,
      );
    }
    console.error("[public reschedule]", error);
    return json({ error: "Could not reschedule. Please try again." }, 500);
  }
  if (!data) return json({ error: "This link is not valid." }, 404);

  const result = data as Appointment;

  // The function returns the row unchanged if it wasn't actionable; detect the
  // (rare) race where status didn't end up confirmed at the requested time.
  if (result.status !== "confirmed") {
    return json(
      { error: "This appointment can no longer be changed." },
      409,
    );
  }

  await Promise.all([
    sendConfirmationEmail(result),
    sendPatientResponseAdminEmail(result, "self_rescheduled"),
  ]);

  return json({ ok: true, status: result.status, startsAt: result.starts_at });
}
