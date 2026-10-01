import {
  NOT_CONFIGURED_MESSAGE,
  loginSchema,
  safeNextPath,
  type LoginState,
} from "../domain/login";
import type { AuthServicePort } from "../ports/auth-service.port";

export interface SignInDeps {
  auth: AuthServicePort;
}

export interface SignInFields {
  email: unknown;
  password: unknown;
  next: unknown;
}

export type SignInOutcome =
  | { ok: true; redirectTo: string }
  | { ok: false; state: LoginState };

export async function signIn(
  deps: SignInDeps,
  fields: SignInFields,
): Promise<SignInOutcome> {
  const email = typeof fields.email === "string" ? fields.email : "";

  if (!deps.auth.isConfigured()) {
    return { ok: false, state: { error: NOT_CONFIGURED_MESSAGE, email } };
  }

  const parsed = loginSchema.safeParse({ email: fields.email, password: fields.password });
  if (!parsed.success) {
    return {
      ok: false,
      state: { error: parsed.error.issues[0]?.message ?? "Invalid credentials.", email },
    };
  }

  const signedIn = await deps.auth.signInWithPassword(parsed.data);
  if (!signedIn) {
    return { ok: false, state: { error: "Incorrect email or password.", email } };
  }

  return { ok: true, redirectTo: safeNextPath(fields.next) };
}
