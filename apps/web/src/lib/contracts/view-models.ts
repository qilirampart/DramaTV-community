export type HomePageView = {
  feedItems: HomeFeedCardView[];
  homeLayoutSlots?: Array<{
    key: string;
    items: HomeFeedCardView[];
  }>;
  hotWorkflows: WorkflowMiniCardView[];
  featuredCreators: CreatorMiniCardView[];
  discussionChannels: DiscussionChannelView[];
  discussionHighlights: DiscussionThreadCardView[];
  nextCursor?: string;
  hasMore: boolean;
};

export type HomeFeedCardView = {
  contentKind: "prompt" | "workflow_work" | "post";
  promptModality?: "image" | "video";
  itemType: "video" | "workflow" | "prompt" | "post";
  targetId: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  workflow?: {
    id: string;
    title: string;
  };
  stats?: {
    playCount?: number;
    likeCount?: number;
  };
};

export type VideoMiniCardView = {
  id: string;
  itemType?: "video" | "prompt";
  promptModality?: "image" | "video";
  title: string;
  href?: string;
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  durationMs?: number;
  summary?: string;
  likeCount?: number;
  playCount?: number;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  workflow?: {
    id: string;
    title: string;
    processHref?: string;
  };
};

export type WorkflowMiniCardView = {
  id: string;
  title: string;
  coverUrl?: string;
  summary?: string;
  likeCount?: number;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  allowCopy: boolean;
  processHref?: string;
};

export type CreatorMiniCardView = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  headline?: string;
};

export type CommentView = {
  id: string;
  parentId?: string;
  replyTarget?: {
    commentId: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string;
  };
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  viewerLiked: boolean;
  viewerCanDelete: boolean;
  replies: CommentView[];
};

export type CommentPolicyView = {
  commentingEnabled: boolean;
  canManageComments: boolean;
};

export type CommentPageView = {
  items: CommentView[];
  nextCursor?: string;
  hasMore: boolean;
};

export type PromptAssetView = {
  id: string;
  role: "example" | "reference_image" | "reference_audio";
  assetKind: "image" | "video" | "audio";
  url?: string;
  fileName: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  badgeLabel: string;
  metaLabel?: string;
  previewImageUrl?: string;
};

export type VideoDetailPageView = {
  id: string;
  title: string;
  summary?: string;
  promptText?: string;
  tags: string[];
  media: {
    kind?: "video" | "image";
    coverUrl?: string;
    posterUrl?: string;
    previewUrl?: string;
    sourceUrl?: string;
    durationMs?: number;
  };
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    followed: boolean;
  };
  workflow?: {
    id: string;
    title: string;
    allowCopy: boolean;
  };
  promptAssets?: {
    primary?: PromptAssetView;
    referenceImages: PromptAssetView[];
    referenceAudios: PromptAssetView[];
    all: PromptAssetView[];
  };
  commentPolicy: CommentPolicyView;
  stats: {
    playCount: number;
    likeCount: number;
    favoriteCount: number;
    commentCount: number;
  };
  viewerActions: {
    liked: boolean;
    favorited: boolean;
  };
  relatedVideos: VideoMiniCardView[];
  comments: CommentPageView;
};

export type WorkflowDetailPageView = {
  id: string;
  title: string;
  summary?: string;
  scenarioText?: string;
  coverUrl?: string;
  exampleMedia?: {
    assetKind: "video" | "image";
    url?: string;
  };
  isReadonlyPreview?: boolean;
  tagNames: string[];
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  permissions: {
    allowCopy: boolean;
    allowFork: boolean;
  };
  commentPolicy: CommentPolicyView;
  canvasBinding?: {
    bindingType: "internal" | "external";
    openUrl?: string;
    canCopy: boolean;
  };
  stats: {
    likeCount: number;
    favoriteCount: number;
    commentCount: number;
    videoBindCount: number;
  };
  relatedVideos: VideoMiniCardView[];
  viewerActions: {
    liked: boolean;
    favorited: boolean;
  };
  comments: CommentPageView;
};

export type CreatorPageView = {
  profile: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    headline?: string;
    followed: boolean;
  };
  stats: {
    videoCount: number;
    workflowCount: number;
    followerCount: number;
    likeReceivedCount: number;
  };
  works: VideoMiniCardView[];
  workflows: WorkflowMiniCardView[];
  posts: DiscussionThreadCardView[];
  nextWorksCursor?: string;
  nextWorkflowCursor?: string;
  nextPostCursor?: string;
};

export type PersonalCenterPageView = {
  profile: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    roleCode: string;
    bio?: string;
    headline?: string;
    stats: {
      videoCount: number;
      workflowCount: number;
      followerCount: number;
      likeReceivedCount: number;
    };
  };
  publishedVideos: VideoMiniCardView[];
  publishedPrompts: VideoMiniCardView[];
  publishedWorkflows: WorkflowMiniCardView[];
  likedItems: PersonalCenterItemView[];
  favoritedItems: PersonalCenterItemView[];
  draftItems: PersonalCenterDraftItemView[];
  posts: DiscussionThreadCardView[];
};

