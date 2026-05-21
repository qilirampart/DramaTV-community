import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { FeaturedArchivePage } from "@/features/featured/FeaturedArchivePage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getAllPrompts,
  getFeaturedArchiveLayout,
  getHomeFeed,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { hasCommunitySession } from "@/lib/auth/community-auth";
import { loadFeaturedArchivePublicData } from "@/lib/api/community-public-cache";

export default async function FeaturedArchiveRoute() {
  try {
    const isAuthenticated = await hasCommunitySession();

    if (isAuthenticated) {
      const [homeFeed, featuredLayout, videoPrompts, imagePrompts] = await Promise.all([
        getHomeFeed(),
        getFeaturedArchiveLayout(),
        getAllPrompts({ modality: "video", sort: "latest" }),
        getAllPrompts({ modality: "image", sort: "latest" })
      ]);

      return (
        <FeaturedArchivePage
          feedItems={homeFeed.data.items}
          featuredSlots={featuredLayout.data.slots}
          prompts={[...videoPrompts.data, ...imagePrompts.data]}
          workflows={homeFeed.data.sections.hotWorkflows}
        />
      );
    }

    const publicData = await loadFeaturedArchivePublicData();

    return (
      <FeaturedArchivePage
        feedItems={publicData.homeFeed.data.items}
        featuredSlots={publicData.featuredLayout.data.slots}
        lazyPromptInventoryUrl="/api/public/featured-prompts"
        workflows={publicData.homeFeed.data.sections.hotWorkflows}
      />
    );
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Featured archive unavailable"
          description="The featured archive could not load imported prompt data from the backend."
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
