import type {
  CanvasRuntimePageView,
  CommentView,
  CreatorPageView,
  DiscussionBindingView,
  DiscussionDetailPageView,
  DiscussionHubPageView,
  HomePageView,
  PersonalCenterItemView,
  PersonalCenterPageView,
  PublishPageView,
  VideoDetailPageView,
  VideoMiniCardView,
  WorkflowDetailPageView,
  WorkflowMiniCardView
} from "@/lib/contracts/view-models";
import type {
  ApiCanvasRuntime,
  ApiComment,
  ApiCreatorProfile,
  ApiCursorPage,
  ApiDiscussionHomeResponse,
  ApiDiscussionThreadDetail,
  ApiEnvelope,
  ApiFeedHomeResponse,
  ApiMeHubResponse,
  ApiMeInteractionItem,
  ApiPromptDetail,
  ApiPromptSummary,
  ApiPublishBootstrap,
  ApiVideoDetail,
  ApiVideoSummary,
  ApiWorkflowDetail,
  ApiWorkflowSummary
} from "@/lib/contracts/community-api";

function mapComment(comment: ApiComment): CommentView {
  return {
    id: comment.id,
    authorName: comment.author.displayName,
    authorAvatarUrl: comment.author.avatarUrl,
    content: comment.content,
    createdAt: comment.createdAt,
    likeCount: comment.likeCount,
    replyCount: comment.replyCount,
    viewerLiked: comment.viewerActions.liked
  };
}

function formatDateLabel(value?: string | null, fallback = "Pending time"): string {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString("zh-CN");
}

function formatReplyCountLabel(value: number): string {
  return `${value.toLocaleString("zh-CN")} replies`;
}