export type PersonalCenterItemView = {
  itemType: "video" | "workflow" | "prompt" | "post";
  targetId: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  href: string;
  workflowTitle?: string;
  channelTitle?: string;
  actedAtLabel: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    href: string;
  };
};

export type PersonalCenterDraftItemView = {
  draftType: "video" | "workflow" | "post";
  draftId: string;
  targetId?: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  statusLabel: string;
  currentStepLabel: string;
  processingStatusLabel?: string;
  processingMessage?: string;
  updatedAtLabel: string;
  continueHref?: string;
  editable: boolean;
};

type PublishCurrentUserView = {
  currentUser: {
    id: string;
    displayName: string;
    roleCode: string;
  };
};

export type DraftLifecycleView = {
  draftStatus: "draft" | "submitted";
  moderationStatus: string;
  moderationMessage?: string;
  processingStatus: string;
  processingMessage?: string;
  mediaTask?: MediaTaskSummaryView;
  editable: boolean;
  submittedAt?: string;
};

export type MediaTaskSummaryView = {
  taskId: string;
  taskType: string;
  targetType: string;
  targetId: string;
  statusCode: string;
  retryCount: number;
  maxRetryCount: number;
  errorMessage?: string;
  submittedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  retryable: boolean;
};

export type PublishPageView = PublishCurrentUserView & {
  videoDraft: VideoDraftView;
  workflowDraft: WorkflowDraftView;
  availableWorkflows: WorkflowMiniCardView[];
};

export type DiscussionComposerPageView = PublishCurrentUserView & {
  postDraft: PostDraftView;
  channels: DiscussionChannelView[];
};

export type VideoDraftView = {
  draftId: string;
  targetId?: string;
  title?: string;
  summary?: string;
  categoryCode?: string;
  promptText?: string;
  modelCategory?: string;
  contentCategory?: string;
  compositionCategory?: string;
  tagNames: string[];
  workflowId?: string;
  visibility: "public" | "link" | "private";
  coverAssetId?: string;
  sourceAssetId?: string;
  referenceImageAssetIds: string[];
  referenceAudioAssetIds: string[];
  statusCode: string;
  lifecycle: DraftLifecycleView;
};

export type WorkflowDraftView = {
  draftId: string;
  targetId?: string;
  title?: string;
  summary?: string;
  scenarioText?: string;
  tagNames: string[];
  allowCopy: boolean;
  allowFork: boolean;
  visibility: "public" | "link" | "private";
  coverAssetId?: string;
  exampleAssetId?: string;
  statusCode: string;
  lifecycle: DraftLifecycleView;
};

export type PostDraftView = {
  draftId: string;
  targetId?: string;
  title?: string;
  channelSlug: string;
  content?: string;
  tagNames: string[];
  statusCode: string;
  lifecycle: DraftLifecycleView;
};

export type CanvasRuntimePageView = {
  runtime: {
    id: string;
    sourceWorkflowId?: string;
    canvasSpaceId: string;
    canvasWorkflowId: string;
    runtimeStatus: "creating" | "runtime_ready" | "reconciling" | "failed" | "archived";
    lightSnapshotVersion: number;
  };
  snapshot: CanvasLightSnapshotView;
  copyTask?: {
    id: string;
    statusCode: string;
    progressPercent: number;
  };
};

export type CanvasLightSnapshotView = {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  minimapBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  nodes: CanvasNodeShellView[];
  edges: CanvasEdgeView[];
};

export type CanvasNodeShellView = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  assetState: "empty" | "placeholder" | "ready" | "failed";
};

export type CanvasEdgeView = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
};

export type DiscussionChannelView = {
  slug: string;
  title: string;
  description: string;
  href: string;
  threadCount: number;
  threadCountLabel: string;
};

export type DiscussionBindingView = {
  targetType: "video" | "workflow";
  targetId: string;
  targetTitle?: string;
  href: string;
  label: string;
};

export type DiscussionThreadCardView = {
  id: string;
  slug: string;
  title: string;
  href: string;
  excerpt?: string;
  channelTitle: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    href: string;
  };
  publishedAtLabel: string;
  lastActivityLabel: string;
  likeCount: number;
  likeCountLabel: string;
  favoriteCount: number;
  favoriteCountLabel: string;
  replyCountLabel: string;
  viewerLiked: boolean;
  viewerFavorited: boolean;
  tags: string[];
  binding?: DiscussionBindingView;
};

export type DiscussionHubPageView = {
  channels: DiscussionChannelView[];
  featuredThreads: DiscussionThreadCardView[];
};

export type DiscussionDetailPageView = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  channel: {
    slug: string;
    title: string;
    href: string;
  };
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    href: string;
  };
  stats: {
    likeCount: number;
    favoriteCount: number;
    replyCount: number;
  };
  viewerActions: {
    liked: boolean;
    favorited: boolean;
  };
  likeCountLabel: string;
  favoriteCountLabel: string;
  replyCountLabel: string;
  publishedAtLabel: string;
  lastActivityLabel: string;
  tagNames: string[];
  commentPolicy: CommentPolicyView;
  binding?: DiscussionBindingView;
  relatedThreads: DiscussionThreadCardView[];
  comments: CommentPageView;
};
