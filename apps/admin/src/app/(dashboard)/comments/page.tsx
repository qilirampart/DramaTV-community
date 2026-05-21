import Link from "next/link";
import { requireAdminAccess } from "@/lib/admin-auth";
import { AdminBackendError, listAdminComments, type AdminCommentListData } from "@/lib/admin-service";
import {
  deleteCommentAction,
  hideCommentAction,
  restoreCommentAction,
  toggleCommentTargetSettingsAction
} from "./actions";
import CommentsTableInteractive from "./CommentsTableInteractive";
import styles from "./page.module.css";

type Metric = {
  label: string;
  value: string;
  delta: string;
  kind: "today" | "reported" | "hidden" | "closed";
};

type CommentStatusTone = "normal" | "reported" | "hidden";
type RiskTone = "normal" | "suspect" | "high";
type ContentType = "帖子" | "视频作品" | "视频提示词" | "图片提示词" | "工作流" | "提示词";
type AvatarTone = "black" | "stone" | "navy" | "amber";
type CommentItem = AdminCommentListData["items"][number];

type CommentRow = {
  id: string;
  author: string;
  avatarText: string;
  avatarTone: AvatarTone;
  content: string;
  replyTo: string;
  targetTitle: string;
  targetType: ContentType;
  publishedAt: string;
  status: string;
  statusTone: CommentStatusTone;
  risk: string;
  riskTone: RiskTone;
};

type ThreadItem = {
  author: string;
  text: string;
  time: string;
  tone: AvatarTone;
};

type GovernanceLog = {
  time: string;
  title: string;
  description: string;
};

type CommentFilters = {
  q: string;
  status: string;
  targetType: string;
  reportedOnly: string;
};

type PageData = {
  hasError: boolean;
  modeTitle: string;
  modeDetail: string;
  metrics: readonly Metric[];
  commentRows: readonly CommentRow[];
  commentItems: readonly CommentItem[];
  defaultSelectedId: string | null;
  totalCountLabel: string;
  emptyMessage: string | null;
};

const ZERO_METRICS: readonly Metric[] = [
  { label: "今日新增评论", value: "0", delta: "当前实时数据", kind: "today" },
  { label: "被举报评论", value: "0", delta: "当前实时数据", kind: "reported" },
  { label: "已隐藏评论", value: "0", delta: "当前实时数据", kind: "hidden" },
  { label: "已关闭评论区内容", value: "0", delta: "当前实时数据", kind: "closed" }
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "全部评论状态" },
  { value: "active", label: "正常" },
  { value: "hidden", label: "已隐藏" },
  { value: "deleted", label: "已删除" },
  { value: "reported", label: "待处理举报" }
] as const;

const TARGET_TYPE_FILTER_OPTIONS = [
  { value: "", label: "全部目标类型" },
  { value: "post", label: "帖子" },
  { value: "video", label: "视频作品" },
  { value: "workflow", label: "工作流" },
  { value: "prompt", label: "提示词" }
] as const;

const REPORTED_ONLY_FILTER_OPTIONS = [
  { value: "", label: "全部治理范围" },
  { value: "true", label: "仅看未关闭举报" }
] as const;

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

function normalizeFilterValue(value: string | null | undefined) {
  return value?.trim() || "";
}

function readFilters(searchParams?: {
  q?: string;
  status?: string;
  targetType?: string;
  reportedOnly?: string;
}) {
  return {
    q: normalizeFilterValue(searchParams?.q),
    status: normalizeFilterValue(searchParams?.status),
    targetType: normalizeFilterValue(searchParams?.targetType),
    reportedOnly: normalizeFilterValue(searchParams?.reportedOnly)
  };
}

function hasActiveFilters(filters: CommentFilters) {
  return Boolean(filters.q || filters.status || filters.targetType || filters.reportedOnly);
}

