import type {
  ApiComment,
  ApiCommentTargetType,
  ApiAuthSession,
  ApiCopyToCanvasResult,
  ApiCreatorProfile,
  ApiCursorPage,
  ApiDiscussionHomeResponse,
  ApiDiscussionThreadDetail,
  ApiDraftSubmitResult,
  ApiCanvasRuntime,
  ApiEnvelope,
  ApiFeedHomeResponse,
  ApiInteractionState,
  ApiInteractionTargetType,
  ApiMeHubResponse,
  ApiPostDraft,
  ApiPostDraftUpdateInput,
  ApiPromptDetail,
  ApiPromptSummary,
  ApiPublishBootstrap,
  ApiUploadAssetKind,
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
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: string;
  replyCount: number;
  likeCount: number;
  viewerActions?: {
    liked: boolean;
  };
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
    channelSlug: string;
    channelTitle: string;
    likeCount: number;
    favoriteCount: number;
    replyCount: number;
    lastActivityAt?: string;
    tagNames?: string[];
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
  binding?: BackendDiscussionBinding | null;
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
};

type BackendVideoDraft = {
  draftId: string;
  targetId?: string;
  title?: string;
  summary?: string;
  categoryCode?: string;
  tagNames?: string[];
  workflowId?: string;
  visibility: "public" | "link" | "private";
  coverAssetId?: string;
  sourceAssetId?: string;
  statusCode: string;
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
  statusCode: string;
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
};

type BackendVideoDraftSubmit = {
  videoId: string;
  publishStatus: string;
  taskIds: string[];
  submitMode: string;
};

type BackendWorkflowDraftSubmit = {
  workflowId: string;
  publishStatus: string;
  taskIds: string[];
  submitMode: string;
};

type BackendPostDraftSubmit = {
  targetId: string;
  slug?: string;
  publishStatus: string;
  taskIds: string[];
  submitMode: string;
};

type BackendUploadPolicy = {
  assetId: string;
  uploadUrl: string;
  headers?: Record<string, string>;
  expiresAt: string;
};

type BackendUploadedAsset = {
  assetId: string;
  statusCode: string;
  publicUrl: string;
  sizeBytes: number;
};

export type CommunityDataMode = "real";

type RequestBackendOptions = {
  treat404AsNull?: boolean;
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

const REQUEST_ID_HEADER_NAME = "X-Request-Id";
const AUTHORIZATION_HEADER_NAME = "Authorization";
const COMMUNITY_ACCESS_TOKEN_COOKIE = "dramatv_access_token";
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
  return error instanceof CommunityBackendUnavailableError;
}

export function isCommunityBackendCommandError(
  error: unknown
): error is CommunityBackendCommandError {
  return error instanceof CommunityBackendCommandError;
}

export function isCommunityAuthRequiredError(error: unknown): boolean {
  if (error instanceof CommunityBackendUnavailableError || error instanceof CommunityBackendCommandError) {
    return error.status === 401 || error.code === "AUTH_REQUIRED";
  }

  return false;
}

export function getCommunityErrorRequestId(error: unknown): string | undefined {
  if (error instanceof CommunityBackendUnavailableError || error instanceof CommunityBackendCommandError) {
    return error.requestId;
  }

  return undefined;
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
    author: {
      displayName: comment.author.displayName,
      avatarUrl: comment.author.avatarUrl
    },
    content: comment.content,
    createdAt: comment.createdAt,
    likeCount: comment.likeCount,
    replyCount: comment.replyCount,
    viewerActions: {
      liked: comment.viewerActions?.liked ?? false
    }
  };
}

async function requestBackend<T>(
  path: string,
  init?: RequestInit,
  options?: { treat404AsNull?: false }
): Promise<BackendEnvelope<T>>;
async function requestBackend<T>(
  path: string,
  init: RequestInit | undefined,
  options: { treat404AsNull: true }
): Promise<BackendEnvelope<T> | null>;
async function requestBackend<T>(
  path: string,
  init?: RequestInit,
  options?: RequestBackendOptions
): Promise<BackendEnvelope<T> | null> {
  assertRealModeBackend(path);
  const requestId = createRequestId();

  try {
    const headers = createBackendHeaders(init?.headers, requestId);
    await applyAuthorizationHeader(headers);

    const response = await fetch(absoluteUrl(path), {
      ...init,
      headers,
      cache: "no-store"
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

    throw new CommunityBackendUnavailableError(
      `Community backend is unavailable for ${path}.`,
      path,
      undefined,
      requestId
    );
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
  username: string;
  password: string;
}): Promise<ApiEnvelope<LoginPayload>> {
  const backend = await requestBackendCommand<LoginPayload>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      loginType: "password",
      username: input.username,
      password: input.password
    })
  });

  const cookieStore = await cookies();
  cookieStore.set(COMMUNITY_ACCESS_TOKEN_COOKIE, backend.data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: backend.data.expiresIn
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
  return ok(backend.data, backend.requestId);
}

