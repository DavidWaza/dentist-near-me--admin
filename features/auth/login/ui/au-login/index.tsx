import {
  NAlert,
  NAlertBody,
  NAlertTitle,
  NIcon,
} from "@/components/n";
import { isSupabaseConfigured } from "@/lib/env";
import { AuLoginForm } from "./login-form";

/** Staff sign-in — feature root. */
export function AuLogin({ next }: { next?: string }) {
  return (
    <main className="grid min-h-dvh bg-base-50 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel */}
      <section
        aria-hidden
        className="relative hidden overflow-hidden bg-flow-primary p-12 text-base-0 lg:flex lg:flex-col lg:justify-between"
      >
        <div
          className="absolute -right-24 -top-24 size-96 rounded-full bg-flow-secondary/40 blur-3xl"
        />
        <div
          className="absolute -bottom-32 -left-16 size-96 rounded-full bg-flow-s3/20 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-linear-135 from-flow-s3 to-flow-secondary">
            <NIcon name="brand" weight="fill" className="size-6" />
          </span>
          <span className="text-lg font-bold">DentistNearMe</span>
        </div>
        <div className="relative flex max-w-md flex-col gap-4">
          <p className="text-3xl font-bold leading-tight">
            Every booking, confirmed and on time.
          </p>
          <p className="text-flow-s5">
            Triage requests, reschedule in a click and keep patients in the loop
            — all from one console.
          </p>
        </div>
        <p className="relative text-xs text-flow-s4">Staff console · authorised access only</p>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-linear-135 from-flow-s3 to-flow-secondary text-base-0 lg:hidden">
              <NIcon name="brand" weight="fill" className="size-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-base-900">
              Sign in to the staff console
            </h1>
            <p className="text-sm text-base-500">
              Use the account your clinic administrator created for you.
            </p>
          </div>

          {!isSupabaseConfigured ? (
            <NAlert tone="pending">
              <NIcon name="warning" />
              <NAlertBody>
                <NAlertTitle>Supabase isn’t configured</NAlertTitle>
                Copy <code>.env.example</code> to <code>.env.local</code>, add your
                project URL and anon key, then restart the dev server.
              </NAlertBody>
            </NAlert>
          ) : null}

          <AuLoginForm next={next} />

          <p className="text-center text-xs text-base-500">
            There is no public sign-up. Ask an administrator for access.
          </p>
        </div>
      </section>
    </main>
  );
}
