import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconName } from "@/lib/utils/icons";
import { cn } from "@/lib/utils/cn";
import { NIcon } from "../icon/n-icon";

const emptyStateVariants = cva(
  "flex flex-col items-center gap-2 rounded-xl border px-6 py-12 text-center",
  {
    variants: {
      tone: {
        neutral: "border-dashed border-base-150 bg-base-0",
        danger: "border-red-150 bg-red-50",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

const emptyIconVariants = cva(
  "mb-2 inline-flex size-12 items-center justify-center rounded-full [&_svg]:size-6",
  {
    variants: {
      tone: {
        neutral: "bg-accent-50 text-accent-500",
        danger: "bg-red-100 text-red-500",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

type Tone = VariantProps<typeof emptyStateVariants>;

export function NEmptyState({
  className,
  tone,
  role,
  ...props
}: ComponentProps<"div"> & Tone) {
  return (
    <div
      data-slot="empty-state"
      role={role ?? (tone === "danger" ? "alert" : undefined)}
      className={cn(emptyStateVariants({ tone }), className)}
      {...props}
    />
  );
}

export function NEmptyStateIcon({
  name,
  tone,
  className,
}: { name: IconName; className?: string } & Tone) {
  return (
    <span className={cn(emptyIconVariants({ tone }), className)}>
      <NIcon name={name} weight="duotone" />
    </span>
  );
}

export function NEmptyStateTitle({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-state-title"
      className={cn("text-base font-semibold text-base-900", className)}
      {...props}
    />
  );
}

export function NEmptyStateDescription({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-state-description"
      className={cn("max-w-md text-sm text-base-500", className)}
      {...props}
    />
  );
}

export function NEmptyStateActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-state-actions"
      className={cn("mt-3 flex flex-wrap justify-center gap-2", className)}
      {...props}
    />
  );
}
