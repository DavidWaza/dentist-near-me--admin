import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { clinicWallTimeToUtcISO } from "@/lib/scheduling";
import { formatDateTime } from "@/lib/utils/date-formatters";
import {
  applyAppointmentAction,
  type ApplyAppointmentActionOutcome,
} from "../application/apply-appointment-action";
import type { ActionRequest } from "../domain/action-target";
import { createSupabaseAppointmentRepository } from "../infrastructure/services/supabase-appointment-repository";
import { createResendMailer } from "../infrastructure/services/resend-mailer-adapter";

/**
 * Server composition root for PATCH /api/admin/appointments/[id]. This file is
 * the swap point: repository and mailer adapters are named only here.
 */
export function runAppointmentAction(
  supabase: SupabaseClient,
  user: User,
  id: string,
  request: ActionRequest,
): Promise<ApplyAppointmentActionOutcome> {
  return applyAppointmentAction(
    {
      repository: createSupabaseAppointmentRepository(supabase),
      mailer: createResendMailer(),
      wallTimeToUtc: clinicWallTimeToUtcISO,
      auditStamp: () => formatDateTime(new Date().toISOString()),
      newToken: () => crypto.randomUUID(),
      actor: user.email ?? user.id,
    },
    id,
    request,
  );
}

/** Read one appointment for GET /api/admin/appointments/[id]. */
export function findAppointmentForApi(supabase: SupabaseClient, id: string) {
  return createSupabaseAppointmentRepository(supabase).findById(id);
}
