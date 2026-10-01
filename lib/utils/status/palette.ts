import { cva, type VariantProps } from "class-variance-authority";

/**
 * Semantic tones, not colours. A design change to what "pending" looks like
 * is one edit here. `fg`/`bg`/`bd` are exposed for non-badge consumers
 * (progress bars, stat tiles).
 */
export const TONES = {
  neutral: { fg: "text-base-600", bg: "bg-base-100", bd: "border-base-150", solid: "bg-base-500" },
  info: { fg: "text-accent-500", bg: "bg-accent-100", bd: "border-accent-150", solid: "bg-accent-500" },
  pending: { fg: "text-yellow-600", bg: "bg-yellow-100", bd: "border-yellow-150", solid: "bg-yellow-500" },
  attention: { fg: "text-accent-600", bg: "bg-base-0", bd: "border-accent-500", solid: "bg-flow-secondary" },
  success: { fg: "text-green-500", bg: "bg-green-100", bd: "border-green-150", solid: "bg-green-500" },
  danger: { fg: "text-red-500", bg: "bg-red-100", bd: "border-red-150", solid: "bg-red-500" },
} as const;

export type Tone = keyof typeof TONES;

export const statusVariants = cva(
  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap border font-semibold",
  {
    variants: {
      tone: {
        neutral: "",
        info: "",
        pending: "",
        attention: "",
        success: "",
        danger: "",
      },
      variant: {
        soft: "",
        outline: "bg-base-0",
      },
      size: {
        sm: "rounded-sm px-1.5 py-0.5 text-[0.6875rem] uppercase tracking-wide [&_svg]:size-3",
        default: "rounded-full px-2.5 py-0.5 text-xs [&_svg]:size-3.5",
      },
    },
    compoundVariants: (Object.keys(TONES) as Tone[]).flatMap((tone) => [
      {
        tone,
        variant: "soft" as const,
        class: `${TONES[tone].fg} ${TONES[tone].bg} ${TONES[tone].bd}`,
      },
      {
        tone,
        variant: "outline" as const,
        class: `${TONES[tone].fg} ${TONES[tone].bd}`,
      },
    ]),
    defaultVariants: { tone: "neutral", variant: "soft", size: "default" },
  },
);

export type StatusVariantProps = VariantProps<typeof statusVariants>;
