import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { notFound } from "next/navigation";
import { DiscussionDetailPage } from "@/features/discussions/DiscussionDetailPage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getComments,
  getDiscussionThread,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { mapDiscussionDetailPageView } from "@/lib/mappers/community";
import { normalizeBackTarget, normalizeDynamicSegment } from "@/lib/routes/redirect-utils";

type DiscussionDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    from?: string;
  }>;
};

export default async function DiscussionDetailRoute({ params, searchParams }: DiscussionDetailRouteProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const normalizedSlug = normalizeDynamicSegment(slug);
  const backHref = normalizeBackTarget(resolvedSearchParams?.from, "/discussions");
  let detail: Awaited<ReturnType<typeof getDiscussionThread>>;
  let comments: Awaited<ReturnType<typeof getComments>>;

  try {
    detail = await getDiscussionThread(normalizedSlug);
    if (!detail.data) {
      notFound();
    }

    comments = await getComments("post", detail.data.id);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Discussion thread unavailable"
          description="The discussion thread page could not load live detail data from the backend."
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }

  const view = mapDiscussionDetailPageView({ ...detail, data: detail.data }, comments);
  return <DiscussionDetailPage view={view} backHref={backHref} />;
}
