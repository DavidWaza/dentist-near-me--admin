import {
  describeStatus,
  statusVariants,
  type StatusKind,
  type StatusVariantProps,
} from "@/lib/utils/status";
import { cn } from "@/lib/utils/cn";
import { NIcon } from "../icon/n-icon";

/**
 * The one way a status reaches the screen:
 *   <NStatus status={row.status} kind="appointment" />
 * Raw strings are resolved through the alias table; tone, label and icon come
 * from the registry.
 */
export function NStatus({
  status,
  kind,
  variant,
  size,
  showIcon = true,
  className,
}: {
  status: string | null | undefined;
  kind: StatusKind;
  showIcon?: boolean;
  className?: string;
} & Omit<StatusVariantProps, "tone">) {
  const def = describeStatus(status, kind);
  return (
    <span
      data-slot="status"
      className={cn(statusVariants({ tone: def.tone, variant, size }), className)}
    >
      {showIcon ? <NIcon name={def.icon} weight="bold" /> : null}
      {def.label}
    </span>
  );
}
