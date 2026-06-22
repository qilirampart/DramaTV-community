import type {
  CanvasRuntimePageView,
  CommentView,
  CreatorPageView,
  DiscussionComposerPageView,
  DiscussionThreadCardView,
  DiscussionBindingView,
  DiscussionDetailPageView,
  DiscussionHubPageView,
  HomePageView,
  PersonalCenterDraftItemView,
  PersonalCenterItemView,
  PersonalCenterPageView,
  PromptAssetView,
  PublishPageView,
  VideoDetailPageView,
  VideoMiniCardView,
  WorkflowDetailPageView,
  WorkflowMiniCardView
} from "@/lib/contracts/view-models";
import type {
  ApiCanvasRuntime,
  ApiComment,
  ApiCommentPage,
  ApiCreatorWorkSummary,
  ApiCreatorProfile,
  ApiCursorPage,
  ApiDiscussionHomeResponse,
  ApiDiscussionThreadDetail,
  ApiEnvelope,
  ApiFeedHomeResponse,
  ApiMeHubResponse,
  ApiMeDraftItem,
  ApiMeInteractionItem,
  ApiPromptDetail,
  ApiPromptSummary,
  ApiPostComposerBootstrap,
  ApiPublishPageBootstrap,
  ApiVideoDetail,
  ApiVideoSummary,
  ApiWorkflowDetail,
  ApiWorkflowSummary
} from "@/lib/contracts/community-api";
import { resolvePrefillVideoCardMediaFallback } from "@/lib/prefill/prefill-video-fallback";
import { normalizeAssetUrl } from "@/lib/presentation";

