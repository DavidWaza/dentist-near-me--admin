"use server";

import { redirect } from "next/navigation";
import { signIn } from "../application/sign-in";
import type { LoginState } from "../domain/login";
import { createSupabaseAuthService } from "../infrastructure/services/supabase-auth-service-adapter";

/** Server-action composition root for the login form. */
export async function signInAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const outcome = await signIn(
    { auth: createSupabaseAuthService() },
    {
      email: formData.get("email"),
      password: formData.get("password"),
      next: formData.get("next"),
    },
  );
  if (!outcome.ok) return outcome.state;
  // redirect() throws to interrupt — keep it outside any try/catch.
  redirect(outcome.redirectTo);
}
