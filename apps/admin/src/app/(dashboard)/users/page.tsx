import { requireAdminAccess } from "@/lib/admin-auth";
import { AdminBackendError, getAdminUser, listAdminUsers } from "@/lib/admin-service";
import UsersPageClient from "./UsersPageClient";
import type { DetailContentItem, DisplayRole, DisplayStatus, DisplaySource, DisplayUser, PageData, UserDetailData } from "./types";

const USERS_PAGE_SIZE = 20;

function roleFromCode(code: string): DisplayRole {
  if (code === "creator") {
    return "创作者";
  }
  if (code === "admin") {
    return "管理员";
  }
  if (code === "moderator") {
    return "审核";
  }
  if (code === "operator") {
    return "运营";
  }
  return "普通用户";
}

function statusFromCode(code: string): DisplayStatus {
  if (code === "disabled" || code === "banned" || code === "blocked") {
    return "禁用";
  }
  if (code === "pending") {
    return "观察中";
  }
  return "正常";
}

function sourceFromIdentityProvider(identityProvider?: string | null, account?: string | null): DisplaySource {
  const normalizedProvider = identityProvider?.trim().toLowerCase();
  if (normalizedProvider === "canvas") {
    return "画布账号";
  }
  if ((account ?? "").includes("@")) {
    return "邮箱注册";
  }
  return "社区本地";
}

