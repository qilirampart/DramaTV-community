import type { ReactNode } from "react";
import { CommunityRouteTransitionProvider } from "@/components/shared/CommunityRouteTransitionProvider";
import { CommunitySessionProvider } from "@/components/shared/CommunitySessionProvider";
import { getRecentNotifications, isCommunityAuthRequiredError } from "@/lib/api/community-service";
import { getVerifiedCommunitySession } from "@/lib/auth/community-auth";
import type { ApiAuthSession, ApiRecentNotificationItem } from "@/lib/contracts/community-api";

export const dynamic = "force-dynamic";

type CommunityLayoutProps = {
  children: ReactNode;
};

async function resolveCommunitySession(): Promise<{
  currentUser: ApiAuthSession | null;
  recentNotifications: ApiRecentNotificationItem[];
}> {
  try {
    const session = await getVerifiedCommunitySession();
    if (!session) {
      return {
        currentUser: null,
        recentNotifications: []
      };
    }

    try {
      const notifications = await getRecentNotifications();
      return {
        currentUser: session,
        recentNotifications: notifications.data.items
      };
    } catch (error) {
      if (isCommunityAuthRequiredError(error)) {
        return {
          currentUser: session,
          recentNotifications: []
        };
      }

      return {
        currentUser: session,
        recentNotifications: []
      };
    }
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      return {
        currentUser: null,
        recentNotifications: []
      };
    }

    // Session lookup should not hide the page's own backend fallback UI.
    return {
      currentUser: null,
      recentNotifications: []
    };
  }
}

export default async function CommunityLayout({ children }: CommunityLayoutProps) {
  const { currentUser, recentNotifications } = await resolveCommunitySession();

  return (
    <CommunityRouteTransitionProvider>
      <CommunitySessionProvider currentUser={currentUser} recentNotifications={recentNotifications}>
        {children}
      </CommunitySessionProvider>
    </CommunityRouteTransitionProvider>
  );
}