function buildCommentsHref(
  filters: CommentFilters,
  options?: {
    selected?: string | null;
    error?: string | null;
  }
) {
  const searchParams = new URLSearchParams();

  if (options?.selected?.trim()) {
    searchParams.set("selected", options.selected.trim());
  }
  if (filters.q) {
    searchParams.set("q", filters.q);
  }
  if (filters.status) {
    searchParams.set("status", filters.status);
  }
  if (filters.targetType) {
    searchParams.set("targetType", filters.targetType);
  }
  if (filters.reportedOnly) {
    searchParams.set("reportedOnly", filters.reportedOnly);
  }
  if (options?.error?.trim()) {
    searchParams.set("error", options.error.trim());
  }

  const query = searchParams.toString();
  return query ? `/comments?${query}` : "/comments";
}

function avatarToneForIndex(index: number): AvatarTone {
  return (["black", "stone", "navy", "amber"] as const)[index % 4];
}

function targetTypeLabel(item: CommentItem): ContentType {
  if (item.targetType === "post") {
    return "帖子";
  }
  if (item.targetType === "workflow") {
    return "工作流";
  }
  if (item.targetType === "video") {
    return "视频作品";
  }
  if (item.targetType === "prompt" && item.targetPromptModality === "image") {
    return "图片提示词";
  }
  if (item.targetType === "prompt" && item.targetPromptModality === "video") {
    return "视频提示词";
  }
  return "提示词";
}

function statusMeta(item: CommentItem) {
  if (item.statusCode === "hidden") {
    return {
      status: "已隐藏",
      statusTone: "hidden" as const,
      actionLabel: "查看详情"
    };
  }
  if (item.statusCode === "deleted") {
    return {
      status: "已删除",
      statusTone: "hidden" as const,
      actionLabel: "查看详情"
    };
  }
  if (item.openReportCount > 0) {
    return {
      status: "待处理",
      statusTone: "reported" as const,
      actionLabel: "查看详情"
    };
  }
  return {
    status: "正常",
    statusTone: "normal" as const,
    actionLabel: "查看详情"
  };
}

function riskMeta(item: CommentItem) {
  if (item.riskLevel === "high") {
    return {
      risk: "高风险",
      riskTone: "high" as const
    };
  }
  if (item.riskLevel === "suspect") {
    return {
      risk: "疑似违规",
      riskTone: "suspect" as const
    };
  }
  return {
    risk: "正常",
    riskTone: "normal" as const
  };
}

function mapCommentRow(item: CommentItem, index: number): CommentRow {
  const status = statusMeta(item);
  const risk = riskMeta(item);
  const avatarText = item.authorDisplayName.slice(0, 2) || item.authorId.slice(0, 2).toUpperCase();

  return {
    id: item.id,
    author: item.authorDisplayName,
    avatarText,
    avatarTone: avatarToneForIndex(index),
    content: item.contentText,
    replyTo: item.parentAuthorDisplayName ? `回复：${item.parentAuthorDisplayName}` : "—",
    targetTitle: item.targetTitle,
    targetType: targetTypeLabel(item),
    publishedAt: formatDateTime(item.createdAt),
    status: status.status,
    statusTone: status.statusTone,
    risk: risk.risk,
    riskTone: risk.riskTone
  };
}

function buildThreadItems(item: CommentItem, row: CommentRow): readonly ThreadItem[] {
  const items: ThreadItem[] = [];

  if (item.parentContentText) {
    items.push({
      author: item.parentAuthorDisplayName ? `上级：${item.parentAuthorDisplayName}` : "上级评论",
      text: item.parentContentText,
      time: row.publishedAt.slice(-5),
      tone: "stone"
    });
  }

  items.push({
    author: "当前评论",
    text: row.content,
    time: row.publishedAt.slice(-5),
    tone: row.avatarTone
  });

  if (item.reportCount > 0) {
    items.push({
      author: "治理提示",
      text: `累计举报 ${item.reportCount} 条，未关闭 ${item.openReportCount} 条${item.targetCommentsEnabled ? "" : "，目标评论区当前已关闭"}。`,
      time: row.publishedAt.slice(-5),
      tone: "amber"
    });
  }

  return items;
}

