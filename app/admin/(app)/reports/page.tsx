import type { Metadata } from "next";
import { Suspense } from "react";
import { NClientOnly } from "@/components/n";
import { RpDashboard } from "@/features/reports/dashboard/ui/rp-dashboard";
import { RpDashboardSkeleton } from "@/features/reports/dashboard/ui/rp-dashboard/skeleton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reports · Staff console" };

/** The dashboard is fed by client-resolved queries → client-only, owned here. */
export default function ReportsPage() {
  const fallback = <RpDashboardSkeleton />;
  return (
    <NClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <RpDashboard />
      </Suspense>
    </NClientOnly>
  );
}
