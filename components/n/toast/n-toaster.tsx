"use client";

import { Toaster } from "sonner";

/**
 * Mounted once per layout. Raise toasts with `toast.success(...)` /
 * `toast.error(...)` from "sonner"; an Error's message is the toast text.
 */
export function NToaster() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      duration={6000}
      offset={{ bottom: 24, right: 24 }}
      mobileOffset={{ bottom: 88 }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-base-150 !bg-base-0 !text-base-900 !font-sans !shadow-lg",
          description: "!text-base-500",
          success: "[&_[data-icon]]:!text-green-500",
          error: "[&_[data-icon]]:!text-red-500",
          info: "[&_[data-icon]]:!text-accent-500",
        },
      }}
    />
  );
}
