"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  createUserAction,
  resetUserPasswordAction,
  updateUserGovernanceAction
} from "./actions";
import styles from "./page.module.css";
import type { CreateUserActionState, DetailContentItem, DisplayRole, DisplayStatus, DisplayUser, PageData, ResetPasswordActionState } from "./types";

const initialResetPasswordActionState: ResetPasswordActionState = {
  status: "idle",
  message: null,
  temporaryPassword: null,
  passwordActionLabel: null,
  userId: null
};

const initialCreateUserActionState: CreateUserActionState = {
  status: "idle",
  message: null,
  requestId: null,
  createdUserId: null,
  temporaryPassword: null,
  passwordMode: null,
  createdUsername: null,
  createdDisplayName: null
};

const GOVERNANCE_ROLE_OPTIONS = [
  { value: "creator", label: "创作者 / 普通账号" },
  { value: "moderator", label: "审核" },
  { value: "operator", label: "运营" },
  { value: "admin", label: "管理员" }
] as const;
const GOVERNANCE_STATUS_OPTIONS = [
  { value: "active", label: "正常" },
  { value: "pending", label: "观察中" },
  { value: "disabled", label: "禁用" }
] as const;

function MetricIcon({ kind }: { kind: "users" | "today" | "creator" | "blocked" }) {
  if (kind === "users") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="7.25" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13.25" cy="8" r="1.85" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.75 14.5c.45-1.98 2.18-3.2 4.5-3.2s4.05 1.22 4.5 3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M11.75 13.75c.29-.99 1.1-1.62 2.23-1.62.94 0 1.65.38 2.02 1.12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "today") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="7.25" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.75 14.5c.45-1.98 2.18-3.2 4.5-3.2s4.05 1.22 4.5 3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M13.25 6.25v5.5M10.5 9h5.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "creator") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M5.75 4.75h8.5a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-8.5a1.5 1.5 0 0 1-1.5-1.5v-7.5a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.5 10l1.8 1.8 3.2-3.4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M10 3.75l5 1.5v4.1c0 3.06-2.1 5.87-5 6.9-2.9-1.03-5-3.84-5-6.9v-4.1l5-1.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M8 8l4 4M12 8l-4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function userRoleTone(role: DisplayRole) {
  if (role === "创作者") {
    return styles.roleCreator;
  }
  if (role === "管理员") {
    return styles.roleAdmin;
  }
  if (role === "审核") {
    return styles.roleReviewer;
  }
  if (role === "运营") {
    return styles.roleOperator;
  }
  return styles.roleUser;
}

function userStatusTone(status: DisplayStatus) {
  if (status === "禁用") {
    return styles.statusBlocked;
  }
  if (status === "观察中") {
    return styles.statusPending;
  }
  return styles.statusNormal;
}

function avatarToneClass(tone: DisplayUser["avatarTone"]) {
  switch (tone) {
    case "amber":
      return styles.avatarAmber;
    case "stone":
      return styles.avatarStone;
    case "navy":
      return styles.avatarNavy;
    case "rose":
      return styles.avatarRose;
    case "teal":
      return styles.avatarTeal;
    default:
      return styles.avatarViolet;
  }
}

function publishStatusLabel(statusCode: string) {
  if (statusCode === "published") {
    return "已发布";
  }
  if (statusCode === "submitted" || statusCode === "in_review") {
    return "审核中";
  }
  if (statusCode === "rejected") {
    return "已驳回";
  }
  return statusCode || "未记录";
}

type Props = {
  data: PageData;
  canManageUsers: boolean;
  canAssignAdminRole: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
};

type RecentContentListProps = {
  items: DetailContentItem[];
  compact?: boolean;
};

function buildUsersHref(options?: {
  selected?: string | null;
  q?: string | null;
  page?: number | null;
  error?: string | null;
}) {
  const searchParams = new URLSearchParams();
  if (options?.selected?.trim()) {
    searchParams.set("selected", options.selected.trim());
  }
  if (options?.q?.trim()) {
    searchParams.set("q", options.q.trim());
  }
  if (typeof options?.page === "number" && Number.isFinite(options.page) && options.page > 0) {
    searchParams.set("page", String(Math.floor(options.page)));
  }
  if (options?.error?.trim()) {
    searchParams.set("error", options.error.trim());
  }
  const query = searchParams.toString();
  return query ? `/users?${query}` : "/users";
}

