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

export type ApiAuthProviderConfig = {
  primaryProvider: string;
  loginProviders: Array<{
    code: string;
    displayName: string;
    description?: string;
    enabled: boolean;
    formType: "password";
  }>;
};

export type ApiCursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ApiComment = {
  id: string;
  parentId?: string;
  replyTarget?: {
    commentId: string;
    author: {
      id: string;
      displayName: string;
      avatarUrl?: string;
    };
  };
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  statusCode?: string;
  viewerActions: {
    liked: boolean;
    canDelete?: boolean;
  };
  replies: ApiComment[];
};

export type ApiCommentPage = {
  items: ApiComment[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ApiCommentPolicy = {
  commentingEnabled: boolean;
  canManageComments: boolean;
};

export type ApiInteractionAction = "like" | "favorite" | "follow";
export type ApiCommentTargetType = "video" | "workflow" | "prompt" | "post";
export type ApiDiscussionBindingTargetType = "video" | "workflow";
export type ApiReportTargetType = "video" | "workflow" | "prompt" | "post";
export type ApiReportReasonCode =
  | "pornographic"
  | "political"
  | "spam"
  | "abuse"
  | "copyright"
  | "misleading"
  | "other";

export type ApiInteractionTargetType = "video" | "workflow" | "prompt" | "comment" | "post";

export type ApiInteractionState = {
  action: ApiInteractionAction;
  targetId: string;
  active: boolean;
};

export type ApiReportCreateInput = {
  targetType: ApiReportTargetType;
  targetId: string;
  reasonCode: ApiReportReasonCode;
  descriptionText?: string;
};

export type ApiReportResponse = {
  reportId: string;
  targetType: ApiReportTargetType;
  targetId: string;
  reasonCode: ApiReportReasonCode;
  statusCode: string;
};

export type ApiVideoSummary = {
  id: string;
  title: string;
  coverUrl: string;
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

export type ApiCreatorWorkSummary = {
  id: string;
  itemType: "video" | "prompt";
  title: string;
  summary?: string;
  promptModality?: "image" | "video";
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
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
    width?: number;
    height?: number;
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
  layout?: {
    slots: Array<{
      key: string;
      items: Array<{
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
        width?: number;
        height?: number;
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
    }>;
  };
};

export type ApiFeaturedArchiveResponse = {
  slots: Array<{
    key: string;
    items: Array<{
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
      width?: number;
      height?: number;
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
      targetSlug?: string;
      channelSlug?: string;
    }>;
  }>;
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
  commentPolicy: ApiCommentPolicy;
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
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  taxonomy: {
    modelCategory?: string;
    contentCategory?: string;
    compositionCategory?: string;
  };
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
  viewerActions?: {
    liked: boolean;
  };
};

export type ApiFeaturedPromptInventoryFilter = "all" | "video_prompt" | "image_prompt";

export type ApiFeaturedPromptFacetSummary = {
  modelCounts: Record<string, number>;
  contentCounts: Record<string, number>;
};

export type ApiFeaturedPromptInventorySummary = {
  counts: {
    all: number;
    videoPrompt: number;
    imagePrompt: number;
  };
  videoPromptFacets: ApiFeaturedPromptFacetSummary;
  imagePromptFacets: ApiFeaturedPromptFacetSummary;
};

export type ApiFeaturedPromptInventoryResponse = {
  summary: ApiFeaturedPromptInventorySummary;
  page: ApiCursorPage<ApiPromptSummary>;
};

export type ApiFeaturedInventoryFilter = "all" | "workflow" | "video_prompt" | "image_prompt" | "activity";
export type ApiFeaturedWorkflowInventoryType = "copyable" | "placeholder";

export type ApiFeaturedInventoryItem = {
  contentKind: "prompt" | "workflow_work" | "post";
  promptModality?: "image" | "video";
  itemType: "prompt" | "workflow" | "post";
  targetId: string;
  targetSlug?: string;
  channelSlug?: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  stats: {
    playCount?: number;
    likeCount?: number;
  };
  tagNames: string[];
  modelCategory?: string;
  contentCategory?: string;
  allowCopy?: boolean;
  viewerActions?: {
    liked: boolean;
  };
};

export type ApiFeaturedInventorySummary = {
  counts: {
    all: number;
    workflow: number;
    videoPrompt: number;
    imagePrompt: number;
    activity: number;
  };
  workflowFacets: {
    copyable: number;
    placeholder: number;
  };
  videoPromptFacets: ApiFeaturedPromptFacetSummary;
  imagePromptFacets: ApiFeaturedPromptFacetSummary;
};

export type ApiFeaturedInventoryResponse = {
  summary: ApiFeaturedInventorySummary;
  page: ApiCursorPage<ApiFeaturedInventoryItem>;
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
  taxonomy: {
    modelCategory?: string;
    contentCategory?: string;
    compositionCategory?: string;
  };
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
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  tagNames: string[];
  examples: Array<{
    id: string;
    role: "example" | "reference_image" | "reference_audio";
    assetKind: "image" | "video" | "audio";
    url: string;
    fileName: string;
    mimeType?: string;
    sizeBytes?: number;
    width?: number;
    height?: number;
    durationMs?: number;
  }>;
  commentPolicy: ApiCommentPolicy;
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
  coverUrl?: string;
  exampleMedia?: {
    assetKind: "video" | "image";
    url?: string;
  };
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
  commentPolicy: ApiCommentPolicy;
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
    likeReceivedCount: number;
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
      likeReceivedCount: number;
    };
  };
  likedItems: ApiMeInteractionItem[];
  favoritedItems: ApiMeInteractionItem[];
  draftItems: ApiMeDraftItem[];
  publishedContent: {
    videos: ApiVideoSummary[];
    prompts: ApiPromptSummary[];
    workflows: ApiWorkflowSummary[];
    posts: ApiDiscussionHomeResponse["featuredThreads"];
  };
};

export type ApiRecentNotificationsResponse = {
  items: ApiRecentNotificationItem[];
};

export type ApiRecentNotificationItem = {
  id: string;
  actionType: "like" | "favorite" | "comment" | "reply";
  actedAt: string;
  excerpt?: string;
  replyToActorName?: string;
  commentId?: string;
  actor: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  target: {
    id: string;
    type: "video" | "workflow" | "prompt" | "post";
    title: string;
    href: string;
  };
};

export type ApiMeProfileUpdateInput = {
  displayName: string;
  bio?: string;
  headline?: string;
  avatarAssetId?: string;
  avatarUrl?: string;
};

export type ApiMeProfile = ApiMeHubResponse["profile"];

export type ApiMeInteractionItem = {
  itemType: "video" | "workflow" | "prompt" | "post";
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

export type ApiMeDraftItem = {
  draftType: "video" | "workflow" | "post";
  draftId: string;
  targetId?: string;
  title?: string;
  summary?: string;
  coverUrl?: string;
  statusCode: string;
  currentStep: string;
  lifecycle: ApiDraftLifecycle;
  updatedAt?: string;
  continueHref?: string;
  editable: boolean;
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
    publishedAt?: string;
    channelSlug: string;
    channelTitle: string;
    likeCount: number;
    favoriteCount: number;
    replyCount: number;
    lastActivityAt?: string;
    tagNames: string[];
    author: {
      id: string;
      displayName: string;
      avatarUrl?: string;
    };
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
  commentPolicy: ApiCommentPolicy;
  binding?: {
    targetType: ApiDiscussionBindingTargetType;
    targetId: string;
    targetTitle?: string;
  } | null;
  relatedThreads: ApiDiscussionHomeResponse["featuredThreads"];
};

export type ApiPublishCurrentUser = {
  currentUser: {
    id: string;
    displayName: string;
    roleCode: string;
  };
};

export type ApiDraftLifecycle = {
  draftStatus: "draft" | "submitted";
  moderationStatus: string;
  moderationMessage?: string;
  processingStatus: string;
  processingMessage?: string;
  mediaTask?: ApiMediaTaskSummary;
  editable: boolean;
  submittedAt?: string;
};

export type ApiMediaTaskSummary = {
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

export type ApiMediaTask = {
  taskId: string;
  taskType: string;
  targetType: string;
  targetId: string;
  queueName: string;
  priorityLevel: number;
  statusCode: string;
  retryCount: number;
  maxRetryCount: number;
  errorMessage?: string;
  submittedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  retryable: boolean;
};

export type ApiPublishPageBootstrap = ApiPublishCurrentUser & {
  videoDraft: {
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
    lifecycle: ApiDraftLifecycle;
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
    exampleAssetId?: string;
    statusCode: string;
    lifecycle: ApiDraftLifecycle;
  };
  availableWorkflows: ApiWorkflowSummary[];
};

export type ApiPostComposerBootstrap = ApiPublishCurrentUser & {
  postDraft: {
    draftId: string;
    targetId?: string;
    title?: string;
    channelSlug: string;
    content?: string;
    tagNames: string[];
    statusCode: string;
    lifecycle: ApiDraftLifecycle;
  };
  channels: ApiDiscussionHomeResponse["channels"];
};

export type ApiVideoDraft = ApiPublishPageBootstrap["videoDraft"];
export type ApiWorkflowDraft = ApiPublishPageBootstrap["workflowDraft"];
export type ApiPostDraft = ApiPostComposerBootstrap["postDraft"];
export type ApiUploadAssetKind = "video" | "image" | "audio";
export type ApiUploadAssetRole = "source" | "cover" | "preview" | "poster" | "avatar" | "attachment";

export type ApiUploadPolicy = {
  assetId: string;
  assetKind: ApiUploadAssetKind;
  assetRole: ApiUploadAssetRole;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
};

export type ApiUploadedAsset = {
  assetId: string;
  assetKind: ApiUploadAssetKind;
  assetRole: ApiUploadAssetRole;
  statusCode: string;
  mediaPath: string;
  publicUrl: string;
  sizeBytes: number;
};

export type ApiVideoDraftUpdateInput = {
  title?: string;
  summary?: string;
  categoryCode?: string;
  promptText?: string;
  modelName?: string;
  modelCategory?: string;
  contentCategory?: string;
  compositionCategory?: string;
  sourcePlatform?: string;
  sourceCampaign?: string;
  tagNames: string[];
  workflowId?: string;
  visibility: "public" | "link" | "private";
  coverAssetId?: string;
  sourceAssetId?: string;
  referenceImageAssetIds: string[];
  referenceAudioAssetIds: string[];
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
  exampleAssetId?: string;
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
  draftStatus: string;
  contentStatus: string;
  publishStatus: string;
  lifecycle: ApiDraftLifecycle;
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
