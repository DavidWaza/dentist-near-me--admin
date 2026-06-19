import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Waitlist · Staff console" };

export default function WaitlistPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-deep">Waitlist</h1>
        <p className="text-sm text-ink/60">
          Manage patients waiting for an earlier slot.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-mint bg-white p-10 text-center">
        <p className="text-lg font-semibold text-deep">Coming in v1.1 (P1)</p>
        <p className="mt-1 text-sm text-ink/60">
          The waitlist table and offer-on-cancellation flow are scaffolded in the
          schema (<code>public.waitlist</code>). The screen lands in the P1
          fast-follow.
        </p>
      </div>
    </div>
  );
}
