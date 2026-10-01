import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { toProfileView } from "@/features/account/settings";
import { AcSettings } from "@/features/account/settings/ui/ac-settings";
import { ShSignOutButton } from "@/features/shell/sidebar/ui/sh-shell/sign-out-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings · Staff console" };

export default async function SettingsPage() {
  const user = await requireUser("/admin/settings");
  return (
    <AcSettings
      profile={toProfileView(user)}
      sessionAction={<ShSignOutButton color="destructive" />}
    />
  );
}