function buildGovernanceLogs(item: CommentItem, row: CommentRow): readonly GovernanceLog[] {
  const time = row.publishedAt.slice(-5);
  const logs: GovernanceLog[] = [
    {
      time,
      title: "评论进入治理视图",
      description: `当前状态：${row.status}，风险等级：${row.risk}。`
    }
  ];

  if (item.openReportCount > 0) {
    logs.push({
      time,
      title: "已关联未关闭举报",
      description: `累计举报 ${item.reportCount} 条，其中未关闭 ${item.openReportCount} 条。`
    });
  } else if (item.reportCount > 0) {
    logs.push({
      time,
      title: "存在历史举报记录",
      description: `累计举报 ${item.reportCount} 条，当前没有未关闭举报工单。`
    });
  }

  if (item.latestReportReasonCode) {
    logs.push({
      time,
      title: "最新举报原因",
      description: `reasonCode: ${item.latestReportReasonCode}`
    });
  }

  logs.push({
    time,
    title: item.targetCommentsEnabled ? "目标评论区保持开启" : "目标评论区已关闭",
    description: `目标类型：${targetTypeLabel(item)} · ${item.targetTitle}`
  });

  return logs;
}

function buildMetrics(summary: AdminCommentListData["summary"]): readonly Metric[] {
  return [
    {
      label: "今日新增评论",
      value: formatMetricValue(summary.todayComments),
      delta: "当前实时数据",
      kind: "today"
    },
    {
      label: "被举报评论",
      value: formatMetricValue(summary.reportedComments),
      delta: "打开工单",
      kind: "reported"
    },
    {
      label: "已隐藏评论",
      value: formatMetricValue(summary.hiddenComments),
      delta: "当前状态",
      kind: "hidden"
    },
    {
      label: "已关闭评论区内容",
      value: formatMetricValue(summary.closedTargets),
      delta: "命中目标",
      kind: "closed"
    }
  ];
}

async function loadPageData(filters: CommentFilters): Promise<PageData> {
  try {
    const response = await listAdminComments({
      q: filters.q,
      status: filters.status,
      targetType: filters.targetType,
      reportedOnly: filters.reportedOnly === "true"
    });

    const rows = response.data.items.map((item, index) => mapCommentRow(item, index));
    const selected =
      response.data.items.find((item) => item.openReportCount > 0 || item.statusCode === "hidden") ??
      response.data.items[0] ??
      null;

    if (rows.length === 0) {
      return {
        hasError: false,
        modeTitle: "当前为实时评论治理数据",
        modeDetail: hasActiveFilters(filters)
          ? "当前筛选条件已走真实后端查询，但没有匹配到对应评论。"
          : "admin/comments 已接入真实后端，但当前库里还没有可展示的评论记录。",
        metrics: buildMetrics(response.data.summary),
        commentRows: rows,
        commentItems: response.data.items,
        defaultSelectedId: null,
        totalCountLabel: "共 0 条",
        emptyMessage: hasActiveFilters(filters) ? "当前筛选条件下没有匹配的评论记录。" : "当前还没有可展示的评论记录。"
      };
    }

    return {
      hasError: false,
      modeTitle: "当前为实时评论治理数据",
      modeDetail: "评论列表、治理动作与 q / 状态 / 目标类型 / 举报范围筛选都已接入真实后端。",
      metrics: buildMetrics(response.data.summary),
      commentRows: rows,
      commentItems: response.data.items,
      defaultSelectedId: selected?.id ?? null,
      totalCountLabel: `共 ${formatMetricValue(response.data.items.length)} 条`,
      emptyMessage: null
    };
  } catch (error) {
    const requestId =
      error instanceof AdminBackendError && error.requestId
        ? `requestId: ${error.requestId}`
        : "评论接口读取异常";

    return {
      hasError: true,
      modeTitle: "评论数据读取失败",
      modeDetail: `${requestId}，当前不再回退展示占位评论数据，请先排查真实后端请求。`,
      metrics: ZERO_METRICS,
      commentRows: [],
      commentItems: [],
      defaultSelectedId: null,
      totalCountLabel: "共 0 条",
      emptyMessage: "当前无法读取评论记录，请稍后重试。"
    };
  }
}

