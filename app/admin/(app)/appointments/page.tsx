import type { Metadata } from "next";
import { AqQueue } from "@/features/appointments/queue/ui/aq-queue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Appointments · Staff console" };

export default async function AppointmentsPage({
  searchParams,
}: PageProps<"/admin/appointments">) {
  return <AqQueue params={await searchParams} />;
}
