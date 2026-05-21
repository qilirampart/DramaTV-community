import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { DiscussionComposerPage } from "@/features/discussions/DiscussionComposerPage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getPostComposerBootstrap,
  isCommunityAuthRequiredError,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { requireCommunitySession } from "@/lib/auth/community-auth";
import { mapDiscussionComposerPageView } from "@/lib/mappers/community";
import { redirect } from "next/navigation";

type NewDiscussionRouteProps = {
  searchParams?:
    | Promise<{
        draftId?: string | string[];
        channel?: string | string[];
      }>
    | {
        draftId?: string | string[];
        channel?: string | string[];
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

export default async function NewDiscussionRoute({ searchParams }: NewDiscussionRouteProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const draftId = normalizeDraftIdParam(resolvedSearchParams?.draftId);
  const requestedChannelSlug = normalizeChannelParam(resolvedSearchParams?.channel);
  const query = new URLSearchParams();

  if (draftId) {
    query.set("draftId", draftId);
  }

  if (requestedChannelSlug) {
    query.set("channel", requestedChannelSlug);
  }

  const currentPath = query.size > 0 ? `/discussions/new?${query.toString()}` : "/discussions/new";

  await requireCommunitySession(currentPath);

  try {
    const bootstrap = await getPostComposerBootstrap(draftId ? { postDraftId: draftId } : undefined);
    const view = mapDiscussionComposerPageView(bootstrap);
    const initialChannelSlug =
      !draftId && requestedChannelSlug && view.channels.some((channel) => channel.slug === requestedChannelSlug)
        ? requestedChannelSlug
        : undefined;

    return (
      <DiscussionComposerPage
        channels={view.channels}
        initialChannelSlug={initialChannelSlug}
        view={view}
      />
    );
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      redirect(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
    }

    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Discussion composer unavailable"
          description="The discussion post composer could not load draft and channel data from the backend."
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
