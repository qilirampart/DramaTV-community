import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { notFound } from "next/navigation";
import { VideoDetailPage } from "@/features/video-detail/VideoDetailPage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getComments,
  getRelatedVideos,
  getVideoDetail,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { buildImportedPromptVideoDetailView, isImportedPromptVideo } from "@/lib/prefill/imported-prompt-library";
import {
  buildPromptPreviewVideoDetailView,
  isPromptPreviewVideo
} from "@/lib/prefill/prompt-detail-demo";
import { mapVideoDetailPageView } from "@/lib/mappers/community";
import { normalizeBackTarget } from "@/lib/routes/redirect-utils";

type VideoRouteProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    from?: string;
  }>;
};

const UNAVAILABLE_FALLBACK = "服务暂时不可用，请稍后重试。";

export default async function VideoDetailRoute({ params, searchParams }: VideoRouteProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const backHref = normalizeBackTarget(resolvedSearchParams?.from);

  if (isPromptPreviewVideo(id)) {
    return <VideoDetailPage view={buildPromptPreviewVideoDetailView(id)} backHref={backHref} />;
  }

  if (isImportedPromptVideo(id)) {
    return <VideoDetailPage view={buildImportedPromptVideoDetailView(id)} backHref={backHref} />;
  }

  let detail: Awaited<ReturnType<typeof getVideoDetail>>;
  let related: Awaited<ReturnType<typeof getRelatedVideos>>;
  let comments: Awaited<ReturnType<typeof getComments>>;

  try {
    detail = await getVideoDetail(id);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Video detail unavailable"
          description="The video detail page could not load live data from the backend."
          detail={formatCommunityActionError(error, UNAVAILABLE_FALLBACK)}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }

  if (!detail.data) {
    notFound();
  }

  try {
    [related, comments] = await Promise.all([getRelatedVideos(id), getComments("video", id)]);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Video detail unavailable"
          description="The video detail page could not load live data from the backend."
          detail={formatCommunityActionError(error, UNAVAILABLE_FALLBACK)}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }

  const view = mapVideoDetailPageView({ ...detail, data: detail.data }, related, comments);
  return <VideoDetailPage view={view} backHref={backHref} />;
}
