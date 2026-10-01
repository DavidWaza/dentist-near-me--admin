import type { Metadata } from "next";
import { NIcon } from "@/components/n";

export const metadata: Metadata = {
  title: "Your appointment · DentistNearMe",
  robots: { index: false, follow: false },
};

/**
 * Minimal chrome for the public patient pages (confirm / self-reschedule).
 * Deliberately no admin nav.
 */
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-base-50">
      <header className="bg-flow-primary px-4 py-4 text-base-0">
        <div className="mx-auto flex max-w-xl items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-linear-135 from-flow-s3 to-flow-secondary">
            <NIcon name="brand" weight="fill" className="size-5" />
          </span>
          <span className="text-lg font-bold">DentistNearMe</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">{children}</main>
      <footer className="px-4 py-6 text-center text-xs text-base-500">
        Questions? Reply to your appointment email and our front desk will help.
      </footer>
    </div>
  );
}
