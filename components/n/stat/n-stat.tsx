import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconName } from "@/lib/utils/icons";
import { cn } from "@/lib/utils/cn";
import { NIcon } from "../icon/n-icon";

const statIconVariants = cva(
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5",
  {
    variants: {
      tone: {
        neutral: "bg-base-100 text-base-600",
        info: "bg-accent-100 text-accent-500",
        pending: "bg-yellow-100 text-yellow-600",
        success: "bg-green-100 text-green-500",
        danger: "bg-red-100 text-red-500",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

/** KPI tile: <NStat><NStatHeader>…</NStatHeader><NStatValue/>…</NStat> */
export function NStat({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="stat"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-base-150 bg-base-0 p-5",
        className,
      )}
      {...props}
    />
  );
}

export function NStatHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-header"
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    />
  );
}

export function NStatLabel({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="stat-label"
      className={cn("text-sm font-medium text-base-500", className)}
      {...props}
    />
  );
}

export function NStatIcon({
  name,
  tone,
  className,
}: { name: IconName; className?: string } & VariantProps<
  typeof statIconVariants
>) {
  return (
    <span data-slot="stat-icon" className={cn(statIconVariants({ tone }), className)}>
      <NIcon name={name} weight="duotone" />
    </span>
  );
}

export function NStatValue({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="stat-value"
      className={cn(
        "text-3xl font-bold tabular-nums leading-none text-base-900",
        className,
      )}
      {...props}
    />
  );
}

export function NStatHint({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="stat-hint"
      className={cn("text-xs text-base-500", className)}
      {...props}
    />
  );
}
