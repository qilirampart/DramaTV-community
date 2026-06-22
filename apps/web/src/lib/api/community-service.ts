import type {
  ApiComment,
  ApiCommentPage,
  ApiCommentTargetType,
  ApiAuthProviderConfig,
  ApiAuthSession,
  ApiCopyToCanvasResult,
  ApiCreatorWorkSummary,
  ApiCreatorProfile,
  ApiCursorPage,
  ApiDraftLifecycle,
  ApiDiscussionHomeResponse,
  ApiDiscussionThreadDetail,
  ApiDraftSubmitResult,
  ApiCanvasRuntime,
  ApiEnvelope,
  ApiFeaturedArchiveResponse,
  ApiFeaturedInventoryFilter,
  ApiFeaturedInventoryItem,
  ApiFeaturedInventoryResponse,
  ApiFeaturedPromptInventoryFilter,
  ApiFeaturedPromptInventoryResponse,
  ApiFeaturedWorkflowInventoryType,
  ApiFeedHomeResponse,
  ApiInteractionState,
  ApiInteractionTargetType,
  ApiMeHubResponse,
  ApiMediaTask,
  ApiMediaTaskSummary,
  ApiMeProfile,
  ApiMeProfileUpdateInput,
  ApiPostComposerBootstrap,
  ApiRecentNotificationsResponse,
  ApiPostDraft,
  ApiPostDraftUpdateInput,
  ApiPromptDetail,
  ApiPromptSummary,
  ApiPublishPageBootstrap,
  ApiReportCreateInput,
  ApiReportResponse,
  ApiUploadAssetKind,
  ApiUploadAssetRole,
  ApiUploadPolicy,
  ApiUploadedAsset,
  ApiVideoDetail,
  ApiVideoDraft,
  ApiVideoDraftUpdateInput,
  ApiVideoSummary,
  ApiWorkflowDetail,
  ApiWorkflowDraft,
  ApiWorkflowDraftUpdateInput,
  ApiWorkflowSummary
} from "@/lib/contracts/community-api";
import { normalizeAssetUrl } from "@/lib/presentation";
import { cookies } from "next/headers";

type BackendEnvelope<T> = {
  code: string;
  message: string;
  data: T;
  requestId: string;
};

type BackendCursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

type BackendComment = {
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
  statusCode?: string;
  createdAt: string;
  replyCount: number;
  likeCount: number;
  viewerActions?: {
    liked: boolean;
    canDelete?: boolean;
  };
  replies?: BackendComment[];
};

type BackendCanvasRuntime = {
  runtimeId: string;
  sourceWorkflowId?: string;
  runtimeStatus: "creating" | "runtime_ready" | "reconciling" | "failed" | "archived";
  canvasSpaceId: string;
  canvasWorkflowId: string;
  lightSnapshotVersion: number;
  copyTask?: {
    id: string;
    statusCode: string;
    progressPercent: number;
  };
};

type BackendCanvasSnapshot = {
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

type BackendCanvasCopyTask = {
  statusCode: string;
  progressPercent: number;
  targetRuntimeId: string;
  warnings: string[];
  errorCode?: string | null;
  errorMessage?: string | null;
};

type BackendCopyToCanvasResponse = {
  copyTaskId: string;
  targetRuntimeId: string;
  targetCanvasWorkflowId: string;
  status: string;
  openUrl: string;
  lightSnapshotVersion: number;
};

type BackendDiscussionBinding = {
  targetType: "video" | "workflow";
  targetId: string;
  targetTitle?: string;
};

type BackendDiscussionHomeResponse = {
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
    tagNames?: string[];
    author: {
      id: string;
      displayName: string;
      avatarUrl?: string;
    };
    viewerActions?: {
      liked: boolean;
      favorited: boolean;
    };
    binding?: BackendDiscussionBinding | null;
  }>;
};

type BackendDiscussionThreadDetail = {
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
  stats?: {
    likeCount: number;
    favoriteCount: number;
    replyCount: number;
  };
  publishedAt?: string;
  lastActivityAt?: string;
  tagNames?: string[];
  viewerActions?: {
    liked: boolean;
    favorited: boolean;
  };
  commentPolicy?: {
    commentingEnabled: boolean;
    canManageComments: boolean;
  };
  binding?: BackendDiscussionBinding | null;
  relatedThreads?: BackendDiscussionHomeResponse["featuredThreads"];
};

type BackendMeHubResponse = {
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
  likedItems: Array<{
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
  }>;
  favoritedItems: Array<{
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
  }>;
  draftItems: Array<{
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
  }>;
  publishedContent: {
    videos: ApiVideoSummary[];
    prompts: ApiPromptSummary[];
    workflows: ApiWorkflowSummary[];
    posts: BackendDiscussionHomeResponse["featuredThreads"];
  };
};

type BackendRecentNotificationsResponse = {
  items: Array<{
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
  }>;
};

const HIDDEN_TAG_NAMES = new Set(["youmind"]);

function normalizeTagNames(tagNames?: string[] | null): string[] {
  return [
    ...new Set(
      (tagNames ?? [])
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter((tag) => tag && !HIDDEN_TAG_NAMES.has(tag.toLowerCase()))
    )
  ];
}

function normalizePromptSummary(prompt: ApiPromptSummary): ApiPromptSummary {
  return {
    ...prompt,
    taxonomy: {
      modelCategory: prompt.taxonomy?.modelCategory,
      contentCategory: prompt.taxonomy?.contentCategory,
      compositionCategory: prompt.taxonomy?.compositionCategory
    },
    tagNames: normalizeTagNames(prompt.tagNames),
    viewerActions: {
      liked: prompt.viewerActions?.liked ?? false
    }
  };
}

function normalizeCreatorWorkSummary(work: ApiCreatorWorkSummary): ApiCreatorWorkSummary {
  return {
    ...work,
    itemType: work.itemType === "prompt" ? "prompt" : "video",
    promptModality:
      work.promptModality === "image" ? "image" : work.promptModality === "video" ? "video" : undefined,
    coverUrl: normalizeAssetUrl(work.coverUrl),
    posterUrl: normalizeAssetUrl(work.posterUrl),
    previewUrl: normalizeAssetUrl(work.previewUrl),
    sourceUrl: normalizeAssetUrl(work.sourceUrl),
    author: {
      id: work.author.id,
      displayName: work.author.displayName,
      avatarUrl: normalizeAssetUrl(work.author.avatarUrl)
    }
  };
}

function normalizePromptDetail(prompt: ApiPromptDetail): ApiPromptDetail {
  return {
    ...prompt,
    taxonomy: {
      modelCategory: prompt.taxonomy?.modelCategory,
      contentCategory: prompt.taxonomy?.contentCategory,
      compositionCategory: prompt.taxonomy?.compositionCategory
    },
    tagNames: normalizeTagNames(prompt.tagNames),
    examples: Array.isArray(prompt.examples) ? prompt.examples : []
  };
}

function normalizeFeaturedInventoryItem(item: ApiFeaturedInventoryItem): ApiFeaturedInventoryItem {
  return {
    ...item,
    contentKind: item.contentKind === "workflow_work" || item.contentKind === "post" ? item.contentKind : "prompt",
    promptModality: item.promptModality === "video" ? "video" : item.promptModality === "image" ? "image" : undefined,
    itemType: item.itemType === "workflow" || item.itemType === "post" ? item.itemType : "prompt",
    coverUrl: normalizeAssetUrl(item.coverUrl),
    posterUrl: normalizeAssetUrl(item.posterUrl),
    previewUrl: normalizeAssetUrl(item.previewUrl),
    sourceUrl: normalizeAssetUrl(item.sourceUrl),
    width: typeof item.width === "number" && item.width > 0 ? item.width : undefined,
    height: typeof item.height === "number" && item.height > 0 ? item.height : undefined,
    author: {
      id: item.author.id,
      displayName: item.author.displayName,
      avatarUrl: normalizeAssetUrl(item.author.avatarUrl)
    },
    stats: {
      playCount: item.stats?.playCount,
      likeCount: item.stats?.likeCount ?? 0
    },
    tagNames: normalizeTagNames(item.tagNames),
    viewerActions: item.viewerActions
      ? {
          liked: item.viewerActions.liked ?? false
        }
      : undefined
  };
}

