import type { Metadata } from "next";
import { AdDetail } from "@/features/appointments/detail/ui/ad-detail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Appointment · Staff console" };

export default async function AppointmentDetailPage({
  params,
}: PageProps<"/admin/appointments/[id]">) {
  const { id } = await params;
  return <AdDetail id={id} />;
}
