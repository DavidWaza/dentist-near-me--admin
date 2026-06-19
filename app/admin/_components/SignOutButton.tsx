"use client";

import { useTransition } from "react";
import { signOut } from "../_actions/auth";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void signOut())}
      className="rounded-lg border border-mint px-3 py-1.5 text-sm font-medium text-ink hover:bg-mint/40 disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
