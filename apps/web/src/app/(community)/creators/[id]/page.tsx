import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { notFound } from "next/navigation";
import { CreatorPage } from "@/features/creator/CreatorPage";
import {
  getCreator,
  getCreatorVideos,
  getCreatorWorkflows,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { mapCreatorPageView } from "@/lib/mappers/community";

type CreatorRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CreatorRoute({ params }: CreatorRouteProps) {
  const { id } = await params;
  let profile: Awaited<ReturnType<typeof getCreator>>;
  let videos: Awaited<ReturnType<typeof getCreatorVideos>>;
  let workflows: Awaited<ReturnType<typeof getCreatorWorkflows>>;

  try {
    [profile, videos, workflows] = await Promise.all([
      getCreator(id),
      getCreatorVideos(id),
      getCreatorWorkflows(id)
    ]);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Creator page unavailable"
          description="The creator page could not load live data from the backend."
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }

  if (!profile.data) {
    notFound();
  }

  const view = mapCreatorPageView({ ...profile, data: profile.data }, videos, workflows);
  return <CreatorPage view={view} />;
}
