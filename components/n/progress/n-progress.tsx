import { TONES, type Tone } from "@/lib/utils/status";
import { cn } from "@/lib/utils/cn";

export function NProgress({
  value,
  tone = "info",
  label,
  className,
}: {
  /** 0–100 */
  value: number;
  tone?: Tone;
  label: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      data-slot="progress"
      className={cn("h-2 overflow-hidden rounded-full bg-base-100", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          TONES[tone].solid,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
