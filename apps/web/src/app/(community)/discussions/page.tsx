import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { DiscussionsPage } from "@/features/discussions/DiscussionsPage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getDiscussionHome,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { mapDiscussionHubPageView } from "@/lib/mappers/community";

type DiscussionsRouteProps = {
  searchParams?:
    | Promise<{
        channel?: string | string[];
      }>
    | {
        channel?: string | string[];
      };
};

function normalizeChannelParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return normalizeChannelParam(value[0]);
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export default async function DiscussionsRoute({ searchParams }: DiscussionsRouteProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedChannelSlug = normalizeChannelParam(resolvedSearchParams?.channel);

  try {
    const home = await getDiscussionHome(requestedChannelSlug);
    const view = mapDiscussionHubPageView(home);
    return <DiscussionsPage view={view} requestedChannelSlug={requestedChannelSlug} />;
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Discussion hub unavailable"
          description="The discussion page could not load live threads from the backend."
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
