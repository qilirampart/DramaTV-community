import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { notFound } from "next/navigation";
import { VideoDetailPage } from "@/features/video-detail/VideoDetailPage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getComments,
  getPromptDetail,
  getRelatedPrompts,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { mapPromptDetailPageView } from "@/lib/mappers/community";
import { normalizeBackTarget } from "@/lib/routes/redirect-utils";

type PromptRouteProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    from?: string;
  }>;
};

const UNAVAILABLE_FALLBACK = "服务暂时不可用，请稍后重试。";

export default async function PromptDetailRoute({ params, searchParams }: PromptRouteProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const backHref = normalizeBackTarget(resolvedSearchParams?.from);

  let detail: Awaited<ReturnType<typeof getPromptDetail>>;
  let related: Awaited<ReturnType<typeof getRelatedPrompts>>;
  let comments: Awaited<ReturnType<typeof getComments>>;

  try {
    detail = await getPromptDetail(id);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Prompt detail unavailable"
          description="The prompt detail page could not load live data from the backend."
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
    [related, comments] = await Promise.all([getRelatedPrompts(id), getComments("prompt", id)]);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Prompt detail unavailable"
          description="The prompt detail page could not load live data from the backend."
          detail={formatCommunityActionError(error, UNAVAILABLE_FALLBACK)}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }

  const view = mapPromptDetailPageView({ ...detail, data: detail.data }, related, comments);
  return <VideoDetailPage view={view} backHref={backHref} />;
}
