import { notFound } from "next/navigation";
import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { LocalSmokeToolsPage } from "@/features/devtools/local-smoke/LocalSmokeToolsPage";
import {
  isLocalSmokeToolsEnabled,
  loadLocalSmokeToolsView
} from "@/features/devtools/local-smoke/shared";
import { isCommunityBackendUnavailableError } from "@/lib/api/community-service";

export default async function InternalLocalSmokeToolsRoute() {
  if (!isLocalSmokeToolsEnabled()) {
    notFound();
  }

  try {
    const view = await loadLocalSmokeToolsView();
    return <LocalSmokeToolsPage view={view} />;
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Local smoke tools unavailable"
          description="The smoke tools page could not read live backend data."
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
