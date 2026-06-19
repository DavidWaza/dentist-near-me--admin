import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your appointment · DentistNearMe",
  robots: { index: false, follow: false },
};

/**
 * Minimal chrome for the public patient pages (confirm / self-reschedule).
 * Inherits fonts + globals from the root layout; deliberately no admin nav.
 */
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="border-b border-mint bg-deep px-4 py-4 text-cream">
        <div className="mx-auto max-w-xl">
          <span className="text-lg font-bold">DentistNearMe</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">{children}</main>
      <footer className="px-4 py-6 text-center text-xs text-ink/50">
        Questions? Reply to your appointment email and our front desk will help.
      </footer>
    </div>
  );
}