function normalizeFeaturedInventorySummary(
  summary?: ApiFeaturedInventoryResponse["summary"]
): ApiFeaturedInventoryResponse["summary"] {
  return {
    counts: {
      all: summary?.counts?.all ?? 0,
      workflow: summary?.counts?.workflow ?? 0,
      videoPrompt: summary?.counts?.videoPrompt ?? 0,
      imagePrompt: summary?.counts?.imagePrompt ?? 0,
      activity: summary?.counts?.activity ?? 0
    },
    workflowFacets: {
      copyable: summary?.workflowFacets?.copyable ?? 0,
      placeholder: summary?.workflowFacets?.placeholder ?? 0
    },
    videoPromptFacets: {
      modelCounts: summary?.videoPromptFacets?.modelCounts ?? {},
      contentCounts: summary?.videoPromptFacets?.contentCounts ?? {}
    },
    imagePromptFacets: {
      modelCounts: summary?.imagePromptFacets?.modelCounts ?? {},
      contentCounts: summary?.imagePromptFacets?.contentCounts ?? {}
    }
  };
}

function normalizeWorkflowDetail(workflow: ApiWorkflowDetail): ApiWorkflowDetail {
  return {
    ...workflow,
    tagNames: normalizeTagNames(workflow.tagNames)
  };
}

function normalizeDiscussionThreadCard(thread: BackendDiscussionHomeResponse["featuredThreads"][number]) {
  return {
    ...thread,
    likeCount: thread.likeCount ?? 0,
    tagNames: normalizeTagNames(thread.tagNames),
    favoriteCount: thread.favoriteCount ?? 0,
    author: {
      id: thread.author.id,
      displayName: thread.author.displayName,
      avatarUrl: normalizeAssetUrl(thread.author.avatarUrl)
    },
    viewerActions: {
      liked: thread.viewerActions?.liked ?? false,
      favorited: thread.viewerActions?.favorited ?? false
    }
  };
}

function normalizeDraftLifecycle(
  lifecycle?: ApiDraftLifecycle | null,
  fallbackStatusCode?: string | null
): ApiDraftLifecycle {
  const normalizedStatus = fallbackStatusCode?.trim();
  const fallbackDraftStatus = normalizedStatus === "draft" ? "draft" : "submitted";
  return {
    draftStatus: lifecycle?.draftStatus === "submitted" ? "submitted" : fallbackDraftStatus,
    moderationStatus: lifecycle?.moderationStatus?.trim() || "not_submitted",
    moderationMessage: lifecycle?.moderationMessage?.trim() || undefined,
    processingStatus: lifecycle?.processingStatus?.trim() || "not_applicable",
    processingMessage: lifecycle?.processingMessage?.trim() || undefined,
    mediaTask: normalizeMediaTaskSummary(lifecycle?.mediaTask),
    editable: lifecycle?.editable ?? fallbackDraftStatus === "draft",
    submittedAt: lifecycle?.submittedAt
  };
}

function normalizeMediaTaskSummary(
  mediaTask?: ApiMediaTaskSummary | BackendMediaTaskSummary | null
): ApiMediaTaskSummary | undefined {
  if (!mediaTask?.taskId?.trim()) {
    return undefined;
  }

  return {
    taskId: mediaTask.taskId,
    taskType: mediaTask.taskType,
    targetType: mediaTask.targetType,
    targetId: mediaTask.targetId,
    statusCode: mediaTask.statusCode,
    retryCount: mediaTask.retryCount ?? 0,
    maxRetryCount: mediaTask.maxRetryCount ?? 0,
    errorMessage: mediaTask.errorMessage?.trim() || undefined,
    submittedAt: mediaTask.submittedAt,
    startedAt: mediaTask.startedAt,
    finishedAt: mediaTask.finishedAt,
    retryable: mediaTask.retryable ?? false
  };
}

type BackendVideoDraft = {
  draftId: string;
  targetId?: string;
  title?: string;
  summary?: string;
  categoryCode?: string;
  promptText?: string;
  modelCategory?: string;
  contentCategory?: string;
  compositionCategory?: string;
  tagNames?: string[];
  workflowId?: string;
  visibility: "public" | "link" | "private";
  coverAssetId?: string;
  sourceAssetId?: string;
  referenceImageAssetIds?: string[];
  referenceAudioAssetIds?: string[];
  statusCode: string;
  lifecycle: ApiDraftLifecycle;
};

type BackendWorkflowDraft = {
  draftId: string;
  targetId?: string;
  title?: string;
  summary?: string;
  scenarioText?: string;
  tagNames?: string[];
  allowCopy: boolean;
  allowFork: boolean;
  visibility: "public" | "link" | "private";
  coverAssetId?: string;
  exampleAssetId?: string;
  statusCode: string;
  lifecycle: ApiDraftLifecycle;
};

type BackendPostDraft = {
  draftId: string;
  targetId?: string;
  title?: string;
  channelSlug: string;
  content?: string;
  tagNames?: string[];
  bindingTargetType?: "video" | "workflow";
  bindingTargetId?: string;
  statusCode: string;
  lifecycle: ApiDraftLifecycle;
};

type BackendVideoDraftSubmit = {
  videoId: string;
  draftStatus: string;
  contentStatus: string;
  publishStatus: string;
  lifecycle: ApiDraftLifecycle;
  taskIds: string[];
  submitMode: string;
};

type BackendWorkflowDraftSubmit = {
  workflowId: string;
  draftStatus: string;
  contentStatus: string;
  publishStatus: string;
  lifecycle: ApiDraftLifecycle;
  taskIds: string[];
  submitMode: string;
};

type BackendPostDraftSubmit = {
  targetId: string;
  slug?: string;
  draftStatus: string;
  contentStatus: string;
  publishStatus: string;
  lifecycle: ApiDraftLifecycle;
  taskIds: string[];
  submitMode: string;
};

type BackendUploadPolicy = {
  assetId: string;
  assetKind: ApiUploadAssetKind;
  assetRole: ApiUploadAssetRole;
  uploadUrl: string;
  headers?: Record<string, string>;
  expiresAt: string;
};

type BackendUploadedAsset = {
  assetId: string;
  assetKind: ApiUploadAssetKind;
  assetRole: ApiUploadAssetRole;
  statusCode: string;
  mediaPath: string;
  publicUrl: string;
  sizeBytes: number;
};

type BackendMediaTaskSummary = {
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

type BackendMediaTask = BackendMediaTaskSummary & {
  queueName: string;
  priorityLevel: number;
};

export type CommunityDataMode = "real";

type RequestBackendOptions = {
  treat404AsNull?: boolean;
  includeAuth?: boolean;
  timeoutMs?: number;
};

export type PublicReadOptions = {
  includeAuth?: boolean;
  timeoutMs?: number;
};

type LoginPayload = {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    displayName: string;
    roleCode: string;
  };
};