function toSafeCount(value?: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatLikeCountLabel(value: number): string {
  return `${value.toLocaleString("zh-CN")} likes`;
}

function formatFavoriteCountLabel(value: number): string {
  return `${value.toLocaleString("zh-CN")} favorites`;
}

function mapDiscussionBinding(
  binding:
    | ApiDiscussionHomeResponse["featuredThreads"][number]["binding"]
    | ApiDiscussionThreadDetail["binding"]
    | undefined
): DiscussionBindingView | undefined {
  if (!binding) {
    return undefined;
  }

  const targetType: DiscussionBindingView["targetType"] =
    binding.targetType === "workflow" ? "workflow" : "video";

  return {
    targetType,
    targetId: binding.targetId,
    targetTitle: binding.targetTitle,
    href: targetType === "workflow" ? `/workflows/${binding.targetId}` : `/videos/${binding.targetId}`,
    label: targetType === "workflow" ? "Bound workflow" : "Bound video"
  };
}

function mapVideoMiniCard(video: ApiVideoSummary): VideoMiniCardView {
  return {
    id: video.id,
    title: video.title,
    href: `/videos/${video.id}`,
    coverUrl: video.coverUrl,
    durationMs: video.durationMs,
    summary: video.summary,
    likeCount: video.likeCount,
    playCount: video.playCount,
    author: video.author,
    workflow: video.workflow
  };
}

function mapPromptMiniCard(prompt: ApiPromptSummary): VideoMiniCardView {
  return {
    id: prompt.id,
    title: prompt.title,
    href: `/prompts/${prompt.id}`,
    coverUrl: prompt.coverUrl ?? "",
    summary: prompt.summary,
    likeCount: prompt.stats.likeCount,
    playCount: prompt.stats.exampleCount,
    author: prompt.author
  };
}

function mapWorkflowMiniCard(workflow: ApiWorkflowSummary): WorkflowMiniCardView {
  return {
    id: workflow.id,
    title: workflow.title,
    coverUrl: workflow.coverUrl,
    summary: workflow.summary,
    likeCount: workflow.likeCount,
    author: workflow.author,
    allowCopy: workflow.allowCopy,
    processHref: workflow.processHref
  };
}

function mapPersonalCenterItem(item: ApiMeInteractionItem): PersonalCenterItemView {
  return {
    itemType: item.itemType,
    targetId: item.targetId,
    title: item.title,
    summary: item.summary,
    coverUrl: item.coverUrl,
    href: item.href,
    workflowTitle: item.workflowTitle,
    channelTitle: item.channelTitle,
    actedAtLabel: formatDateLabel(item.actedAt, "Recently updated"),
    author: {
      id: item.author.id,
      displayName: item.author.displayName,
      avatarUrl: item.author.avatarUrl,
      href: `/creators/${item.author.id}`
    }
  };
}

export function mapHomePageView(
  response: ApiEnvelope<ApiFeedHomeResponse>,
  discussionResponse?: ApiEnvelope<ApiDiscussionHomeResponse>
): HomePageView {
  const discussionView = discussionResponse
    ? mapDiscussionHubPageView(discussionResponse)
    : {
        channels: [],
        featuredThreads: []
      };

  return {
    feedItems: response.data.items,
    hotWorkflows: response.data.sections.hotWorkflows.map(mapWorkflowMiniCard),
    featuredCreators: response.data.sections.featuredCreators,
    discussionChannels: discussionView.channels,
    discussionHighlights: discussionView.featuredThreads.slice(0, 3),
    nextCursor: response.data.nextCursor ?? undefined,
    hasMore: response.data.hasMore
  };
}

export function mapVideoDetailPageView(
  detail: ApiEnvelope<ApiVideoDetail>,
  related: ApiEnvelope<ApiVideoSummary[]>,
  comments: ApiEnvelope<ApiComment[]>
): VideoDetailPageView {
  return {
    id: detail.data.id,
    title: detail.data.title,
    summary: detail.data.summary,
    tags: detail.data.tags,
    media: detail.data.media,
    author: {
      id: detail.data.author.id,
      displayName: detail.data.author.displayName,
      avatarUrl: detail.data.author.avatarUrl,
      followed: detail.data.viewerActions.followedAuthor
    },
    workflow: detail.data.workflow,
    stats: detail.data.stats,
    viewerActions: {
      liked: detail.data.viewerActions.liked,
      favorited: detail.data.viewerActions.favorited
    },
    relatedVideos: related.data.map(mapVideoMiniCard),
    comments: comments.data.map(mapComment)
  };
}

export function mapPromptDetailPageView(
  detail: ApiEnvelope<ApiPromptDetail>,
  related: ApiEnvelope<ApiPromptSummary[]>,
  comments?: ApiEnvelope<ApiComment[]>
): VideoDetailPageView {
  const primaryExample = detail.data.examples[0];
  const previewExample =
    detail.data.examples.find((item) => item.assetKind === "video") ??
    detail.data.examples.find((item) => item.assetKind === "image") ??
    primaryExample;

  return {
    id: detail.data.id,
    title: detail.data.title,
    summary: detail.data.summary,
    promptText: detail.data.promptTextZh ?? detail.data.promptText ?? detail.data.promptTextRaw,
    tags: detail.data.tagNames,
    media: {
      kind: detail.data.modality,
      coverUrl: detail.data.coverUrl ?? primaryExample?.url,
      posterUrl: detail.data.coverUrl ?? primaryExample?.url,
      previewUrl: previewExample?.url,
      sourceUrl: previewExample?.url,
      durationMs: previewExample?.durationMs
    },
    author: {
      id: detail.data.author.id,
      displayName: detail.data.author.displayName,
      avatarUrl: detail.data.author.avatarUrl,
      followed: detail.data.viewerActions.followedAuthor
    },
    stats: {
      playCount: detail.data.stats.exampleCount,
      likeCount: detail.data.stats.likeCount,
      favoriteCount: detail.data.stats.favoriteCount,
      commentCount: detail.data.stats.commentCount
    },
    viewerActions: {
      liked: detail.data.viewerActions.liked,
      favorited: detail.data.viewerActions.favorited
    },
    relatedVideos: related.data.map(mapPromptMiniCard),
    comments: comments?.data.map(mapComment) ?? []
  };
}

export function mapWorkflowDetailPageView(
  detail: ApiEnvelope<ApiWorkflowDetail>,
  related: ApiEnvelope<ApiVideoSummary[]>,
  comments: ApiEnvelope<ApiComment[]>
): WorkflowDetailPageView {
  return {
    id: detail.data.id,
    title: detail.data.title,
    summary: detail.data.summary,
    scenarioText: detail.data.scenarioText,
    tagNames: detail.data.tagNames,
    author: detail.data.author,
    permissions: detail.data.permissions,
    canvasBinding: detail.data.canvasBinding,
    stats: detail.data.stats,
    relatedVideos: related.data.map(mapVideoMiniCard),
    viewerActions: detail.data.viewerActions,
    comments: comments.data.map(mapComment)
  };
}

export function mapCreatorPageView(
  profile: ApiEnvelope<ApiCreatorProfile>,
  videos: ApiEnvelope<ApiCursorPage<ApiVideoSummary>>,
  workflows: ApiEnvelope<ApiCursorPage<ApiWorkflowSummary>>
): CreatorPageView {
  return {
    profile: {
      id: profile.data.id,
      displayName: profile.data.displayName,
      avatarUrl: profile.data.avatarUrl,
      bio: profile.data.bio,
      headline: profile.data.headline,
      followed: profile.data.viewerActions.followed
    },
    stats: profile.data.stats,
    videos: videos.data.items.map(mapVideoMiniCard),
    workflows: workflows.data.items.map(mapWorkflowMiniCard),
    nextVideoCursor: videos.data.nextCursor ?? undefined,
    nextWorkflowCursor: workflows.data.nextCursor ?? undefined
  };
}

export function mapPersonalCenterPageView(
  response: ApiEnvelope<ApiMeHubResponse>
): PersonalCenterPageView {
  return {
    profile: response.data.profile,
    likedItems: response.data.likedItems.map(mapPersonalCenterItem),
    favoritedItems: response.data.favoritedItems.map(mapPersonalCenterItem)
  };
}

export function mapPublishPageView(response: ApiEnvelope<ApiPublishBootstrap>): PublishPageView {
  return {
    currentUser: response.data.currentUser,
    activeTab: "video",
    videoDraft: response.data.videoDraft,
    workflowDraft: response.data.workflowDraft,
    postDraft: response.data.postDraft
  };
}

export function mapCanvasRuntimePageView(
  response: ApiEnvelope<ApiCanvasRuntime>
): CanvasRuntimePageView {
  return response.data;
}

export function mapDiscussionHubPageView(
  response: ApiEnvelope<ApiDiscussionHomeResponse>
): DiscussionHubPageView {
  return {
    channels: response.data.channels.map((channel) => ({
      slug: channel.slug,
      title: channel.title,
      description: channel.description,
      href: `/discussions?channel=${encodeURIComponent(channel.slug)}`,
      threadCount: channel.threadCount,
      threadCountLabel: `${channel.threadCount.toLocaleString("zh-CN")} threads`
    })),
    featuredThreads: response.data.featuredThreads.map((thread) => ({
      id: thread.id,
      slug: thread.slug,
      href: `/discussions/${thread.slug}`,
      title: thread.title,
      excerpt: thread.excerpt,
      channelTitle: thread.channelTitle,
      lastActivityLabel: formatDateLabel(thread.lastActivityAt, "No activity yet"),
      likeCount: toSafeCount(thread.likeCount),
      likeCountLabel: formatLikeCountLabel(toSafeCount(thread.likeCount)),
      favoriteCount: toSafeCount(thread.favoriteCount),
      favoriteCountLabel: formatFavoriteCountLabel(toSafeCount(thread.favoriteCount)),
      replyCountLabel: formatReplyCountLabel(thread.replyCount),
      viewerLiked: thread.viewerActions?.liked ?? false,
      viewerFavorited: thread.viewerActions?.favorited ?? false,
      tags: thread.tagNames,
      binding: mapDiscussionBinding(thread.binding)
    }))
  };
}

export function mapDiscussionDetailPageView(
  detail: ApiEnvelope<ApiDiscussionThreadDetail>,
  comments: ApiEnvelope<ApiComment[]>
): DiscussionDetailPageView {
  return {
    id: detail.data.id,
    slug: detail.data.slug,
    title: detail.data.title,
    content: detail.data.content,
    excerpt: detail.data.excerpt,
    channel: {
      slug: detail.data.channel.slug,
      title: detail.data.channel.title,
      href: `/discussions?channel=${encodeURIComponent(detail.data.channel.slug)}`
    },
    author: {
      id: detail.data.author.id,
      displayName: detail.data.author.displayName,
      avatarUrl: detail.data.author.avatarUrl,
      href: `/creators/${detail.data.author.id}`
    },
    stats: detail.data.stats,
    viewerActions: detail.data.viewerActions,
    likeCountLabel: formatLikeCountLabel(detail.data.stats.likeCount),
    favoriteCountLabel: formatFavoriteCountLabel(detail.data.stats.favoriteCount),
    replyCountLabel: formatReplyCountLabel(detail.data.stats.replyCount),
    publishedAtLabel: formatDateLabel(detail.data.publishedAt, "Pending publish time"),
    lastActivityLabel: formatDateLabel(detail.data.lastActivityAt, "No activity yet"),
    tagNames: detail.data.tagNames,
    binding: mapDiscussionBinding(detail.data.binding),
    comments: comments.data.map(mapComment)
  };
}