function MetricIcon({ kind }: { kind: Metric["kind"] }) {
  if (kind === "today") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M4 10c0-3.2 2.72-5.8 6-5.8 3.29 0 6 2.6 6 5.8 0 3.21-2.71 5.8-6 5.8A6.01 6.01 0 0 1 4 10Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 7.3v3.1l2 1.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "reported") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 4.25 16 15H4l6-10.75Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M10 8v3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="10" cy="13.2" fill="currentColor" r="0.85" />
      </svg>
    );
  }

  if (kind === "hidden") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M2.75 10s2.5-4.25 7.25-4.25c1.45 0 2.7.4 3.78.97 2.11 1.11 3.47 3.28 3.47 3.28S14.75 14.25 10 14.25c-1.45 0-2.7-.4-3.78-.97C4.11 12.17 2.75 10 2.75 10Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M4 4l12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.5" width="9" x="5.5" y="7" />
      <path d="M7.5 7V5.75A2.5 2.5 0 0 1 10 3.25a2.5 2.5 0 0 1 2.5 2.5V7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function avatarToneClass(tone: AvatarTone) {
  if (tone === "stone") {
    return styles.avatarStone;
  }
  if (tone === "navy") {
    return styles.avatarNavy;
  }
  if (tone === "amber") {
    return styles.avatarAmber;
  }
  return styles.avatarBlack;
}

function targetTone(type: ContentType) {
  if (type === "视频提示词" || type === "视频作品" || type === "提示词") {
    return styles.typeVideo;
  }
  if (type === "图片提示词") {
    return styles.typeImage;
  }
  if (type === "工作流") {
    return styles.typeWorkflow;
  }
  return styles.typePost;
}

function statusToneClass(tone: CommentStatusTone) {
  if (tone === "hidden") {
    return styles.statusHidden;
  }
  if (tone === "reported") {
    return styles.statusReported;
  }
  return styles.statusNormal;
}

function riskToneClass(tone: RiskTone) {
  if (tone === "high") {
    return styles.riskHigh;
  }
  if (tone === "suspect") {
    return styles.riskSuspect;
  }
  return styles.riskNormal;
}

