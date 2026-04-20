import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { notFound } from "next/navigation";
import { VideoDetailPage } from "@/features/video-detail/VideoDetailPage";
import {
  getComments,
  getPromptDetail,
  getRelatedPrompts,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { mapPromptDetailPageView } from "@/lib/mappers/community";

type PromptRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PromptDetailRoute({ params }: PromptRouteProps) {
  const { id } = await params;

  let detail: Awaited<ReturnType<typeof getPromptDetail>>;
  let related: Awaited<ReturnType<typeof getRelatedPrompts>>;
  let comments: Awaited<ReturnType<typeof getComments>>;

  try {
    [detail, related, comments] = await Promise.all([
      getPromptDetail(id),
      getRelatedPrompts(id),
      getComments("prompt", id)
    ]);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Prompt detail unavailable"
          description="The prompt detail page could not load live data from the backend."
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }

  if (!detail.data) {
    notFound();
  }

  const view = mapPromptDetailPageView({ ...detail, data: detail.data }, related, comments);
  return <VideoDetailPage view={view} />;
}
