import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { unwrapApiResponse } from "@/lib/utils/api-envelope";
import { reportsQueryKeys } from "../infrastructure/query-keys";
import type { ReportsQueryPort } from "../ports/reports-query.port";
import type { ReportsServicePort } from "../ports/reports-service.port";

export function createReportsQueryAdapter(
  service: ReportsServicePort,
): ReportsQueryPort {
  return {
    useMetricsQuery({ range, enabled }) {
      return useQuery({
        queryKey: reportsQueryKeys.metrics(range),
        queryFn: async () => {
          const { httpStatus, body } = await service.getMetrics(range);
          return unwrapApiResponse(body, "Couldn’t load reports.", httpStatus).data;
        },
        enabled,
        // Without this the tiles collapse to skeletons on every range change.
        placeholderData: keepPreviousData,
      });
    },
  };
}
