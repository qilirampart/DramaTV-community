import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { FeaturedArchivePage } from "@/features/featured/FeaturedArchivePage";
import {
  getHomeFeed,
  getPrompts,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";

export default async function FeaturedArchiveRoute() {
  try {
    const [prompts, homeFeed] = await Promise.all([
      getPrompts({ modality: "all", sort: "hot" }),
      getHomeFeed()
    ]);

    return <FeaturedArchivePage prompts={prompts.data} workflows={homeFeed.data.sections.hotWorkflows} />;
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Featured archive unavailable"
          description="The featured archive could not load imported prompt data from the backend."
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
