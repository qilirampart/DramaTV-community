import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { HomePage } from "@/features/home/HomePage";
import {
  getDiscussionHome,
  getHomeFeed,
  getPrompts,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { hasCommunitySession } from "@/lib/auth/community-auth";
import { mapHomePageView } from "@/lib/mappers/community";
import { mergeHomePageWithDemo } from "@/lib/prefill/home-resource-catalog";

export default async function CommunityHomeRoute() {
  try {
    const [homeFeed, discussionHome, prompts, isAuthenticated] = await Promise.all([
      getHomeFeed(),
      getDiscussionHome(),
      getPrompts({ modality: "all", sort: "hot" }),
      hasCommunitySession()
    ]);
    const view = mergeHomePageWithDemo(mapHomePageView(homeFeed, discussionHome));

    return <HomePage isAuthenticated={isAuthenticated} prompts={prompts.data} view={view} />;
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Home feed unavailable"
          description="The homepage could not load live community data from the backend."
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