export function mapComment(comment: ApiComment): CommentView {
  return {
    id: comment.id,
    parentId: comment.parentId,
    replyTarget: comment.replyTarget
      ? {
          commentId: comment.replyTarget.commentId,
          authorId: comment.replyTarget.author.id,
          authorName: comment.replyTarget.author.displayName,
          authorAvatarUrl: normalizeAssetUrl(comment.replyTarget.author.avatarUrl)
        }
      : undefined,
    authorId: comment.author.id,
    authorName: comment.author.displayName,
    authorAvatarUrl: normalizeAssetUrl(comment.author.avatarUrl),
    content: comment.content,
    createdAt: comment.createdAt,
    likeCount: comment.likeCount,
    replyCount: comment.replyCount,
    viewerLiked: comment.viewerActions.liked,
    viewerCanDelete: comment.viewerActions.canDelete ?? false,
    replies: comment.replies.map(mapComment)
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

function formatDraftTypeLabel(value: ApiMeDraftItem["draftType"]): string {
  switch (value) {
    case "video":
      return "视频草稿";
    case "post":
      return "帖子草稿";
    case "workflow":
      return "工作流草稿";
    default:
      return "草稿";
  }
}

function formatDraftStepLabel(value?: string | null): string {
  switch (value) {
    case "compose":
      return "编辑中";
    case "submitted":
    case "published":
      return "已提交";
    default:
      return value?.trim() || "草稿";
  }
}

function formatDraftStatusLabel(value?: string | null): string {
  switch (value) {
    case "draft":
      return "草稿";
    case "submitted":
      return "已提交";
    case "published":
      return "已发布";
    case "in_review":
      return "待审核";
    default:
      return value?.trim() || "草稿";
  }
}

function formatProcessingStatusLabel(value?: string | null): string | undefined {
  switch (value) {
    case "queued":
      return "排队中";
    case "processing":
      return "处理中";
    case "failed":
      return "处理失败";
    case "succeeded":
      return "已处理";
    case "not_requested":
      return "未触发";
    case "not_submitted":
      return "未提交";
    case "not_applicable":
      return undefined;
    default:
      return value?.trim() || undefined;
  }
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

function formatAssetSizeLabel(sizeBytes?: number): string | undefined {
  if (typeof sizeBytes !== "number" || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return undefined;
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = sizeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded = value >= 10 || unitIndex === 0 ? Math.round(value) : Number(value.toFixed(1));
  return `${rounded}${units[unitIndex]}`;
}

function formatAssetDurationLabel(durationMs?: number): string | undefined {
  if (typeof durationMs !== "number" || !Number.isFinite(durationMs) || durationMs <= 0) {
    return undefined;
  }

  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${totalSeconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function resolvePromptAssetBadgeLabel(
  asset: ApiPromptDetail["examples"][number]
): PromptAssetView["badgeLabel"] {
  if (asset.role === "reference_image") {
    return "参考图";
  }

  if (asset.role === "reference_audio") {
    return "参考音频";
  }

  if (asset.assetKind === "video") {
    return "主视频";
  }

  if (asset.assetKind === "audio") {
    return "主音频";
  }

  return "主图片";
}

function normalizePromptAssetRole(
  asset: ApiPromptDetail["examples"][number]
): PromptAssetView["role"] {
  if (asset.role === "reference_image" || asset.role === "reference_audio" || asset.role === "example") {
    return asset.role;
  }

  return asset.assetKind === "audio" ? "reference_audio" : "example";
}

function buildPromptAssetMetaLabel(asset: ApiPromptDetail["examples"][number]): string | undefined {
  const parts: string[] = [];

  if (
    asset.assetKind === "image" &&
    typeof asset.width === "number" &&
    asset.width > 0 &&
    typeof asset.height === "number" &&
    asset.height > 0
  ) {
    parts.push(`${asset.width}×${asset.height}`);
  }

  const durationLabel = formatAssetDurationLabel(asset.durationMs);
  if (durationLabel) {
    parts.push(durationLabel);
  }

  const sizeLabel = formatAssetSizeLabel(asset.sizeBytes);
  if (sizeLabel) {
    parts.push(sizeLabel);
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function mapPromptAsset(
  asset: ApiPromptDetail["examples"][number],
  previewImageUrl?: string
): PromptAssetView {
  const normalizedRole = normalizePromptAssetRole(asset);

  return {
    id: asset.id,
    role: normalizedRole,
    assetKind: asset.assetKind,
    url: normalizeAssetUrl(asset.url),
    fileName: asset.fileName?.trim() || `asset-${asset.id.slice(0, 8)}`,
    sizeBytes: asset.sizeBytes,
    width: asset.width,
    height: asset.height,
    durationMs: asset.durationMs,
    badgeLabel: resolvePromptAssetBadgeLabel(asset),
    metaLabel: buildPromptAssetMetaLabel(asset),
    previewImageUrl
  };
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

export function mapVideoMiniCard(video: ApiVideoSummary): VideoMiniCardView {
  const normalizedCoverUrl = normalizeAssetUrl(video.coverUrl);
  const normalizedPosterUrl = normalizeAssetUrl(video.posterUrl);
  const normalizedPreviewUrl = normalizeAssetUrl(video.previewUrl);
  const normalizedSourceUrl = normalizeAssetUrl(video.sourceUrl);
  const fallbackMedia = resolvePrefillVideoCardMediaFallback({
    title: video.title,
    summary: video.summary,
    coverUrl: normalizedCoverUrl,
    posterUrl: normalizedPosterUrl,
    previewUrl: normalizedPreviewUrl,
    sourceUrl: normalizedSourceUrl
  });

  return {
    id: video.id,
    itemType: "video",
    title: video.title,
    href: `/videos/${video.id}`,
    coverUrl: normalizedCoverUrl ?? normalizedPosterUrl ?? fallbackMedia?.coverUrl ?? fallbackMedia?.posterUrl ?? "",
    posterUrl: normalizedPosterUrl ?? normalizedCoverUrl ?? fallbackMedia?.posterUrl ?? fallbackMedia?.coverUrl,
    previewUrl: normalizedPreviewUrl ?? fallbackMedia?.previewUrl,
    sourceUrl: normalizedSourceUrl ?? fallbackMedia?.sourceUrl,
    durationMs: video.durationMs,
    summary: video.summary,
    likeCount: video.likeCount,
    playCount: video.playCount,
    author: {
      ...video.author,
      avatarUrl: normalizeAssetUrl(video.author.avatarUrl)
    },
    workflow: video.workflow
  };
}

export function mapPromptMiniCard(prompt: ApiPromptSummary): VideoMiniCardView {
  return {
    id: prompt.id,
    itemType: "prompt",
    promptModality: prompt.modality,
    title: prompt.title,
    href: `/prompts/${prompt.id}`,
    coverUrl: normalizeAssetUrl(prompt.coverUrl) ?? normalizeAssetUrl(prompt.posterUrl) ?? "",
    posterUrl: normalizeAssetUrl(prompt.posterUrl) ?? normalizeAssetUrl(prompt.coverUrl),
    previewUrl: normalizeAssetUrl(prompt.previewUrl),
    sourceUrl: normalizeAssetUrl(prompt.sourceUrl),
    summary: prompt.summary,
    likeCount: prompt.stats.likeCount,
    playCount: prompt.stats.exampleCount,
    author: {
      ...prompt.author,
      avatarUrl: normalizeAssetUrl(prompt.author.avatarUrl)
    }
  };
}

export function mapCreatorWorkMiniCard(work: ApiCreatorWorkSummary): VideoMiniCardView {
  const normalizedCoverUrl = normalizeAssetUrl(work.coverUrl);
  const normalizedPosterUrl = normalizeAssetUrl(work.posterUrl);
  const normalizedPreviewUrl = normalizeAssetUrl(work.previewUrl);
  const normalizedSourceUrl = normalizeAssetUrl(work.sourceUrl);
  const fallbackMedia =
    work.itemType === "video"
      ? resolvePrefillVideoCardMediaFallback({
          title: work.title,
          summary: work.summary,
          coverUrl: normalizedCoverUrl,
          posterUrl: normalizedPosterUrl,
          previewUrl: normalizedPreviewUrl,
          sourceUrl: normalizedSourceUrl
        })
      : null;

  return {
    id: work.id,
    itemType: work.itemType,
    promptModality: work.itemType === "prompt" ? work.promptModality : undefined,
    title: work.title,
    href: work.itemType === "prompt" ? `/prompts/${work.id}` : `/videos/${work.id}`,
    coverUrl:
      normalizedCoverUrl ??
      normalizedPosterUrl ??
      fallbackMedia?.coverUrl ??
      fallbackMedia?.posterUrl ??
      "",
    posterUrl: normalizedPosterUrl ?? normalizedCoverUrl ?? fallbackMedia?.posterUrl ?? fallbackMedia?.coverUrl,
    previewUrl: normalizedPreviewUrl ?? fallbackMedia?.previewUrl,
    sourceUrl: normalizedSourceUrl ?? fallbackMedia?.sourceUrl,
    summary: work.summary,
    likeCount: work.likeCount,
    playCount: work.playCount,
    author: {
      ...work.author,
      avatarUrl: normalizeAssetUrl(work.author.avatarUrl)
    },
    workflow: work.workflow
  };
}

export function mapWorkflowMiniCard(workflow: ApiWorkflowSummary): WorkflowMiniCardView {
  return {
    id: workflow.id,
    title: workflow.title,
    coverUrl: normalizeAssetUrl(workflow.coverUrl),
    summary: workflow.summary,
    likeCount: workflow.likeCount,
    author: {
      ...workflow.author,
      avatarUrl: normalizeAssetUrl(workflow.author.avatarUrl)
    },
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
    coverUrl: normalizeAssetUrl(item.coverUrl),
    href: item.href,
    workflowTitle: item.workflowTitle,
    channelTitle: item.channelTitle,
    actedAtLabel: formatDateLabel(item.actedAt, "Recently updated"),
    author: {
      id: item.author.id,
      displayName: item.author.displayName,
      avatarUrl: normalizeAssetUrl(item.author.avatarUrl),
      href: `/creators/${item.author.id}`
    }
  };
}

function mapPersonalCenterDraftItem(item: ApiMeDraftItem): PersonalCenterDraftItemView {
  const effectiveDraftStatus = item.lifecycle?.draftStatus ?? item.statusCode;
  return {
    draftType: item.draftType,
    draftId: item.draftId,
    targetId: item.targetId,
    title: item.title?.trim() || formatDraftTypeLabel(item.draftType),
    summary: item.summary,
    coverUrl: normalizeAssetUrl(item.coverUrl),
    statusLabel: formatDraftStatusLabel(effectiveDraftStatus),
    currentStepLabel: formatDraftStepLabel(item.currentStep),
    processingStatusLabel: formatProcessingStatusLabel(item.lifecycle?.processingStatus),
    processingMessage: item.lifecycle?.processingMessage?.trim() || undefined,
    updatedAtLabel: formatDateLabel(item.updatedAt, "Recently saved"),
    continueHref: item.continueHref,
    editable: item.editable
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
    feedItems: response.data.items.map((item) => ({
      contentKind: item.contentKind,
      promptModality: item.promptModality,
      itemType: item.itemType,
      targetId: item.targetId,
      title: item.title,
      summary: item.summary,
      coverUrl: normalizeAssetUrl(item.coverUrl) ?? normalizeAssetUrl(item.posterUrl),
      posterUrl: normalizeAssetUrl(item.posterUrl) ?? normalizeAssetUrl(item.coverUrl),
      previewUrl: normalizeAssetUrl(item.previewUrl),
      sourceUrl: normalizeAssetUrl(item.sourceUrl),
      author: {
        id: item.author.id,
        displayName: item.author.displayName,
        avatarUrl: normalizeAssetUrl(item.author.avatarUrl)
      },
      workflow: item.workflow,
      stats: item.stats
    })),
    homeLayoutSlots: response.data.layout?.slots?.map((slot) => ({
      key: slot.key,
      items: slot.items.map((item) => ({
        contentKind: item.contentKind,
        promptModality: item.promptModality,
        itemType: item.itemType,
        targetId: item.targetId,
        title: item.title,
        summary: item.summary,
        coverUrl: normalizeAssetUrl(item.coverUrl) ?? normalizeAssetUrl(item.posterUrl),
        posterUrl: normalizeAssetUrl(item.posterUrl) ?? normalizeAssetUrl(item.coverUrl),
        previewUrl: normalizeAssetUrl(item.previewUrl),
        sourceUrl: normalizeAssetUrl(item.sourceUrl),
        author: {
          id: item.author.id,
          displayName: item.author.displayName,
          avatarUrl: normalizeAssetUrl(item.author.avatarUrl)
        },
        workflow: item.workflow,
        stats: item.stats
      }))
    })),
    hotWorkflows: response.data.sections.hotWorkflows.map(mapWorkflowMiniCard),
    featuredCreators: response.data.sections.featuredCreators.map((creator) => ({
      ...creator,
      avatarUrl: normalizeAssetUrl(creator.avatarUrl)
    })),
    discussionChannels: discussionView.channels,
    discussionHighlights: discussionView.featuredThreads.slice(0, 3),
    nextCursor: response.data.nextCursor ?? undefined,
    hasMore: response.data.hasMore
  };
}

export function mapVideoDetailPageView(
  detail: ApiEnvelope<ApiVideoDetail>,
  related: ApiEnvelope<ApiVideoSummary[]>,
  comments: ApiEnvelope<ApiCommentPage>
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
      avatarUrl: normalizeAssetUrl(detail.data.author.avatarUrl),
      followed: detail.data.viewerActions.followedAuthor
    },
    workflow: detail.data.workflow,
    commentPolicy: detail.data.commentPolicy,
    stats: detail.data.stats,
    viewerActions: {
      liked: detail.data.viewerActions.liked,
      favorited: detail.data.viewerActions.favorited
    },
    relatedVideos: related.data.map(mapVideoMiniCard),
    comments: {
      items: comments.data.items.map(mapComment),
      nextCursor: comments.data.nextCursor ?? undefined,
      hasMore: comments.data.hasMore
    }
  };
}

export function mapPromptDetailPageView(
  detail: ApiEnvelope<ApiPromptDetail>,
  related: ApiEnvelope<ApiPromptSummary[]>,
  comments?: ApiEnvelope<ApiCommentPage>
): VideoDetailPageView {
  const exampleAssets = detail.data.examples ?? [];
  const primaryImageExample =
    exampleAssets.find((item) => item.role === "example" && item.assetKind === "image") ??
    exampleAssets.find((item) => item.assetKind === "image");
  const primaryVideoExample =
    exampleAssets.find((item) => item.role === "example" && item.assetKind === "video") ??
    exampleAssets.find((item) => item.assetKind === "video");
  const normalizedCoverUrl =
    normalizeAssetUrl(detail.data.coverUrl) ??
    normalizeAssetUrl(detail.data.posterUrl) ??
    (primaryImageExample?.assetKind === "image" ? normalizeAssetUrl(primaryImageExample.url) : undefined);
  const normalizedPosterUrl =
    normalizeAssetUrl(detail.data.posterUrl) ??
    normalizeAssetUrl(detail.data.coverUrl) ??
    (primaryImageExample?.assetKind === "image" ? normalizeAssetUrl(primaryImageExample.url) : undefined);
  const promptAssets = exampleAssets.map((asset) =>
    mapPromptAsset(
      asset,
      asset.assetKind === "image"
        ? normalizeAssetUrl(asset.url)
        : asset.role === "example" && asset.assetKind === "video"
          ? normalizedCoverUrl ?? normalizedPosterUrl
          : undefined
    )
  );

  return {
    id: detail.data.id,
    title: detail.data.title,
    summary: detail.data.summary,
    promptText: detail.data.promptTextZh ?? detail.data.promptText ?? detail.data.promptTextRaw,
    tags: detail.data.tagNames,
    media: {
      kind: detail.data.modality,
      coverUrl: normalizedCoverUrl,
      posterUrl: normalizedPosterUrl,
      previewUrl: normalizeAssetUrl(detail.data.previewUrl),
      sourceUrl:
        detail.data.modality === "video"
          ? normalizeAssetUrl(detail.data.sourceUrl) ??
            (primaryVideoExample?.assetKind === "video" ? normalizeAssetUrl(primaryVideoExample.url) : undefined)
          : undefined,
      durationMs: primaryVideoExample?.durationMs
    },
    author: {
      id: detail.data.author.id,
      displayName: detail.data.author.displayName,
      avatarUrl: normalizeAssetUrl(detail.data.author.avatarUrl),
      followed: detail.data.viewerActions.followedAuthor
    },
    promptAssets: {
      primary: promptAssets.find((asset) => asset.role === "example"),
      referenceImages: promptAssets.filter((asset) => asset.role === "reference_image"),
      referenceAudios: promptAssets.filter((asset) => asset.role === "reference_audio"),
      all: promptAssets
    },
    stats: {
      playCount: detail.data.stats.exampleCount,
      likeCount: detail.data.stats.likeCount,
      favoriteCount: detail.data.stats.favoriteCount,
      commentCount: detail.data.stats.commentCount
    },
    commentPolicy: detail.data.commentPolicy,
    viewerActions: {
      liked: detail.data.viewerActions.liked,
      favorited: detail.data.viewerActions.favorited
    },
    relatedVideos: related.data.map(mapPromptMiniCard),
    comments: {
      items: comments?.data.items.map(mapComment) ?? [],
      nextCursor: comments?.data.nextCursor ?? undefined,
      hasMore: comments?.data.hasMore ?? false
    }
  };
}

export function mapWorkflowDetailPageView(
  detail: ApiEnvelope<ApiWorkflowDetail>,
  related: ApiEnvelope<ApiVideoSummary[]>,
  comments: ApiEnvelope<ApiCommentPage>
): WorkflowDetailPageView {
  return {
    id: detail.data.id,
    title: detail.data.title,
    summary: detail.data.summary,
    scenarioText: detail.data.scenarioText,
    coverUrl: normalizeAssetUrl(detail.data.coverUrl),
    exampleMedia: detail.data.exampleMedia
      ? {
          assetKind: detail.data.exampleMedia.assetKind,
          url: normalizeAssetUrl(detail.data.exampleMedia.url)
        }
      : undefined,
    tagNames: detail.data.tagNames,
    author: {
      ...detail.data.author,
      avatarUrl: normalizeAssetUrl(detail.data.author.avatarUrl)
    },
    permissions: detail.data.permissions,
    commentPolicy: detail.data.commentPolicy,
    canvasBinding: detail.data.canvasBinding,
    stats: detail.data.stats,
    relatedVideos: related.data.map(mapVideoMiniCard),
    viewerActions: detail.data.viewerActions,
    comments: {
      items: comments.data.items.map(mapComment),
      nextCursor: comments.data.nextCursor ?? undefined,
      hasMore: comments.data.hasMore
    }
  };
}

export function mapCreatorPageView(
  profile: ApiEnvelope<ApiCreatorProfile>,
  works: ApiEnvelope<ApiCursorPage<ApiCreatorWorkSummary>>,
  workflows: ApiEnvelope<ApiCursorPage<ApiWorkflowSummary>>,
  posts: ApiEnvelope<ApiCursorPage<ApiDiscussionHomeResponse["featuredThreads"][number]>>
): CreatorPageView {
  return {
    profile: {
      id: profile.data.id,
      displayName: profile.data.displayName,
      avatarUrl: normalizeAssetUrl(profile.data.avatarUrl),
      bio: profile.data.bio,
      headline: profile.data.headline,
      followed: profile.data.viewerActions.followed
    },
    stats: profile.data.stats,
    works: works.data.items.map(mapCreatorWorkMiniCard),
    workflows: workflows.data.items.map(mapWorkflowMiniCard),
    posts: posts.data.items.map(mapDiscussionThreadCard),
    nextWorksCursor: works.data.nextCursor ?? undefined,
    nextWorkflowCursor: workflows.data.nextCursor ?? undefined,
    nextPostCursor: posts.data.nextCursor ?? undefined
  };
}

export function mapPersonalCenterPageView(
  response: ApiEnvelope<ApiMeHubResponse>
): PersonalCenterPageView {
  return {
    profile: {
      ...response.data.profile,
      avatarUrl: normalizeAssetUrl(response.data.profile.avatarUrl)
    },
    publishedVideos: response.data.publishedContent.videos.map(mapVideoMiniCard),
    publishedPrompts: response.data.publishedContent.prompts.map(mapPromptMiniCard),
    publishedWorkflows: response.data.publishedContent.workflows.map(mapWorkflowMiniCard),
    likedItems: response.data.likedItems.map(mapPersonalCenterItem),
    favoritedItems: response.data.favoritedItems.map(mapPersonalCenterItem),
    draftItems: response.data.draftItems.map(mapPersonalCenterDraftItem),
    posts: mapDiscussionThreadCards(response.data.publishedContent.posts)
  };
}

export function mapPublishPageView(response: ApiEnvelope<ApiPublishPageBootstrap>): PublishPageView {
  return {
    currentUser: response.data.currentUser,
    videoDraft: response.data.videoDraft,
    workflowDraft: response.data.workflowDraft,
    availableWorkflows: response.data.availableWorkflows.map(mapWorkflowMiniCard)
  };
}

export function mapDiscussionComposerPageView(
  response: ApiEnvelope<ApiPostComposerBootstrap>
): DiscussionComposerPageView {
  return {
    currentUser: response.data.currentUser,
    postDraft: response.data.postDraft,
    channels: response.data.channels.map((channel) => ({
      slug: channel.slug,
      title: channel.title,
      description: channel.description,
      href: `/discussions?channel=${encodeURIComponent(channel.slug)}`,
      threadCount: channel.threadCount,
      threadCountLabel: `${channel.threadCount.toLocaleString("zh-CN")} threads`
    }))
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
    featuredThreads: response.data.featuredThreads.map(mapDiscussionThreadCard)
  };
}

function mapDiscussionThreadCard(thread: ApiDiscussionHomeResponse["featuredThreads"][number]) {
  return {
    id: thread.id,
    slug: thread.slug,
    href: `/discussions/${thread.slug}`,
    title: thread.title,
    excerpt: thread.excerpt,
    channelTitle: thread.channelTitle,
    author: {
      id: thread.author.id,
      displayName: thread.author.displayName,
      avatarUrl: normalizeAssetUrl(thread.author.avatarUrl),
      href: `/creators/${thread.author.id}?from=%2Fdiscussions`
    },
    publishedAtLabel: formatDateLabel(thread.publishedAt, "Pending publish time"),
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
  };
}

export function mapDiscussionThreadCards(
  items: ApiDiscussionHomeResponse["featuredThreads"]
): DiscussionThreadCardView[] {
  return items.map(mapDiscussionThreadCard);
}

export function mapDiscussionDetailPageView(
  detail: ApiEnvelope<ApiDiscussionThreadDetail>,
  comments: ApiEnvelope<ApiCommentPage>
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
      avatarUrl: normalizeAssetUrl(detail.data.author.avatarUrl),
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
    commentPolicy: detail.data.commentPolicy,
    binding: mapDiscussionBinding(detail.data.binding),
    relatedThreads: (detail.data.relatedThreads ?? []).map(mapDiscussionThreadCard),
    comments: {
      items: comments.data.items.map(mapComment),
      nextCursor: comments.data.nextCursor ?? undefined,
      hasMore: comments.data.hasMore
    }
  };
}
