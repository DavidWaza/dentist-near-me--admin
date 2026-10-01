"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NIcon } from "@/components/n";
import { cn } from "@/lib/utils/cn";
import { SHELL_NAV_ITEMS, isNavItemActive } from "../../domain/nav-registry";

export function ShMobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-base-150 bg-base-0/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      style={{ gridTemplateColumns: `repeat(${SHELL_NAV_ITEMS.length}, minmax(0, 1fr))` }}
    >
      {SHELL_NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-medium",
              active ? "text-accent-500" : "text-base-500",
            )}
          >
            <NIcon name={item.icon} weight={active ? "fill" : "regular"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
