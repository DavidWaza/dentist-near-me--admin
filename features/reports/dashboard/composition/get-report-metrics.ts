import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clinicWallTimeToUtcISO } from "@/lib/scheduling";
import { loadReportMetrics } from "../application/load-report-metrics";
import { parseReportRange } from "../domain/report-range";
import { createSupabaseReportsRepository } from "../infrastructure/services/supabase-reports-repository";

/** Server composition root for GET /api/admin/reports. */
export function getReportMetrics(
  supabase: SupabaseClient,
  params: Record<string, string | string[] | undefined>,
) {
  return loadReportMetrics(
    {
      repository: createSupabaseReportsRepository(supabase),
      wallTimeToUtc: clinicWallTimeToUtcISO,
    },
    parseReportRange(params),
  );
}
