import type { ReactNode } from "react";
import { CommunitySessionProvider } from "@/components/shared/CommunitySessionProvider";
import { getCurrentAuthSession, isCommunityAuthRequiredError } from "@/lib/api/community-service";

export const dynamic = "force-dynamic";

type CommunityLayoutProps = {
  children: ReactNode;
};

async function resolveCurrentUser() {
  try {
    return (await getCurrentAuthSession()).data;
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      return null;
    }

    // Session lookup should not hide the page's own backend fallback UI.
    return null;
  }
}

export default async function CommunityLayout({ children }: CommunityLayoutProps) {
  const currentUser = await resolveCurrentUser();

  return (
    <CommunitySessionProvider currentUser={currentUser}>
      {children}
    </CommunitySessionProvider>
  );
}