function buildPaginationPages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages] as const;
}

function RecentContentList({ items, compact = false }: RecentContentListProps) {
  return (
    <div className={`${styles.recentList} ${compact ? styles.recentListCompact : ""}`}>
      {items.map((item) => (
        <article
          key={`${item.targetType}-${item.title}-${item.publishedAt}`}
          className={`${styles.recentItem} ${compact ? styles.recentItemCompact : ""}`}
        >
          <div className={styles.recentMeta}>
            <span className={styles.recentType}>{item.targetLabel}</span>
            <span className={styles.recentStatus}>{publishStatusLabel(item.publishStatus)}</span>
          </div>
          <strong className={styles.recentTitle}>{item.title}</strong>
          <span className={styles.recentTime}>{item.publishedAt}</span>
        </article>
      ))}
    </div>
  );
}

type CreateUserModalProps = {
  canAssignAdminRole: boolean;
  onClose: (options?: { refresh?: boolean }) => void;
};

function CreateUserModal({ canAssignAdminRole, onClose }: CreateUserModalProps) {
  const [createUserState, createUserFormAction, createUserPending] = useActionState(
    createUserAction,
    initialCreateUserActionState
  );
  const createCompleted = createUserState.status === "success";

  function handleClose() {
    onClose({ refresh: createCompleted });
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createCompleted]);

  return (
    <div className={styles.recentModalScrim} onClick={handleClose}>
      <section
        aria-labelledby="create-user-title"
        aria-modal="true"
        className={styles.createUserModal}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.recentModalHeader}>
          <div className={styles.recentModalTitle}>
            <h2 id="create-user-title">创建账号</h2>
            <p>创建本地账号，可直接设置初始密码；留空时默认使用 dramatv-local-dev。</p>
          </div>
          <button
            aria-label="关闭创建账号弹窗"
            className={styles.closeButton}
            type="button"
            onClick={handleClose}
          >
            ×
          </button>
        </header>
        <form action={createUserFormAction} className={styles.createUserForm}>
          <div className={styles.createUserGrid}>
            <label className={styles.formField}>
              <span>用户名</span>
              <input className={styles.searchInput} name="username" placeholder="如 creator-demo-01" required type="text" />
            </label>
            <label className={styles.formField}>
              <span>显示名</span>
              <input className={styles.searchInput} name="displayName" placeholder="如 创作者演示账号" required type="text" />
            </label>
            <label className={styles.formField}>
              <span>角色</span>
              <select className={styles.formSelect} defaultValue="creator" name="roleCode">
                {GOVERNANCE_ROLE_OPTIONS.filter((option) => option.value !== "admin" || canAssignAdminRole).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.formField}>
              <span>邮箱</span>
              <input className={styles.searchInput} name="email" placeholder="可选" type="email" />
            </label>
            <label className={styles.formField}>
              <span>手机号</span>
              <input className={styles.searchInput} name="phone" placeholder="可选" type="text" />
            </label>
            <label className={styles.formField}>
              <span>初始密码</span>
              <input className={styles.searchInput} name="password" placeholder="可选，不填则使用默认密码" type="text" />
            </label>
          </div>

          {createUserState.status === "success" ? (
            <div className={styles.passwordResultSuccess}>
              <strong>账号创建成功</strong>
              <span>{createUserState.message}</span>
              <span>{createUserState.passwordMode === "custom" ? "初始密码（自定义）" : "初始密码（默认）"}</span>
              <code>{createUserState.temporaryPassword}</code>
              <span>
                {createUserState.createdDisplayName} / {createUserState.createdUsername}
              </span>
            </div>
          ) : null}

          {createUserState.status === "error" && createUserState.message ? (
            <div className={styles.passwordResultError}>
              <strong>创建账号失败</strong>
              <span>{createUserState.message}</span>
            </div>
          ) : null}

          <div className={styles.formActions}>
            <button className={styles.secondaryAction} type="button" onClick={handleClose}>
              {createCompleted ? "完成" : "取消"}
            </button>
            {!createCompleted ? (
              <button className={styles.primaryAction} disabled={createUserPending} type="submit">
                {createUserPending ? "创建中..." : "确认创建"}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}

export default function UsersPageClient({ data, canManageUsers, canAssignAdminRole, errorMessage, successMessage }: Props) {
  const router = useRouter();
  const [isDetailVisible, setIsDetailVisible] = useState(true);
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState(data.selectedDetail?.statusCode ?? "active");
  const [roleDraft, setRoleDraft] = useState(data.selectedDetail?.roleCode ?? "creator");
  const [resetPasswordState, resetPasswordFormAction, resetPasswordPending] = useActionState(
    resetUserPasswordAction,
    initialResetPasswordActionState
  );

  const selectedUser = data.users.find((user) => user.id === data.selectedUserId) ?? data.users[0] ?? null;

  const selectedDetail = data.selectedDetail ?? null;
  const selectedUserLink = selectedUser
    ? buildUsersHref({
        selected: selectedUser.id,
        q: data.searchQuery,
        page: data.currentPage
      })
    : buildUsersHref({
        q: data.searchQuery,
        page: data.currentPage
      });
  const paginationPages = useMemo(() => buildPaginationPages(data.currentPage, data.totalPages), [data.currentPage, data.totalPages]);

  const selectedRoleLabel = useMemo(() => {
    return GOVERNANCE_ROLE_OPTIONS.find((item) => item.value === roleDraft)?.label ?? "创作者 / 普通账号";
  }, [roleDraft]);

  const selectedStatusLabel = useMemo(() => {
    return GOVERNANCE_STATUS_OPTIONS.find((item) => item.value === statusDraft)?.label ?? "正常";
  }, [statusDraft]);

  useEffect(() => {
    setStatusDraft(data.selectedDetail?.statusCode ?? "active");
    setRoleDraft(data.selectedDetail?.roleCode ?? "creator");
    setIsDetailVisible(true);
    setIsRecentModalOpen(false);
  }, [data.selectedDetail?.id, data.selectedDetail?.roleCode, data.selectedDetail?.statusCode]);

  useEffect(() => {
    if (!isRecentModalOpen && !isCreateModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isRecentModalOpen) {
        setIsRecentModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRecentModalOpen, isCreateModalOpen]);

  function handleCloseCreateModal(options?: { refresh?: boolean }) {
    setIsCreateModalOpen(false);
    if (options?.refresh) {
      router.refresh();
    }
  }

  const activePasswordResult =
    selectedDetail && resetPasswordState.userId === selectedDetail.id ? resetPasswordState : initialResetPasswordActionState;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div>
            <h1 className={styles.title}>用户管理</h1>
            <p className={styles.subtitle}>管理社区账号、状态与后台权限</p>
          </div>
          {canManageUsers ? (
            <button className={styles.primaryAction} type="button" onClick={() => setIsCreateModalOpen(true)}>
              创建账号
            </button>
          ) : null}
        </div>
      </header>

      {errorMessage ? (
        <div className={styles.errorBanner}>
          <strong>保存失败</strong>
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div className={styles.successBanner}>
          <strong>保存成功</strong>
          <span>{successMessage}</span>
        </div>
      ) : null}

      <div className={styles.stage}>
        <div className={`${styles.layout} ${!isDetailVisible || !selectedDetail ? styles.layoutSingleColumn : ""}`}>
          <div className={styles.mainColumn}>
            <section className={styles.metricsGrid}>
              <article className={styles.metricCard}>
                <div className={styles.metricHead}>
                  <span className={styles.metricIcon}>
                    <MetricIcon kind="users" />
                  </span>
                  <span>用户总数</span>
                </div>
                <strong className={styles.metricValue}>{data.totalUsers.toLocaleString("en-US")}</strong>
                <span className={styles.metricDelta}>当前实时数据</span>
              </article>

              <article className={styles.metricCard}>
                <div className={styles.metricHead}>
                  <span className={styles.metricIcon}>
                    <MetricIcon kind="today" />
                  </span>
                  <span>当前列表</span>
                </div>
                <strong className={styles.metricValue}>{data.displayedUsers.toLocaleString("en-US")}</strong>
                <span className={styles.metricDelta}>当前查询返回</span>
              </article>

              <article className={styles.metricCard}>
                <div className={styles.metricHead}>
                  <span className={styles.metricIcon}>
                    <MetricIcon kind="creator" />
                  </span>
                  <span>后台角色账号</span>
                </div>
                <strong className={styles.metricValue}>{data.backendRoleUsers.toLocaleString("en-US")}</strong>
                <span className={styles.metricDelta}>管理员 / 运营 / 审核</span>
              </article>

              <article className={styles.metricCard}>
                <div className={styles.metricHead}>
                  <span className={styles.metricIcon}>
                    <MetricIcon kind="blocked" />
                  </span>
                  <span>非活跃账号</span>
                </div>
                <strong className={styles.metricValue}>{data.blockedUsers.toLocaleString("en-US")}</strong>
                <span className={styles.metricDelta}>观察中 + 禁用</span>
              </article>
            </section>

            <section className={styles.filterCard}>
              <form action="/users" className={styles.filterForm} method="get">
                <input name="page" type="hidden" value="1" />
                <label className={styles.searchField}>
                  <span className={styles.filterLabel}>搜索关键词</span>
                  <input
                    className={styles.searchInput}
                    defaultValue={data.searchQuery}
                    name="q"
                    placeholder="昵称 / 用户名 / 邮箱"
                    type="search"
                  />
                </label>

                <div className={styles.filterFooter}>
                  <span className={styles.filterHint}>当前已接真实分页与真实 q 搜索，每页展示 {data.pageSize} 条用户。</span>
                  <div className={styles.filterActions}>
                    <Link className={styles.resetButton} href="/users">
                      重置筛选
                    </Link>
                    <button className={styles.primaryAction} type="submit">
                      应用搜索
                    </button>
                  </div>
                </div>
              </form>
            </section>

            <section className={styles.tableCard}>
              {data.users.length > 0 ? (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>用户头像</th>
                          <th>昵称</th>
                          <th>用户ID</th>
                          <th>账号标识</th>
                          <th>角色</th>
                          <th>发布数</th>
                          <th>获赞数</th>
                          <th>最近活跃时间</th>
                          <th>当前状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.map((user) => {
                          const isSelected = user.id === selectedUser?.id;

                          return (
                            <tr
                              key={user.id}
                              className={`${styles.tableRow} ${isSelected ? styles.rowSelected : ""}`}
                              onClick={() => {
                                router.push(
                                  buildUsersHref({
                                    selected: user.id,
                                    q: data.searchQuery,
                                    page: data.currentPage
                                  }),
                                  {
                                    scroll: false
                                  }
                                );
                              }}
                            >
                              <td>
                                <span className={`${styles.avatar} ${avatarToneClass(user.avatarTone)}`}>{user.avatarText}</span>
                              </td>
                              <td className={styles.nameCell}>{user.displayName}</td>
                              <td>{user.userId}</td>
                              <td>{user.accountLabel}</td>
                              <td>
                                <span className={`${styles.rolePill} ${userRoleTone(user.roleLabel)}`}>{user.roleLabel}</span>
                              </td>
                              <td>{user.publishedCount.toLocaleString("en-US")}</td>
                              <td>{user.likesCount.toLocaleString("en-US")}</td>
                              <td>{user.lastActiveAt}</td>
                              <td>
                                <span className={styles.statusInline}>
                                  <span className={`${styles.statusDot} ${userStatusTone(user.statusLabel)}`} />
                                  {user.statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <footer className={styles.tableFooter}>
                    <span className={styles.footerCount}>{data.tableCountLabel}</span>
                    <div className={styles.paginationArea}>
                      <span className={styles.pageSizeButton}>每页 {data.pageSize} 条</span>
                      {data.totalPages > 1 ? (
                        <nav aria-label="用户分页" className={styles.pagination}>
                          <Link
                            className={styles.pageButton}
                            href={buildUsersHref({
                              q: data.searchQuery,
                              page: Math.max(1, data.currentPage - 1)
                            })}
                            scroll={false}
                            aria-disabled={!data.hasPreviousPage}
                            tabIndex={data.hasPreviousPage ? undefined : -1}
                          >
                            上一页
                          </Link>
                          {paginationPages.map((page, index) =>
                            page === "..." ? (
                              <span key={`ellipsis-${data.currentPage}-${index}`} className={styles.pageEllipsis}>
                                ...
                              </span>
                            ) : (
                              <Link
                                key={page}
                                className={`${styles.pageButton} ${page === data.currentPage ? styles.pageButtonActive : ""}`}
                                href={buildUsersHref({
                                  q: data.searchQuery,
                                  page
                                })}
                                scroll={false}
                                aria-current={page === data.currentPage ? "page" : undefined}
                              >
                                {page}
                              </Link>
                            )
                          )}
                          <Link
                            className={styles.pageButton}
                            href={buildUsersHref({
                              q: data.searchQuery,
                              page: Math.min(data.totalPages, data.currentPage + 1)
                            })}
                            scroll={false}
                            aria-disabled={!data.hasNextPage}
                            tabIndex={data.hasNextPage ? undefined : -1}
                          >
                            下一页
                          </Link>
                        </nav>
                      ) : null}
                    </div>
                  </footer>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <strong>{data.emptyMessage}</strong>
                  <span>{data.modeDetail}</span>
                </div>
              )}
            </section>
          </div>

          {selectedDetail && isDetailVisible ? (
            <aside className={styles.detailCard}>
              <header className={styles.detailHeader}>
                <h2>账号详情</h2>
                <button className={styles.closeButton} type="button" onClick={() => setIsDetailVisible(false)}>
                  ×
                </button>
              </header>

              <div className={styles.detailBody}>
                <div className={styles.detailProfile}>
                  <span className={`${styles.detailAvatar} ${avatarToneClass(selectedDetail.avatarTone)}`}>{selectedDetail.avatarText}</span>
                  <div className={styles.detailIdentity}>
                    <div className={styles.detailNameRow}>
                      <strong>{selectedDetail.displayName}</strong>
                      <span className={`${styles.rolePill} ${userRoleTone(selectedDetail.roleLabel)}`}>{selectedDetail.roleLabel}</span>
                    </div>
                    <span className={styles.detailUserId}>用户ID: {selectedDetail.userId}</span>
                  </div>
                </div>

                <dl className={styles.detailGrid}>
                  <div>
                    <dt>账号标识</dt>
                    <dd>{selectedDetail.accountLabel}</dd>
                  </div>
                  <div>
                    <dt>用户名</dt>
                    <dd>{selectedDetail.username}</dd>
                  </div>
                  <div>
                    <dt>注册时间</dt>
                    <dd>{selectedDetail.registrationAt}</dd>
                  </div>
                  <div>
                    <dt>最近登录</dt>
                    <dd>{selectedDetail.lastActiveAt}</dd>
                  </div>
                  <div>
                    <dt>账号状态</dt>
                    <dd className={styles.statusDetail}>
                      <span className={`${styles.statusDot} ${userStatusTone(selectedDetail.statusLabel)}`} />
                      {selectedDetail.statusLabel}
                    </dd>
                  </div>
                  <div>
                    <dt>注册来源</dt>
                    <dd>{selectedDetail.sourceLabel}</dd>
                  </div>
                  <div>
                    <dt>邮箱</dt>
                    <dd>{selectedDetail.emailLabel}</dd>
                  </div>
                  <div>
                    <dt>手机号</dt>
                    <dd>{selectedDetail.phoneLabel}</dd>
                  </div>
                  <div className={styles.detailFull}>
                    <dt>账号备注</dt>
                    <dd>{selectedDetail.note}</dd>
                  </div>
                </dl>

                <div className={styles.statsPanel}>
                  <article className={styles.miniStatCard}>
                    <span>内容发布</span>
                    <strong>{selectedDetail.contentSummary}</strong>
                  </article>
                  <article className={styles.miniStatCard}>
                    <span>互动沉淀</span>
                    <strong>粉丝 {selectedDetail.followerCount} / 获赞 {selectedDetail.likesCount}</strong>
                  </article>
                  <article className={styles.miniStatCard}>
                    <span>治理摘要</span>
                    <strong>{selectedDetail.moderationSummary}</strong>
                  </article>
                  <article className={styles.miniStatCard}>
                    <span>被举报风险</span>
                    <strong>{selectedDetail.openReportsAgainstUser} 条未关闭举报命中该账号内容</strong>
                  </article>
                </div>

                <div className={styles.governanceForm}>
                  <form action={updateUserGovernanceAction} className={styles.formSection}>
                    <input name="userId" type="hidden" value={selectedDetail.id} />
                    <input name="selectedId" type="hidden" value={selectedDetail.id} />
                    <input name="q" type="hidden" value={data.searchQuery} />
                    <input name="page" type="hidden" value={String(data.currentPage)} />

                    <div className={styles.formSectionHeader}>
                      <h3>账号治理</h3>
                      <p>当前已接真实写接口，仅支持角色与状态治理。</p>
                    </div>

                    <div className={styles.formField}>
                      <label htmlFor="user-governance-status">账号状态</label>
                      <select
                        id="user-governance-status"
                        name="statusCode"
                        className={styles.formSelect}
                        disabled={!canManageUsers || data.isFallback}
                        value={statusDraft}
                        onChange={(event) => setStatusDraft(event.target.value)}
                      >
                        {GOVERNANCE_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className={styles.formHint}>当前显示：{selectedStatusLabel}。禁用后现有登录态会被撤销。</span>
                    </div>

                    <div className={styles.formField}>
                      <label htmlFor="user-governance-role">后台角色</label>
                      <select
                        id="user-governance-role"
                        name="roleCode"
                        className={styles.formSelect}
                        disabled={!canManageUsers || data.isFallback}
                        value={roleDraft}
                        onChange={(event) => setRoleDraft(event.target.value)}
                      >
                        {GOVERNANCE_ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className={styles.formHint}>当前显示：{selectedRoleLabel}。仅管理员可授予管理员角色。</span>
                    </div>

                    <div className={styles.capabilityGrid}>
                      <div className={styles.capabilityCard}>
                        <span>登录权限</span>
                        <strong>{selectedDetail.canLogin ? "允许登录" : "已阻断"}</strong>
                      </div>
                      <div className={styles.capabilityCard}>
                        <span>发布权限</span>
                        <strong>{selectedDetail.canPublish ? "允许发布" : "已阻断"}</strong>
                      </div>
                      <div className={styles.capabilityCard}>
                        <span>后台高权治理</span>
                        <strong>{selectedDetail.canManageAdmin ? "允许管理后台能力" : "普通账号口径"}</strong>
                      </div>
                    </div>

                    <div className={styles.formActions}>
                      <button className={styles.primaryAction} disabled={data.isFallback || !canManageUsers} type="submit">
                        保存账号治理
                      </button>
                    </div>
                  </form>

                  <div className={styles.formSection}>
                    <div className={styles.formField}>
                      <label>密码治理</label>
                      <div className={styles.passwordGovernanceCard}>
                        <div className={styles.passwordGovernanceMeta}>
                          <strong>{selectedDetail.passwordActionLabel}</strong>
                          <span>{selectedDetail.passwordHint}</span>
                        </div>
                        <form action={resetPasswordFormAction} className={styles.passwordGovernanceAction}>
                          <input name="userId" type="hidden" value={selectedDetail.id} />
                          <button
                            className={styles.secondaryAction}
                            disabled={
                              data.isFallback ||
                              resetPasswordPending ||
                              !canManageUsers ||
                              (!selectedDetail.canInitializePassword && !selectedDetail.canResetPassword)
                            }
                            type="submit"
                          >
                            {resetPasswordPending ? "处理中..." : selectedDetail.passwordActionLabel}
                          </button>
                        </form>
                      </div>
                      {activePasswordResult.status === "success" && activePasswordResult.temporaryPassword ? (
                        <div className={styles.passwordResultSuccess}>
                          <strong>{activePasswordResult.passwordActionLabel}成功</strong>
                          <span>{activePasswordResult.message}</span>
                          <code>{activePasswordResult.temporaryPassword}</code>
                        </div>
                      ) : null}
                      {activePasswordResult.status === "error" && activePasswordResult.message ? (
                        <div className={styles.passwordResultError}>
                          <strong>密码治理失败</strong>
                          <span>{activePasswordResult.message}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className={styles.recentPanel}>
                  <div className={styles.recentPanelHead}>
                    <div className={styles.formSectionHeader}>
                      <h3>最近内容</h3>
                      <p>展示最近落库的内容摘要，完整列表可单独查看。</p>
                    </div>
                    {selectedDetail.recentContents.length > 4 ? (
                      <button
                        aria-expanded={isRecentModalOpen}
                        aria-haspopup="dialog"
                        className={styles.secondaryAction}
                        type="button"
                        onClick={() => setIsRecentModalOpen(true)}
                      >
                        查看全部 {selectedDetail.recentContents.length} 条
                      </button>
                    ) : null}
                  </div>
                  {data.detailErrorMessage ? (
                    <div className={styles.errorBanner}>
                      <strong>详情降级展示</strong>
                      <span>{data.detailErrorMessage}</span>
                    </div>
                  ) : null}
                  {selectedDetail.recentContents.length > 0 ? (
                    <div className={styles.recentPreviewFrame}>
                      <RecentContentList compact items={selectedDetail.recentContents} />
                    </div>
                  ) : (
                    <div className={styles.emptyState}>当前没有可展示的最近内容。</div>
                  )}
                </div>
              </div>
            </aside>
          ) : data.detailErrorMessage && selectedUser ? (
            <aside className={styles.detailCard}>
              <header className={styles.detailHeader}>
                <h2>账号详情</h2>
                <Link className={styles.closeButton} href={buildUsersHref({ q: data.searchQuery, page: data.currentPage })} scroll={false}>
                  ×
                </Link>
              </header>

              <div className={styles.detailBody}>
                <div className={styles.emptyState}>
                  <strong>当前无法读取账号详情</strong>
                  <span>{data.detailErrorMessage}</span>
                </div>
                <div className={styles.formActions}>
                  <Link
                    className={styles.secondaryAction}
                    href={selectedUserLink}
                    scroll={false}
                  >
                    重新加载详情
                  </Link>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </div>

      {selectedDetail && isRecentModalOpen && selectedDetail.recentContents.length > 0 ? (
        <div className={styles.recentModalScrim} onClick={() => setIsRecentModalOpen(false)}>
          <section
            aria-labelledby="user-recent-content-title"
            aria-modal="true"
            className={styles.recentModal}
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.recentModalHeader}>
              <div className={styles.recentModalTitle}>
                <h2 id="user-recent-content-title">最近内容</h2>
                <p>
                  {selectedDetail.displayName} 近期待治理内容，共 {selectedDetail.recentContents.length} 条。
                </p>
              </div>
              <button
                aria-label="关闭最近内容弹层"
                className={styles.closeButton}
                type="button"
                onClick={() => setIsRecentModalOpen(false)}
              >
                ×
              </button>
            </header>
            <div className={styles.recentModalBody}>
              <RecentContentList items={selectedDetail.recentContents} />
            </div>
          </section>
        </div>
      ) : null}

      {isCreateModalOpen ? <CreateUserModal canAssignAdminRole={canAssignAdminRole} onClose={handleCloseCreateModal} /> : null}
    </section>
  );
}
