import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { CommunityHomePage } from "@/features/home/CommunityHomePage";
import {
  getDiscussionHome,
  getHomeFeed,
  getPrompts,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { mapHomePageView } from "@/lib/mappers/community";
import { mergeHomePageWithDemo } from "@/lib/prefill/home-resource-catalog";

export default async function CommunityContentHomeRoute() {
  try {
    const [homeFeed, discussionHome, prompts] = await Promise.all([
      getHomeFeed(),
      getDiscussionHome(),
      getPrompts({ modality: "all", sort: "hot" })
    ]);
    const view = mergeHomePageWithDemo(mapHomePageView(homeFeed, discussionHome));

    return <CommunityHomePage prompts={prompts.data} view={view} />;
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Community home unavailable"
          description="The content homepage could not load live community data from the backend."
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
