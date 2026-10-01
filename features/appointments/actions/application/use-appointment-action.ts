import { useState } from "react";
import { ACTIONS, type ActionKey } from "@/lib/appointments";
import { ApiError } from "@/lib/utils/api-envelope";
import {
  describeActionFeedback,
  type ActionFeedback,
} from "../domain/action-feedback";
import type { ActionTarget } from "../domain/action-target";
import type {
  ActionsServicePort,
  ApplyActionResult,
} from "../ports/actions-service.port";

export interface UseAppointmentActionDeps {
  service: ActionsServicePort;
  /** Called after a successful write (cache invalidation, refresh…). */
  onChanged: (result: ApplyActionResult) => void;
  onFeedback: (feedback: ActionFeedback) => void;
  onUnauthorized: () => void;
}

export interface DialogInput {
  /** Clinic wall-clock value from the reschedule picker. */
  wall?: string;
  reason?: string;
}

/**
 * Screen state for one appointment's action buttons: which dialog is open,
 * whether a write is in flight, and the inline error. No router, no fetch.
 */
export function useAppointmentAction(
  target: ActionTarget,
  deps: UseAppointmentActionDeps,
) {
  const [openAction, setOpenAction] = useState<ActionKey | null>(null);
  const [pending, setPending] = useState<ActionKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: ActionKey, input: DialogInput = {}) {
    const def = ACTIONS[action];
    setPending(action);
    setError(null);
    try {
      const result = await deps.service.applyAction(target.id, {
        action,
        starts_at: def.needsTime ? input.wall : undefined,
        reason: def.needsReason ? input.reason?.trim() || undefined : undefined,
      });
      deps.onFeedback(describeActionFeedback(action, result.email));
      setOpenAction(null);
      deps.onChanged(result);
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 401) {
        deps.onUnauthorized();
        return;
      }
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
      // Direct actions have no dialog to show the error in.
      if (def.direct) {
        deps.onFeedback({ tone: "error", title: def.title, description: message });
      }
    } finally {
      setPending(null);
    }
  }

  function trigger(action: ActionKey) {
    setError(null);
    if (ACTIONS[action].direct) void run(action);
    else setOpenAction(action);
  }

  function closeDialog() {
    if (pending) return;
    setOpenAction(null);
    setError(null);
  }

  return {
    openAction,
    pending,
    busy: pending !== null,
    error,
    trigger,
    submit: (input: DialogInput) => (openAction ? run(openAction, input) : undefined),
    closeDialog,
  };
}
