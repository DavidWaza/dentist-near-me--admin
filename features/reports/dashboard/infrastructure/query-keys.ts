import { ADMIN_APPOINTMENTS_ROOT } from "@/lib/query/query-roots";
import type { ReportRange } from "../domain/report-range";

/**
 * Slice-owned keys, hung off the shared appointments root so an appointment
 * mutation anywhere invalidates reports by prefix.
 */
export const reportsQueryKeys = {
  root: [...ADMIN_APPOINTMENTS_ROOT, "reports"] as const,
  metrics: (range: ReportRange) =>
    [...ADMIN_APPOINTMENTS_ROOT, "reports", "metrics", range.from, range.to] as const,
};
