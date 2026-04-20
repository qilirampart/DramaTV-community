export type HomePageView = {
  feedItems: HomeFeedCardView[];
  hotWorkflows: WorkflowMiniCardView[];
  featuredCreators: CreatorMiniCardView[];
  discussionChannels: DiscussionChannelView[];
  discussionHighlights: DiscussionThreadCardView[];
  nextCursor?: string;
  hasMore: boolean;
};

export type HomeFeedCardView = {
  itemType: "video" | "workflow" | "prompt";
  targetId: string;
  title: string;
  summary?: string;
  coverUrl: string;
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
  title: string;
  href?: string;
  coverUrl: string;
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
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  viewerLiked: boolean;
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
  comments: CommentView[];
};

export type WorkflowDetailPageView = {
  id: string;
  title: string;
  summary?: string;
  scenarioText?: string;
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
  comments: CommentView[];
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
  };
  videos: VideoMiniCardView[];
  workflows: WorkflowMiniCardView[];
  nextVideoCursor?: string;
  nextWorkflowCursor?: string;
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
    };
  };
  likedItems: PersonalCenterItemView[];
  favoritedItems: PersonalCenterItemView[];
};

export type PersonalCenterItemView = {
  itemType: "video" | "workflow" | "post";
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

export type PublishPageView = {
  currentUser: {
    id: string;
    displayName: string;
    roleCode: string;
  };
  activeTab: "video" | "post";
  videoDraft: VideoDraftView;
  workflowDraft: WorkflowDraftView;
  postDraft: PostDraftView;
};

export type VideoDraftView = {
  draftId: string;
  targetId?: string;
  title?: string;
  summary?: string;
  categoryCode?: string;
  tagNames: string[];
  workflowId?: string;
  visibility: "public" | "link" | "private";
  coverAssetId?: string;
  sourceAssetId?: string;
  statusCode: string;
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
  statusCode: string;
};

export type PostDraftView = {
  draftId: string;
  targetId?: string;
  title?: string;
  channelSlug: string;
  content?: string;
  tagNames: string[];
  statusCode: string;
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
  binding?: DiscussionBindingView;
  comments: CommentView[];
};
