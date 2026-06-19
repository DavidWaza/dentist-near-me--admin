import type { Metadata } from "next";
import { ReschedulePicker } from "./ReschedulePicker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Pick a new time · DentistNearMe",
  robots: { index: false, follow: false },
};

export default async function ReschedulePage({
  params,
}: PageProps<"/appointment/[token]/reschedule">) {
  const { token } = await params;
  return <ReschedulePicker token={token} />;
}
