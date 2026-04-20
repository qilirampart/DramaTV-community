import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { notFound } from "next/navigation";
import { DiscussionDetailPage } from "@/features/discussions/DiscussionDetailPage";
import {
  getComments,
  getDiscussionThread,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { mapDiscussionDetailPageView } from "@/lib/mappers/community";

type DiscussionDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DiscussionDetailRoute({ params }: DiscussionDetailRouteProps) {
  const { slug } = await params;
  let detail: Awaited<ReturnType<typeof getDiscussionThread>>;
  let comments: Awaited<ReturnType<typeof getComments>>;

  try {
    detail = await getDiscussionThread(slug);
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
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }

  const view = mapDiscussionDetailPageView({ ...detail, data: detail.data }, comments);
  return <DiscussionDetailPage view={view} />;
}
