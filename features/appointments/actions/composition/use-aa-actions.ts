import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ADMIN_APPOINTMENTS_ROOT } from "@/lib/query/query-roots";
import { useAppointmentAction } from "../application/use-appointment-action";
import type { ActionTarget } from "../domain/action-target";
import { createHttpActionsService } from "../infrastructure/services/http-actions-service-adapter";
import { ACTIONS_LOGIN_PATH } from "../domain/action-routes";

/**
 * Client composition root for the action buttons. The HTTP adapter is named
 * only here — swap it for a mock adapter in this one line.
 */
export function useAaActions(target: ActionTarget) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const service = useMemo(() => createHttpActionsService(), []);

  return useAppointmentAction(target, {
    service,
    onChanged: () => {
      // Server Components re-render with fresh rows; client queries refetch.
      void queryClient.invalidateQueries({ queryKey: ADMIN_APPOINTMENTS_ROOT });
      router.refresh();
    },
    onFeedback: ({ tone, title, description }) => {
      if (tone === "error") toast.error(title, { description });
      else if (tone === "info") toast.info(title, { description });
      else toast.success(title, { description });
    },
    onUnauthorized: () => router.push(ACTIONS_LOGIN_PATH),
  });
}
