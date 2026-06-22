import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { HomePage } from "@/features/home/HomePage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { loadLandingPagePublicData } from "@/lib/api/community-public-cache";
import { hasCommunitySession } from "@/lib/auth/community-auth";
import { mapHomePageView } from "@/lib/mappers/community";
import { mergeHomePageWithDemo } from "@/lib/prefill/home-resource-catalog";

export default async function CommunityHomeRoute() {
  try {
    const [publicData, isAuthenticated] = await Promise.all([
      loadLandingPagePublicData(),
      hasCommunitySession()
    ]);
    const view = mergeHomePageWithDemo(mapHomePageView(publicData.homeFeed));

    return (
      <HomePage
        isAuthenticated={isAuthenticated}
        landingLayout={publicData.landingLayout.data}
        prompts={publicData.prompts.data}
        view={view}
      />
    );
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Home feed unavailable"
          description="The homepage could not load live community data from the backend."
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
