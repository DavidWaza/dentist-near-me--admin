import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const alertVariants = cva(
  "flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm [&>[data-slot=icon]]:mt-0.5 [&>[data-slot=icon]]:size-4",
  {
    variants: {
      tone: {
        info: "border-accent-150 bg-accent-50 text-accent-600",
        success: "border-green-150 bg-green-50 text-green-600",
        pending: "border-yellow-150 bg-yellow-50 text-yellow-600",
        danger: "border-red-150 bg-red-50 text-red-600",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

/** <NAlert tone="danger"><NIcon name="error"/><NAlertBody>…</NAlertBody></NAlert> */
export function NAlert({
  className,
  tone,
  role,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role={role ?? (tone === "danger" ? "alert" : undefined)}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  );
}

export function NAlertBody({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-body"
      className={cn("flex min-w-0 flex-col gap-0.5", className)}
      {...props}
    />
  );
}

export function NAlertTitle({ className, ...props }: ComponentProps<"p">) {
  return (
    <p data-slot="alert-title" className={cn("font-semibold", className)} {...props} />
  );
}
