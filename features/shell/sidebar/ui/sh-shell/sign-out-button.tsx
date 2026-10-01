"use client";

import { useTransition, type ComponentProps } from "react";
import { NButton, NIcon } from "@/components/n";
import { signOutAction } from "../../infrastructure/sign-out.action";

export function ShSignOutButton({
  iconOnly = false,
  ...props
}: { iconOnly?: boolean } & Omit<ComponentProps<typeof NButton>, "onClick">) {
  const [pending, startTransition] = useTransition();
  return (
    <NButton
      color="secondary"
      variant="outline"
      size={iconOnly ? "icon-sm" : "sm"}
      disabled={pending}
      aria-label={iconOnly ? "Sign out" : undefined}
      title={iconOnly ? "Sign out" : undefined}
      onClick={() => startTransition(() => signOutAction())}
      {...props}
    >
      <NIcon name="signOut" />
      {iconOnly ? null : pending ? "Signing out…" : "Sign out"}
    </NButton>
  );
}
