import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { CLINIC_TIMEZONE } from "@/lib/env";
import { SignOutButton } from "../../_components/SignOutButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings · Staff console" };

export default async function SettingsPage() {
  const user = await requireUser("/admin/settings");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-deep">Settings</h1>
        <p className="text-sm text-ink/60">Your profile and session.</p>
      </div>

      <section className="space-y-3 rounded-xl border border-mint bg-white p-5">
        <h2 className="font-semibold text-deep">Profile</h2>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <dt className="text-ink/60">Email</dt>
          <dd className="col-span-2 text-ink">{user.email}</dd>
          <dt className="text-ink/60">Role</dt>
          <dd className="col-span-2 text-ink">Staff</dd>
          <dt className="text-ink/60">Timezone</dt>
          <dd className="col-span-2 text-ink">
            {CLINIC_TIMEZONE.replace("_", " ")}
          </dd>
        </dl>
      </section>

      <section className="space-y-3 rounded-xl border border-mint bg-white p-5">
        <h2 className="font-semibold text-deep">Session</h2>
        <p className="text-sm text-ink/60">
          Signing out ends your session on this device.
        </p>
        <SignOutButton />
      </section>

      <p className="text-xs text-ink/50">
        Staff accounts and the services / dentists catalogue are managed in
        Supabase for v1. Roles and in-app catalogue management are planned for
        v1.1.
      </p>
    </div>
  );
}
