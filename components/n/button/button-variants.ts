import { cva, type VariantProps } from "class-variance-authority";

/**
 * `color` and `variant` are declared empty; the real classes live in
 * compoundVariants so the two stay orthogonal (colours × variants without a
 * named option for every pair).
 */
export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      color: {
        primary: "",
        secondary: "",
        destructive: "",
        success: "",
        inverse: "",
      },
      variant: {
        solid: "",
        outline: "",
        ghost: "border-transparent",
        link: "h-auto border-transparent px-0 underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2 text-xs [&_svg]:size-3.5",
        sm: "h-8 px-2.5 text-xs [&_svg]:size-4",
        default: "h-10 px-4 text-sm [&_svg]:size-4",
        lg: "h-12 px-5 text-sm [&_svg]:size-5",
        "icon-sm": "size-8 [&_svg]:size-4",
        icon: "size-10 [&_svg]:size-5",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // primary
      { color: "primary", variant: "solid", class: "border-accent-500 bg-accent-500 text-base-0 hover:border-accent-600 hover:bg-accent-600" },
      { color: "primary", variant: "outline", class: "border-accent-150 bg-base-0 text-accent-600 hover:bg-accent-50" },
      { color: "primary", variant: "ghost", class: "text-accent-500 hover:bg-accent-50" },
      { color: "primary", variant: "link", class: "text-accent-500" },
      // secondary
      { color: "secondary", variant: "solid", class: "border-base-100 bg-base-100 text-base-900 hover:bg-base-150" },
      { color: "secondary", variant: "outline", class: "border-base-150 bg-base-0 text-base-900 hover:bg-base-50" },
      { color: "secondary", variant: "ghost", class: "text-base-600 hover:bg-base-100 hover:text-base-900" },
      { color: "secondary", variant: "link", class: "text-base-600" },
      // destructive
      { color: "destructive", variant: "solid", class: "border-red-500 bg-red-500 text-base-0 hover:border-red-600 hover:bg-red-600" },
      { color: "destructive", variant: "outline", class: "border-red-150 bg-base-0 text-red-500 hover:bg-red-50" },
      { color: "destructive", variant: "ghost", class: "text-red-500 hover:bg-red-50" },
      { color: "destructive", variant: "link", class: "text-red-500" },
      // success
      { color: "success", variant: "solid", class: "border-green-500 bg-green-500 text-base-0 hover:border-green-600 hover:bg-green-600" },
      { color: "success", variant: "outline", class: "border-green-150 bg-base-0 text-green-500 hover:bg-green-50" },
      { color: "success", variant: "ghost", class: "text-green-500 hover:bg-green-50" },
      { color: "success", variant: "link", class: "text-green-500" },
      // inverse — on flow-primary chrome
      { color: "inverse", variant: "solid", class: "border-base-0 bg-base-0 text-flow-primary hover:bg-flow-s6" },
      { color: "inverse", variant: "outline", class: "border-flow-stroke text-base-0 hover:bg-flow-stroke" },
      { color: "inverse", variant: "ghost", class: "text-base-0/80 hover:bg-flow-stroke hover:text-base-0" },
      { color: "inverse", variant: "link", class: "text-base-0" },
    ],
    defaultVariants: {
      color: "primary",
      variant: "solid",
      size: "default",
      block: false,
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
