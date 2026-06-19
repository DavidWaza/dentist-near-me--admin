import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import {
  getPublicAppointment,
  isActionable,
  isUuid,
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
  _req: NextRequest,
  ctx: RouteContext<"/api/public/appointment/[token]/confirm">,
) {
  const { token } = await ctx.params;
  if (!isUuid(token)) return json({ error: "Invalid link." }, 400);

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
      { error: `This appointment can no longer be confirmed (${appt.status}).` },
      409,
    );
  }

  // Idempotent: already confirmed by the patient → success without re-emailing.
  if (appt.status === "confirmed" && appt.patient_response === "confirmed") {
    return json({ ok: true, status: "confirmed", alreadyDone: true });
  }

  const { data, error } = await supabase
    .rpc("appt_confirm", { p_token: token })
    .maybeSingle();
  if (error || !data) {
    console.error("[public confirm]", error);
    return json({ error: "Could not confirm. Please try again." }, 500);
  }

  const result = data as Appointment;

  // Best-effort notifications — never block the confirmation.
  await Promise.all([
    sendConfirmationEmail(result),
    sendPatientResponseAdminEmail(result, "confirmed"),
  ]);

  return json({ ok: true, status: result.status });
}
