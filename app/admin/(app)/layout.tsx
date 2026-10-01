import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { AppQueryProvider } from "@/lib/query/query-provider";
import {
  NAlert,
  NAlertBody,
  NAlertTitle,
  NIcon,
} from "@/components/n";
import { ShShell } from "@/features/shell/sidebar/ui/sh-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
        <NAlert tone="pending">
          <NIcon name="warning" />
          <NAlertBody>
            <NAlertTitle>Setup required</NAlertTitle>
            The admin dashboard needs Supabase credentials. Copy{" "}
            <code>.env.example</code> to <code>.env.local</code>, set{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then restart.
          </NAlertBody>
        </NAlert>
      </main>
    );
  }

  const user = await getUser();
  if (!user) redirect("/admin/login");

  return (
    <AppQueryProvider>
      <ShShell userEmail={user.email ?? null}>{children}</ShShell>
    </AppQueryProvider>
  );
}
