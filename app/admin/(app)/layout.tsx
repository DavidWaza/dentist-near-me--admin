import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured, CLINIC_TIMEZONE } from "@/lib/env";
import { AdminShell } from "../_components/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-3 px-6 text-ink">
        <h1 className="text-xl font-bold text-deep">Setup required</h1>
        <p className="text-sm">
          The admin dashboard needs Supabase credentials. Copy{" "}
          <code>.env.example</code> to <code>.env.local</code>, set{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL_ADMIN</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then restart.
        </p>
      </main>
    );
  }

  const user = await getUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminShell
      userEmail={user.email}
      timezoneLabel={CLINIC_TIMEZONE.replace("_", " ")}
    >
      {children}
    </AdminShell>
  );
}
