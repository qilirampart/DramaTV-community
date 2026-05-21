import { cookies } from "next/headers";
import type { FeedOpsPageData } from "@/app/(dashboard)/feed-ops/shared/feed-ops-types";
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_ROLE_LABELS,
  clearAdminAccessToken,
  isAdminRole,
  setAdminAccessToken,
  type AdminSession
} from "./admin-auth";

type ApiEnvelope<T> = {
  code: string;
  message: string;
  data: T;
  requestId: string;
};

type BackendEnvelope<T> = ApiEnvelope<T>;

type BackendAdminAuthSession = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  roleCode: string;
};

type BackendAdminLoginPayload = {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    displayName: string;
    roleCode: string;
  };
};

type BackendAdminUserListResponse = {
  summary: {
    totalUsers: number;
    backendRoleUsers: number;
    nonActiveUsers: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  items: Array<{
    id: string;
    username: string;
    displayName: string;
    roleCode: string;
    statusCode: string;
    createdAt: string;
    lastLoginAt?: string | null;
    contentStats: {
      videoCount: number;
      workflowCount: number;
      promptCount: number;
      postCount: number;
    };
    engagementStats: {
      followerCount: number;
      likeReceivedCount: number;
    };
    moderationStats: {
      reportedTickets: number;
      assignedOpenTickets: number;
    };
  }>;
};

type BackendAdminUserDetailResponse = {
  id: string;
  username: string;
  displayName: string;
  roleCode: string;
  statusCode: string;
  identityProvider?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  headline?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  contentStats: {
    videoCount: number;
    workflowCount: number;
    promptCount: number;
    postCount: number;
  };
  engagementStats: {
    followerCount: number;
    likeReceivedCount: number;
  };
  moderationStats: {
    reportedTickets: number;
    assignedOpenTickets: number;
    openReportsAgainstUser: number;
  };
  governanceSummary: {
    adminRole: boolean;
    canLogin: boolean;
    canPublish: boolean;
    canManageAdmin: boolean;
    statusNote: string;
  };
  passwordGovernance: {
    hasLocalPassword: boolean;
    canInitializePassword: boolean;
    canResetPassword: boolean;
    passwordActionLabel: string;
    passwordHint: string;
  };
  recentContents: Array<{
    targetType: string;
    targetId: string;
    title: string;
    publishStatus: string;
    publishedAt?: string | null;
  }>;
};

type BackendAdminCommentListResponse = {
  summary: {
    todayComments: number;
    reportedComments: number;
    hiddenComments: number;
    closedTargets: number;
  };
  items: Array<{
    id: string;
    targetType: string;
    targetId: string;
    targetTitle: string;
    targetPromptModality?: string | null;
    targetCommentsEnabled: boolean;
    authorId: string;
    authorDisplayName: string;
    authorAvatarUrl?: string | null;
    contentText: string;
    parentId?: string | null;
    parentAuthorDisplayName?: string | null;
    parentContentText?: string | null;
    statusCode: string;
    createdAt: string;
    reportCount: number;
    openReportCount: number;
    latestReportReasonCode?: string | null;
    riskLevel: string;
  }>;
};

type BackendAdminModerationListResponse = {
  summary: {
    pendingItems: number;
    highRiskItems: number;
    processedToday: number;
    offlineItems: number;
  };
  items: Array<{
    targetType: string;
    targetId: string;
    title: string;
    authorId?: string | null;
    authorDisplayName: string;
    tagNames: string[];
    submittedAt: string;
    statusCode: string;
    riskLevel?: string | null;
    reviewerId?: string | null;
    reviewerDisplayName?: string | null;
    summaryText?: string | null;
    media: {
      coverUrl?: string | null;
      posterUrl?: string | null;
      previewUrl?: string | null;
      sourceUrl?: string | null;
    };
    modelTags: string[];
  }>;
};

type BackendAdminModerationItemDetailResponse = {
  targetType: string;
  targetId: string;
  title: string;
  authorId?: string | null;
  authorDisplayName: string;
  tagNames: string[];
  submittedAt: string;
  statusCode: string;
  riskLevel?: string | null;
  reviewerId?: string | null;
  reviewerDisplayName?: string | null;
  summaryText?: string | null;
  contentText?: string | null;
  media: {
    coverUrl?: string | null;
    posterUrl?: string | null;
    previewUrl?: string | null;
    sourceUrl?: string | null;
  };
  modelTags: string[];
  riskSignals: Array<{
    label: string;
    tone: string;
    detail: string;
  }>;
};

type BackendAdminResourceListResponse = {
  summary: {
    totalItems: number;
    publishedItems: number;
    pendingItems: number;
    offlineItems: number;
    rejectedItems: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  items: Array<{
    targetType: string;
    targetId: string;
    title: string;
    authorId?: string | null;
    authorDisplayName: string;
    tagNames: string[];
    publishedAt?: string | null;
    reviewedAt?: string | null;
    publishStatusCode: string;
    governanceStatusCode: string;
    latestAuditStatusCode?: string | null;
    riskLevel?: string | null;
    reviewerId?: string | null;
    reviewerDisplayName?: string | null;
    summaryText?: string | null;
    channelTitle?: string | null;
    bindingTargetType?: string | null;
    bindingTargetId?: string | null;
    media: {
      coverUrl?: string | null;
      posterUrl?: string | null;
      previewUrl?: string | null;
      sourceUrl?: string | null;
    };
    modelTags: string[];
  }>;
};

type BackendAdminResourceDetailResponse = {
  targetType: string;
  targetId: string;
  title: string;
  authorId?: string | null;
  authorDisplayName: string;
  tagNames: string[];
  publishedAt?: string | null;
  reviewedAt?: string | null;
  publishStatusCode: string;
  governanceStatusCode: string;
  latestAuditStatusCode?: string | null;
  riskLevel?: string | null;
  reviewerId?: string | null;
  reviewerDisplayName?: string | null;
  summaryText?: string | null;
  contentText?: string | null;
  channelTitle?: string | null;
  bindingTargetType?: string | null;
  bindingTargetId?: string | null;
  media: {
    coverUrl?: string | null;
    posterUrl?: string | null;
    previewUrl?: string | null;
    sourceUrl?: string | null;
  };
  modelTags: string[];
  riskSignals: Array<{
    label: string;
    tone: string;
    detail: string;
  }>;
};

type BackendAdminReportListResponse = {
  summary: {
    pendingTickets: number;
    highRiskTickets: number;
    newToday: number;
    resolvedTickets: number;
  };
  items: Array<{
    id: string;
    targetType: string;
    targetId: string;
    targetTitle: string;
    targetPromptModality?: string | null;
    targetAuthorId?: string | null;
    targetAuthorDisplayName: string;
    reporterId: string;
    reporterDisplayName: string;
    reasonCode: string;
    descriptionText?: string | null;
    statusCode: string;
    riskLevel: string;
    assigneeId?: string | null;
    assigneeDisplayName?: string | null;
    resultNote?: string | null;
    createdAt: string;
    updatedAt: string;
    targetStatusCode: string;
  }>;
};

type BackendAdminReportDetailResponse = {
  id: string;
  targetType: string;
  targetId: string;
  targetTitle: string;
  targetPromptModality?: string | null;
  targetAuthorId?: string | null;
  targetAuthorDisplayName: string;
  targetExcerptText?: string | null;
  targetCoverUrl?: string | null;
  targetPosterUrl?: string | null;
  targetPreviewUrl?: string | null;
  targetSourceUrl?: string | null;
  reporterId: string;
  reporterDisplayName: string;
  reasonCode: string;
  descriptionText?: string | null;
  statusCode: string;
  riskLevel: string;
  assigneeId?: string | null;
  assigneeDisplayName?: string | null;
  resultNote?: string | null;
  createdAt: string;
  updatedAt: string;
  targetStatusCode: string;
  canOfflineTarget: boolean;
  canHideComment: boolean;
  timelineEntries: Array<{
    happenedAt: string;
    actorDisplayName: string;
    actionText: string;
  }>;
};

type BackendAdminTaxonomyResponse = {
  summary: {
    totalPrompts: number;
    fullyCategorizedPrompts: number;
    needsAttentionPrompts: number;
    imageModelCategories: number;
    videoModelCategories: number;
    contentCategories: number;
    compositionCategories: number;
  };
  sections: Array<{
    key: string;
    label: string;
    description: string;
    promptCount: number;
    categoryCount: number;
    items: Array<{
      value: string;
      label: string;
      modalityScope: string;
      promptCount: number;
      authorCount: number;
      latestPublishedAt?: string | null;
      sampleTitles: string[];
      governance: {
        hasCustomConfig: boolean;
        statusCode: string;
        sortOrder: number;
        exposureFlags: string[];
        noteText?: string | null;
        updatedByDisplayName?: string | null;
        updatedAt?: string | null;
      };
    }>;
  }>;
};

type BackendAdminTaxonomyPromptListResponse = {
  summary: {
    totalItems: number;
    needsAttentionItems: number;
    imageItems: number;
    videoItems: number;
  };
  items: Array<{
    promptId: string;
    title: string;
    modality: string;
    authorId: string;
    authorDisplayName: string;
    modelCategory?: string | null;
    contentCategory?: string | null;
    compositionCategory?: string | null;
    needsAttention: boolean;
    publishedAt: string;
    tagNames: string[];
  }>;
};

type BackendAdminTaxonomyBulkApplyResponse = {
  modality: string;
  updatedCount: number;
  modelCategory: string;
  contentCategory: string;
  compositionCategory: string;
  promptIds: string[];
};

type BackendAdminFeedOpsPageResponse = FeedOpsPageData;

type BackendAdminMediaTaskListResponse = {
  summary: {
    totalTasks: number;
    failedTasks: number;
    retryableTasks: number;
    todayTasks: number;
    processingTasks: number;
  };
  items: Array<{
    taskId: string;
    taskType: string;
    targetType: string;
    targetId: string;
    targetTitle: string;
    targetSummary?: string | null;
    targetAuthorId?: string | null;
    targetAuthorDisplayName: string;
    queueName: string;
    priorityLevel: number;
    statusCode: string;
    retryCount: number;
    maxRetryCount: number;
    errorMessage?: string | null;
    submittedAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
    retryable: boolean;
  }>;
};

type BackendAdminMediaTaskDetailResponse = {
  taskId: string;
  taskType: string;
  targetType: string;
  targetId: string;
  targetTitle: string;
  targetSummary?: string | null;
  targetStatusCode: string;
  targetAuthorId?: string | null;
  targetAuthorDisplayName: string;
  queueName: string;
  priorityLevel: number;
  statusCode: string;
  retryCount: number;
  maxRetryCount: number;
  errorMessage?: string | null;
  submittedAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  retryable: boolean;
  payloadSummary: {
    draftId?: string | null;
    submitMode?: string | null;
    sourceAssetId?: string | null;
    coverAssetId?: string | null;
    workflowId?: string | null;
    desiredOutputs: string[];
  };
  resultJson?: string | null;
  callbackLogs: Array<{
    id: string;
    callbackType: string;
    sourceName: string;
    requestId?: string | null;
    verifyStatus: string;
    processStatus: string;
    rawPayloadJson?: string | null;
    createdAt: string;
  }>;
};

type BackendAdminAuditLogListResponse = {
  summary: {
    totalLogs: number;
    sensitiveLogs: number;
    reviewLogs: number;
    publishLogs: number;
  };
  items: Array<{
    id: string;
    occurredAt: string;
    operatorId?: string | null;
    operatorUsername: string;
    operatorDisplayName: string;
    operatorRoleCode: string;
    moduleCode: string;
    moduleLabel: string;
    actionCode: string;
    actionLabel: string;
    targetType?: string | null;
    targetId?: string | null;
    targetTitle?: string | null;
    resultStatus: string;
    riskLevel: string;
    noteText?: string | null;
    requestId?: string | null;
    traceId?: string | null;
    requestPath: string;
    requestMethod: string;
    responseStatus: number;
  }>;
};

type BackendAdminAuditLogDetailResponse = {
  id: string;
  occurredAt: string;
  operatorId?: string | null;
  operatorUsername: string;
  operatorDisplayName: string;
  operatorRoleCode: string;
  moduleCode: string;
  moduleLabel: string;
  actionCode: string;
  actionLabel: string;
  targetType?: string | null;
  targetId?: string | null;
  targetTitle?: string | null;
  resultStatus: string;
  riskLevel: string;
  noteText?: string | null;
  requestId?: string | null;
  traceId?: string | null;
  requestPath: string;
  requestMethod: string;
  responseStatus: number;
  metadataText?: string | null;
};

type BackendAdminDashboardOverviewResponse = {
  summary: {
    pendingModerationCount: number;
    pendingReportCount: number;
    failedMediaTaskCount: number;
    retryableMediaTaskCount: number;
    totalUsers: number;
    nonActiveUsers: number;
    backendRoleUsers: number;
  };
  moderationQueue: Array<{
    targetType: string;
    targetId: string;
    title: string;
    authorDisplayName: string;
    statusCode: string;
    riskLevel: string;
    submittedAt: string;
  }>;
  latestReports: Array<{
    reportId: string;
    targetType: string;
    targetId: string;
    targetTitle: string;
    reporterDisplayName: string;
    reasonCode: string;
    statusCode: string;
    riskLevel: string;
    createdAt: string;
  }>;
  failedMediaTasks: Array<{
    taskId: string;
    targetType: string;
    targetId: string;
    targetTitle: string;
    targetAuthorDisplayName: string;
    statusCode: string;
    errorMessage?: string | null;
    retryCount: number;
    maxRetryCount: number;
    createdAt: string;
  }>;
  userWatchItems: Array<{
    userId: string;
    username: string;
    displayName: string;
    roleCode: string;
    statusCode: string;
    openReportsAgainstUser: number;
    assignedOpenTickets: number;
    lastLoginAt?: string | null;
  }>;
};

export type AdminUserListData = {
  summary: BackendAdminUserListResponse["summary"];
  pagination: BackendAdminUserListResponse["pagination"];
  items: Array<{
    id: string;
    username: string;
    displayName: string;
    roleCode: string;
    roleLabel: string;
    statusCode: string;
    createdAt: string;
    lastLoginAt: string | null;
    contentSummary: string;
    publishedCount: number;
    followerCount: number;
    likeReceivedCount: number;
    moderationSummary: string;
  }>;
};
export type AdminUserDetailData = BackendAdminUserDetailResponse;

export type AdminCommentListData = BackendAdminCommentListResponse;
export type AdminModerationListData = BackendAdminModerationListResponse;
export type AdminModerationItemDetailData = BackendAdminModerationItemDetailResponse;
export type AdminResourceListData = BackendAdminResourceListResponse;
export type AdminResourceDetailData = BackendAdminResourceDetailResponse;
export type AdminReportListData = BackendAdminReportListResponse;
export type AdminReportDetailData = BackendAdminReportDetailResponse;
export type AdminTaxonomyData = BackendAdminTaxonomyResponse;
export type AdminTaxonomyItemData = BackendAdminTaxonomyResponse["sections"][number]["items"][number];
export type AdminTaxonomyPromptListData = BackendAdminTaxonomyPromptListResponse;
export type AdminTaxonomyBulkApplyData = BackendAdminTaxonomyBulkApplyResponse;
export type AdminFeedOpsPageData = FeedOpsPageData;
export type AdminMediaTaskListData = BackendAdminMediaTaskListResponse;
export type AdminMediaTaskDetailData = BackendAdminMediaTaskDetailResponse;
export type AdminAuditLogListData = BackendAdminAuditLogListResponse;
export type AdminAuditLogDetailData = BackendAdminAuditLogDetailResponse;
export type AdminDashboardOverviewData = BackendAdminDashboardOverviewResponse;

type AdminCommentActionData = {
  action: string;
  targetId: string;
  active: boolean;
};

type AdminCommentListQuery = {
  q?: string;
  status?: string;
  targetType?: string;
  reportedOnly?: boolean | string;
};

type AdminUserGovernanceUpdateData = {
  userId: string;
  roleCode: string;
  statusCode: string;
  adminRole: boolean;
  canLogin: boolean;
  canPublish: boolean;
};

type AdminUserPasswordResetData = {
  userId: string;
  passwordAction: string;
  temporaryPassword: string;
  canLogin: boolean;
  sessionsRevoked: boolean;
};

type AdminCommentTargetSettingsData = {
  targetType: string;
  targetId: string;
  commentsEnabled: boolean;
  canManageComments: boolean;
};

type AdminModerationActionData = {
  action: string;
  targetType: string;
  targetId: string;
  statusCode: string;
};

type AdminModerationListQuery = {
  q?: string;
  targetType?: string;
  status?: string;
};

type AdminResourceListQuery = {
  q?: string;
  targetType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

type AdminReportActionData = {
  action: string;
  reportId: string;
  statusCode: string;
};

type AdminReportListQuery = {
  q?: string;
  status?: string;
  targetType?: string;
  reason?: string;
};

type AdminTaxonomyUpdateInput = {
  sectionKey: string;
  categoryValue: string;
  statusCode: string;
  sortOrder: number;
  exposureFlags: string[];
  noteText?: string;
};

type AdminTaxonomyPromptListQuery = {
  q?: string;
  modality?: string;
  needsAttention?: boolean | string;
  modelCategory?: string;
  contentCategory?: string;
  compositionCategory?: string;
};

type AdminTaxonomyBulkApplyInput = {
  modality: string;
  promptIds: string[];
  modelCategory?: string;
  contentCategory?: string;
  compositionCategory?: string;
};

type AdminFeedOpsPageUpdateInput = {
  statusCode: string;
  slots: Array<{
    slotKey: string;
    items: Array<{
      targetType: string;
      targetId: string;
    }>;
  }>;
};

type AdminMediaTaskActionData = {
  action: string;
  taskId: string;
  statusCode: string;
  retryCount: number;
  retryable: boolean;
};

type AdminMediaTaskListQuery = {
  q?: string;
  status?: string;
  targetType?: string;
};

type AdminAuditLogListQuery = {
  q?: string;
  module?: string;
  result?: string;
  risk?: string;
};

const REQUEST_ID_HEADER_NAME = "X-Request-Id";
const AUTHORIZATION_HEADER_NAME = "Authorization";
const ADMIN_API_BASE_URL = process.env.DRAMATV_ADMIN_API_BASE_URL?.trim() || "http://127.0.0.1:18080";

export class AdminBackendError extends Error {
  constructor(
    message: string,
    readonly path: string,
    readonly status?: number,
    readonly code?: string,
    readonly requestId?: string
  ) {
    super(message);
    this.name = "AdminBackendError";
  }
}

function createRequestId() {
  return `admin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function absoluteUrl(path: string) {
  return `${ADMIN_API_BASE_URL}${path}`;
}

function createHeaders(headersInit: HeadersInit | undefined, requestId: string) {
  const headers = new Headers(headersInit);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set(REQUEST_ID_HEADER_NAME, requestId);
  return headers;
}

async function applyAuthorizationHeader(headers: Headers) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (accessToken) {
    headers.set(AUTHORIZATION_HEADER_NAME, `Bearer ${accessToken}`);
  }
}

async function parseBackendFailure(response: Response, fallbackRequestId: string, fallbackMessage: string) {
  const responseRequestId = response.headers.get(REQUEST_ID_HEADER_NAME) ?? fallbackRequestId;
  let code = `HTTP_${response.status}`;
  let message = fallbackMessage;
  let requestId = responseRequestId;

  try {
    const failure = (await response.json()) as Partial<BackendEnvelope<unknown>>;
    if (typeof failure.code === "string" && failure.code.trim()) {
      code = failure.code;
    }
    if (typeof failure.message === "string" && failure.message.trim()) {
      message = failure.message;
    }
    if (typeof failure.requestId === "string" && failure.requestId.trim()) {
      requestId = failure.requestId;
    }
  } catch {
    // ignore malformed body
  }

  return { code, message, requestId };
}

async function requestAdminBackend<T>(
  path: string,
  init?: RequestInit,
  options?: {
    includeAuth?: boolean;
    treat401AsNull?: boolean;
  }
): Promise<BackendEnvelope<T> | null> {
  const requestId = createRequestId();
  const headers = createHeaders(init?.headers, requestId);

  if (options?.includeAuth !== false) {
    await applyAuthorizationHeader(headers);
  }

  const response = await fetch(absoluteUrl(path), {
    ...init,
    headers,
    cache: "no-store"
  });

  if (response.status === 401 && options?.treat401AsNull) {
    return null;
  }

  if (!response.ok) {
    const failure = await parseBackendFailure(response, requestId, `Admin backend request failed with status ${response.status}.`);
    throw new AdminBackendError(failure.message, path, response.status, failure.code, failure.requestId);
  }

  return (await response.json()) as BackendEnvelope<T>;
}

function ok<T>(data: T, requestId = "admin-backend-adapter"): ApiEnvelope<T> {
  return {
    code: "OK",
    message: "ok",
    data,
    requestId
  };
}

function mapAdminSession(session: BackendAdminAuthSession): AdminSession {
  if (!isAdminRole(session.roleCode)) {
    throw new AdminBackendError("Admin session returned an unsupported role.", "/api/admin/auth/session", 500, "ADMIN_ROLE_INVALID");
  }

  return {
    id: session.id,
    username: session.username,
    displayName: session.displayName,
    avatarUrl: session.avatarUrl,
    role: session.roleCode,
    roleLabel: ADMIN_ROLE_LABELS[session.roleCode]
  };
}

function mapUserList(data: BackendAdminUserListResponse): AdminUserListData {
  return {
    summary: data.summary,
    pagination: data.pagination,
    items: data.items.map((item) => ({
      id: item.id,
      username: item.username,
      displayName: item.displayName,
      roleCode: item.roleCode,
      roleLabel: isAdminRole(item.roleCode) ? ADMIN_ROLE_LABELS[item.roleCode] : "无后台角色",
      statusCode: item.statusCode,
      createdAt: item.createdAt,
      lastLoginAt: item.lastLoginAt ?? null,
      contentSummary: `视频 ${item.contentStats.videoCount} / 工作流 ${item.contentStats.workflowCount} / 提示词 ${item.contentStats.promptCount} / 帖子 ${item.contentStats.postCount}`,
      publishedCount:
        item.contentStats.videoCount +
        item.contentStats.workflowCount +
        item.contentStats.promptCount +
        item.contentStats.postCount,
      followerCount: item.engagementStats.followerCount,
      likeReceivedCount: item.engagementStats.likeReceivedCount,
      moderationSummary: `发起举报 ${item.moderationStats.reportedTickets} / 待处理工单 ${item.moderationStats.assignedOpenTickets}`
    }))
  };
}

export async function loginAdmin(input: { username: string; password: string }) {
  const backend = await requestAdminBackend<BackendAdminLoginPayload>(
    "/api/admin/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        loginType: "password",
        username: input.username,
        password: input.password
      })
    },
    { includeAuth: false }
  );

  if (!backend) {
    throw new AdminBackendError("Admin login failed unexpectedly.", "/api/admin/auth/login");
  }

  await setAdminAccessToken(backend.data.accessToken, backend.data.expiresIn);
  return ok(backend.data, backend.requestId);
}

export async function logoutAdmin() {
  try {
    await requestAdminBackend<{ status: string }>("/api/admin/auth/logout", {
      method: "POST",
      body: JSON.stringify({})
    });
  } finally {
    await clearAdminAccessToken();
  }
}

export async function getAdminCurrentSession() {
  const token = await getTokenFromCookie();
  if (!token) {
    return ok<AdminSession | null>(null);
  }

  const backend = await requestAdminBackend<BackendAdminAuthSession>("/api/admin/auth/session", undefined, {
    treat401AsNull: true
  });

  if (!backend) {
    await clearAdminAccessToken();
    return ok<AdminSession | null>(null);
  }

  return ok(mapAdminSession(backend.data), backend.requestId);
}

export async function listAdminUsers(query?: { q?: string; page?: number; pageSize?: number } | string) {
  const searchParams = new URLSearchParams();

  const rawQuery = typeof query === "string" ? query : query?.q;
  const normalizedQuery = rawQuery?.trim();
  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  const page = typeof query === "string" ? undefined : query?.page;
  if (typeof page === "number" && Number.isFinite(page) && page > 0) {
    searchParams.set("page", String(Math.floor(page)));
  }

  const pageSize = typeof query === "string" ? undefined : query?.pageSize;
  if (typeof pageSize === "number" && Number.isFinite(pageSize) && pageSize > 0) {
    searchParams.set("pageSize", String(Math.floor(pageSize)));
  }

  const path = searchParams.size > 0 ? `/api/admin/users?${searchParams.toString()}` : "/api/admin/users";
  const backend = await requestAdminBackend<BackendAdminUserListResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin users response is empty.", path);
  }

  return ok(mapUserList(backend.data), backend.requestId);
}

export async function getAdminUser(userId: string) {
  const path = `/api/admin/users/${encodeURIComponent(userId)}`;
  const backend = await requestAdminBackend<BackendAdminUserDetailResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin user detail response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function updateAdminUserGovernance(input: {
  userId: string;
  roleCode: string;
  statusCode: string;
}) {
  const path = `/api/admin/users/${encodeURIComponent(input.userId)}/governance`;
  const backend = await requestAdminBackend<AdminUserGovernanceUpdateData>(path, {
    method: "PUT",
    body: JSON.stringify({
      roleCode: input.roleCode,
      statusCode: input.statusCode
    })
  });
  if (!backend) {
    throw new AdminBackendError("Admin user governance update response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function resetAdminUserPassword(userId: string) {
  const path = `/api/admin/users/${encodeURIComponent(userId)}/password/reset`;
  const backend = await requestAdminBackend<AdminUserPasswordResetData>(path, {
    method: "POST",
    body: JSON.stringify({})
  });
  if (!backend) {
    throw new AdminBackendError("Admin user password reset response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function listAdminComments(query?: AdminCommentListQuery | string) {
  const searchParams = new URLSearchParams();

  const rawQuery = typeof query === "string" ? query : query?.q;
  const normalizedQuery = rawQuery?.trim();
  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  const normalizedStatus = typeof query === "string" ? "" : query?.status?.trim();
  if (normalizedStatus) {
    searchParams.set("status", normalizedStatus);
  }

  const normalizedTargetType = typeof query === "string" ? "" : query?.targetType?.trim();
  if (normalizedTargetType) {
    searchParams.set("targetType", normalizedTargetType);
  }

  const reportedOnly = typeof query === "string" ? null : query?.reportedOnly;
  if (reportedOnly === true || reportedOnly === "true") {
    searchParams.set("reportedOnly", "true");
  }

  const path = searchParams.size > 0 ? `/api/admin/comments?${searchParams.toString()}` : "/api/admin/comments";
  const backend = await requestAdminBackend<BackendAdminCommentListResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin comments response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function hideAdminComment(commentId: string) {
  const path = `/api/admin/comments/${encodeURIComponent(commentId)}/hide`;
  const backend = await requestAdminBackend<AdminCommentActionData>(path, {
    method: "POST",
    body: JSON.stringify({})
  });
  if (!backend) {
    throw new AdminBackendError("Hide admin comment response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function restoreAdminComment(commentId: string) {
  const path = `/api/admin/comments/${encodeURIComponent(commentId)}/restore`;
  const backend = await requestAdminBackend<AdminCommentActionData>(path, {
    method: "POST",
    body: JSON.stringify({})
  });
  if (!backend) {
    throw new AdminBackendError("Restore admin comment response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function deleteAdminComment(commentId: string) {
  const path = `/api/admin/comments/${encodeURIComponent(commentId)}`;
  const backend = await requestAdminBackend<AdminCommentActionData>(path, {
    method: "DELETE"
  });
  if (!backend) {
    throw new AdminBackendError("Delete admin comment response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function updateAdminCommentTargetSettings(input: {
  targetType: string;
  targetId: string;
  commentsEnabled: boolean;
}) {
  const path = `/api/admin/comments/targets/${encodeURIComponent(input.targetType)}/${encodeURIComponent(input.targetId)}/settings`;
  const backend = await requestAdminBackend<AdminCommentTargetSettingsData>(path, {
    method: "PATCH",
    body: JSON.stringify({
      commentsEnabled: input.commentsEnabled
    })
  });
  if (!backend) {
    throw new AdminBackendError("Update admin comment target settings response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function listAdminModerationItems(query?: AdminModerationListQuery | string) {
  const searchParams = new URLSearchParams();

  const rawQuery = typeof query === "string" ? query : query?.q;
  const normalizedQuery = rawQuery?.trim();
  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  const normalizedTargetType = typeof query === "string" ? "" : query?.targetType?.trim();
  if (normalizedTargetType) {
    searchParams.set("targetType", normalizedTargetType);
  }

  const normalizedStatus = typeof query === "string" ? "" : query?.status?.trim();
  if (normalizedStatus) {
    searchParams.set("status", normalizedStatus);
  }

  const path = searchParams.size > 0 ? `/api/admin/moderation/items?${searchParams.toString()}` : "/api/admin/moderation/items";
  const backend = await requestAdminBackend<BackendAdminModerationListResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin moderation response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function getAdminModerationItem(targetType: string, targetId: string) {
  const path = `/api/admin/moderation/items/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`;
  const backend = await requestAdminBackend<BackendAdminModerationItemDetailResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin moderation detail response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function listAdminResources(query?: AdminResourceListQuery | string) {
  const searchParams = new URLSearchParams();

  const rawQuery = typeof query === "string" ? query : query?.q;
  const normalizedQuery = rawQuery?.trim();
  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  const normalizedTargetType = typeof query === "string" ? "" : query?.targetType?.trim();
  if (normalizedTargetType) {
    searchParams.set("targetType", normalizedTargetType);
  }

  const normalizedStatus = typeof query === "string" ? "" : query?.status?.trim();
  if (normalizedStatus) {
    searchParams.set("status", normalizedStatus);
  }

  const page = typeof query === "string" ? undefined : query?.page;
  if (typeof page === "number" && Number.isFinite(page) && page > 0) {
    searchParams.set("page", String(Math.floor(page)));
  }

  const pageSize = typeof query === "string" ? undefined : query?.pageSize;
  if (typeof pageSize === "number" && Number.isFinite(pageSize) && pageSize > 0) {
    searchParams.set("pageSize", String(Math.floor(pageSize)));
  }

  const path = searchParams.size > 0 ? `/api/admin/resources?${searchParams.toString()}` : "/api/admin/resources";
  const backend = await requestAdminBackend<BackendAdminResourceListResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin resource response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function getAdminResource(targetType: string, targetId: string) {
  const path = `/api/admin/resources/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`;
  const backend = await requestAdminBackend<BackendAdminResourceDetailResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin resource detail response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function listAdminReports(query?: AdminReportListQuery) {
  const searchParams = new URLSearchParams();

  const normalizedQuery = query?.q?.trim();
  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  const normalizedStatus = query?.status?.trim();
  if (normalizedStatus) {
    searchParams.set("status", normalizedStatus);
  }

  const normalizedTargetType = query?.targetType?.trim();
  if (normalizedTargetType) {
    searchParams.set("targetType", normalizedTargetType);
  }

  const normalizedReason = query?.reason?.trim();
  if (normalizedReason) {
    searchParams.set("reason", normalizedReason);
  }

  const path = searchParams.size > 0 ? `/api/admin/reports?${searchParams.toString()}` : "/api/admin/reports";
  const backend = await requestAdminBackend<BackendAdminReportListResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin reports response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function getAdminReport(reportId: string) {
  const path = `/api/admin/reports/${encodeURIComponent(reportId)}`;
  const backend = await requestAdminBackend<BackendAdminReportDetailResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin report detail response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function getAdminTaxonomy() {
  const path = "/api/admin/taxonomy";
  const backend = await requestAdminBackend<BackendAdminTaxonomyResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin taxonomy response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function updateAdminTaxonomy(input: AdminTaxonomyUpdateInput) {
  const path = "/api/admin/taxonomy";
  const backend = await requestAdminBackend<AdminTaxonomyItemData>(path, {
    method: "PUT",
    body: JSON.stringify({
      sectionKey: input.sectionKey,
      categoryValue: input.categoryValue,
      statusCode: input.statusCode,
      sortOrder: input.sortOrder,
      exposureFlags: input.exposureFlags,
      noteText: input.noteText?.trim() || undefined
    })
  });
  if (!backend) {
    throw new AdminBackendError("Admin taxonomy update response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function listAdminTaxonomyPrompts(query?: AdminTaxonomyPromptListQuery) {
  const searchParams = new URLSearchParams();

  const normalizedQuery = query?.q?.trim();
  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  const normalizedModality = query?.modality?.trim();
  if (normalizedModality) {
    searchParams.set("modality", normalizedModality);
  }

  const needsAttention = query?.needsAttention;
  if (needsAttention === true || needsAttention === "true") {
    searchParams.set("needsAttention", "true");
  } else if (needsAttention === false || needsAttention === "false") {
    searchParams.set("needsAttention", "false");
  }

  const normalizedModelCategory = query?.modelCategory?.trim();
  if (normalizedModelCategory) {
    searchParams.set("modelCategory", normalizedModelCategory);
  }

  const normalizedContentCategory = query?.contentCategory?.trim();
  if (normalizedContentCategory) {
    searchParams.set("contentCategory", normalizedContentCategory);
  }

  const normalizedCompositionCategory = query?.compositionCategory?.trim();
  if (normalizedCompositionCategory) {
    searchParams.set("compositionCategory", normalizedCompositionCategory);
  }

  const path = searchParams.size > 0 ? `/api/admin/taxonomy/prompts?${searchParams.toString()}` : "/api/admin/taxonomy/prompts";
  const backend = await requestAdminBackend<BackendAdminTaxonomyPromptListResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin taxonomy prompt list response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function bulkApplyAdminTaxonomy(input: AdminTaxonomyBulkApplyInput) {
  const path = "/api/admin/taxonomy/prompts/bulk-apply";
  const backend = await requestAdminBackend<BackendAdminTaxonomyBulkApplyResponse>(path, {
    method: "POST",
    body: JSON.stringify({
      modality: input.modality,
      promptIds: input.promptIds,
      modelCategory: input.modelCategory?.trim() || undefined,
      contentCategory: input.contentCategory?.trim() || undefined,
      compositionCategory: input.compositionCategory?.trim() || undefined
    })
  });
  if (!backend) {
    throw new AdminBackendError("Admin taxonomy bulk apply response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

async function getAdminFeedOpsPage(path: string) {
  const backend = await requestAdminBackend<BackendAdminFeedOpsPageResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin feed ops page response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

async function updateAdminFeedOpsPage(path: string, input: AdminFeedOpsPageUpdateInput) {
  const backend = await requestAdminBackend<BackendAdminFeedOpsPageResponse>(path, {
    method: "PUT",
    body: JSON.stringify({
      statusCode: input.statusCode,
      slots: input.slots
    })
  });
  if (!backend) {
    throw new AdminBackendError("Admin feed ops page update response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function getAdminFeedOpsHome() {
  return getAdminFeedOpsPage("/api/admin/feed-ops/home");
}

export async function updateAdminFeedOpsHome(input: AdminFeedOpsPageUpdateInput) {
  return updateAdminFeedOpsPage("/api/admin/feed-ops/home", input);
}

export async function getAdminFeedOpsFeatured() {
  return getAdminFeedOpsPage("/api/admin/feed-ops/featured");
}

export async function updateAdminFeedOpsFeatured(input: AdminFeedOpsPageUpdateInput) {
  return updateAdminFeedOpsPage("/api/admin/feed-ops/featured", input);
}

export async function getAdminFeedOpsDiscussions() {
  return getAdminFeedOpsPage("/api/admin/feed-ops/discussions");
}

export async function updateAdminFeedOpsDiscussions(input: AdminFeedOpsPageUpdateInput) {
  return updateAdminFeedOpsPage("/api/admin/feed-ops/discussions", input);
}

export async function listAdminMediaTasks(query?: AdminMediaTaskListQuery | string) {
  const searchParams = new URLSearchParams();

  const rawQuery = typeof query === "string" ? query : query?.q;
  const normalizedQuery = rawQuery?.trim();
  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  const normalizedStatus = typeof query === "string" ? "" : query?.status?.trim();
  if (normalizedStatus) {
    searchParams.set("status", normalizedStatus);
  }

  const normalizedTargetType = typeof query === "string" ? "" : query?.targetType?.trim();
  if (normalizedTargetType) {
    searchParams.set("targetType", normalizedTargetType);
  }

  const path = searchParams.size > 0 ? `/api/admin/media-tasks?${searchParams.toString()}` : "/api/admin/media-tasks";
  const backend = await requestAdminBackend<BackendAdminMediaTaskListResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin media tasks response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function getAdminMediaTask(taskId: string) {
  const path = `/api/admin/media-tasks/${encodeURIComponent(taskId)}`;
  const backend = await requestAdminBackend<BackendAdminMediaTaskDetailResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin media task detail response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function retryAdminMediaTask(taskId: string) {
  const path = `/api/admin/media-tasks/${encodeURIComponent(taskId)}/retry`;
  const backend = await requestAdminBackend<AdminMediaTaskActionData>(path, {
    method: "POST",
    body: JSON.stringify({})
  });
  if (!backend) {
    throw new AdminBackendError("Admin media task retry response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function listAdminAuditLogs(query?: AdminAuditLogListQuery | string) {
  const searchParams = new URLSearchParams();

  const rawQuery = typeof query === "string" ? query : query?.q;
  const normalizedQuery = rawQuery?.trim();
  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  const normalizedModule = typeof query === "string" ? "" : query?.module?.trim();
  if (normalizedModule) {
    searchParams.set("module", normalizedModule);
  }

  const normalizedResult = typeof query === "string" ? "" : query?.result?.trim();
  if (normalizedResult) {
    searchParams.set("result", normalizedResult);
  }

  const normalizedRisk = typeof query === "string" ? "" : query?.risk?.trim();
  if (normalizedRisk) {
    searchParams.set("risk", normalizedRisk);
  }

  const path = searchParams.size > 0 ? `/api/admin/audit-logs?${searchParams.toString()}` : "/api/admin/audit-logs";
  const backend = await requestAdminBackend<BackendAdminAuditLogListResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin audit logs response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function getAdminAuditLog(logId: string) {
  const path = `/api/admin/audit-logs/${encodeURIComponent(logId)}`;
  const backend = await requestAdminBackend<BackendAdminAuditLogDetailResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin audit log detail response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

export async function getAdminDashboardOverview() {
  const path = "/api/admin/dashboard/overview";
  const backend = await requestAdminBackend<BackendAdminDashboardOverviewResponse>(path);
  if (!backend) {
    throw new AdminBackendError("Admin dashboard overview response is empty.", path);
  }

  return ok(backend.data, backend.requestId);
}

async function submitAdminModerationAction(
  action: "approve" | "reject" | "offline" | "restore",
  input: {
    targetType: string;
    targetId: string;
    note?: string;
  }
) {
  const path = `/api/admin/moderation/items/${encodeURIComponent(input.targetType)}/${encodeURIComponent(input.targetId)}/${action}`;
  const backend = await requestAdminBackend<AdminModerationActionData>(path, {
    method: "POST",
    body: JSON.stringify({
      note: input.note?.trim() || undefined
    })
  });
  if (!backend) {
    throw new AdminBackendError(`Admin moderation ${action} response is empty.`, path);
  }

  return ok(backend.data, backend.requestId);
}

export async function approveAdminModerationItem(input: { targetType: string; targetId: string; note?: string }) {
  return submitAdminModerationAction("approve", input);
}

export async function rejectAdminModerationItem(input: { targetType: string; targetId: string; note?: string }) {
  return submitAdminModerationAction("reject", input);
}

export async function offlineAdminModerationItem(input: { targetType: string; targetId: string; note?: string }) {
  return submitAdminModerationAction("offline", input);
}

export async function restoreAdminModerationItem(input: { targetType: string; targetId: string; note?: string }) {
  return submitAdminModerationAction("restore", input);
}

async function submitAdminReportAction(
  action: "processing" | "close" | "offline-target" | "hide-comment",
  input: {
    reportId: string;
    note?: string;
  }
) {
  const path = `/api/admin/reports/${encodeURIComponent(input.reportId)}/${action}`;
  const backend = await requestAdminBackend<AdminReportActionData>(path, {
    method: "POST",
    body: JSON.stringify({
      note: input.note?.trim() || undefined
    })
  });
  if (!backend) {
    throw new AdminBackendError(`Admin report ${action} response is empty.`, path);
  }

  return ok(backend.data, backend.requestId);
}

export async function markProcessingAdminReport(input: { reportId: string; note?: string }) {
  return submitAdminReportAction("processing", input);
}

export async function closeAdminReport(input: { reportId: string; note?: string }) {
  return submitAdminReportAction("close", input);
}

export async function offlineAdminReportTarget(input: { reportId: string; note?: string }) {
  return submitAdminReportAction("offline-target", input);
}

export async function hideAdminReportedComment(input: { reportId: string; note?: string }) {
  return submitAdminReportAction("hide-comment", input);
}

async function getTokenFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value?.trim();
  return token && token.length > 0 ? token : null;
}
