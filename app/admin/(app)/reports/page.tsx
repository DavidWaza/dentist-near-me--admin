import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsDashboard } from "../../_components/ReportsDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reports · Staff console" };

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <div className="h-8 w-48 animate-pulse rounded bg-mint/60" />
          <div className="h-32 animate-pulse rounded-xl border border-mint bg-white" />
        </div>
      }
    >
      <ReportsDashboard />
    </Suspense>
  );
}
