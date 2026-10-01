import { cva, type VariantProps } from "class-variance-authority";

/** Shared by NInput, NSelect and NTextarea so form controls match. */
export const controlVariants = cva(
  "w-full min-w-0 rounded-lg border border-base-150 bg-base-0 text-base-900 transition-colors placeholder:text-base-500 hover:border-base-400 focus-visible:border-accent-500 disabled:cursor-not-allowed disabled:bg-base-50 disabled:opacity-60 aria-invalid:border-red-500",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-sm",
        default: "h-10 px-3 text-sm",
        lg: "h-12 px-3.5 text-base",
      },
    },
    defaultVariants: { size: "default" },
  },
);

export type ControlVariantProps = VariantProps<typeof controlVariants>;