export async function getHomeFeed(): Promise<ApiEnvelope<ApiFeedHomeResponse>> {
  const backend = await requestBackend<ApiFeedHomeResponse>("/api/feed/home");
  return ok(backend.data, backend.requestId);
}

export async function getDiscussionHome(
  channelSlug?: string
): Promise<ApiEnvelope<ApiDiscussionHomeResponse>> {
  const normalizedChannelSlug = channelSlug?.trim();
  const path =
    normalizedChannelSlug && normalizedChannelSlug.length > 0
      ? `/api/discussions/home?channel=${encodeURIComponent(normalizedChannelSlug)}`
      : "/api/discussions/home";
  const backend = await requestBackend<BackendDiscussionHomeResponse>(path);

  return ok(
    {
      channels: backend.data.channels,
      featuredThreads: backend.data.featuredThreads.map((thread) => ({
        ...thread,
        likeCount: thread.likeCount ?? 0,
        tagNames: thread.tagNames ?? [],
        favoriteCount: thread.favoriteCount ?? 0,
        viewerActions: {
          liked: thread.viewerActions?.liked ?? false,
          favorited: thread.viewerActions?.favorited ?? false
        }
      }))
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
      tagNames: backend.data.tagNames ?? [],
      stats: {
        likeCount: backend.data.stats?.likeCount ?? 0,
        favoriteCount: backend.data.stats?.favoriteCount ?? 0,
        replyCount: backend.data.stats?.replyCount ?? 0
      },
      viewerActions: {
        liked: backend.data.viewerActions?.liked ?? false,
        favorited: backend.data.viewerActions?.favorited ?? false
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

export async function getPrompts(input?: {
  modality?: "all" | "image" | "video";
  sort?: "latest" | "hot";
}): Promise<ApiEnvelope<ApiPromptSummary[]>> {
  const modality = input?.modality ?? "all";
  const sort = input?.sort ?? "latest";
  const backend = await requestBackend<ApiPromptSummary[]>(
    `/api/prompts?modality=${encodeURIComponent(modality)}&sort=${encodeURIComponent(sort)}`
  );

  return ok(backend.data, backend.requestId);
}

export async function getPromptDetail(id: string): Promise<ApiEnvelope<ApiPromptDetail | null>> {
  const backend = await requestBackend<ApiPromptDetail>(`/api/prompts/${id}`, undefined, {
    treat404AsNull: true
  });

  if (!backend) {
    return ok(null);
  }

  return ok(backend.data, backend.requestId);
}

export async function getRelatedPrompts(id: string): Promise<ApiEnvelope<ApiPromptSummary[]>> {
  const backend = await requestBackend<ApiPromptSummary[]>(`/api/prompts/${id}/related`);
  return ok(backend.data, backend.requestId);
}

export async function getWorkflowDetail(id: string): Promise<ApiEnvelope<ApiWorkflowDetail | null>> {
  const backend = await requestBackend<ApiWorkflowDetail>(`/api/workflows/${id}`, undefined, {
    treat404AsNull: true
  });

  if (!backend) {
    return ok(null);
  }

  return ok(backend.data, backend.requestId);
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

export async function getCreatorVideos(id: string): Promise<ApiEnvelope<ApiCursorPage<ApiVideoSummary>>> {
  const backend = await requestBackend<BackendCursorPage<ApiVideoSummary>>(`/api/creators/${id}/videos`);
  return ok(backend.data, backend.requestId);
}

export async function getCreatorWorkflows(id: string): Promise<ApiEnvelope<ApiCursorPage<ApiWorkflowSummary>>> {
  const backend = await requestBackend<BackendCursorPage<ApiWorkflowSummary>>(`/api/creators/${id}/workflows`);
  return ok(backend.data, backend.requestId);
}

export async function getMeHub(): Promise<ApiEnvelope<ApiMeHubResponse>> {
  const backend = await requestBackend<BackendMeHubResponse>("/api/me/hub");
  return ok(backend.data, backend.requestId);
}

export async function getComments(
  targetType: ApiCommentTargetType,
  targetId: string
): Promise<ApiEnvelope<ApiComment[]>> {
  const backend = await requestBackend<BackendCursorPage<BackendComment>>(
    `/api/comments?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`
  );

  return ok(backend.data.items.map(mapBackendComment), backend.requestId);
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
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<ApiEnvelope<ApiUploadPolicy>> {
  const backend = await requestBackendCommand<BackendUploadPolicy>(
    input.kind === "image" ? "/api/uploads/image-policy" : "/api/uploads/video-policy",
    {
      method: "POST",
      body: JSON.stringify({
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes
      })
    }
  );

  return ok(
    {
      assetId: backend.data.assetId,
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
      statusCode: backend.data.statusCode,
      publicUrl: backend.data.publicUrl,
      sizeBytes: backend.data.sizeBytes
    },
    backend.requestId
  );
}

export async function getPublishBootstrap(): Promise<ApiEnvelope<ApiPublishBootstrap>> {
  const currentUser = await requestBackend<{
    id: string;
    displayName: string;
    avatarUrl?: string;
    roleCode: string;
    creatorProfile?: {
      bio?: string;
      headline?: string;
    };
  }>("/api/auth/me");
  const [videoDraft, workflowDraft, postDraft] = await Promise.all([
    requestBackend<BackendVideoDraft>("/api/video-drafts", { method: "POST" }),
    requestBackend<BackendWorkflowDraft>("/api/workflow-drafts", { method: "POST" }),
    requestBackend<BackendPostDraft>("/api/post-drafts", { method: "POST" })
  ]);

  return ok(
    {
      currentUser: {
        id: currentUser.data.id,
        displayName: currentUser.data.displayName,
        roleCode: currentUser.data.roleCode
      },
      videoDraft: {
        draftId: videoDraft.data.draftId,
        targetId: videoDraft.data.targetId,
        title: videoDraft.data.title,
        summary: videoDraft.data.summary,
        categoryCode: videoDraft.data.categoryCode,
        tagNames: videoDraft.data.tagNames ?? [],
        workflowId: videoDraft.data.workflowId,
        visibility: videoDraft.data.visibility,
        coverAssetId: videoDraft.data.coverAssetId,
        sourceAssetId: videoDraft.data.sourceAssetId,
        statusCode: videoDraft.data.statusCode
      },
      workflowDraft: {
        draftId: workflowDraft.data.draftId,
        targetId: workflowDraft.data.targetId,
        title: workflowDraft.data.title,
        summary: workflowDraft.data.summary,
        scenarioText: workflowDraft.data.scenarioText,
        tagNames: workflowDraft.data.tagNames ?? [],
        allowCopy: workflowDraft.data.allowCopy,
        allowFork: workflowDraft.data.allowFork,
        visibility: workflowDraft.data.visibility,
        coverAssetId: workflowDraft.data.coverAssetId,
        statusCode: workflowDraft.data.statusCode
      },
      postDraft: {
        draftId: postDraft.data.draftId,
        targetId: postDraft.data.targetId,
        title: postDraft.data.title,
        channelSlug: postDraft.data.channelSlug,
        content: postDraft.data.content,
        tagNames: postDraft.data.tagNames ?? [],
        statusCode: postDraft.data.statusCode
      }
    },
    currentUser.requestId
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
      tagNames: backend.data.tagNames ?? [],
      workflowId: backend.data.workflowId,
      visibility: backend.data.visibility,
      coverAssetId: backend.data.coverAssetId,
      sourceAssetId: backend.data.sourceAssetId,
      statusCode: backend.data.statusCode
    },
    backend.requestId
  );
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
      tagNames: backend.data.tagNames ?? [],
      allowCopy: backend.data.allowCopy,
      allowFork: backend.data.allowFork,
      visibility: backend.data.visibility,
      coverAssetId: backend.data.coverAssetId,
      statusCode: backend.data.statusCode
    },
    backend.requestId
  );
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
      tagNames: backend.data.tagNames ?? [],
      statusCode: backend.data.statusCode
    },
    backend.requestId
  );
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
      publishStatus: backend.data.publishStatus,
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
      publishStatus: backend.data.publishStatus,
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
      publishStatus: backend.data.publishStatus,
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
