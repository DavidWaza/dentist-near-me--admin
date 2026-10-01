import Link from "next/link";
import {
  NButton,
  NEmptyState,
  NEmptyStateActions,
  NEmptyStateDescription,
  NEmptyStateIcon,
  NEmptyStateTitle,
  NPageContainer,
  NPageContent,
} from "@/components/n";

export default function AppointmentNotFound() {
  return (
    <NPageContainer>
      <NPageContent width="default">
        <NEmptyState>
          <NEmptyStateIcon name="appointments" />
          <NEmptyStateTitle>Appointment not found</NEmptyStateTitle>
          <NEmptyStateDescription>
            It may have been removed, or the link is incorrect.
          </NEmptyStateDescription>
          <NEmptyStateActions>
            <NButton asChild size="sm">
              <Link href="/admin/appointments">Back to appointments</Link>
            </NButton>
          </NEmptyStateActions>
        </NEmptyState>
      </NPageContent>
    </NPageContainer>
  );
}