type BackendAuthSession = {
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

type BackendAuthProviderConfig = {
  primaryProvider: string;
  loginProviders: Array<{
    code: string;
    displayName: string;
    description?: string;
    enabled: boolean;
    formType: "password";
  }>;
};

const REQUEST_ID_HEADER_NAME = "X-Request-Id";
const AUTHORIZATION_HEADER_NAME = "Authorization";
const COMMUNITY_ACCESS_TOKEN_COOKIE = "dramatv_access_token";
const COMMUNITY_SESSION_COOKIE_MAX_AGE_SECONDS = 7200;
const API_BASE_URL =
  process.env.DRAMATV_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_DRAMATV_API_BASE_URL?.trim() ||
  "";

const COMMUNITY_DATA_MODE: CommunityDataMode = "real";

export class CommunityBackendUnavailableError extends Error {
  readonly path: string;
  readonly status?: number;
  readonly requestId?: string;
  readonly code?: string;

  constructor(message: string, path: string, status?: number, requestId?: string, code?: string) {
    super(message);
    this.name = "CommunityBackendUnavailableError";
    this.path = path;
    this.status = status;
    this.requestId = requestId;
    this.code = code;
  }
}

export class CommunityBackendCommandError extends Error {
  readonly path: string;
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor(message: string, path: string, status?: number, code?: string, requestId?: string) {
    super(message);
    this.name = "CommunityBackendCommandError";
    this.path = path;
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function getCommunityDataMode(): CommunityDataMode {
  return COMMUNITY_DATA_MODE;
}

export function getConfiguredApiBaseUrl(): string | null {
  return API_BASE_URL.length > 0 ? API_BASE_URL : null;
}

export function isCommunityBackendUnavailableError(
  error: unknown
): error is CommunityBackendUnavailableError {
  return (
    error instanceof CommunityBackendUnavailableError ||
    (error instanceof Error &&
      error.name === "CommunityBackendUnavailableError" &&
      typeof (error as { path?: unknown }).path === "string")
  );
}

export function isCommunityBackendCommandError(
  error: unknown
): error is CommunityBackendCommandError {
  return (
    error instanceof CommunityBackendCommandError ||
    (error instanceof Error &&
      error.name === "CommunityBackendCommandError" &&
      typeof (error as { path?: unknown }).path === "string")
  );
}

function readCommunityErrorMeta(error: unknown): {
  status?: number;
  code?: string;
  requestId?: string;
} | null {
  if (!isCommunityBackendUnavailableError(error) && !isCommunityBackendCommandError(error)) {
    return null;
  }

  return {
    status: typeof error.status === "number" ? error.status : undefined,
    code: typeof error.code === "string" ? error.code : undefined,
    requestId: typeof error.requestId === "string" ? error.requestId : undefined
  };
}

export function isCommunityAuthRequiredError(error: unknown): boolean {
  const meta = readCommunityErrorMeta(error);
  return meta?.status === 401 || meta?.status === 403 || meta?.code === "AUTH_REQUIRED" || meta?.code === "FORBIDDEN";
}

export function getCommunityErrorRequestId(error: unknown): string | undefined {
  return readCommunityErrorMeta(error)?.requestId;
}

export function appendCommunityRequestId(message: string, error: unknown): string {
  const requestId = getCommunityErrorRequestId(error);
  return requestId ? `${message} Request ID: ${requestId}` : message;
}

function assertRealModeBackend(path: string) {
  if (API_BASE_URL.length === 0) {
    throw new CommunityBackendUnavailableError(
      "DRAMATV_API_BASE_URL is required when community data mode is real.",
      path
    );
  }
}

function absoluteUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

function createRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `web-${globalThis.crypto.randomUUID()}`;
  }

  return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createRequestTimeoutController(timeoutMs?: number) {
  if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return null;
  }

  const controller = new AbortController();
  const handle = globalThis.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup() {
      globalThis.clearTimeout(handle);
    }
  };
}

function isAbortRequestError(error: unknown): error is Error {
  return error instanceof Error && error.name === "AbortError";
}

function createBackendHeaders(headersInit: HeadersInit | undefined, requestId: string) {
  const headers = new Headers(headersInit);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set(REQUEST_ID_HEADER_NAME, requestId);
  return headers;
}

async function applyAuthorizationHeader(headers: Headers) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COMMUNITY_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (accessToken) {
    headers.set(AUTHORIZATION_HEADER_NAME, `Bearer ${accessToken}`);
  }
}

function normalizeBackendEnvelope<T>(backend: BackendEnvelope<T>, fallbackRequestId: string): BackendEnvelope<T> {
  return {
    ...backend,
    requestId: backend.requestId?.trim() ? backend.requestId : fallbackRequestId
  };
}

async function parseBackendFailure(
  response: Response,
  fallbackRequestId: string,
  fallbackMessage: string
) {
  const responseRequestId = response.headers.get(REQUEST_ID_HEADER_NAME) ?? fallbackRequestId;
  let code = `HTTP_${response.status}`;
  let message = fallbackMessage;
  let requestId = responseRequestId;

  try {
    const failure = (await response.json()) as Partial<BackendEnvelope<unknown>>;
    if (typeof failure.code === "string" && failure.code.trim().length > 0) {
      code = failure.code;
    }
    if (typeof failure.message === "string" && failure.message.trim().length > 0) {
      message = failure.message;
    }
    if (typeof failure.requestId === "string" && failure.requestId.trim().length > 0) {
      requestId = failure.requestId;
    }
  } catch {
    // ignore JSON parse failures and keep the fallback payload
  }

  return {
    code,
    message,
    requestId
  };
}

function mapBackendComment(comment: BackendComment): ApiComment {
  return {
    id: comment.id,
    parentId: comment.parentId,
    replyTarget: comment.replyTarget
      ? {
          commentId: comment.replyTarget.commentId,
          author: {
            id: comment.replyTarget.author.id,
            displayName: comment.replyTarget.author.displayName,
            avatarUrl: comment.replyTarget.author.avatarUrl
          }
        }
      : undefined,
    author: {
      id: comment.author.id,
      displayName: comment.author.displayName,
      avatarUrl: comment.author.avatarUrl
    },
    content: comment.content,
    createdAt: comment.createdAt,
    likeCount: comment.likeCount,
    replyCount: comment.replyCount,
    statusCode: comment.statusCode,
    viewerActions: {
      liked: comment.viewerActions?.liked ?? false,
      canDelete: comment.viewerActions?.canDelete ?? false
    },
    replies: (comment.replies ?? []).map(mapBackendComment)
  };
}

async function requestBackend<T>(
  path: string,
  init?: RequestInit,
  options?: RequestBackendOptions & { treat404AsNull?: false }
): Promise<BackendEnvelope<T>>;
async function requestBackend<T>(
  path: string,
  init: RequestInit | undefined,
  options: RequestBackendOptions & { treat404AsNull: true }
): Promise<BackendEnvelope<T> | null>;
async function requestBackend<T>(
  path: string,
  init?: RequestInit,
  options?: RequestBackendOptions
): Promise<BackendEnvelope<T> | null> {
  assertRealModeBackend(path);
  const requestId = createRequestId();
  const timeoutController = createRequestTimeoutController(options?.timeoutMs);

  try {
    const headers = createBackendHeaders(init?.headers, requestId);
    if (options?.includeAuth !== false) {
      await applyAuthorizationHeader(headers);
    }

    const response = await fetch(absoluteUrl(path), {
      ...init,
      headers,
      cache: "no-store",
      signal: timeoutController?.signal
    });

    if (response.status === 404 && options?.treat404AsNull) {
      return null;
    }

    if (!response.ok) {
      const failure = await parseBackendFailure(
        response,
        requestId,
        `Community backend request failed with status ${response.status}.`
      );
      throw new CommunityBackendUnavailableError(failure.message, path, response.status, failure.requestId, failure.code);
    }

    return normalizeBackendEnvelope((await response.json()) as BackendEnvelope<T>, requestId);
  } catch (error) {
    if (error instanceof CommunityBackendUnavailableError) {
      throw error;
    }

    if (isAbortRequestError(error)) {
      throw new CommunityBackendUnavailableError(
        `Community backend request timed out for ${path}.`,
        path,
        undefined,
        requestId,
        "REQUEST_TIMEOUT"
      );
    }

    throw new CommunityBackendUnavailableError(
      `Community backend is unavailable for ${path}.`,
      path,
      undefined,
      requestId
    );
  } finally {
    timeoutController?.cleanup();
  }
}

