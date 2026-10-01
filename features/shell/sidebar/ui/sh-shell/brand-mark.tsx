import { NIcon } from "@/components/n";
import { cn } from "@/lib/utils/cn";

export function ShBrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-135 from-flow-s3 to-flow-secondary text-base-0 shadow-sm",
        className,
      )}
    >
      <NIcon name="brand" weight="fill" className="size-5" />
    </span>
  );
}
