import type { Metadata } from "next";
import { AuLogin } from "@/features/auth/login/ui/au-login";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff sign-in · DentistNearMe" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  return <AuLogin next={typeof next === "string" ? next : undefined} />;
}
