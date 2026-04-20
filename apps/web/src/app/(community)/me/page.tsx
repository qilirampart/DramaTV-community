import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { PersonalCenterPage } from "@/features/me/PersonalCenterPage";
import {
  getCreatorVideos,
  getCreatorWorkflows,
  getMeHub,
  isCommunityAuthRequiredError,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { requireCommunitySession } from "@/lib/auth/community-auth";
import { mapPersonalCenterPageView } from "@/lib/mappers/community";
import { redirect } from "next/navigation";

export default async function PersonalCenterRoute() {
  await requireCommunitySession("/me");

  try {
    const response = await getMeHub();
    const [publishedVideos, publishedWorkflows] = await Promise.all([
      getCreatorVideos(response.data.profile.id),
      getCreatorWorkflows(response.data.profile.id)
    ]);
    const view = mapPersonalCenterPageView(response);

    return (
      <PersonalCenterPage
        publishedVideos={publishedVideos.data.items}
        publishedWorkflows={publishedWorkflows.data.items}
        view={view}
      />
    );
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      redirect("/login?redirectTo=%2Fme");
    }

    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Personal center unavailable"
          description="The personal center could not load live account and interaction data from the backend."
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
