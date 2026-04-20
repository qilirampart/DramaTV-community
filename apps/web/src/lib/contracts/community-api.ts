export type ApiEnvelope<T> = {
  code: "OK";
  message: "ok";
  data: T;
  requestId: string;
};

export type ApiAuthSession = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  roleCode: string;
  identityProvider: string;
  externalSubject?: string;
  creatorProfile: {
    bio?: string;
    headline?: string;
  };
};

export type ApiCursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ApiComment = {
  id: string;
  author: {
    displayName: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  viewerActions: {
    liked: boolean;
  };
};

export type ApiInteractionAction = "like" | "favorite" | "follow";
export type ApiCommentTargetType = "video" | "workflow" | "prompt" | "post";
export type ApiDiscussionBindingTargetType = "video" | "workflow";

export type ApiInteractionTargetType = "video" | "workflow" | "prompt" | "comment" | "post";

export type ApiInteractionState = {
  action: ApiInteractionAction;
  targetId: string;
  active: boolean;
};

export type ApiVideoSummary = {
  id: string;
  title: string;
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

export type ApiWorkflowSummary = {
  id: string;
  title: string;
  coverUrl?: string;
  summary?: string;
  likeCount?: number;
  allowCopy: boolean;
  processHref?: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
};

export type ApiFeedHomeResponse = {
  items: Array<{
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
  }>;
  nextCursor: string | null;
  hasMore: boolean;
  sections: {
    hotWorkflows: ApiWorkflowSummary[];
    featuredCreators: Array<{
      id: string;
      displayName: string;
      avatarUrl?: string;
      headline?: string;
    }>;
  };
};

export type ApiVideoDetail = {
  id: string;
  title: string;
  summary?: string;
  tags: string[];
  media: {
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
    followedAuthor: boolean;
  };
};

export type ApiPromptSummary = {
  id: string;
  title: string;
  summary?: string;
  modality: "image" | "video";
  coverUrl?: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  tagNames: string[];
  stats: {
    likeCount: number;
    favoriteCount: number;
    exampleCount: number;
  };
};

export type ApiPromptDetail = {
  id: string;
  title: string;
  summary?: string;
  modality: "image" | "video";
  promptText: string;
  promptTextZh?: string;
  promptTextEn?: string;
  promptTextRaw?: string;
  source: {
    sourcePlatform?: string;
    sourceCampaign?: string;
    sourceItemId?: string;
    sourceUrl?: string;
    modelName?: string;
  };
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  coverUrl?: string;
  tagNames: string[];
  examples: Array<{
    id: string;
    assetKind: "image" | "video";
    url: string;
    mimeType?: string;
    width?: number;
    height?: number;
    durationMs?: number;
  }>;
  stats: {
    likeCount: number;
    favoriteCount: number;
    commentCount: number;
    exampleCount: number;
  };
  viewerActions: {
    liked: boolean;
    favorited: boolean;
    followedAuthor: boolean;
  };
};

export type ApiWorkflowDetail = {
  id: string;
  title: string;
  summary?: string;
  scenarioText?: string;
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
  viewerActions: {
    liked: boolean;
    favorited: boolean;
  };
};

export type ApiCreatorProfile = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  headline?: string;
  stats: {
    videoCount: number;
    workflowCount: number;
    followerCount: number;
  };
  viewerActions: {
    followed: boolean;
  };
};

export type ApiMeHubResponse = {
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
  likedItems: ApiMeInteractionItem[];
  favoritedItems: ApiMeInteractionItem[];
};

export type ApiMeInteractionItem = {
  itemType: "video" | "workflow" | "post";
  targetId: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  href: string;
  workflowTitle?: string;
  channelTitle?: string;
  actedAt?: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
};

export type ApiDiscussionHomeResponse = {
  channels: Array<{
    slug: string;
    title: string;
    description: string;
    threadCount: number;
  }>;
  featuredThreads: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    channelSlug: string;
    channelTitle: string;
    likeCount: number;
    favoriteCount: number;
    replyCount: number;
    lastActivityAt?: string;
    tagNames: string[];
    viewerActions: {
      liked: boolean;
      favorited: boolean;
    };
    binding?: {
      targetType: ApiDiscussionBindingTargetType;
      targetId: string;
      targetTitle?: string;
    } | null;
  }>;
};

export type ApiDiscussionThreadDetail = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  channel: {
    slug: string;
    title: string;
  };
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  stats: {
    likeCount: number;
    favoriteCount: number;
    replyCount: number;
  };
  publishedAt?: string;
  lastActivityAt?: string;
  tagNames: string[];
  viewerActions: {
    liked: boolean;
    favorited: boolean;
  };
  binding?: {
    targetType: ApiDiscussionBindingTargetType;
    targetId: string;
    targetTitle?: string;
  } | null;
};

export type ApiPublishBootstrap = {
  currentUser: {
    id: string;
    displayName: string;
    roleCode: string;
  };
  videoDraft: {
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
  workflowDraft: {
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
  postDraft: {
    draftId: string;
    targetId?: string;
    title?: string;
    channelSlug: string;
    content?: string;
    tagNames: string[];
    statusCode: string;
  };
};

export type ApiVideoDraft = ApiPublishBootstrap["videoDraft"];
export type ApiWorkflowDraft = ApiPublishBootstrap["workflowDraft"];
export type ApiPostDraft = ApiPublishBootstrap["postDraft"];
export type ApiUploadAssetKind = "video" | "image";

export type ApiUploadPolicy = {
  assetId: string;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
};

export type ApiUploadedAsset = {
  assetId: string;
  statusCode: string;
  publicUrl: string;
  sizeBytes: number;
};

export type ApiVideoDraftUpdateInput = {
  title?: string;
  summary?: string;
  categoryCode?: string;
  tagNames: string[];
  workflowId?: string;
  visibility: "public" | "link" | "private";
  coverAssetId?: string;
  sourceAssetId?: string;
};

export type ApiWorkflowDraftUpdateInput = {
  title?: string;
  summary?: string;
  scenarioText?: string;
  tagNames: string[];
  allowCopy: boolean;
  allowFork: boolean;
  visibility: "public" | "link" | "private";
  coverAssetId?: string;
};

export type ApiPostDraftUpdateInput = {
  title?: string;
  channelSlug?: string;
  content?: string;
  tagNames: string[];
};

export type ApiDraftSubmitResult = {
  targetId: string;
  slug?: string;
  publishStatus: string;
  taskIds: string[];
  submitMode: string;
};

export type ApiCanvasRuntime = {
  runtime: {
    id: string;
    sourceWorkflowId?: string;
    canvasSpaceId: string;
    canvasWorkflowId: string;
    runtimeStatus: "creating" | "runtime_ready" | "reconciling" | "failed" | "archived";
    lightSnapshotVersion: number;
  };
  snapshot: {
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
    nodes: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
      title?: string;
      assetState: "empty" | "placeholder" | "ready" | "failed";
    }>;
    edges: Array<{
      id: string;
      sourceNodeId: string;
      targetNodeId: string;
    }>;
  };
  copyTask?: {
    id: string;
    statusCode: string;
    progressPercent: number;
  };
};

export type ApiCopyToCanvasResult = {
  copyTaskId: string;
  targetRuntimeId: string;
  targetCanvasWorkflowId: string;
  status: string;
  openUrl: string;
  lightSnapshotVersion: number;
};
