import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { notFound } from "next/navigation";
import { WorkflowDetailPage } from "@/features/workflow-detail/WorkflowDetailPage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getComments,
  getWorkflowDetail,
  getWorkflowRelatedVideos,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { mapWorkflowDetailPageView } from "@/lib/mappers/community";
import { buildWorkflowPreviewDetailView, isWorkflowPreview } from "@/lib/prefill/workflow-detail-demo";
import { normalizeBackTarget } from "@/lib/routes/redirect-utils";

type WorkflowRouteProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    from?: string;
  }>;
};

const UNAVAILABLE_FALLBACK = "服务暂时不可用，请稍后重试。";

export default async function WorkflowDetailRoute({ params, searchParams }: WorkflowRouteProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const backHref = normalizeBackTarget(resolvedSearchParams?.from);

  if (isWorkflowPreview(id)) {
    return <WorkflowDetailPage view={buildWorkflowPreviewDetailView(id)} backHref={backHref} />;
  }

  let detail: Awaited<ReturnType<typeof getWorkflowDetail>>;
  let related: Awaited<ReturnType<typeof getWorkflowRelatedVideos>>;
  let comments: Awaited<ReturnType<typeof getComments>>;

  try {
    detail = await getWorkflowDetail(id);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Workflow detail unavailable"
          description="The workflow detail page could not load live data from the backend."
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
    [related, comments] = await Promise.all([getWorkflowRelatedVideos(id), getComments("workflow", id)]);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Workflow detail unavailable"
          description="The workflow detail page could not load live data from the backend."
          detail={formatCommunityActionError(error, UNAVAILABLE_FALLBACK)}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }

  const view = mapWorkflowDetailPageView({ ...detail, data: detail.data }, related, comments);
  return <WorkflowDetailPage view={view} backHref={backHref} />;
}
