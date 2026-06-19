"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ICON = {
  appointments: (
    <path d="M8 2v3M16 2v3M3.5 9h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5V19A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V6.5A1.5 1.5 0 0 1 5 5Z" />
  ),
  waitlist: <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  reports: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  settings: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.13-1.3l2-1.56-2-3.46-2.36.95a7.3 7.3 0 0 0-2.25-1.3L15.5 2h-4l-.31 2.53a7.3 7.3 0 0 0-2.25 1.3L6.58 4.88l-2 3.46 2 1.56a7.4 7.4 0 0 0 0 2.6l-2 1.56 2 3.46 2.36-.95a7.3 7.3 0 0 0 2.25 1.3L11.5 22h4l.31-2.53a7.3 7.3 0 0 0 2.25-1.3l2.36.95 2-3.46-2-1.56c.08-.43.13-.86.13-1.3Z" />
  ),
} as const;

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/appointments",
    label: "Appointments",
    icon: ICON.appointments,
  },
  { href: "/admin/waitlist", label: "Waitlist", icon: ICON.waitlist },
  { href: "/admin/reports", label: "Reports", icon: ICON.reports },
  { href: "/admin/settings", label: "Settings", icon: ICON.settings },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const isActive = useIsActive();

  return (
    <nav
      id="admin-sidebar-nav"
      aria-label="Primary"
      className={`flex flex-col gap-1 ${collapsed ? "items-center" : ""}`}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
              collapsed
                ? "h-10 w-10 justify-center p-0"
                : "gap-3 px-3 py-2"
            } ${
              active
                ? "bg-mint text-deep"
                : "text-cream/80 hover:bg-white/10 hover:text-cream"
            }`}
          >
            <Icon>{item.icon}</Icon>
            <span
              className={`truncate transition-opacity duration-200 ${
                collapsed ? "sr-only" : "opacity-100"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabBar() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-mint bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${
              active ? "text-teal" : "text-ink/60"
            }`}
          >
            <Icon>{item.icon}</Icon>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
