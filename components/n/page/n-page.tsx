import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * Page scaffolding. Container owns the gutter; content owns the max width and
 * the vertical rhythm. A screen composes header/heading/actions as it needs.
 */

export function NPageContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-container"
      className={cn("px-4 pb-24 pt-6 md:px-8 md:pb-10", className)}
      {...props}
    />
  );
}

const pageContentVariants = cva("mx-auto flex w-full flex-col gap-5", {
  variants: {
    width: {
      narrow: "max-w-xl",
      default: "max-w-3xl",
      wide: "max-w-7xl",
    },
  },
  defaultVariants: { width: "wide" },
});

export function NPageContent({
  className,
  width,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof pageContentVariants>) {
  return (
    <div
      data-slot="page-content"
      className={cn(pageContentVariants({ width }), className)}
      {...props}
    />
  );
}

export function NPageHeader({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-4 gap-y-3",
        className,
      )}
      {...props}
    />
  );
}

export function NPageHeading({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-heading"
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

export function NPageTitle({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-title"
      className={cn(
        "text-2xl font-bold tracking-tight text-base-900 md:text-[1.75rem]",
        className,
      )}
      {...props}
    />
  );
}

export function NPageDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="page-description"
      className={cn("max-w-2xl text-sm text-base-500", className)}
      {...props}
    />
  );
}

export function NPageActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

export function NPageSection({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot="page-section"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}
