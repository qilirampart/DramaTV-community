import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { DiscussionComposerPage } from "@/features/discussions/DiscussionComposerPage";
import {
  getDiscussionHome,
  getPublishBootstrap,
  isCommunityAuthRequiredError,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { requireCommunitySession } from "@/lib/auth/community-auth";
import { mapDiscussionHubPageView, mapPublishPageView } from "@/lib/mappers/community";
import { redirect } from "next/navigation";

export default async function NewDiscussionRoute() {
  await requireCommunitySession("/discussions/new");

  try {
    const [bootstrap, discussionHome] = await Promise.all([
      getPublishBootstrap(),
      getDiscussionHome()
    ]);
    const publishView = {
      ...mapPublishPageView(bootstrap),
      activeTab: "post" as const
    };
    const discussionView = mapDiscussionHubPageView(discussionHome);

    return <DiscussionComposerPage channels={discussionView.channels} view={publishView} />;
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      redirect("/login?redirectTo=%2Fdiscussions%2Fnew");
    }

    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Discussion composer unavailable"
          description="The discussion post composer could not load draft and channel data from the backend."
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
