import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function NField({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("flex min-w-0 flex-col gap-1.5", className)}
      {...props}
    />
  );
}

export function NFieldLabel({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn("text-sm font-medium text-base-600", className)}
      {...props}
    />
  );
}

export function NFieldHint({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="field-hint"
      className={cn("text-xs text-base-500", className)}
      {...props}
    />
  );
}

export function NFieldError({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      role="alert"
      data-slot="field-error"
      className={cn("text-sm text-red-500", className)}
      {...props}
    />
  );
}
