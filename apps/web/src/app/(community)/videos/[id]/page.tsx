import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { notFound } from "next/navigation";
import { VideoDetailPage } from "@/features/video-detail/VideoDetailPage";
import {
  getComments,
  getRelatedVideos,
  getVideoDetail,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import {
  buildPromptPreviewVideoDetailView,
  isPromptPreviewVideo,
} from "@/lib/prefill/prompt-detail-demo";
import { buildImportedPromptVideoDetailView, isImportedPromptVideo } from "@/lib/prefill/imported-prompt-library";
import { mapVideoDetailPageView } from "@/lib/mappers/community";

type VideoRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VideoDetailRoute({ params }: VideoRouteProps) {
  const { id } = await params;

  if (isPromptPreviewVideo(id)) {
    return <VideoDetailPage view={buildPromptPreviewVideoDetailView(id)} />;
  }

  if (isImportedPromptVideo(id)) {
    return <VideoDetailPage view={buildImportedPromptVideoDetailView(id)} />;
  }

  let detail: Awaited<ReturnType<typeof getVideoDetail>>;
  let related: Awaited<ReturnType<typeof getRelatedVideos>>;
  let comments: Awaited<ReturnType<typeof getComments>>;

  try {
    [detail, related, comments] = await Promise.all([
      getVideoDetail(id),
      getRelatedVideos(id),
      getComments("video", id)
    ]);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Video detail unavailable"
          description="The video detail page could not load live data from the backend."
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

  const view = mapVideoDetailPageView({ ...detail, data: detail.data }, related, comments);
  return <VideoDetailPage view={view} />;
}
