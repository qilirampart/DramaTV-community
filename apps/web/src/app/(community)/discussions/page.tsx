import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { DiscussionsPage } from "@/features/discussions/DiscussionsPage";
import {
  getDiscussionHome,
  getDiscussionThread,
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

function formatDateLabel(value?: string) {
  if (!value) {
    return "近期更新";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "近期更新";
  }

  return date.toLocaleDateString("zh-CN");
}

export default async function DiscussionsRoute({ searchParams }: DiscussionsRouteProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedChannelSlug = normalizeChannelParam(resolvedSearchParams?.channel);

  try {
    const home = await getDiscussionHome(requestedChannelSlug);
    const view = mapDiscussionHubPageView(home);
    const authorMeta = (
      await Promise.all(
        view.featuredThreads.map(async (thread) => {
          const detail = await getDiscussionThread(thread.slug);

          if (!detail.data) {
            return null;
          }

          return {
            slug: thread.slug,
            author: {
              id: detail.data.author.id,
              displayName: detail.data.author.displayName,
              avatarUrl: detail.data.author.avatarUrl,
              href: `/creators/${detail.data.author.id}`
            },
            publishedAtLabel: formatDateLabel(detail.data.publishedAt)
          };
        })
      )
    ).filter((item): item is NonNullable<typeof item> => Boolean(item));

    return <DiscussionsPage authorMeta={authorMeta} view={view} requestedChannelSlug={requestedChannelSlug} />;
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Discussion hub unavailable"
          description="The discussion page could not load live threads from the backend."
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
