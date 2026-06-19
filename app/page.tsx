import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-deep">DentistNearMe</h1>
        <p className="mt-2 text-ink/70">
          This is the staff console. The patient-facing booking site lives
          separately.
        </p>
        <Link
          href="/admin/appointments"
          className="mt-6 inline-block rounded-lg bg-deep px-5 py-2.5 font-semibold text-cream hover:opacity-90"
        >
          Go to staff console
        </Link>
      </div>
    </main>
  );
}