async function requestBackendCommand<T>(
  path: string,
  init: RequestInit
): Promise<BackendEnvelope<T>> {
  assertRealModeBackend(path);
  const requestId = createRequestId();

  try {
    const headers = createBackendHeaders(init.headers, requestId);
    await applyAuthorizationHeader(headers);

    const response = await fetch(absoluteUrl(path), {
      ...init,
      headers,
      cache: "no-store"
    });

    if (!response.ok) {
      const failure = await parseBackendFailure(
        response,
        requestId,
        `Community backend command failed with status ${response.status}.`
      );
      throw new CommunityBackendCommandError(
        failure.message,
        path,
        response.status,
        failure.code,
        failure.requestId
      );
    }

    return normalizeBackendEnvelope((await response.json()) as BackendEnvelope<T>, requestId);
  } catch (error) {
    if (error instanceof CommunityBackendCommandError) {
      throw error;
    }

    throw new CommunityBackendCommandError(
      `Community backend command is unavailable for ${path}.`,
      path,
      undefined,
      undefined,
      requestId
    );
  }
}

function ok<T>(data: T, requestId = "backend-adapter"): ApiEnvelope<T> {
  return {
    code: "OK",
    message: "ok",
    data,
    requestId
  };
}

export async function loginCommunity(input: {
  loginType?: string;
  username: string;
  password: string;
}): Promise<ApiEnvelope<LoginPayload>> {
  const backend = await requestBackendCommand<LoginPayload>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      loginType: input.loginType?.trim() || "local_password",
      username: input.username,
      password: input.password
    })
  });

  const cookieStore = await cookies();
  cookieStore.set(COMMUNITY_ACCESS_TOKEN_COOKIE, backend.data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(backend.data.expiresIn, COMMUNITY_SESSION_COOKIE_MAX_AGE_SECONDS)
  });

  return ok(backend.data, backend.requestId);
}

export async function logoutCommunity(): Promise<void> {
  try {
    await requestBackendCommand<{ status: string }>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({})
    });
  } finally {
    const cookieStore = await cookies();
    cookieStore.delete(COMMUNITY_ACCESS_TOKEN_COOKIE);
  }
}

export async function getCurrentAuthSession(): Promise<ApiEnvelope<ApiAuthSession | null>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COMMUNITY_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (!accessToken) {
    return ok(null);
  }

  const backend = await requestBackend<BackendAuthSession>("/api/auth/me");
  return ok(
    {
      ...backend.data,
      avatarUrl: normalizeAssetUrl(backend.data.avatarUrl)
    },
    backend.requestId
  );
}

export async function getAuthProviderConfig(
  options?: PublicReadOptions
): Promise<ApiEnvelope<ApiAuthProviderConfig>> {
  const backend = await requestBackend<BackendAuthProviderConfig>("/api/auth/providers", undefined, options);
  return ok(backend.data, backend.requestId);
}

export async function getHomeFeed(options?: PublicReadOptions): Promise<ApiEnvelope<ApiFeedHomeResponse>> {
  const backend = await requestBackend<ApiFeedHomeResponse>("/api/feed/home", undefined, options);
  return ok(backend.data, backend.requestId);
}

export async function getFeaturedArchiveLayout(
  sort: "latest" | "hot" = "latest",
  options?: PublicReadOptions
): Promise<ApiEnvelope<ApiFeaturedArchiveResponse>> {
  const path = sort === "hot" ? "/api/feed/featured?sort=hot" : "/api/feed/featured";
  const backend = await requestBackend<ApiFeaturedArchiveResponse>(path, undefined, options);
  return ok(backend.data, backend.requestId);
}

export async function getLandingArchiveLayout(
  options?: PublicReadOptions
): Promise<ApiEnvelope<ApiFeaturedArchiveResponse>> {
  const backend = await requestBackend<ApiFeaturedArchiveResponse>("/api/feed/landing", undefined, options);
  return ok(backend.data, backend.requestId);
}

export async function getDiscussionHome(
  channelSlug?: string,
  options?: PublicReadOptions
): Promise<ApiEnvelope<ApiDiscussionHomeResponse>> {
  const normalizedChannelSlug = channelSlug?.trim();
  const path =
    normalizedChannelSlug && normalizedChannelSlug.length > 0
      ? `/api/discussions/home?channel=${encodeURIComponent(normalizedChannelSlug)}`
      : "/api/discussions/home";
  const backend = await requestBackend<BackendDiscussionHomeResponse>(path, undefined, options);

  return ok(
    {
      channels: backend.data.channels,
      featuredThreads: backend.data.featuredThreads.map(normalizeDiscussionThreadCard)
    },
    backend.requestId
  );
}

export async function getDiscussionThread(
  slug: string
): Promise<ApiEnvelope<ApiDiscussionThreadDetail | null>> {
  const backend = await requestBackend<BackendDiscussionThreadDetail>(
    `/api/discussions/threads/${encodeURIComponent(slug)}`,
    undefined,
    {
      treat404AsNull: true
    }
  );

  if (!backend) {
    return ok(null);
  }

  return ok(
    {
      ...backend.data,
      tagNames: normalizeTagNames(backend.data.tagNames),
      relatedThreads: (backend.data.relatedThreads ?? []).map(normalizeDiscussionThreadCard),
      stats: {
        likeCount: backend.data.stats?.likeCount ?? 0,
        favoriteCount: backend.data.stats?.favoriteCount ?? 0,
        replyCount: backend.data.stats?.replyCount ?? 0
      },
      viewerActions: {
        liked: backend.data.viewerActions?.liked ?? false,
        favorited: backend.data.viewerActions?.favorited ?? false
      },
      commentPolicy: backend.data.commentPolicy ?? {
        commentingEnabled: true,
        canManageComments: false
      }
    },
    backend.requestId
  );
}

export async function getVideoDetail(id: string): Promise<ApiEnvelope<ApiVideoDetail | null>> {
  const backend = await requestBackend<ApiVideoDetail>(`/api/videos/${id}`, undefined, {
    treat404AsNull: true
  });

  if (!backend) {
    return ok(null);
  }

  return ok(backend.data, backend.requestId);
}

export async function getRelatedVideos(id: string): Promise<ApiEnvelope<ApiVideoSummary[]>> {
  const backend = await requestBackend<ApiVideoSummary[]>(`/api/videos/${id}/related`);
  return ok(backend.data, backend.requestId);
}

export type FeaturedPromptInventoryQueryInput = {
  filter?: ApiFeaturedPromptInventoryFilter;
  sort?: "latest" | "hot";
  q?: string;
  modelCategory?: string | null;
  contentCategory?: string | null;
  limit?: number;
  cursor?: string | null;
};

export type FeaturedInventoryQueryInput = {
  filter?: ApiFeaturedInventoryFilter;
  sort?: "latest" | "hot";
  q?: string;
  modelCategory?: string | null;
  contentCategory?: string | null;
  workflowType?: ApiFeaturedWorkflowInventoryType | null;
  limit?: number;
  cursor?: string | null;
};

