import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const listVariants = cva("", {
  variants: {
    layout: {
      /** Label above value, laid out in a responsive grid. */
      grid: "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3",
      /** Label left, value right, one per row. */
      rows: "flex flex-col divide-y divide-base-100",
    },
  },
  defaultVariants: { layout: "grid" },
});

export function NDescriptionList({
  className,
  layout,
  ...props
}: ComponentProps<"dl"> & VariantProps<typeof listVariants>) {
  return (
    <dl
      data-slot="description-list"
      data-layout={layout ?? "grid"}
      className={cn("group/dl", listVariants({ layout }), className)}
      {...props}
    />
  );
}

export function NDescriptionItem({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="description-item"
      className={cn(
        "flex min-w-0 flex-col gap-0.5",
        "group-data-[layout=rows]/dl:flex-row group-data-[layout=rows]/dl:items-baseline group-data-[layout=rows]/dl:justify-between group-data-[layout=rows]/dl:gap-4 group-data-[layout=rows]/dl:py-2.5",
        className,
      )}
      {...props}
    />
  );
}

export function NDescriptionTerm({ className, ...props }: ComponentProps<"dt">) {
  return (
    <dt
      data-slot="description-term"
      className={cn(
        "text-xs font-medium uppercase tracking-wide text-base-500",
        "group-data-[layout=rows]/dl:text-sm group-data-[layout=rows]/dl:normal-case group-data-[layout=rows]/dl:tracking-normal",
        className,
      )}
      {...props}
    />
  );
}

export function NDescriptionDetails({ className, ...props }: ComponentProps<"dd">) {
  return (
    <dd
      data-slot="description-details"
      className={cn(
        "min-w-0 break-words text-sm text-base-900",
        "group-data-[layout=rows]/dl:text-right group-data-[layout=rows]/dl:font-semibold",
        className,
      )}
      {...props}
    />
  );
}
