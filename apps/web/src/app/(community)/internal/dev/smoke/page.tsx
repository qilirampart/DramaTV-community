import { notFound } from "next/navigation";
import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { LocalSmokeToolsPage } from "@/features/devtools/local-smoke/LocalSmokeToolsPage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
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
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
