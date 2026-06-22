import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { CommunityHomePage } from "@/features/home/CommunityHomePage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getHomeFeed,
  getPrompts,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { getVerifiedCommunitySession } from "@/lib/auth/community-auth";
import { loadCommunityHomePublicData } from "@/lib/api/community-public-cache";
import { mapHomePageView } from "@/lib/mappers/community";
import { mergeHomePageWithDemo } from "@/lib/prefill/home-resource-catalog";
import { buildCommunityHomePageData, HOME_PROMPT_FETCH_LIMIT } from "@/features/home/home-page-data";

export default async function CommunityContentHomeRoute() {
  try {
    const session = await getVerifiedCommunitySession();

    if (session) {
      const [homeFeed, prompts] = await Promise.all([
        getHomeFeed(),
        getPrompts({ modality: "all", sort: "latest", limit: HOME_PROMPT_FETCH_LIMIT })
      ]);
      const view = mergeHomePageWithDemo(mapHomePageView(homeFeed));
      const pageData = buildCommunityHomePageData(view, prompts.data);

      return <CommunityHomePage pageData={pageData} />;
    }

    const publicData = await loadCommunityHomePublicData();
    const view = mergeHomePageWithDemo(mapHomePageView(publicData.homeFeed));
    const pageData = buildCommunityHomePageData(view, publicData.prompts.data);

    return <CommunityHomePage pageData={pageData} />;
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