function formatDateTime(input: string | null | undefined) {
  if (!input) {
    return "未记录";
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatMetricValue(value: number) {
  return value.toLocaleString("en-US");
}

function pseudoNumericId(id: string, index: number) {
  const compact = id.replace(/[^a-f0-9]/gi, "").slice(0, 6);
  const numeric = Number.parseInt(compact || "0", 16);
  return String(100100 + (numeric % 900000) + index);
}

function noteFromRole(role: DisplayRole, status: DisplayStatus) {
  if (status === "禁用") {
    return "账号当前处于禁用状态，需复核后再恢复。";
  }
  if (status === "观察中") {
    return "近期触发风险策略，建议结合内容历史继续观察。";
  }
  if (role === "创作者") {
    return "核心创作者账号，建议持续跟踪活跃趋势与内容质量。";
  }
  if (role === "管理员") {
    return "具备后台管理权限，操作需同步进入审计日志。";
  }
  if (role === "审核") {
    return "当前承接审核与举报工单，适合做排班跟踪。";
  }
  if (role === "运营") {
    return "主要负责首页与精选运营，关注排期与专题配置。";
  }
  return "普通社区账号，当前无后台权限。";
}

function targetTypeLabel(targetType: string): DetailContentItem["targetLabel"] {
  if (targetType === "video") {
    return "视频作品";
  }
  if (targetType === "workflow") {
    return "工作流";
  }
  if (targetType === "prompt") {
    return "提示词";
  }
  if (targetType === "post") {
    return "帖子";
  }
  return "内容";
}

function normalizeFilterValue(value: string | null | undefined) {
  return value?.trim() || "";
}

function normalizePageValue(value: string | null | undefined) {
  const parsed = Number.parseInt(value?.trim() || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function hasActiveFilters(searchQuery: string) {
  return Boolean(searchQuery);
}

function mapApiUser(
  item: Awaited<ReturnType<typeof listAdminUsers>>["data"]["items"][number],
  index: number
): DisplayUser {
  const roleLabel = item.roleLabel === "无后台角色" ? roleFromCode(item.roleCode) : roleFromCode(item.roleCode);
  const statusLabel = statusFromCode(item.statusCode);
  const accountLabel = item.username.includes("@") ? item.username : `${item.username}@dramatv.com`;
  const moderationMatch = item.moderationSummary.match(/发起举报\s+(\d+)\s+\/\s+待处理工单\s+(\d+)/);
  const reportedTickets = moderationMatch ? Number.parseInt(moderationMatch[1] ?? "0", 10) : 0;
  const assignedOpenTickets = moderationMatch ? Number.parseInt(moderationMatch[2] ?? "0", 10) : 0;

  return {
    id: item.id,
    displayName: item.displayName,
    userId: pseudoNumericId(item.id, index),
    accountLabel,
    username: item.username,
    roleLabel,
    roleCode: item.roleCode,
    publishedCount: item.publishedCount,
    likesCount: item.likeReceivedCount,
    followerCount: item.followerCount,
    reportedTickets,
    assignedOpenTickets,
    lastActiveAt: formatDateTime(item.lastLoginAt ?? item.createdAt),
    statusLabel,
    statusCode: item.statusCode,
    sourceLabel: sourceFromIdentityProvider(null, accountLabel),
    registrationAt: formatDateTime(item.createdAt),
    note: noteFromRole(roleLabel, statusLabel),
    avatarText: item.displayName.slice(0, 1) || item.username.slice(0, 1).toUpperCase(),
    avatarTone: (["amber", "stone", "navy", "rose", "teal", "violet"] as const)[index % 6]
  };
}

function mapApiUserDetail(
  detail: Awaited<ReturnType<typeof getAdminUser>>["data"],
  listUser: DisplayUser | undefined,
  index: number
): UserDetailData {
  const roleLabel = roleFromCode(detail.roleCode);
  const statusLabel = statusFromCode(detail.statusCode);
  const accountLabel = detail.email?.trim() || detail.phone?.trim() || detail.username;

  return {
    id: detail.id,
    displayName: detail.displayName,
    accountLabel,
    roleLabel,
    roleCode: detail.roleCode,
    statusLabel,
    statusCode: detail.statusCode,
    registrationAt: formatDateTime(detail.createdAt),
    lastActiveAt: formatDateTime(detail.lastLoginAt ?? detail.createdAt),
    sourceLabel: sourceFromIdentityProvider(detail.identityProvider, accountLabel),
    note: detail.governanceSummary.statusNote || detail.bio || noteFromRole(roleLabel, statusLabel),
    avatarText: listUser?.avatarText ?? (detail.displayName.slice(0, 1) || detail.username.slice(0, 1).toUpperCase()),
    avatarTone: listUser?.avatarTone ?? (["amber", "stone", "navy", "rose", "teal", "violet"] as const)[index % 6],
    username: detail.username,
    userId: listUser?.userId ?? pseudoNumericId(detail.id, index),
    emailLabel: detail.email?.trim() || "未记录",
    phoneLabel: detail.phone?.trim() || "未记录",
    contentSummary: `视频 ${detail.contentStats.videoCount} / 工作流 ${detail.contentStats.workflowCount} / 提示词 ${detail.contentStats.promptCount} / 帖子 ${detail.contentStats.postCount}`,
    moderationSummary: `发起举报 ${detail.moderationStats.reportedTickets} / 待处理工单 ${detail.moderationStats.assignedOpenTickets}`,
    followerCount: detail.engagementStats.followerCount,
    likesCount: detail.engagementStats.likeReceivedCount,
    openReportsAgainstUser: detail.moderationStats.openReportsAgainstUser,
    canLogin: detail.governanceSummary.canLogin,
    canPublish: detail.governanceSummary.canPublish,
    canManageAdmin: detail.governanceSummary.canManageAdmin,
    hasLocalPassword: detail.passwordGovernance.hasLocalPassword,
    canInitializePassword: detail.passwordGovernance.canInitializePassword,
    canResetPassword: detail.passwordGovernance.canResetPassword,
    passwordActionLabel: detail.passwordGovernance.passwordActionLabel,
    passwordHint: detail.passwordGovernance.passwordHint,
    recentContents: detail.recentContents.map((item) => ({
      targetType: item.targetType,
      targetLabel: targetTypeLabel(item.targetType),
      title: item.title,
      publishStatus: item.publishStatus,
      publishedAt: formatDateTime(item.publishedAt)
    }))
  };
}

async function loadPageData(searchQuery: string, page: number, selectedId?: string): Promise<PageData> {
  try {
    const response = await listAdminUsers({
      q: searchQuery || undefined,
      page,
      pageSize: USERS_PAGE_SIZE
    });
    const users = response.data.items.map(mapApiUser);
    const selectedUser = users.find((user) => user.id === selectedId) ?? users[0] ?? null;

    let selectedDetail: UserDetailData | null = null;
    let detailErrorMessage: string | null = null;

    if (selectedUser) {
      try {
        const detail = await getAdminUser(selectedUser.id);
        const selectedIndex = users.findIndex((item) => item.id === selectedUser.id);
        selectedDetail = mapApiUserDetail(detail.data, selectedUser, selectedIndex >= 0 ? selectedIndex : 0);
      } catch (error) {
        detailErrorMessage =
          error instanceof AdminBackendError && error.requestId
            ? `用户详情读取失败（requestId: ${error.requestId}），当前仅保留列表与治理入口。`
            : "用户详情读取失败，当前仅保留列表与治理入口。";
      }
    }

    return {
      totalUsers: response.data.summary.totalUsers,
      backendRoleUsers: response.data.summary.backendRoleUsers,
      displayedUsers: users.length,
      blockedUsers: response.data.summary.nonActiveUsers,
      currentPage: response.data.pagination.page,
      pageSize: response.data.pagination.pageSize,
      totalMatchedUsers: response.data.pagination.totalItems,
      totalPages: response.data.pagination.totalPages,
      hasPreviousPage: response.data.pagination.hasPrevious,
      hasNextPage: response.data.pagination.hasNext,
      users,
      selectedUserId: selectedUser?.id ?? null,
      selectedDetail,
      modeLabel: "当前为实时用户数据",
      modeDetail: "列表、详情、角色状态治理与密码治理均优先读取真实接口。",
      isFallback: false,
      searchQuery,
      tableCountLabel: `第 ${formatMetricValue(response.data.pagination.page)} 页，当前返回 ${formatMetricValue(users.length)} 条，共匹配 ${formatMetricValue(response.data.pagination.totalItems)} 条`,
      emptyMessage: users.length === 0 ? (hasActiveFilters(searchQuery) ? "当前筛选条件下没有匹配的用户。" : "当前还没有可展示的用户。") : null,
      detailErrorMessage
    };
  } catch (error) {
    const requestId =
      error instanceof AdminBackendError && error.requestId ? `requestId: ${error.requestId}` : "后端 users 查询异常";

    return {
      totalUsers: 0,
      backendRoleUsers: 0,
      displayedUsers: 0,
      blockedUsers: 0,
      currentPage: 1,
      pageSize: USERS_PAGE_SIZE,
      totalMatchedUsers: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
      users: [],
      selectedUserId: null,
      selectedDetail: null,
      modeLabel: "用户数据读取失败",
      modeDetail: `${requestId}，当前不再回退展示占位用户数据，请先排查真实后端请求。`,
      isFallback: true,
      searchQuery,
      tableCountLabel: "当前返回 0 条",
      emptyMessage: "当前无法读取用户列表，请稍后重试。",
      detailErrorMessage: null
    };
  }
}

export default async function UsersPage({
  searchParams
}: {
  searchParams?: Promise<{
    selected?: string;
    error?: string;
    success?: string;
    q?: string;
    page?: string;
  }>;
}) {
  await requireAdminAccess(["admin", "operator", "moderator"], "/users");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const searchQuery = normalizeFilterValue(resolvedSearchParams?.q);
  const page = normalizePageValue(resolvedSearchParams?.page);
  const data = await loadPageData(searchQuery, page, resolvedSearchParams?.selected?.trim());

  return (
    <UsersPageClient
      data={data}
      errorMessage={resolvedSearchParams?.error?.trim() || null}
      successMessage={resolvedSearchParams?.success?.trim() || null}
    />
  );
}
