import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { PersonalCenterPage } from "@/features/me/PersonalCenterPage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getMeHub,
  isCommunityAuthRequiredError,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { requireCommunitySession } from "@/lib/auth/community-auth";
import { mapPersonalCenterPageView } from "@/lib/mappers/community";
import { normalizeBackTarget } from "@/lib/routes/redirect-utils";
import { redirect } from "next/navigation";

type PersonalCenterRouteProps = {
  searchParams?: Promise<{
    from?: string;
  }>;
};

export default async function PersonalCenterRoute({ searchParams }: PersonalCenterRouteProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const backHref = normalizeBackTarget(resolvedSearchParams?.from, "/");
  await requireCommunitySession("/me");

  try {
    const response = await getMeHub();
    const view = mapPersonalCenterPageView(response);

    return (
      <PersonalCenterPage
        backHref={backHref}
        publishedVideos={view.publishedVideos}
        publishedPrompts={view.publishedPrompts}
        publishedWorkflows={view.publishedWorkflows}
        view={view}
      />
    );
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      redirect("/login?redirectTo=%2Fme");
    }

    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Personal center unavailable"
          description="The personal center could not load live account and interaction data from the backend."
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
