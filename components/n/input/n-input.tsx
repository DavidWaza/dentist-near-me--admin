import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { controlVariants, type ControlVariantProps } from "./input-variants";

export function NInput({
  className,
  size,
  ...props
}: Omit<ComponentProps<"input">, "size"> & ControlVariantProps) {
  return (
    <input
      data-slot="input"
      className={cn(controlVariants({ size }), className)}
      {...props}
    />
  );
}

/** Native select, styled — keeps mobile pickers and needs no JS. */
export function NSelect({
  className,
  size,
  ...props
}: Omit<ComponentProps<"select">, "size"> & ControlVariantProps) {
  return (
    <select
      data-slot="select"
      className={cn(controlVariants({ size }), "pr-8", className)}
      {...props}
    />
  );
}

export function NTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(controlVariants(), "h-auto min-h-20 py-2", className)}
      {...props}
    />
  );
}
