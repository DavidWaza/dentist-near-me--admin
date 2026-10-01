import type { IconWeight } from "@phosphor-icons/react";
import { ICONS, type IconName } from "@/lib/utils/icons";
import { cn } from "@/lib/utils/cn";

export function NIcon({
  name,
  className,
  weight = "regular",
  label,
}: {
  name: IconName;
  className?: string;
  weight?: IconWeight;
  /** Accessible name; omit for decorative icons. */
  label?: string;
}) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      data-slot="icon"
      weight={weight}
      className={cn("size-5 shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
