"use client";

import { useId, useState } from "react";
import { ACTIONS, type ActionKey } from "@/lib/appointments";
import { utcISOToClinicWallInput } from "@/lib/scheduling";
import { appTimeZoneLabel } from "@/lib/utils/date-formatters";
import {
  NAlert,
  NAlertBody,
  NButton,
  NDialog,
  NDialogBody,
  NDialogContent,
  NDialogDescription,
  NDialogFooter,
  NDialogHeader,
  NDialogTitle,
  NField,
  NFieldError,
  NFieldHint,
  NFieldLabel,
  NIcon,
  NInput,
  NTextarea,
} from "@/components/n";
import type { ActionTarget } from "../../domain/action-target";
import type { DialogInput } from "../../application/use-appointment-action";

export function AaActionDialog({
  action,
  target,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  action: ActionKey | null;
  target: ActionTarget;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: DialogInput) => void;
}) {
  return (
    <NDialog open={action !== null} onOpenChange={(open) => !open && onClose()}>
      {action ? (
        <NDialogContent>
          {/* Keyed so each opening starts from fresh inputs. */}
          <DialogForm
            key={action}
            action={action}
            target={target}
            busy={busy}
            error={error}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        </NDialogContent>
      ) : null}
    </NDialog>
  );
}

function DialogForm({
  action,
  target,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  action: ActionKey;
  target: ActionTarget;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: DialogInput) => void;
}) {
  const def = ACTIONS[action];
  const [wall, setWall] = useState(() => utcISOToClinicWallInput(target.startsAt));
  const [reason, setReason] = useState("");
  const wallId = useId();
  const reasonId = useId();
  const canSubmit = !busy && (!def.needsTime || Boolean(wall));

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ wall, reason });
      }}
    >
      <NDialogHeader>
        <NDialogTitle>{def.title}</NDialogTitle>
        <NDialogDescription>
          <span className="font-medium text-base-900">{target.patientName}</span>
          <span className="block">{target.patientEmail}</span>
        </NDialogDescription>
      </NDialogHeader>

      <NDialogBody>
        {def.needsTime ? (
          <NField>
            <NFieldLabel htmlFor={wallId}>New date &amp; time</NFieldLabel>
            <NInput
              id={wallId}
              type="datetime-local"
              required
              value={wall}
              onChange={(e) => setWall(e.target.value)}
            />
            <NFieldHint>
              In {appTimeZoneLabel()} time. Saving re-checks for double-booking.
            </NFieldHint>
          </NField>
        ) : null}

        {def.needsReason ? (
          <NField>
            <NFieldLabel htmlFor={reasonId}>
              Reason <span className="font-normal text-base-500">(optional)</span>
            </NFieldLabel>
            <NTextarea
              id={reasonId}
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. patient requested, clinic closure…"
            />
          </NField>
        ) : null}

        {def.notifiable ? (
          <NAlert tone="info">
            <NIcon name="email" />
            <NAlertBody>
              A notification email will be sent to{" "}
              <strong className="font-semibold">{target.patientEmail}</strong>.
            </NAlertBody>
          </NAlert>
        ) : null}

        {def.destructive ? (
          <NAlert tone="danger" role="note">
            <NIcon name="warning" />
            <NAlertBody>
              This can’t be undone from here.
              {action === "cancel"
                ? " The appointment stays in the list as Cancelled and the time slot is freed."
                : null}
            </NAlertBody>
          </NAlert>
        ) : null}

        {error ? <NFieldError>{error}</NFieldError> : null}
      </NDialogBody>

      <NDialogFooter>
        <NButton color="secondary" variant="outline" onClick={onClose} disabled={busy}>
          Back
        </NButton>
        <NButton
          type="submit"
          color={def.destructive ? "destructive" : "primary"}
          disabled={!canSubmit}
        >
          {busy ? "Working…" : def.label}
        </NButton>
      </NDialogFooter>
    </form>
  );
}
