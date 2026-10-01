"use client";

import { NButton, NIcon, NToaster } from "@/components/n";
import { cn } from "@/lib/utils/cn";
import { appTimeZoneLabel } from "@/lib/utils/date-formatters";
import { useSidebarCollapsed } from "../../application/use-sidebar-collapsed";
import { SHELL_BRAND } from "../../domain/nav-registry";
import { ShBrandMark } from "./brand-mark";
import { ShMobileTabBar } from "./mobile-tab-bar";
import { SIDEBAR_NAV_ID, ShSidebar } from "./sidebar";
import { ShSignOutButton } from "./sign-out-button";

/**
 * The admin app shell: sidebar (desktop), top bar, mobile tab bar, toaster.
 * Pages own their container/width via <NPageContainer>/<NPageContent>.
 */
export function ShShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const { collapsed, toggle } = useSidebarCollapsed();

  return (
    <div className="min-h-dvh bg-base-50">
      <ShSidebar collapsed={collapsed} userEmail={userEmail} />

      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col transition-[padding-left] duration-300 ease-in-out",
          collapsed ? "md:pl-[4.5rem]" : "md:pl-64",
        )}
      >
        <header className="sticky top-0 z-30 border-b border-base-150 bg-base-0/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:box-content md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <NButton
                color="secondary"
                variant="outline"
                size="icon-sm"
                className="hidden md:inline-flex"
                onClick={toggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
                aria-controls={SIDEBAR_NAV_ID}
              >
                <NIcon
                  name="collapse"
                  className={cn("transition-transform", collapsed && "rotate-180")}
                />
              </NButton>

              <div className="flex min-w-0 items-center gap-2.5 md:hidden">
                <ShBrandMark className="size-8" />
                <span className="truncate font-bold text-base-900">{SHELL_BRAND.name}</span>
              </div>

              <p className="hidden items-center gap-1.5 truncate text-xs text-base-500 md:inline-flex">
                <NIcon name="waitlist" className="size-4" />
                Times shown in {appTimeZoneLabel()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="hidden max-w-56 truncate text-sm text-base-600 sm:block md:hidden"
                title={userEmail ?? undefined}
              >
                {userEmail}
              </span>
              <ShSignOutButton className="hidden md:inline-flex" />
              <ShSignOutButton iconOnly className="md:hidden" />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <ShMobileTabBar />
      <NToaster />
    </div>
  );
}
