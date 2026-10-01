import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils/cn";
import { buttonVariants, type ButtonVariantProps } from "./button-variants";

type NButtonProps = Omit<ComponentProps<"button">, "color"> &
  ButtonVariantProps & {
    /** Render the single child (e.g. a next/link <Link>) with button styling. */
    asChild?: boolean;
  };

export function NButton({
  className,
  color,
  variant,
  size,
  block,
  asChild = false,
  type,
  ...props
}: NButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ color, variant, size, block }), className)}
      {...props}
    />
  );
}
