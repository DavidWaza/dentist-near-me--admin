import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiFail, apiOk } from "@/lib/utils/api-envelope";
import {
  findAppointmentForApi,
  runAppointmentAction,
} from "@/features/appointments/actions/composition/run-appointment-action";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Every response uses the ApiResponse envelope. Failures carry `status: false`
 * AND a non-2xx code, so clients branch on either.
 */

const bodySchema = z.object({
  action: z.enum(["confirm", "reschedule", "cancel", "complete", "no_show", "reopen"]),
  starts_at: z.string().optional(), // clinic wall-clock "YYYY-MM-DDTHH:mm"
  reason: z.string().max(2000).optional(),
});

const fail = (message: string, status: number) =>
  NextResponse.json(apiFail(message), { status });

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/appointments/[id]">,
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Unauthorized", 401);

  try {
    const appointment = await findAppointmentForApi(supabase, id);
    if (!appointment) return fail("Appointment not found.", 404);
    return NextResponse.json(apiOk({ appointment }));
  } catch (err) {
    console.error(`[GET appointment ${id}]`, err);
    return fail("Failed to load the appointment.", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/appointments/[id]">,
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  // RLS is the real guard, but fail fast with a clean 401.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Unauthorized", 401);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid request body.", 400);

  try {
    const outcome = await runAppointmentAction(supabase, user, id, parsed.data);
    if (!outcome.ok) return fail(outcome.message, outcome.httpStatus);
    return NextResponse.json(apiOk(outcome.result));
  } catch (err) {
    console.error(`[PATCH appointment ${id}]`, err);
    return fail("Failed to update the appointment.", 500);
  }
}
