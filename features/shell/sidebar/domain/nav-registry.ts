import type { IconName } from "@/lib/utils/icons";

export interface ShellNavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Shown as a small tag (e.g. features still in progress). */
  badge?: string;
}

/**
 * Navigation registry. Adding a screen is a data change here — the sidebar
 * and the mobile tab bar both render from this list.
 */
export const SHELL_NAV_ITEMS: ShellNavItem[] = [
  { href: "/admin/appointments", label: "Appointments", icon: "appointments" },
  { href: "/admin/waitlist", label: "Waitlist", icon: "waitlist", badge: "Soon" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const SHELL_BRAND = { name: "DentistNearMe", tagline: "Staff console" };

export const LOGIN_PATH = "/admin/login";

/** localStorage key for the per-user collapsed-sidebar preference. */
export const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";
