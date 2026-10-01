"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NIcon } from "@/components/n";
import { cn } from "@/lib/utils/cn";
import {
  SHELL_BRAND,
  SHELL_NAV_ITEMS,
  isNavItemActive,
} from "../../domain/nav-registry";
import { ShBrandMark } from "./brand-mark";

export const SIDEBAR_NAV_ID = "sh-sidebar-nav";

/** Desktop sidebar — fixed, full height, collapses to an icon rail. */
export function ShSidebar({
  collapsed,
  userEmail,
}: {
  collapsed: boolean;
  userEmail: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Staff navigation"
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden bg-flow-primary text-base-0 transition-[width] duration-300 ease-in-out md:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-flow-stroke",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <ShBrandMark />
        {collapsed ? null : (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-bold">{SHELL_BRAND.name}</p>
            <p className="text-xs text-flow-s5">{SHELL_BRAND.tagline}</p>
          </div>
        )}
      </div>

      <nav
        id={SIDEBAR_NAV_ID}
        aria-label="Primary"
        className={cn("flex flex-1 flex-col gap-1 py-4", collapsed ? "items-center px-2" : "px-3")}
      >
        {collapsed ? null : (
          <p className="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-flow-s4">
            Workspace
          </p>
        )}
        {SHELL_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "size-11 justify-center" : "h-10 gap-3 px-3",
                active
                  ? "bg-base-0/10 text-base-0"
                  : "text-flow-s5 hover:bg-base-0/5 hover:text-base-0",
              )}
            >
              {active ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-flow-s3",
                    collapsed ? "-left-2" : "-left-3",
                  )}
                />
              ) : null}
              <NIcon
                name={item.icon}
                weight={active ? "fill" : "regular"}
                className={cn(active ? "text-flow-s3" : "text-flow-s4 group-hover:text-base-0")}
              />
              <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
              {item.badge && !collapsed ? (
                <span className="ml-auto rounded-sm bg-base-0/10 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-flow-s5">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "flex shrink-0 items-center gap-3 border-t border-flow-stroke p-3",
          collapsed && "justify-center",
        )}
      >
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-flow-stroke text-sm font-semibold uppercase"
          title={userEmail ?? "Signed in"}
        >
          {userEmail?.[0] ?? "?"}
        </span>
        {collapsed ? null : (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium" title={userEmail ?? undefined}>
              {userEmail ?? "Signed in"}
            </p>
            <p className="text-xs text-flow-s5">Staff</p>
          </div>
        )}
      </div>
    </aside>
  );
}