function buildFeaturedPromptInventoryQuery(input?: FeaturedPromptInventoryQueryInput) {
  const params = new URLSearchParams();
  const filter = input?.filter ?? "all";
  const sort = input?.sort ?? "latest";
  const q = input?.q?.trim();
  const modelCategory = input?.modelCategory?.trim();
  const contentCategory = input?.contentCategory?.trim();
  const cursor = input?.cursor?.trim();
  const limit =
    typeof input?.limit === "number" && Number.isFinite(input.limit) && input.limit > 0
      ? Math.trunc(input.limit)
      : undefined;

  if (filter !== "all") {
    params.set("filter", filter);
  }

  if (sort !== "latest") {
    params.set("sort", sort);
  }

  if (q) {
    params.set("q", q);
  }

  if (modelCategory) {
    params.set("modelCategory", modelCategory);
  }

  if (contentCategory) {
    params.set("contentCategory", contentCategory);
  }

  if (typeof limit === "number") {
    params.set("limit", String(limit));
  }

  if (cursor) {
    params.set("cursor", cursor);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

function buildFeaturedInventoryQuery(input?: FeaturedInventoryQueryInput) {
  const params = new URLSearchParams();
  const filter = input?.filter ?? "all";
  const sort = input?.sort ?? "latest";
  const q = input?.q?.trim();
  const modelCategory = input?.modelCategory?.trim();
  const contentCategory = input?.contentCategory?.trim();
  const workflowType = input?.workflowType?.trim();
  const cursor = input?.cursor?.trim();
  const limit =
    typeof input?.limit === "number" && Number.isFinite(input.limit) && input.limit > 0
      ? Math.trunc(input.limit)
      : undefined;

  if (filter !== "all") {
    params.set("filter", filter);
  }

  if (sort !== "latest") {
    params.set("sort", sort);
  }

  if (q) {
    params.set("q", q);
  }

  if (modelCategory) {
    params.set("modelCategory", modelCategory);
  }

  if (contentCategory) {
    params.set("contentCategory", contentCategory);
  }

  if (workflowType) {
    params.set("workflowType", workflowType);
  }

  if (typeof limit === "number") {
    params.set("limit", String(limit));
  }

  if (cursor) {
    params.set("cursor", cursor);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function getPrompts(input?: {
  modality?: "all" | "image" | "video";
  sort?: "latest" | "hot";
  limit?: number;
  offset?: number;
},
options?: PublicReadOptions): Promise<ApiEnvelope<ApiPromptSummary[]>> {
  const modality = input?.modality ?? "all";
  const sort = input?.sort ?? "latest";
  const limitQuery =
    typeof input?.limit === "number" && Number.isFinite(input.limit) && input.limit > 0
      ? `&limit=${encodeURIComponent(String(Math.trunc(input.limit)))}`
      : "";
  const offsetQuery =
    typeof input?.offset === "number" && Number.isFinite(input.offset) && input.offset >= 0
      ? `&offset=${encodeURIComponent(String(Math.trunc(input.offset)))}`
      : "";
  const backend = await requestBackend<ApiPromptSummary[]>(
    `/api/prompts?modality=${encodeURIComponent(modality)}&sort=${encodeURIComponent(sort)}${limitQuery}${offsetQuery}`,
    undefined,
    options
  );

  return ok(backend.data.map(normalizePromptSummary), backend.requestId);
}

export async function getFeaturedPromptInventoryPage(
  input?: FeaturedPromptInventoryQueryInput,
  options?: PublicReadOptions
): Promise<ApiEnvelope<ApiFeaturedPromptInventoryResponse>> {
  const backend = await requestBackend<ApiFeaturedPromptInventoryResponse>(
    `/api/prompts/featured-inventory${buildFeaturedPromptInventoryQuery(input)}`,
    undefined,
    options
  );

  return ok(
    {
      summary: {
        counts: {
          all: backend.data.summary?.counts?.all ?? 0,
          videoPrompt: backend.data.summary?.counts?.videoPrompt ?? 0,
          imagePrompt: backend.data.summary?.counts?.imagePrompt ?? 0
        },
        videoPromptFacets: {
          modelCounts: backend.data.summary?.videoPromptFacets?.modelCounts ?? {},
          contentCounts: backend.data.summary?.videoPromptFacets?.contentCounts ?? {}
        },
        imagePromptFacets: {
          modelCounts: backend.data.summary?.imagePromptFacets?.modelCounts ?? {},
          contentCounts: backend.data.summary?.imagePromptFacets?.contentCounts ?? {}
        }
      },
      page: {
        items: (backend.data.page?.items ?? []).map(normalizePromptSummary),
        nextCursor: backend.data.page?.nextCursor ?? null,
        hasMore: backend.data.page?.hasMore ?? false
      }
    },
    backend.requestId
  );
}

export async function getFeaturedInventoryPage(
  input?: FeaturedInventoryQueryInput,
  options?: PublicReadOptions
): Promise<ApiEnvelope<ApiFeaturedInventoryResponse>> {
  const backend = await requestBackend<ApiFeaturedInventoryResponse>(
    `/api/feed/featured-inventory${buildFeaturedInventoryQuery(input)}`,
    undefined,
    options
  );

  return ok(
    {
      summary: normalizeFeaturedInventorySummary(backend.data.summary),
      page: {
        items: (backend.data.page?.items ?? []).map(normalizeFeaturedInventoryItem),
        nextCursor: backend.data.page?.nextCursor ?? null,
        hasMore: backend.data.page?.hasMore ?? false
      }
    },
    backend.requestId
  );
}

export async function getAllPrompts(
  input?: {
    modality?: "all" | "image" | "video";
    sort?: "latest" | "hot";
    pageSize?: number;
  },
  options?: PublicReadOptions
): Promise<ApiEnvelope<ApiPromptSummary[]>> {
  const modality = input?.modality ?? "all";
  const sort = input?.sort ?? "latest";
  const pageSize =
    typeof input?.pageSize === "number" && Number.isFinite(input.pageSize) && input.pageSize > 0
      ? Math.min(Math.trunc(input.pageSize), 1000)
      : 1000;
  const items: ApiPromptSummary[] = [];
  let requestId = "backend-adapter";
  let offset = 0;

  for (let pageIndex = 0; pageIndex < 200; pageIndex += 1) {
    const page = await getPrompts({ modality, sort, limit: pageSize, offset }, options);

    if (pageIndex === 0) {
      requestId = page.requestId;
    }

    items.push(...page.data);

    if (page.data.length < pageSize) {
      return ok(items, requestId);
    }

    offset += page.data.length;
  }

  throw new Error(`[community-service] prompt pagination exceeded safety window for modality=${modality}`);
}

export async function getPromptDetail(id: string): Promise<ApiEnvelope<ApiPromptDetail | null>> {
  const backend = await requestBackend<ApiPromptDetail>(`/api/prompts/${id}`, undefined, {
    treat404AsNull: true
  });

  if (!backend) {
    return ok(null);
  }

  return ok(normalizePromptDetail(backend.data), backend.requestId);
}

export async function getRelatedPrompts(id: string): Promise<ApiEnvelope<ApiPromptSummary[]>> {
  const backend = await requestBackend<ApiPromptSummary[]>(`/api/prompts/${id}/related`);
  return ok(backend.data.map(normalizePromptSummary), backend.requestId);
}

export async function getWorkflowDetail(id: string): Promise<ApiEnvelope<ApiWorkflowDetail | null>> {
  const backend = await requestBackend<ApiWorkflowDetail>(`/api/workflows/${id}`, undefined, {
    treat404AsNull: true
  });

  if (!backend) {
    return ok(null);
  }

  return ok(normalizeWorkflowDetail(backend.data), backend.requestId);
}

export async function getWorkflowRelatedVideos(id: string): Promise<ApiEnvelope<ApiVideoSummary[]>> {
  const backend = await requestBackend<ApiVideoSummary[]>(`/api/workflows/${id}/related-videos`);
  return ok(backend.data, backend.requestId);
}

export async function getCreator(id: string): Promise<ApiEnvelope<ApiCreatorProfile | null>> {
  const backend = await requestBackend<ApiCreatorProfile>(`/api/creators/${id}`, undefined, {
    treat404AsNull: true
  });

  if (!backend) {
    return ok(null);
  }

  return ok(backend.data, backend.requestId);
}

export async function getCreatorWorks(
  id: string,
  cursor?: string
): Promise<ApiEnvelope<ApiCursorPage<ApiCreatorWorkSummary>>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const backend = await requestBackend<BackendCursorPage<ApiCreatorWorkSummary>>(`/api/creators/${id}/works${query}`);
  return ok(
    {
      items: (backend.data.items ?? []).map(normalizeCreatorWorkSummary),
      nextCursor: backend.data.nextCursor ?? null,
      hasMore: backend.data.hasMore
    },
    backend.requestId
  );
}

export async function getCreatorVideos(
  id: string,
  cursor?: string
): Promise<ApiEnvelope<ApiCursorPage<ApiVideoSummary>>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const backend = await requestBackend<BackendCursorPage<ApiVideoSummary>>(`/api/creators/${id}/videos${query}`);
  return ok(backend.data, backend.requestId);
}

export async function getCreatorPrompts(
  id: string,
  cursor?: string
): Promise<ApiEnvelope<ApiCursorPage<ApiPromptSummary>>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const backend = await requestBackend<BackendCursorPage<ApiPromptSummary>>(`/api/creators/${id}/prompts${query}`);
  return ok(
    {
      items: (backend.data.items ?? []).map(normalizePromptSummary),
      nextCursor: backend.data.nextCursor ?? null,
      hasMore: backend.data.hasMore
    },
    backend.requestId
  );
}

export async function getCreatorWorkflows(
  id: string,
  cursor?: string
): Promise<ApiEnvelope<ApiCursorPage<ApiWorkflowSummary>>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const backend = await requestBackend<BackendCursorPage<ApiWorkflowSummary>>(`/api/creators/${id}/workflows${query}`);
  return ok(backend.data, backend.requestId);
}

