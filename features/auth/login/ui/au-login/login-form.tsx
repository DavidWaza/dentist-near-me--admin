"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import {
  NAlert,
  NAlertBody,
  NButton,
  NField,
  NFieldLabel,
  NIcon,
  NInput,
} from "@/components/n";
import { signInAction } from "../../composition/sign-in.action";
import type { LoginState } from "../../domain/login";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <NButton type="submit" size="lg" block disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
      {pending ? null : <NIcon name="forward" />}
    </NButton>
  );
}

export function AuLoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(signInAction, {});
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <NField>
        <NFieldLabel htmlFor={emailId}>Email</NFieldLabel>
        <NInput
          id={emailId}
          name="email"
          type="email"
          size="lg"
          autoComplete="username"
          required
          defaultValue={state.email}
          placeholder="you@clinic.com"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
        />
      </NField>

      <NField>
        <NFieldLabel htmlFor={passwordId}>Password</NFieldLabel>
        <NInput
          id={passwordId}
          name="password"
          type="password"
          size="lg"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
        />
      </NField>

      {state.error ? (
        <NAlert tone="danger" id={errorId}>
          <NIcon name="error" />
          <NAlertBody>{state.error}</NAlertBody>
        </NAlert>
      ) : null}

      <SubmitButton />
    </form>
  );
}
