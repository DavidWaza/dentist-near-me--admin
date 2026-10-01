import type { Metadata } from "next";
import {
  NEmptyState,
  NEmptyStateDescription,
  NEmptyStateIcon,
  NEmptyStateTitle,
  NPageContainer,
  NPageContent,
  NPageDescription,
  NPageHeader,
  NPageHeading,
  NPageTitle,
} from "@/components/n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Waitlist · Staff console" };

/** Placeholder until the waitlist slice lands (P1). */
export default function WaitlistPage() {
  return (
    <NPageContainer>
      <NPageContent>
        <NPageHeader>
          <NPageHeading>
            <NPageTitle>Waitlist</NPageTitle>
            <NPageDescription>
              Patients waiting for an earlier slot.
            </NPageDescription>
          </NPageHeading>
        </NPageHeader>
        <NEmptyState>
          <NEmptyStateIcon name="waitlist" />
          <NEmptyStateTitle>Coming in v1.1</NEmptyStateTitle>
          <NEmptyStateDescription>
            The waitlist table and offer-on-cancellation flow are scaffolded in the
            schema (<code>public.waitlist</code>). This screen lands in the P1
            fast-follow.
          </NEmptyStateDescription>
        </NEmptyState>
      </NPageContent>
    </NPageContainer>
  );
}
