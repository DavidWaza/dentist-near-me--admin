import Link from "next/link";
import { NButton, NIcon } from "@/components/n";

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-base-50 px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-linear-135 from-flow-s3 to-flow-secondary text-base-0">
          <NIcon name="brand" weight="fill" className="size-7" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-base-900">DentistNearMe</h1>
        <p className="text-base-500">
          This is the staff console. The patient-facing booking site lives separately.
        </p>
        <NButton asChild size="lg" className="mt-2">
          <Link href="/admin/appointments">
            Go to staff console
            <NIcon name="forward" />
          </Link>
        </NButton>
      </div>
    </main>
  );
}
