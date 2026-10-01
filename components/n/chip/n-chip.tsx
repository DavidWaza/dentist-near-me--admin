import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export const chipVariants = cva(
  "inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5",
  {
    variants: {
      size: {
        sm: "h-7 px-2.5 text-xs",
        default: "h-8 px-3 text-sm",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/**
 * A toggle chip. Selection is expressed with `aria-pressed`, which is also
 * what styles it — no `active` prop to keep in sync.
 */
export function NChip({
  className,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof chipVariants>) {
  return (
    <button
      data-slot="chip"
      type={type}
      className={cn(
        chipVariants({ size }),
        "border-base-150 bg-base-0 text-base-600 hover:border-base-400 hover:text-base-900",
        "aria-pressed:border-accent-600 aria-pressed:bg-accent-600 aria-pressed:text-base-0",
        className,
      )}
      {...props}
    />
  );
}

export function NChipGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="chip-group"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  );
}