export async function getCreatorPosts(
  id: string,
  cursor?: string
): Promise<ApiEnvelope<ApiCursorPage<ApiDiscussionHomeResponse["featuredThreads"][number]>>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const backend = await requestBackend<BackendCursorPage<BackendDiscussionHomeResponse["featuredThreads"][number]>>(
    `/api/creators/${id}/posts${query}`
  );

  return ok(
    {
      ...backend.data,
      items: backend.data.items.map(normalizeDiscussionThreadCard)
    },
    backend.requestId
  );
}

export async function getMeHub(): Promise<ApiEnvelope<ApiMeHubResponse>> {
  const backend = await requestBackend<BackendMeHubResponse>("/api/me/hub");
  return ok(
    {
      ...backend.data,
      draftItems: backend.data.draftItems ?? [],
      publishedContent: {
        videos: backend.data.publishedContent?.videos ?? [],
        prompts: (backend.data.publishedContent?.prompts ?? []).map(normalizePromptSummary),
        workflows: backend.data.publishedContent?.workflows ?? [],
        posts: (backend.data.publishedContent?.posts ?? []).map(normalizeDiscussionThreadCard)
      }
    },
    backend.requestId
  );
}

export async function getRecentNotifications(): Promise<ApiEnvelope<ApiRecentNotificationsResponse>> {
  const backend = await requestBackend<BackendRecentNotificationsResponse>("/api/me/notifications/recent");
  return ok(
      {
        items: (backend.data.items ?? []).map((item) => ({
          ...item,
          replyToActorName: item.replyToActorName ?? undefined,
          commentId: item.commentId ?? undefined,
          actor: {
            ...item.actor,
            avatarUrl: normalizeAssetUrl(item.actor.avatarUrl)
          }
      }))
    },
    backend.requestId
  );
}

export async function updateMeProfile(
  input: ApiMeProfileUpdateInput
): Promise<ApiEnvelope<ApiMeProfile>> {
  const backend = await requestBackendCommand<ApiMeProfile>("/api/me/profile", {
    method: "PUT",
    body: JSON.stringify(input)
  });

  return ok(backend.data, backend.requestId);
}

export async function getComments(
  targetType: ApiCommentTargetType,
  targetId: string,
  cursor?: string
): Promise<ApiEnvelope<ApiCommentPage>> {
  const backend = await requestBackend<BackendCursorPage<BackendComment>>(
    `/api/comments?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}${
      cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""
    }`
  );

  return ok(
    {
      items: backend.data.items.map(mapBackendComment),
      nextCursor: backend.data.nextCursor ?? null,
      hasMore: backend.data.hasMore
    },
    backend.requestId
  );
}

