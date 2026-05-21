import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { PublishPage } from "@/features/publish/PublishPage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getPublishPageBootstrap,
  isCommunityAuthRequiredError,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { requireCommunitySession } from "@/lib/auth/community-auth";
import { mapPublishPageView } from "@/lib/mappers/community";
import { redirect } from "next/navigation";

type PublishRouteProps = {
  searchParams?:
    | Promise<{
        draftId?: string | string[];
        workflowDraftId?: string | string[];
      }>
    | {
        draftId?: string | string[];
        workflowDraftId?: string | string[];
      };
};

function normalizeDraftIdParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return normalizeDraftIdParam(value[0]);
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export default async function PublishRoute({ searchParams }: PublishRouteProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const draftId = normalizeDraftIdParam(resolvedSearchParams?.draftId);
  const workflowDraftId = normalizeDraftIdParam(resolvedSearchParams?.workflowDraftId);
  const currentPath = draftId
    ? `/publish?draftId=${encodeURIComponent(draftId)}`
    : workflowDraftId
      ? `/publish?workflowDraftId=${encodeURIComponent(workflowDraftId)}`
      : "/publish";

  await requireCommunitySession(currentPath);

  try {
    const bootstrap = await getPublishPageBootstrap(
      draftId
        ? { videoDraftId: draftId }
        : workflowDraftId
          ? { workflowDraftId }
          : undefined
    );
    const view = mapPublishPageView(bootstrap);
    return <PublishPage availableWorkflows={view.availableWorkflows} view={view} />;
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      redirect(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
    }

    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Publish page unavailable"
          description="The publish page could not load draft bootstrap data from the backend."
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
