import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportRow } from "../../domain/report-metrics";
import type { ReportsRepositoryPort } from "../../ports/reports-service.port";

export function createSupabaseReportsRepository(
  supabase: SupabaseClient,
): ReportsRepositoryPort {
  return {
    async listRows(gte, lt) {
      const { data, error } = await supabase
        .from("appointments")
        .select("status, patient_email")
        .gte("starts_at", gte)
        .lt("starts_at", lt);
      if (error) throw error;
      return (data ?? []) as ReportRow[];
    },
  };
}
