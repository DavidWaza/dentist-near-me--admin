"use client";

import { actionsFor } from "@/lib/appointments";
import { cn } from "@/lib/utils/cn";
import { NButton, NIcon } from "@/components/n";
import type { ActionTarget } from "../../domain/action-target";
import { useAaActions } from "../../composition/use-aa-actions";
import { AaActionDialog } from "./action-dialog";

/**
 * Status-aware action buttons for one appointment.
 * `layout="row"` is the compact table cell; `layout="panel"` is the detail
 * screen's full-width stack.
 */
export function AaActions({
  target,
  layout = "row",
}: {
  target: ActionTarget;
  layout?: "row" | "panel";
}) {
  const state = useAaActions(target);
  const available = actionsFor(target.status);

  if (available.length === 0) {
    return layout === "panel" ? (
      <p className="text-sm text-base-500">
        No further actions for this appointment.
      </p>
    ) : (
      <span className="text-xs text-base-400">—</span>
    );
  }

  const panel = layout === "panel";

  return (
    <>
      <div
        className={cn(
          panel ? "grid gap-2" : "flex flex-wrap justify-end gap-1.5",
        )}
      >
        {available.map((def, index) => {
          const primary = index === 0 && !def.destructive;
          const running = state.pending === def.key;
          return (
            <NButton
              key={def.key}
              size={panel ? "default" : "xs"}
              block={panel}
              color={def.destructive ? "destructive" : primary ? "primary" : "secondary"}
              variant={primary ? "solid" : "outline"}
              disabled={state.busy}
              aria-busy={running || undefined}
              title={
                def.notifiable ? `${def.label} and email ${target.patientEmail}` : undefined
              }
              onClick={() => state.trigger(def.key)}
              className={cn(panel && "justify-start")}
            >
              <NIcon name={running ? "refresh" : def.icon} className={cn(running && "animate-spin")} />
              {running ? "Working…" : def.label}
            </NButton>
          );
        })}
      </div>

      <AaActionDialog
        action={state.openAction}
        target={target}
        busy={state.busy}
        error={state.error}
        onClose={state.closeDialog}
        onSubmit={state.submit}
      />
    </>
  );
}
