import type { ReactNode } from "react";
import {
  NCard,
  NCardContent,
  NCardDescription,
  NCardFooter,
  NCardHeader,
  NCardTitle,
  NDescriptionDetails,
  NDescriptionItem,
  NDescriptionList,
  NDescriptionTerm,
  NIcon,
  NPageContainer,
  NPageContent,
  NPageDescription,
  NPageHeader,
  NPageHeading,
  NPageTitle,
} from "@/components/n";
import {
  appTimeZoneLabel,
  formatDateTime,
} from "@/lib/utils/date-formatters";
import type { ProfileView } from "../../domain/profile";

/**
 * Settings — feature root. `sessionAction` is a slot for the shell's sign-out
 * button: the page composes it in, so this slice doesn't import the shell.
 */
export function AcSettings({
  profile,
  sessionAction,
}: {
  profile: ProfileView;
  sessionAction: ReactNode;
}) {
  return (
    <NPageContainer>
      <NPageContent width="default">
        <NPageHeader>
          <NPageHeading>
            <NPageTitle>Settings</NPageTitle>
            <NPageDescription>Your profile and session.</NPageDescription>
          </NPageHeading>
        </NPageHeader>

        <NCard>
          <NCardHeader>
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent-100 text-lg font-semibold uppercase text-accent-600">
                {profile.email[0]}
              </span>
              <div className="min-w-0">
                <NCardTitle className="truncate">{profile.email}</NCardTitle>
                <NCardDescription>{profile.role}</NCardDescription>
              </div>
            </div>
          </NCardHeader>
          <NCardContent>
            <NDescriptionList layout="rows">
              <NDescriptionItem>
                <NDescriptionTerm>Role</NDescriptionTerm>
                <NDescriptionDetails>{profile.role}</NDescriptionDetails>
              </NDescriptionItem>
              <NDescriptionItem>
                <NDescriptionTerm>Display time zone</NDescriptionTerm>
                <NDescriptionDetails>{appTimeZoneLabel()}</NDescriptionDetails>
              </NDescriptionItem>
              <NDescriptionItem>
                <NDescriptionTerm>Last sign-in</NDescriptionTerm>
                <NDescriptionDetails>
                  {profile.lastSignIn ? formatDateTime(profile.lastSignIn) : "—"}
                </NDescriptionDetails>
              </NDescriptionItem>
            </NDescriptionList>
          </NCardContent>
        </NCard>

        <NCard>
          <NCardHeader>
            <NCardTitle>Session</NCardTitle>
            <NCardDescription>Signing out ends your session on this device.</NCardDescription>
          </NCardHeader>
          <NCardFooter className="border-t-0 pt-0">{sessionAction}</NCardFooter>
        </NCard>

        <p className="flex gap-2 text-xs text-base-500">
          <NIcon name="info" className="mt-px size-4" />
          Staff accounts and the services and dentists catalogue are managed in
          Supabase for v1. Roles and in-app catalogue management are planned for v1.1.
        </p>
      </NPageContent>
    </NPageContainer>
  );
}
