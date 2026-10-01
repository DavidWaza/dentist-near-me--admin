import type { ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Inline text link. For button-shaped links use <NButton asChild><Link/></NButton>. */
export function NLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      data-slot="link"
      className={cn(
        "rounded-sm text-accent-500 underline-offset-4 hover:text-accent-600 hover:underline",
        className,
      )}
      {...props}
    />
  );
}
