import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { notFound } from "next/navigation";
import { CreatorPage } from "@/features/creator/CreatorPage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getCreator,
  getCreatorWorks,
  getCreatorPosts,
  getCreatorWorkflows,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { mapCreatorPageView } from "@/lib/mappers/community";
import { normalizeBackTarget } from "@/lib/routes/redirect-utils";

type CreatorRouteProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    from?: string;
  }>;
};

const UNAVAILABLE_FALLBACK = "服务暂时不可用，请稍后重试。";

export default async function CreatorRoute({ params, searchParams }: CreatorRouteProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const backHref = normalizeBackTarget(resolvedSearchParams?.from, "/home");

  let profile: Awaited<ReturnType<typeof getCreator>>;
  let works: Awaited<ReturnType<typeof getCreatorWorks>>;
  let workflows: Awaited<ReturnType<typeof getCreatorWorkflows>>;
  let posts: Awaited<ReturnType<typeof getCreatorPosts>>;

  try {
    profile = await getCreator(id);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Creator page unavailable"
          description="The creator page could not load live data from the backend."
          detail={formatCommunityActionError(error, UNAVAILABLE_FALLBACK)}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }

  if (!profile.data) {
    notFound();
  }

  try {
    [works, workflows, posts] = await Promise.all([
      getCreatorWorks(id),
      getCreatorWorkflows(id),
      getCreatorPosts(id)
    ]);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Creator page unavailable"
          description="The creator page could not load live data from the backend."
          detail={formatCommunityActionError(error, UNAVAILABLE_FALLBACK)}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }

  const view = mapCreatorPageView({ ...profile, data: profile.data }, works, workflows, posts);
  return <CreatorPage view={view} backHref={backHref} />;
}
