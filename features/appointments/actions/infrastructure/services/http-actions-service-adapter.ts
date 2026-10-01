import {
  ApiError,
  fetchEnvelope,
  unwrapApiResponse,
} from "@/lib/utils/api-envelope";
import type { ActionRequest } from "../../domain/action-target";
import type {
  ActionsServicePort,
  ApplyActionResult,
} from "../../ports/actions-service.port";

export function createHttpActionsService(): ActionsServicePort {
  return {
    async applyAction(id, body) {
      let response;
      try {
        response = await fetchEnvelope<ApplyActionResult>(
          `/api/admin/appointments/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body satisfies ActionRequest),
          },
        );
      } catch {
        throw new ApiError("Network error. Please check your connection.");
      }
      const { httpStatus, body: envelope } = response;
      return unwrapApiResponse(
        envelope,
        httpStatus === 401
          ? "Your session has expired."
          : "Something went wrong. Please try again.",
        httpStatus,
      ).data;
    },
  };
}