export async function createComment(input: {
  targetType: ApiCommentTargetType;
  targetId: string;
  content: string;
  parentId?: string;
}): Promise<ApiEnvelope<ApiComment>> {
  const backend = await requestBackendCommand<BackendComment>("/api/comments", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return ok(mapBackendComment(backend.data), backend.requestId);
}

export async function createReport(input: ApiReportCreateInput): Promise<ApiEnvelope<ApiReportResponse>> {
  const backend = await requestBackendCommand<{
    reportId: string;
    targetType: ApiReportCreateInput["targetType"];
    targetId: string;
    reasonCode: ApiReportCreateInput["reasonCode"];
    statusCode: string;
  }>("/api/reports", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return ok(
    {
      reportId: backend.data.reportId,
      targetType: backend.data.targetType,
      targetId: backend.data.targetId,
      reasonCode: backend.data.reasonCode,
      statusCode: backend.data.statusCode
    },
    backend.requestId
  );
}

export async function updateCommentTargetSettings(input: {
  targetType: ApiCommentTargetType;
  targetId: string;
  commentsEnabled: boolean;
}) {
  const backend = await requestBackendCommand<{
    targetType: ApiCommentTargetType;
    targetId: string;
    commentsEnabled: boolean;
    canManageComments: boolean;
  }>("/api/comments/target-settings", {
    method: "PUT",
    body: JSON.stringify(input)
  });

  return ok(backend.data, backend.requestId);
}

export async function deleteComment(commentId: string) {
  const backend = await requestBackendCommand<ApiInteractionState>(`/api/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE"
  });

  return ok(backend.data, backend.requestId);
}

export async function setLike(input: {
  targetType: ApiInteractionTargetType;
  targetId: string;
  active: boolean;
}): Promise<ApiEnvelope<ApiInteractionState>> {
  const backend = await requestBackendCommand<ApiInteractionState>("/api/interactions/like", {
    method: input.active ? "POST" : "DELETE",
    body: JSON.stringify({
      targetType: input.targetType,
      targetId: input.targetId
    })
  });

  return ok(backend.data, backend.requestId);
}

export async function setFavorite(input: {
  targetType: "video" | "workflow" | "prompt" | "post";
  targetId: string;
  active: boolean;
}): Promise<ApiEnvelope<ApiInteractionState>> {
  const backend = await requestBackendCommand<ApiInteractionState>("/api/interactions/favorite", {
    method: input.active ? "POST" : "DELETE",
    body: JSON.stringify({
      targetType: input.targetType,
      targetId: input.targetId
    })
  });

  return ok(backend.data, backend.requestId);
}

export async function setFollow(input: {
  followeeId: string;
  active: boolean;
}): Promise<ApiEnvelope<ApiInteractionState>> {
  const backend = input.active
    ? await requestBackendCommand<ApiInteractionState>("/api/interactions/follow", {
        method: "POST",
        body: JSON.stringify({
          followeeId: input.followeeId
        })
      })
    : await requestBackendCommand<ApiInteractionState>(`/api/interactions/follow/${input.followeeId}`, {
        method: "DELETE"
      });

  return ok(backend.data, backend.requestId);
}

export async function createUploadPolicy(input: {
  kind: ApiUploadAssetKind;
  assetRole?: ApiUploadAssetRole;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<ApiEnvelope<ApiUploadPolicy>> {
  const policyPath =
    input.kind === "image"
      ? "/api/uploads/image-policy"
      : input.kind === "audio"
        ? "/api/uploads/audio-policy"
        : "/api/uploads/video-policy";
  const backend = await requestBackendCommand<BackendUploadPolicy>(
    policyPath,
    {
      method: "POST",
      body: JSON.stringify({
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        assetRole: input.assetRole
      })
    }
  );

  return ok(
    {
      assetId: backend.data.assetId,
      assetKind: backend.data.assetKind,
      assetRole: backend.data.assetRole,
      uploadUrl: backend.data.uploadUrl,
      headers: backend.data.headers ?? {},
      expiresAt: backend.data.expiresAt
    },
    backend.requestId
  );
}

export async function uploadBinaryAsset(input: {
  policy: ApiUploadPolicy;
  file: Blob;
  mimeType?: string;
}): Promise<ApiEnvelope<ApiUploadedAsset>> {
  const headers = new Headers(input.policy.headers);
  headers.set("Content-Type", input.mimeType?.trim() || "application/octet-stream");

  const backend = await requestBackendCommand<BackendUploadedAsset>(input.policy.uploadUrl, {
    method: "PUT",
    headers,
    body: input.file
  });

  return ok(
    {
      assetId: backend.data.assetId,
      assetKind: backend.data.assetKind,
      assetRole: backend.data.assetRole,
      statusCode: backend.data.statusCode,
      mediaPath: backend.data.mediaPath,
      publicUrl: backend.data.publicUrl,
      sizeBytes: backend.data.sizeBytes
    },
    backend.requestId
  );
}

export async function getMediaTask(taskId: string): Promise<ApiEnvelope<ApiMediaTask>> {
  const backend = await requestBackend<BackendMediaTask>(`/api/media-tasks/${encodeURIComponent(taskId)}`);

  return ok(
    {
      taskId: backend.data.taskId,
      taskType: backend.data.taskType,
      targetType: backend.data.targetType,
      targetId: backend.data.targetId,
      queueName: backend.data.queueName,
      priorityLevel: backend.data.priorityLevel,
      statusCode: backend.data.statusCode,
      retryCount: backend.data.retryCount ?? 0,
      maxRetryCount: backend.data.maxRetryCount ?? 0,
      errorMessage: backend.data.errorMessage?.trim() || undefined,
      submittedAt: backend.data.submittedAt,
      startedAt: backend.data.startedAt,
      finishedAt: backend.data.finishedAt,
      retryable: backend.data.retryable ?? false
    },
    backend.requestId
  );
}

export async function retryMediaTask(taskId: string): Promise<ApiEnvelope<ApiMediaTask>> {
  const backend = await requestBackendCommand<BackendMediaTask>(`/api/media-tasks/${encodeURIComponent(taskId)}/retry`, {
    method: "POST"
  });

  return ok(
    {
      taskId: backend.data.taskId,
      taskType: backend.data.taskType,
      targetType: backend.data.targetType,
      targetId: backend.data.targetId,
      queueName: backend.data.queueName,
      priorityLevel: backend.data.priorityLevel,
      statusCode: backend.data.statusCode,
      retryCount: backend.data.retryCount ?? 0,
      maxRetryCount: backend.data.maxRetryCount ?? 0,
      errorMessage: backend.data.errorMessage?.trim() || undefined,
      submittedAt: backend.data.submittedAt,
      startedAt: backend.data.startedAt,
      finishedAt: backend.data.finishedAt,
      retryable: backend.data.retryable ?? false
    },
    backend.requestId
  );
}

export async function getPublishPageBootstrap(input?: {
  videoDraftId?: string;
  workflowDraftId?: string;
}): Promise<ApiEnvelope<ApiPublishPageBootstrap>> {
  const params = new URLSearchParams();
  if (input?.videoDraftId) {
    params.set("videoDraftId", input.videoDraftId);
  }
  if (input?.workflowDraftId) {
    params.set("workflowDraftId", input.workflowDraftId);
  }
  const path = params.size > 0 ? `/api/publish/bootstrap?${params.toString()}` : "/api/publish/bootstrap";
  const backend = await requestBackend<{
    currentUser: {
      id: string;
      displayName: string;
      roleCode: string;
    };
    videoDraft: BackendVideoDraft;
    workflowDraft: BackendWorkflowDraft;
    availableWorkflows: ApiWorkflowSummary[];
  }>(path);

  return ok(
    {
      currentUser: backend.data.currentUser,
      videoDraft: {
        draftId: backend.data.videoDraft.draftId,
        targetId: backend.data.videoDraft.targetId,
        title: backend.data.videoDraft.title,
        summary: backend.data.videoDraft.summary,
        categoryCode: backend.data.videoDraft.categoryCode,
        promptText: backend.data.videoDraft.promptText,
        modelCategory: backend.data.videoDraft.modelCategory,
        contentCategory: backend.data.videoDraft.contentCategory,
        compositionCategory: backend.data.videoDraft.compositionCategory,
        tagNames: normalizeTagNames(backend.data.videoDraft.tagNames),
        workflowId: backend.data.videoDraft.workflowId,
        visibility: backend.data.videoDraft.visibility,
        coverAssetId: backend.data.videoDraft.coverAssetId,
        sourceAssetId: backend.data.videoDraft.sourceAssetId,
        referenceImageAssetIds: backend.data.videoDraft.referenceImageAssetIds ?? [],
        referenceAudioAssetIds: backend.data.videoDraft.referenceAudioAssetIds ?? [],
        statusCode: backend.data.videoDraft.statusCode,
        lifecycle: normalizeDraftLifecycle(backend.data.videoDraft.lifecycle, backend.data.videoDraft.statusCode)
      },
      workflowDraft: {
        draftId: backend.data.workflowDraft.draftId,
        targetId: backend.data.workflowDraft.targetId,
        title: backend.data.workflowDraft.title,
        summary: backend.data.workflowDraft.summary,
        scenarioText: backend.data.workflowDraft.scenarioText,
        tagNames: normalizeTagNames(backend.data.workflowDraft.tagNames),
        allowCopy: backend.data.workflowDraft.allowCopy,
        allowFork: backend.data.workflowDraft.allowFork,
        visibility: backend.data.workflowDraft.visibility,
        coverAssetId: backend.data.workflowDraft.coverAssetId,
        exampleAssetId: backend.data.workflowDraft.exampleAssetId,
        statusCode: backend.data.workflowDraft.statusCode,
        lifecycle: normalizeDraftLifecycle(backend.data.workflowDraft.lifecycle, backend.data.workflowDraft.statusCode)
      },
      availableWorkflows: backend.data.availableWorkflows
    },
    backend.requestId
  );
}

export async function getPostComposerBootstrap(input?: {
  postDraftId?: string;
}): Promise<ApiEnvelope<ApiPostComposerBootstrap>> {
  const params = new URLSearchParams();
  if (input?.postDraftId) {
    params.set("postDraftId", input.postDraftId);
  }
  const path = params.size > 0
    ? `/api/discussions/composer-bootstrap?${params.toString()}`
    : "/api/discussions/composer-bootstrap";
  const backend = await requestBackend<{
    currentUser: {
      id: string;
      displayName: string;
      roleCode: string;
    };
    postDraft: BackendPostDraft;
    channels: ApiDiscussionHomeResponse["channels"];
  }>(path);

  return ok(
    {
      currentUser: backend.data.currentUser,
      postDraft: {
        draftId: backend.data.postDraft.draftId,
        targetId: backend.data.postDraft.targetId,
        title: backend.data.postDraft.title,
        channelSlug: backend.data.postDraft.channelSlug,
        content: backend.data.postDraft.content,
        tagNames: normalizeTagNames(backend.data.postDraft.tagNames),
        statusCode: backend.data.postDraft.statusCode,
        lifecycle: normalizeDraftLifecycle(backend.data.postDraft.lifecycle, backend.data.postDraft.statusCode)
      },
      channels: backend.data.channels
    },
    backend.requestId
  );
}

export async function updateVideoDraft(
  draftId: string,
  input: ApiVideoDraftUpdateInput
): Promise<ApiEnvelope<ApiVideoDraft>> {
  const backend = await requestBackend<BackendVideoDraft>(`/api/video-drafts/${draftId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });

  return ok(
    {
      draftId: backend.data.draftId,
      targetId: backend.data.targetId,
      title: backend.data.title,
      summary: backend.data.summary,
      categoryCode: backend.data.categoryCode,
      promptText: backend.data.promptText,
      modelCategory: backend.data.modelCategory,
      contentCategory: backend.data.contentCategory,
      compositionCategory: backend.data.compositionCategory,
      tagNames: normalizeTagNames(backend.data.tagNames),
      workflowId: backend.data.workflowId,
      visibility: backend.data.visibility,
      coverAssetId: backend.data.coverAssetId,
      sourceAssetId: backend.data.sourceAssetId,
      referenceImageAssetIds: backend.data.referenceImageAssetIds ?? [],
      referenceAudioAssetIds: backend.data.referenceAudioAssetIds ?? [],
      statusCode: backend.data.statusCode,
      lifecycle: normalizeDraftLifecycle(backend.data.lifecycle, backend.data.statusCode)
    },
    backend.requestId
  );
}

export async function deleteVideoDraft(draftId: string): Promise<ApiEnvelope<null>> {
  const backend = await requestBackendCommand<null>(`/api/video-drafts/${draftId}`, {
    method: "DELETE"
  });

  return ok(null, backend.requestId);
}

export async function updateWorkflowDraft(
  draftId: string,
  input: ApiWorkflowDraftUpdateInput
): Promise<ApiEnvelope<ApiWorkflowDraft>> {
  const backend = await requestBackend<BackendWorkflowDraft>(`/api/workflow-drafts/${draftId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });

  return ok(
    {
      draftId: backend.data.draftId,
      targetId: backend.data.targetId,
      title: backend.data.title,
      summary: backend.data.summary,
      scenarioText: backend.data.scenarioText,
      tagNames: normalizeTagNames(backend.data.tagNames),
      allowCopy: backend.data.allowCopy,
      allowFork: backend.data.allowFork,
      visibility: backend.data.visibility,
      coverAssetId: backend.data.coverAssetId,
      exampleAssetId: backend.data.exampleAssetId,
      statusCode: backend.data.statusCode,
      lifecycle: normalizeDraftLifecycle(backend.data.lifecycle, backend.data.statusCode)
    },
    backend.requestId
  );
}

export async function deleteWorkflowDraft(draftId: string): Promise<ApiEnvelope<null>> {
  const backend = await requestBackendCommand<null>(`/api/workflow-drafts/${draftId}`, {
    method: "DELETE"
  });

  return ok(null, backend.requestId);
}

export async function updatePostDraft(
  draftId: string,
  input: ApiPostDraftUpdateInput
): Promise<ApiEnvelope<ApiPostDraft>> {
  const backend = await requestBackend<BackendPostDraft>(`/api/post-drafts/${draftId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });

  return ok(
    {
      draftId: backend.data.draftId,
      targetId: backend.data.targetId,
      title: backend.data.title,
      channelSlug: backend.data.channelSlug,
      content: backend.data.content,
      tagNames: normalizeTagNames(backend.data.tagNames),
      statusCode: backend.data.statusCode,
      lifecycle: normalizeDraftLifecycle(backend.data.lifecycle, backend.data.statusCode)
    },
    backend.requestId
  );
}

export async function deletePostDraft(draftId: string): Promise<ApiEnvelope<null>> {
  const backend = await requestBackendCommand<null>(`/api/post-drafts/${draftId}`, {
    method: "DELETE"
  });

  return ok(null, backend.requestId);
}

export async function submitVideoDraft(
  draftId: string,
  submitMode: string
): Promise<ApiEnvelope<ApiDraftSubmitResult>> {
  const backend = await requestBackend<BackendVideoDraftSubmit>(`/api/video-drafts/${draftId}/submit`, {
    method: "POST",
    body: JSON.stringify({ submitMode })
  });

  return ok(
    {
      targetId: backend.data.videoId,
      draftStatus: backend.data.draftStatus,
      contentStatus: backend.data.contentStatus,
      publishStatus: backend.data.publishStatus,
      lifecycle: normalizeDraftLifecycle(backend.data.lifecycle, backend.data.draftStatus ?? backend.data.publishStatus),
      taskIds: backend.data.taskIds,
      submitMode: backend.data.submitMode
    },
    backend.requestId
  );
}

export async function submitWorkflowDraft(
  draftId: string,
  submitMode: string
): Promise<ApiEnvelope<ApiDraftSubmitResult>> {
  const backend = await requestBackend<BackendWorkflowDraftSubmit>(`/api/workflow-drafts/${draftId}/submit`, {
    method: "POST",
    body: JSON.stringify({ submitMode })
  });

  return ok(
    {
      targetId: backend.data.workflowId,
      draftStatus: backend.data.draftStatus,
      contentStatus: backend.data.contentStatus,
      publishStatus: backend.data.publishStatus,
      lifecycle: normalizeDraftLifecycle(backend.data.lifecycle, backend.data.draftStatus ?? backend.data.publishStatus),
      taskIds: backend.data.taskIds,
      submitMode: backend.data.submitMode
    },
    backend.requestId
  );
}

export async function submitPostDraft(
  draftId: string,
  submitMode: string
): Promise<ApiEnvelope<ApiDraftSubmitResult>> {
  const backend = await requestBackend<BackendPostDraftSubmit>(`/api/post-drafts/${draftId}/submit`, {
    method: "POST",
    body: JSON.stringify({ submitMode })
  });

  return ok(
    {
      targetId: backend.data.targetId,
      slug: backend.data.slug,
      draftStatus: backend.data.draftStatus,
      contentStatus: backend.data.contentStatus,
      publishStatus: backend.data.publishStatus,
      lifecycle: normalizeDraftLifecycle(backend.data.lifecycle, backend.data.draftStatus ?? backend.data.publishStatus),
      taskIds: backend.data.taskIds,
      submitMode: backend.data.submitMode
    },
    backend.requestId
  );
}

export async function getCanvasRuntime(runtimeId: string): Promise<ApiEnvelope<ApiCanvasRuntime>> {
  const [runtime, snapshot] = await Promise.all([
    requestBackend<BackendCanvasRuntime>(`/api/canvas-runtimes/${runtimeId}`),
    requestBackend<BackendCanvasSnapshot>(`/api/canvas-runtimes/${runtimeId}/snapshot?mode=light`)
  ]);

  let copyTask = runtime.data.copyTask;
  if (copyTask) {
    const task = await requestBackend<BackendCanvasCopyTask>(`/api/canvas-copy-tasks/${copyTask.id}`);
    if (task) {
      copyTask = {
        id: copyTask.id,
        statusCode: task.data.statusCode,
        progressPercent: task.data.progressPercent
      };
    }
  }

  return ok(
    {
      runtime: {
        id: runtime.data.runtimeId,
        sourceWorkflowId: runtime.data.sourceWorkflowId,
        canvasSpaceId: runtime.data.canvasSpaceId,
        canvasWorkflowId: runtime.data.canvasWorkflowId,
        runtimeStatus: runtime.data.runtimeStatus,
        lightSnapshotVersion: runtime.data.lightSnapshotVersion
      },
      snapshot: snapshot.data,
      copyTask
    },
    runtime.requestId
  );
}

export async function copyWorkflowToCanvas(
  workflowId: string
): Promise<ApiEnvelope<ApiCopyToCanvasResult>> {
  const backend = await requestBackendCommand<BackendCopyToCanvasResponse>(
    `/api/workflows/${workflowId}/copy-to-canvas`,
    {
      method: "POST",
      body: JSON.stringify({
        targetSpaceId: "space-community-demo",
        copyMode: "reference_then_async_clone",
        openAfterCopy: true,
        idempotencyKey: `workflow-copy-${workflowId}`
      })
    }
  );

  return ok(backend.data, backend.requestId);
}
