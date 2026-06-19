import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Staff sign-in · DentistNearMe" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-deep">DentistNearMe</h1>
          <p className="mt-1 text-sm text-ink/70">Staff console</p>
        </div>

        <div className="rounded-2xl border border-mint bg-white p-6 shadow-sm">
          {!isSupabaseConfigured ? (
            <div className="mb-4 rounded-lg bg-status-pending-bg px-3 py-2 text-sm text-status-pending">
              Supabase isn’t configured yet. Copy <code>.env.example</code> to{" "}
              <code>.env.local</code>, fill in your project URL and anon key,
              then restart the dev server.
            </div>
          ) : null}

          <LoginForm next={nextPath} />

          <p className="mt-4 text-center text-xs text-ink/60">
            Accounts are created by an administrator. There is no public sign-up.
          </p>
        </div>
      </div>
    </main>
  );
}
