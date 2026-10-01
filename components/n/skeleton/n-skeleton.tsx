import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function NSkeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-base-100", className)}
      {...props}
    />
  );
}