function SelectChevron() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path d="M4 6.25 8 10l4-3.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export default async function CommentsPage({
  searchParams
}: {
  searchParams?: Promise<{
    selected?: string;
    error?: string;
    q?: string;
    status?: string;
    targetType?: string;
    reportedOnly?: string;
  }>;
}) {
  await requireAdminAccess(["admin", "moderator"], "/comments");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = readFilters(resolvedSearchParams);
  const pageData = await loadPageData(filters);
  const forcedSelectedId = resolvedSearchParams?.selected?.trim() || "";
  const selectedComment =
    pageData.commentRows.find((item) => item.id === forcedSelectedId) ??
    pageData.commentRows.find((item) => item.id === pageData.defaultSelectedId) ??
    pageData.commentRows[0] ??
    null;
  const selectedItem = pageData.commentItems.find((item) => item.id === selectedComment?.id) ?? null;
  const selectedThreadItems = selectedItem && selectedComment ? buildThreadItems(selectedItem, selectedComment) : [];
  const governanceLogs = selectedItem && selectedComment ? buildGovernanceLogs(selectedItem, selectedComment) : [];
  const errorMessage = resolvedSearchParams?.error?.trim() || null;
  const targetCommentsEnabled = selectedItem?.targetCommentsEnabled ?? true;
  const canHide = !pageData.hasError && !!selectedItem && selectedItem.statusCode !== "hidden" && selectedItem.statusCode !== "deleted";
  const canRestore = !pageData.hasError && !!selectedItem && selectedItem.statusCode === "hidden";
  const canDelete = !pageData.hasError && !!selectedItem && selectedItem.statusCode !== "deleted";

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>评论治理</h1>
          <p className={styles.subtitle}>管理评论内容、回复关系与评论区开关</p>
        </div>

      </header>

      {errorMessage ? (
        <div className={styles.errorBanner}>
          <strong>治理动作失败</strong>
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.metricsGrid}>
            {pageData.metrics.map((metric) => (
              <article key={metric.label} className={styles.metricCard}>
                <div className={styles.metricHead}>
                  <span className={styles.metricIcon}>
                    <MetricIcon kind={metric.kind} />
                  </span>
                  <span>{metric.label}</span>
                </div>
                <strong className={styles.metricValue}>{metric.value}</strong>
                <span className={styles.metricDelta}>{metric.delta}</span>
              </article>
            ))}
          </section>

          <section className={styles.filterCard}>
            <form action="/comments" className={styles.filterForm} method="get">
              <div className={styles.filterGrid}>
                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>搜索关键词</span>
                  <input
                    className={styles.textInput}
                    defaultValue={filters.q}
                    name="q"
                    placeholder="评论内容 / 作者昵称 / 目标标题"
                    type="search"
                  />
                </label>

                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>评论状态</span>
                  <div className={styles.selectWrap}>
                    <select className={styles.selectControl} defaultValue={filters.status} name="status">
                      {STATUS_FILTER_OPTIONS.map((item) => (
                        <option key={item.value || "all-status"} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <span className={styles.selectIcon}>
                      <SelectChevron />
                    </span>
                  </div>
                </label>

                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>目标内容类型</span>
                  <div className={styles.selectWrap}>
                    <select className={styles.selectControl} defaultValue={filters.targetType} name="targetType">
                      {TARGET_TYPE_FILTER_OPTIONS.map((item) => (
                        <option key={item.value || "all-target-types"} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <span className={styles.selectIcon}>
                      <SelectChevron />
                    </span>
                  </div>
                </label>

                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>举报范围</span>
                  <div className={styles.selectWrap}>
                    <select className={styles.selectControl} defaultValue={filters.reportedOnly} name="reportedOnly">
                      {REPORTED_ONLY_FILTER_OPTIONS.map((item) => (
                        <option key={item.value || "all-governance"} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <span className={styles.selectIcon}>
                      <SelectChevron />
                    </span>
                  </div>
                </label>
              </div>

              <div className={styles.filterFooter}>
                <span className={styles.filterHint}>{pageData.modeDetail}</span>
                <div className={styles.filterActions}>
                  <a className={styles.resetButton} href="/comments">
                    重置筛选
                  </a>
                  <button className={styles.primaryAction} type="submit">
                    应用筛选
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className={styles.tableCard}>
            <header className={styles.tableHeader}>
              <h2>评论列表</h2>
            </header>

            {pageData.commentRows.length > 0 ? (
              <>
                <CommentsTableInteractive>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>评论作者</th>
                          <th>评论内容摘要</th>
                          <th>回复关系</th>
                          <th>目标内容标题</th>
                          <th>内容类型</th>
                          <th>发布时间</th>
                          <th>当前状态</th>
                          <th>风险提示</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.commentRows.map((comment) => {
                          const rowHref = buildCommentsHref(filters, { selected: comment.id });
                          const isSelected = comment.id === selectedComment?.id;

                          return (
                            <tr
                              key={comment.id}
                              aria-selected={isSelected}
                              className={`${styles.tableRow} ${isSelected ? styles.rowSelected : ""}`}
                              data-row-href={rowHref}
                              tabIndex={0}
                            >
                              <td>
                                <div className={styles.authorCell}>
                                  <span className={`${styles.avatar} ${avatarToneClass(comment.avatarTone)}`}>{comment.avatarText}</span>
                                  <span className={styles.authorName}>{comment.author}</span>
                                </div>
                              </td>
                              <td className={styles.contentCell}>{comment.content}</td>
                              <td>{comment.replyTo}</td>
                              <td>{comment.targetTitle}</td>
                              <td>
                                <span className={`${styles.typePill} ${targetTone(comment.targetType)}`}>{comment.targetType}</span>
                              </td>
                              <td>{comment.publishedAt}</td>
                              <td>
                                <span className={`${styles.statusPill} ${statusToneClass(comment.statusTone)}`}>{comment.status}</span>
                              </td>
                              <td>
                                <span className={`${styles.riskPill} ${riskToneClass(comment.riskTone)}`}>{comment.risk}</span>
                              </td>
                              <td>
                                <span className={styles.rowAssist}>{isSelected ? "当前查看中" : "点击行查看"}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CommentsTableInteractive>

                <footer className={styles.tableFooter}>
                  <span className={styles.count}>{pageData.totalCountLabel}</span>
                  <span className={styles.pageSizeButton}>固定最近 80 条</span>
                </footer>
              </>
            ) : (
              <div className={styles.emptyState}>
                <strong>{pageData.emptyMessage}</strong>
                <span>{pageData.modeDetail}</span>
              </div>
            )}
          </section>
        </div>

        <aside className={styles.drawer}>
          <header className={styles.drawerHeader}>
            <div className={styles.drawerTitleRow}>
              <h2>评论上下文</h2>
              {selectedComment ? (
                <span className={`${styles.statusPill} ${statusToneClass(selectedComment.statusTone)}`}>{selectedComment.status}</span>
              ) : null}
            </div>
            <Link className={styles.drawerClose} href={buildCommentsHref(filters)} scroll={false}>
              ×
            </Link>
          </header>

          {selectedComment && selectedItem ? (
            <div className={styles.drawerBody}>
              <section className={styles.commentCard}>
                <div className={styles.commentTop}>
                  <div className={styles.authorCell}>
                    <span className={`${styles.avatar} ${avatarToneClass(selectedComment.avatarTone)}`}>{selectedComment.avatarText}</span>
                    <div className={styles.commentMeta}>
                      <strong>{selectedComment.author}</strong>
                      <span>评论 ID：{selectedComment.id}</span>
                    </div>
                  </div>
                </div>
                <p className={styles.selectedComment}>{selectedComment.content}</p>
              </section>

              <section className={styles.section}>
                <h3>目标内容</h3>
                <div className={styles.targetCard}>
                  <span className={`${styles.typePill} ${targetTone(selectedComment.targetType)}`}>{selectedComment.targetType}</span>
                  <strong>{selectedComment.targetTitle}</strong>
                  <div className={styles.targetMeta}>
                    <span>评论作者：{selectedComment.author}</span>
                    <span>
                      举报 {selectedItem.reportCount} / 未关闭 {selectedItem.openReportCount}
                    </span>
                    <span>{selectedItem.targetCommentsEnabled ? "评论区已开启" : "评论区已关闭"}</span>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <h3>评论上下文（{selectedThreadItems.length} 条）</h3>
                <div className={styles.threadList}>
                  {selectedThreadItems.map((item) => (
                    <article key={`${item.author}-${item.time}-${item.text.slice(0, 12)}`} className={styles.threadItem}>
                      <div className={styles.threadTop}>
                        <div className={styles.authorCell}>
                          <span className={`${styles.avatarSmall} ${avatarToneClass(item.tone)}`} />
                          <strong>{item.author}</strong>
                        </div>
                        <span className={styles.threadTime}>{item.time}</span>
                      </div>
                      <p>{item.text}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h3>治理记录</h3>
                <div className={styles.logList}>
                  {governanceLogs.map((item) => (
                    <article key={`${item.time}-${item.title}`} className={styles.logItem}>
                      <span className={styles.logDot} />
                      <div className={styles.logBody}>
                        <strong>
                          {item.time} · {item.title}
                        </strong>
                        <p>{item.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.noteBox}>
                  <span>当前侧栏只展示真实评论上下文与治理摘要，不再伪装审计备注和占位流水。</span>
                  <span className={styles.noteCount}>已连接真实后端</span>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.actionGroup}>
                  <form action={hideCommentAction} className={styles.actionForm}>
                    <input name="commentId" type="hidden" value={selectedComment.id} />
                    <input name="selectedId" type="hidden" value={selectedComment.id} />
                    <input name="q" type="hidden" value={filters.q} />
                    <input name="status" type="hidden" value={filters.status} />
                    <input name="filterTargetType" type="hidden" value={filters.targetType} />
                    <input name="reportedOnly" type="hidden" value={filters.reportedOnly} />
                    <button className={styles.secondaryAction} disabled={!canHide} type="submit">
                      隐藏评论
                    </button>
                  </form>
                  <form action={restoreCommentAction} className={styles.actionForm}>
                    <input name="commentId" type="hidden" value={selectedComment.id} />
                    <input name="selectedId" type="hidden" value={selectedComment.id} />
                    <input name="q" type="hidden" value={filters.q} />
                    <input name="status" type="hidden" value={filters.status} />
                    <input name="filterTargetType" type="hidden" value={filters.targetType} />
                    <input name="reportedOnly" type="hidden" value={filters.reportedOnly} />
                    <button className={styles.secondaryAction} disabled={!canRestore} type="submit">
                      恢复评论
                    </button>
                  </form>
                  <form action={deleteCommentAction} className={styles.actionForm}>
                    <input name="commentId" type="hidden" value={selectedComment.id} />
                    <input name="selectedId" type="hidden" value={selectedComment.id} />
                    <input name="q" type="hidden" value={filters.q} />
                    <input name="status" type="hidden" value={filters.status} />
                    <input name="filterTargetType" type="hidden" value={filters.targetType} />
                    <input name="reportedOnly" type="hidden" value={filters.reportedOnly} />
                    <button className={styles.dangerAction} disabled={!canDelete} type="submit">
                      删除评论
                    </button>
                  </form>
                  <Link className={styles.secondaryActionLink} href={buildCommentsHref(filters, { selected: selectedComment.id })} scroll={false}>
                    刷新
                  </Link>
                </div>
              </section>

              <section className={styles.section}>
                <h3>评论区开关</h3>
                <div className={styles.switchCard}>
                  <div className={styles.switchRow}>
                    <span className={styles.switchLabel}>当前状态：{targetCommentsEnabled ? "已开启" : "已关闭"}</span>
                    <span className={styles.switchControl}>
                      <span className={`${styles.switchTrack} ${!targetCommentsEnabled ? styles.switchTrackOff : ""}`}>
                        <span className={`${styles.switchThumb} ${!targetCommentsEnabled ? styles.switchThumbOff : ""}`} />
                      </span>
                    </span>
                  </div>
                  <div className={styles.switchMeta}>
                    <span>目标类型：{targetTypeLabel(selectedItem)}</span>
                    <span>目标 ID：{selectedItem.targetId}</span>
                    <span>该开关已接入真实后端设置接口</span>
                  </div>
                  <form action={toggleCommentTargetSettingsAction} className={styles.actionForm}>
                    <input name="selectedId" type="hidden" value={selectedComment.id} />
                    <input name="q" type="hidden" value={filters.q} />
                    <input name="status" type="hidden" value={filters.status} />
                    <input name="filterTargetType" type="hidden" value={filters.targetType} />
                    <input name="reportedOnly" type="hidden" value={filters.reportedOnly} />
                    <input name="targetType" type="hidden" value={selectedItem.targetType} />
                    <input name="targetId" type="hidden" value={selectedItem.targetId} />
                    <input name="nextState" type="hidden" value={targetCommentsEnabled ? "disable" : "enable"} />
                    <button className={styles.secondaryAction} type="submit">
                      {targetCommentsEnabled ? "关闭该内容评论区" : "重新开启该内容评论区"}
                    </button>
                  </form>
                </div>
              </section>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>{pageData.commentRows.length === 0 ? "暂无可查看的评论详情" : "请选择一条评论"}</strong>
              <span>{pageData.modeDetail}</span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
