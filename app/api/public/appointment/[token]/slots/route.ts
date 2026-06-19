import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import {
  getPublicAppointment,
  isActionable,
  isUuid,
  openSlotsForToken,
} from "@/lib/public-appointments";
import { clinicDayKey, formatDate, formatDateTime, formatTime } from "@/lib/scheduling";
import { prettifySlug } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/public/appointment/[token]/slots">,
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
  if (!isActionable(appt.status) || !appt.dentist_id) {
    return json({ days: [], appointment: summary(appt) });
  }

  const now = new Date();
  let slots;
  try {
    slots = await openSlotsForToken(supabase, token, appt, now);
  } catch (err) {
    console.error("[public slots]", err);
    return json({ error: "Could not load availability." }, 500);
  }

  // Group by clinic-zone day for the picker UI.
  const byDay = new Map<
    string,
    { dayKey: string; label: string; slots: { startsAt: string; label: string }[] }
  >();
  for (const s of slots) {
    const key = clinicDayKey(s.startsAt);
    let group = byDay.get(key);
    if (!group) {
      group = { dayKey: key, label: formatDate(s.startsAt), slots: [] };
      byDay.set(key, group);
    }
    group.slots.push({ startsAt: s.startsAt, label: formatTime(s.startsAt) });
  }

  return json({ appointment: summary(appt), days: Array.from(byDay.values()) });
}

function summary(appt: Awaited<ReturnType<typeof getPublicAppointment>>) {
  if (!appt) return null;
  return {
    patientName: appt.patient_name,
    service: `${prettifySlug(appt.service_slug)} · ${appt.duration_minutes} min`,
    dentistName: appt.dentist_name,
    locationCity: appt.location_city,
    currentLabel: formatDateTime(appt.starts_at),
    durationMinutes: appt.duration_minutes,
    status: appt.status,
  };
}
