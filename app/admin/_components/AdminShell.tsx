"use client";

import { useCallback, useEffect, useState } from "react";
import { SidebarNav, MobileTabBar } from "./AdminNav";
import { SignOutButton } from "./SignOutButton";

const STORAGE_KEY = "admin-sidebar-collapsed";

interface AdminShellProps {
  userEmail: string | null | undefined;
  timezoneLabel: string;
  children: React.ReactNode;
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function AdminShell({
  userEmail,
  timezoneLabel,
  children,
}: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // ignore private browsing / blocked storage
    }
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-dvh bg-cream">
      {/* Desktop sidebar — fixed, full viewport height, no internal scroll */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden h-dvh flex-col overflow-hidden bg-deep transition-[width] duration-300 ease-in-out md:flex ${
          collapsed ? "w-[4.25rem]" : "w-60"
        }`}
        aria-label="Staff navigation"
      >
        <div
          className={`shrink-0 flex items-center border-b border-white/10 py-4 ${
            collapsed ? "justify-center px-2" : "px-4"
          }`}
        >
          {collapsed ? (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint/20 text-sm font-bold text-cream"
              title="DentistNearMe"
            >
              D
            </span>
          ) : (
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-cream">
                DentistNearMe
              </p>
              <p className="text-xs text-cream/60">Staff console</p>
            </div>
          )}
        </div>

        <div
          className={`shrink-0 py-3 ${collapsed ? "px-2" : "px-3"}`}
        >
          <SidebarNav collapsed={collapsed} />
        </div>

        <div
          className={`mt-auto shrink-0 border-t border-white/10 p-3 ${
            collapsed ? "flex justify-center" : "min-w-0"
          }`}
        >
          {collapsed ? (
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold uppercase text-cream"
              title={userEmail ?? "Signed in"}
            >
              {userEmail?.[0] ?? "?"}
            </span>
          ) : (
            <p
              className="min-w-0 truncate text-xs text-cream/70"
              title={userEmail ?? undefined}
            >
              {userEmail ?? "Signed in"}
            </p>
          )}
        </div>
      </aside>

      <div
        className={`flex min-h-dvh min-w-0 flex-col transition-[margin-left] duration-300 ease-in-out ${
          collapsed ? "md:ml-[4.25rem]" : "md:ml-60"
        }`}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-mint bg-cream/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-mint text-ink transition-colors hover:bg-mint/40 md:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              aria-controls="admin-sidebar-nav"
            >
              <CollapseIcon collapsed={collapsed} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-deep md:hidden">
                DentistNearMe
              </p>
              <p
                className={`truncate text-xs text-ink/60 ${
                  ready ? "hidden md:block" : "hidden"
                }`}
              >
                All times shown in {timezoneLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="max-w-[14rem] truncate text-sm text-ink/80 md:hidden"
              title={userEmail ?? undefined}
            >
              {userEmail}
            </span>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 md:px-6 md:pb-8">
          {children}
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
