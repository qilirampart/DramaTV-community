import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { CommunityHomePage } from "@/features/home/CommunityHomePage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getHomeFeed,
  getPrompts,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { hasCommunitySession } from "@/lib/auth/community-auth";
import { loadCommunityHomePublicData } from "@/lib/api/community-public-cache";
import { mapHomePageView } from "@/lib/mappers/community";
import { mergeHomePageWithDemo } from "@/lib/prefill/home-resource-catalog";

export default async function CommunityContentHomeRoute() {
  try {
    const isAuthenticated = await hasCommunitySession();

    if (isAuthenticated) {
      const [homeFeed, prompts, heroPrompts] = await Promise.all([
        getHomeFeed(),
        getPrompts({ modality: "all", sort: "latest", limit: 60 }),
        getPrompts({ modality: "video", sort: "latest", limit: 12 })
      ]);
      const view = mergeHomePageWithDemo(mapHomePageView(homeFeed));

      return (
        <CommunityHomePage
          heroPrompts={heroPrompts.data}
          prompts={prompts.data}
          view={view}
        />
      );
    }

    const publicData = await loadCommunityHomePublicData();
    const view = mergeHomePageWithDemo(mapHomePageView(publicData.homeFeed));

    return (
      <CommunityHomePage
        heroPrompts={publicData.heroPrompts.data}
        prompts={publicData.prompts.data}
        view={view}
      />
    );
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Community home unavailable"
          description="The content homepage could not load live community data from the backend."
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
