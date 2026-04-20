import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { notFound } from "next/navigation";
import { WorkflowDetailPage } from "@/features/workflow-detail/WorkflowDetailPage";
import {
  getComments,
  getWorkflowDetail,
  getWorkflowRelatedVideos,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { mapWorkflowDetailPageView } from "@/lib/mappers/community";
import { buildWorkflowPreviewDetailView, isWorkflowPreview } from "@/lib/prefill/workflow-detail-demo";

type WorkflowRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkflowDetailRoute({ params }: WorkflowRouteProps) {
  const { id } = await params;

  if (isWorkflowPreview(id)) {
    return <WorkflowDetailPage view={buildWorkflowPreviewDetailView(id)} />;
  }

  let detail: Awaited<ReturnType<typeof getWorkflowDetail>>;
  let related: Awaited<ReturnType<typeof getWorkflowRelatedVideos>>;
  let comments: Awaited<ReturnType<typeof getComments>>;

  try {
    [detail, related, comments] = await Promise.all([
      getWorkflowDetail(id),
      getWorkflowRelatedVideos(id),
      getComments("workflow", id)
    ]);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Workflow detail unavailable"
          description="The workflow detail page could not load live data from the backend."
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

  const view = mapWorkflowDetailPageView({ ...detail, data: detail.data }, related, comments);
  return <WorkflowDetailPage view={view} />;
}
