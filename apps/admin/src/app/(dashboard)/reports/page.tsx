import Link from "next/link";
import { requireAdminAccess } from "@/lib/admin-auth";
import {
  AdminBackendError,
  getAdminReport,
  listAdminReports,
  type AdminReportDetailData,
  type AdminReportListData
} from "@/lib/admin-service";
import {
  closeReportAction,
  hideReportedCommentAction,
  markProcessingReportAction,
  offlineReportTargetAction
} from "./actions";
import { resolveFeedOpsMediaUrl } from "../feed-ops/shared/feed-ops-media";
import ReportsMediaPreview from "./ReportsMediaPreview";
import ReportsTableInteractive from "./ReportsTableInteractive";
import styles from "./page.module.css";

const PAGE_SIZE = 15;

type Metric = {
  label: string;
  value: string;
  delta: string;
  kind: "pending" | "high" | "new" | "closed";
};

type TicketStatusTone = "pending" | "processing" | "resolved" | "closed";
type RiskTone = "low" | "medium" | "high";
type TargetType = "帖子" | "评论" | "视频提示词" | "图片提示词" | "工作流" | "视频作品";

type ReportTicket = {
  id: string;
  targetTypeCode: "video" | "workflow" | "prompt" | "post" | "comment";
  targetId: string;
  targetType: TargetType;
  contentSummary: string;
  targetActor: string;
  reason: string;
  createdAt: string;
  status: string;
  statusTone: TicketStatusTone;
  risk: string;
  riskTone: RiskTone;
  assignee: string;
  evidenceTone: "post" | "comment" | "video" | "image" | "workflow";
  reportDescription: string;
  moderationSuggestion: string;
  targetStatusCode: string;
};

type ReportDetail = {
  id: string;
  targetTypeCode: ReportTicket["targetTypeCode"];
  targetId: string;
  targetType: TargetType;
  contentSummary: string;
  targetActor: string;
  targetCoverUrl: string | null;
  targetPosterUrl: string | null;
  targetPreviewUrl: string | null;
  targetSourceUrl: string | null;
  reporter: string;
  reporterId: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  statusTone: TicketStatusTone;
  risk: string;
  riskTone: RiskTone;
  assignee: string;
  reportDescription: string;
  resultNote: string;
  evidenceTone: ReportTicket["evidenceTone"];
  evidencePreview: readonly string[];
  excerpt: string;
  targetStatusCode: string;
  canOfflineTarget: boolean;
  canHideComment: boolean;
  timelineEntries: readonly {
    time: string;
    actor: string;
    action: string;
  }[];
};

type PageData = {
  hasError: boolean;
  modeTitle: string;
  modeDetail: string;
  metrics: readonly Metric[];
  rows: readonly ReportTicket[];
  defaultSelectedId: string | null;
  totalCountLabel: string;
  emptyMessage: string | null;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
};

type ReportFilters = {
  q: string;
  status: string;
  targetType: string;
  reason: string;
  page: number;
};

const ZERO_METRICS: readonly Metric[] = [
  { label: "打开工单", value: "0", delta: "待处理 + 处理中", kind: "pending" },
  { label: "高风险举报", value: "0", delta: "当前实时数据", kind: "high" },
  { label: "今日新增举报", value: "0", delta: "当前实时数据", kind: "new" },
  { label: "已处理 / 归档", value: "0", delta: "当前实时数据", kind: "closed" }
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "processing", label: "处理中" },
  { value: "resolved", label: "已处理" },
  { value: "closed", label: "已归档" }
] as const;

const TARGET_FILTER_OPTIONS = [
  { value: "", label: "全部对象" },
  { value: "post", label: "帖子" },
  { value: "comment", label: "评论" },
  { value: "prompt", label: "提示词" },
  { value: "workflow", label: "工作流" },
  { value: "video", label: "视频作品" }
] as const;

const REASON_FILTER_OPTIONS = [
  { value: "", label: "全部原因" },
  { value: "pornographic", label: "色情低俗" },
  { value: "political", label: "政治敏感" },
  { value: "spam", label: "垃圾广告" },
  { value: "abuse", label: "骚扰辱骂" },
  { value: "copyright", label: "侵权" },
  { value: "misleading", label: "误导信息" },
  { value: "other", label: "其他" }
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

function typeLabel(item: AdminReportListData["items"][number]): TargetType {
  if (item.targetType === "workflow") {
    return "工作流";
  }
  if (item.targetType === "post") {
    return "帖子";
  }
  if (item.targetType === "comment") {
    return "评论";
  }
  if (item.targetType === "video") {
    return "视频作品";
  }
  if (item.targetType === "prompt") {
    return item.targetPromptModality === "image" ? "图片提示词" : "视频提示词";
  }
  return "视频作品";
}

function evidenceTone(type: TargetType): ReportTicket["evidenceTone"] {
  if (type === "评论") {
    return "comment";
  }
  if (type === "视频提示词" || type === "视频作品") {
    return "video";
  }
  if (type === "图片提示词") {
    return "image";
  }
  if (type === "工作流") {
    return "workflow";
  }
  return "post";
}

function statusMeta(code: string) {
  if (code === "processing") {
    return { status: "处理中", tone: "processing" as const };
  }
  if (code === "resolved") {
    return { status: "已处理", tone: "resolved" as const };
  }
  if (code === "closed") {
    return { status: "已归档", tone: "closed" as const };
  }
  return { status: "待处理", tone: "pending" as const };
}

function riskMeta(level?: string | null) {
  if (level === "high") {
    return { risk: "高风险", tone: "high" as const };
  }
  if (level === "medium") {
    return { risk: "中风险", tone: "medium" as const };
  }
  return { risk: "低风险", tone: "low" as const };
}

function reasonLabel(code: string) {
  switch (code) {
    case "pornographic":
      return "色情低俗";
    case "political":
      return "政治敏感";
    case "spam":
      return "垃圾广告";
    case "abuse":
      return "骚扰辱骂";
    case "copyright":
      return "侵权";
    case "misleading":
      return "误导信息";
    default:
      return "其他";
  }
}

function suggestionLabel(item: { targetType: string }) {
  if (item.targetType === "comment") {
    return "联动处理建议：隐藏评论后标记已处理";
  }
  return "联动处理建议：下线内容后标记已处理";
}

function mapRow(item: AdminReportListData["items"][number]): ReportTicket {
  const status = statusMeta(item.statusCode);
  const risk = riskMeta(item.riskLevel);
  const targetType = typeLabel(item);

  return {
    id: item.id,
    targetTypeCode: item.targetType as ReportTicket["targetTypeCode"],
    targetId: item.targetId,
    targetType,
    contentSummary: item.targetTitle,
    targetActor: item.targetAuthorDisplayName,
    reason: reasonLabel(item.reasonCode),
    createdAt: formatDateTime(item.createdAt),
    status: status.status,
    statusTone: status.tone,
    risk: risk.risk,
    riskTone: risk.tone,
    assignee: item.assigneeDisplayName ?? "—",
    evidenceTone: evidenceTone(targetType),
    reportDescription: item.descriptionText?.trim() || "举报人未填写额外说明。",
    moderationSuggestion: suggestionLabel(item),
    targetStatusCode: item.targetStatusCode
  };
}

function mapDetail(detail: AdminReportDetailData): ReportDetail {
  const targetType = typeLabel({
    targetType: detail.targetType,
    targetPromptModality: detail.targetPromptModality
  } as AdminReportListData["items"][number]);
  const status = statusMeta(detail.statusCode);
  const risk = riskMeta(detail.riskLevel);
  const tone = evidenceTone(targetType);

  return {
    id: detail.id,
    targetTypeCode: detail.targetType as ReportTicket["targetTypeCode"],
    targetId: detail.targetId,
    targetType,
    contentSummary: detail.targetTitle,
    targetActor: detail.targetAuthorDisplayName,
    targetCoverUrl: resolveFeedOpsMediaUrl(detail.targetCoverUrl) ?? null,
    targetPosterUrl: resolveFeedOpsMediaUrl(detail.targetPosterUrl) ?? null,
    targetPreviewUrl: resolveFeedOpsMediaUrl(detail.targetPreviewUrl) ?? null,
    targetSourceUrl: resolveFeedOpsMediaUrl(detail.targetSourceUrl) ?? null,
    reporter: detail.reporterDisplayName,
    reporterId: detail.reporterId,
    reason: reasonLabel(detail.reasonCode),
    createdAt: formatDateTime(detail.createdAt),
    updatedAt: formatDateTime(detail.updatedAt),
    status: status.status,
    statusTone: status.tone,
    risk: risk.risk,
    riskTone: risk.tone,
    assignee: detail.assigneeDisplayName ?? "—",
    reportDescription: detail.descriptionText?.trim() || "举报人未填写额外说明。",
    resultNote: detail.resultNote?.trim() || "当前暂无处理备注。",
    evidenceTone: tone,
    evidencePreview:
      tone === "comment"
        ? ["评论正文", "上下文", "举报记录"]
        : tone === "workflow"
          ? ["节点图", "说明文", "处理记录"]
          : tone === "image"
            ? ["封面图", "截图 2", "处理记录"]
            : ["封面", "上下文", "处理记录"],
    excerpt: detail.targetExcerptText?.trim() || detail.targetTitle,
    targetStatusCode: detail.targetStatusCode,
    canOfflineTarget: detail.canOfflineTarget,
    canHideComment: detail.canHideComment,
    timelineEntries: detail.timelineEntries.map((entry) => ({
      time: formatDateTime(entry.happenedAt),
      actor: entry.actorDisplayName,
      action: entry.actionText
    }))
  };
}

function normalizeFilterValue(value: string | null | undefined) {
  return value?.trim() || "";
}

function normalizePageValue(value: string | null | undefined) {
  const parsed = Number.parseInt(value?.trim() || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function readFilters(searchParams?: {
  q?: string;
  status?: string;
  targetType?: string;
  reason?: string;
  page?: string;
}): ReportFilters {
  return {
    q: normalizeFilterValue(searchParams?.q),
    status: normalizeFilterValue(searchParams?.status),
    targetType: normalizeFilterValue(searchParams?.targetType),
    reason: normalizeFilterValue(searchParams?.reason),
    page: normalizePageValue(searchParams?.page)
  };
}

function hasActiveFilters(filters: ReportFilters) {
  return Boolean(filters.q || filters.status || filters.targetType || filters.reason);
}

function buildReportsHref(
  filters: ReportFilters,
  options?: {
    selected?: string | null;
    page?: number | null;
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
  if (filters.reason) {
    searchParams.set("reason", filters.reason);
  }
  const nextPage = typeof options?.page === "number" && options.page > 0 ? options.page : filters.page;
  if (nextPage > 1) {
    searchParams.set("page", String(nextPage));
  }

  const query = searchParams.toString();
  return query ? `/reports?${query}` : "/reports";
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

function buildMetrics(summary: AdminReportListData["summary"]): readonly Metric[] {
  return [
    {
      label: "打开工单",
      value: formatMetricValue(summary.pendingTickets),
      delta: "待处理 + 处理中",
      kind: "pending"
    },
    {
      label: "高风险举报",
      value: formatMetricValue(summary.highRiskTickets),
      delta: "当前实时数据",
      kind: "high"
    },
    {
      label: "今日新增举报",
      value: formatMetricValue(summary.newToday),
      delta: "当前实时数据",
      kind: "new"
    },
    {
      label: "已处理 / 归档",
      value: formatMetricValue(summary.resolvedTickets),
      delta: "当前实时数据",
      kind: "closed"
    }
  ];
}

async function loadPageData(filters: ReportFilters): Promise<PageData> {
  try {
    const response = await listAdminReports({
      q: filters.q || undefined,
      status: filters.status || undefined,
      targetType: filters.targetType || undefined,
      reason: filters.reason || undefined,
      page: filters.page,
      pageSize: PAGE_SIZE
    });
    const rows = response.data.items.map(mapRow);
    const selected = rows.find((row) => row.statusTone === "pending") ?? rows[0] ?? null;
    const filtered = hasActiveFilters(filters);

    if (response.data.items.length === 0) {
      return {
        hasError: false,
        modeTitle: "当前为实时举报数据",
        modeDetail: filtered
          ? "当前筛选条件已走真实后端查询，但没有匹配到对应举报工单。"
          : "admin/reports 已接入真实后端，但当前库里还没有可展示的举报工单。",
        metrics: buildMetrics(response.data.summary),
        rows,
        defaultSelectedId: null,
        totalCountLabel: `第 ${formatMetricValue(response.data.pagination.page)} 页，当前返回 0 条，共匹配 ${formatMetricValue(response.data.pagination.totalItems)} 条`,
        emptyMessage: filtered ? "当前筛选条件下没有匹配的举报工单。" : "当前还没有可展示的举报工单。",
        pagination: response.data.pagination
      };
    }

    return {
      hasError: false,
      modeTitle: "当前为实时举报数据",
      modeDetail: "举报列表、详情、工单动作与状态/对象/原因筛选都已接入真实后端；当前“标记已处理”和“归档关闭”按真实状态分开展示。",
      metrics: buildMetrics(response.data.summary),
      rows,
      defaultSelectedId: selected?.id ?? null,
      totalCountLabel: `第 ${formatMetricValue(response.data.pagination.page)} 页，当前返回 ${formatMetricValue(rows.length)} 条，共匹配 ${formatMetricValue(response.data.pagination.totalItems)} 条`,
      emptyMessage: null,
      pagination: response.data.pagination
    };
  } catch (error) {
    const requestId =
      error instanceof AdminBackendError && error.requestId
        ? `requestId: ${error.requestId}`
        : "举报接口读取异常";

    return {
      hasError: true,
      modeTitle: "举报数据读取失败",
      modeDetail: `${requestId}，当前不再回退展示假工单，请先排查真实后端请求。`,
      metrics: ZERO_METRICS,
      rows: [],
      defaultSelectedId: null,
      totalCountLabel: "第 1 页，当前返回 0 条，共匹配 0 条",
      emptyMessage: "当前无法读取举报工单，请稍后重试。",
      pagination: {
        page: filters.page,
        pageSize: PAGE_SIZE,
        totalItems: 0,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false
      }
    };
  }
}

async function loadSelectedDetail(
  row: ReportTicket | null
): Promise<{
  detail: ReportDetail | null;
  errorMessage: string | null;
}> {
  if (!row) {
    return {
      detail: null,
      errorMessage: null
    };
  }

  try {
    const response = await getAdminReport(row.id);
    return {
      detail: mapDetail(response.data),
      errorMessage: null
    };
  } catch {
    return {
      detail: null,
      errorMessage: "举报详情读取失败，请稍后刷新重试。"
    };
  }
}

function MetricIcon({ kind }: { kind: Metric["kind"] }) {
  if (kind === "pending") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 3.75l5 1.5v4.1c0 3.06-2.1 5.87-5 6.9-2.9-1.03-5-3.84-5-6.9v-4.1l5-1.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M10 7.7v3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="10" cy="13" fill="currentColor" r="0.85" />
      </svg>
    );
  }

  if (kind === "high") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 4.25 16 15H4l6-10.75Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M10 8v3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="10" cy="13.2" fill="currentColor" r="0.85" />
      </svg>
    );
  }

  if (kind === "new") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <rect height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="11" x="4.5" y="5" />
        <path d="M7.5 3.75v2.5M12.5 3.75v2.5M7.25 10h5.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.7 10.05 9.3 11.6 12.6 8.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function StatusTone(tone: TicketStatusTone) {
  if (tone === "processing") {
    return styles.statusProcessing;
  }
  if (tone === "resolved") {
    return styles.statusResolved;
  }
  if (tone === "closed") {
    return styles.statusClosed;
  }
  return styles.statusPending;
}

function RiskToneClass(tone: RiskTone) {
  if (tone === "low") {
    return styles.riskLow;
  }
  if (tone === "high") {
    return styles.riskHigh;
  }
  return styles.riskMedium;
}

function TargetTone(type: TargetType) {
  if (type === "帖子") {
    return styles.targetPost;
  }
  if (type === "评论") {
    return styles.targetComment;
  }
  if (type === "工作流") {
    return styles.targetWorkflow;
  }
  if (type === "图片提示词") {
    return styles.targetImage;
  }
  return styles.targetVideo;
}

function PreviewToneClass(tone: ReportDetail["evidenceTone"]) {
  if (tone === "comment") {
    return styles.previewComment;
  }
  if (tone === "video") {
    return styles.previewVideo;
  }
  if (tone === "image") {
    return styles.previewImage;
  }
  if (tone === "workflow") {
    return styles.previewWorkflow;
  }
  return styles.previewPost;
}

function resolveReportMediaBadge(detail: ReportDetail) {
  if (detail.evidenceTone === "video") {
    return "视频";
  }
  if (detail.evidenceTone === "image") {
    return "图片";
  }
  if (detail.targetTypeCode === "workflow") {
    return "工作流";
  }
  return detail.targetType;
}

function SelectChevron() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path d="M4 6.25 8 10l4-3.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: Promise<{
    selected?: string;
    error?: string;
    q?: string;
    status?: string;
    targetType?: string;
    reason?: string;
    page?: string;
  }>;
}) {
  await requireAdminAccess(["admin", "moderator"], "/reports");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = readFilters(resolvedSearchParams);
  const pageData = await loadPageData(filters);
  const selectedReportId = resolvedSearchParams?.selected?.trim() || pageData.defaultSelectedId || "";
  const selectedRow =
    pageData.rows.find((row) => row.id === selectedReportId) ??
    pageData.rows.find((row) => row.id === pageData.defaultSelectedId) ??
    pageData.rows[0] ??
    null;
  const selectedDetailState = await loadSelectedDetail(selectedRow);
  const selectedDetail = selectedDetailState.detail;
  const errorMessage = resolvedSearchParams?.error?.trim() || null;
  const detailErrorMessage = selectedDetailState.errorMessage;
  const canAct = !pageData.hasError && Boolean(selectedDetail);
  const canMarkProcessing = canAct && selectedDetail?.statusTone === "pending";
  const canResolve = canAct && selectedDetail?.statusTone !== "resolved" && selectedDetail?.statusTone !== "closed";
  const canArchive = canAct && selectedDetail?.statusTone === "resolved";
  const canOfflineTarget = canAct && Boolean(selectedDetail?.canOfflineTarget);
  const canHideComment = canAct && Boolean(selectedDetail?.canHideComment);
  const closeActionLabel =
    selectedDetail?.statusTone === "closed" ? "已归档" : canArchive ? "归档关闭" : "标记已处理";
  const paginationPages = buildPaginationPages(pageData.pagination.page, pageData.pagination.totalPages);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>举报中心</h1>
          <p className={styles.subtitle}>查看并处理社区举报工单</p>
        </div>
      </header>

      {errorMessage ? (
        <div className={styles.modeBadge}>
          <strong>举报动作失败</strong>
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
            <form action="/reports" className={styles.filterForm} method="get">
              <input name="page" type="hidden" value="1" />
              <div className={styles.filterGrid}>
                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>搜索关键词</span>
                  <input
                    className={styles.textInput}
                    defaultValue={filters.q}
                    name="q"
                    placeholder="标题 / 作者 / 举报人"
                    type="search"
                  />
                </label>

                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>举报状态</span>
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
                  <span className={styles.selectLabel}>举报对象</span>
                  <div className={styles.selectWrap}>
                    <select className={styles.selectControl} defaultValue={filters.targetType} name="targetType">
                      {TARGET_FILTER_OPTIONS.map((item) => (
                        <option key={item.value || "all-targets"} value={item.value}>
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
                  <span className={styles.selectLabel}>举报原因</span>
                  <div className={styles.selectWrap}>
                    <select className={styles.selectControl} defaultValue={filters.reason} name="reason">
                      {REASON_FILTER_OPTIONS.map((item) => (
                        <option key={item.value || "all-reasons"} value={item.value}>
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
                <a className={styles.resetButton} href="/reports">
                  重置筛选
                </a>
                <button className={styles.primaryFilterButton} type="submit">
                  应用筛选
                </button>
              </div>
            </form>
          </section>

          <section className={styles.tableCard}>
            <header className={styles.tableHeader}>
              <h2>举报工单列表</h2>
            </header>

            {pageData.rows.length > 0 ? (
              <>
                <ReportsTableInteractive>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>举报单号</th>
                          <th>举报对象类型</th>
                          <th>内容标题 / 摘要</th>
                          <th>被举报作者</th>
                          <th>举报原因</th>
                          <th>举报时间</th>
                          <th>当前状态</th>
                          <th>风险提示</th>
                          <th>处理人</th>
                          <th>操作入口</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.rows.map((ticket) => {
                          const rowHref = buildReportsHref(filters, { selected: ticket.id });
                          const isSelected = ticket.id === selectedRow?.id;

                          return (
                            <tr
                              key={ticket.id}
                              aria-selected={isSelected}
                              className={`${styles.tableRow} ${isSelected ? styles.rowSelected : ""}`}
                              data-row-href={rowHref}
                              tabIndex={0}
                            >
                              <td>{ticket.id}</td>
                              <td>
                                <span className={`${styles.targetPill} ${TargetTone(ticket.targetType)}`}>{ticket.targetType}</span>
                              </td>
                              <td className={styles.titleCell}>{ticket.contentSummary}</td>
                              <td>{ticket.targetActor}</td>
                              <td>{ticket.reason}</td>
                              <td>{ticket.createdAt}</td>
                              <td>
                                <span className={`${styles.statusPill} ${StatusTone(ticket.statusTone)}`}>{ticket.status}</span>
                              </td>
                              <td>
                                <span className={`${styles.riskPill} ${RiskToneClass(ticket.riskTone)}`}>{ticket.risk}</span>
                              </td>
                              <td>{ticket.assignee}</td>
                              <td>
                                <span className={styles.rowAssist}>{isSelected ? "当前查看中" : "点击行查看"}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </ReportsTableInteractive>

                <footer className={styles.tableFooter}>
                  <span className={styles.count}>{pageData.totalCountLabel}</span>
                  <span className={styles.pageSizeButton}>每页 {pageData.pagination.pageSize} 条</span>
                </footer>
                <div className={styles.paginationArea}>
                  {pageData.pagination.totalPages > 1 ? (
                    <nav aria-label="举报分页" className={styles.pagination}>
                      <Link
                        aria-disabled={!pageData.pagination.hasPrevious}
                        className={styles.pageButton}
                        href={buildReportsHref(filters, {
                          selected: selectedRow?.id ?? null,
                          page: Math.max(1, pageData.pagination.page - 1)
                        })}
                        scroll={false}
                        tabIndex={pageData.pagination.hasPrevious ? undefined : -1}
                      >
                        上一页
                      </Link>
                      {paginationPages.map((page, index) =>
                        page === "..." ? (
                          <span key={`ellipsis-${pageData.pagination.page}-${index}`} className={styles.pageEllipsis}>
                            ...
                          </span>
                        ) : (
                          <Link
                            key={page}
                            aria-current={page === pageData.pagination.page ? "page" : undefined}
                            className={`${styles.pageButton} ${page === pageData.pagination.page ? styles.pageButtonActive : ""}`}
                            href={buildReportsHref(filters, {
                              selected: selectedRow?.id ?? null,
                              page
                            })}
                            scroll={false}
                          >
                            {page}
                          </Link>
                        )
                      )}
                      <Link
                        aria-disabled={!pageData.pagination.hasNext}
                        className={styles.pageButton}
                        href={buildReportsHref(filters, {
                          selected: selectedRow?.id ?? null,
                          page: Math.min(pageData.pagination.totalPages, pageData.pagination.page + 1)
                        })}
                        scroll={false}
                        tabIndex={pageData.pagination.hasNext ? undefined : -1}
                      >
                        下一页
                      </Link>
                    </nav>
                  ) : null}
                </div>
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
            <h2>举报详情</h2>
            <Link className={styles.drawerClose} href={buildReportsHref(filters)} scroll={false}>
              ×
            </Link>
          </header>

          {selectedDetail ? (
            <>
              <div className={styles.drawerBody}>
                <section className={styles.infoSection}>
                  <dl className={styles.infoGrid}>
                    <div>
                      <dt>举报单号:</dt>
                      <dd>{selectedDetail.id}</dd>
                    </div>
                    <div>
                      <dt>当前状态:</dt>
                      <dd>
                        <span className={`${styles.statusPill} ${StatusTone(selectedDetail.statusTone)}`}>{selectedDetail.status}</span>
                      </dd>
                    </div>
                    <div>
                      <dt>举报人:</dt>
                      <dd>{selectedDetail.reporter}</dd>
                    </div>
                    <div>
                      <dt>用户ID:</dt>
                      <dd>{selectedDetail.reporterId}</dd>
                    </div>
                    <div>
                      <dt>举报原因:</dt>
                      <dd>{selectedDetail.reason}</dd>
                    </div>
                    <div className={styles.infoFull}>
                      <dt>举报说明:</dt>
                      <dd>{selectedDetail.reportDescription}</dd>
                    </div>
                  </dl>
                </section>

                <section className={styles.section}>
                  <h3>被举报内容摘要:</h3>
                  <article className={styles.contentCard}>
                    <div className={styles.contentThumbWrap}>
                      <ReportsMediaPreview
                        badgeText={resolveReportMediaBadge(selectedDetail)}
                        isVideo={selectedDetail.evidenceTone === "video"}
                        previewUrl={selectedDetail.targetPreviewUrl}
                        sourceUrl={selectedDetail.targetSourceUrl}
                        thumbnailUrl={selectedDetail.targetCoverUrl ?? selectedDetail.targetPosterUrl}
                        toneClass={PreviewToneClass(selectedDetail.evidenceTone)}
                      />
                    </div>
                    <div className={styles.contentBody}>
                      <strong>{selectedDetail.contentSummary}</strong>
                      <span>{selectedDetail.targetActor}</span>
                      <p>{selectedDetail.excerpt}</p>
                      <div className={styles.contentMeta}>
                        <span>{selectedDetail.targetType} · 状态 {selectedDetail.targetStatusCode}</span>
                        <div className={styles.metaStats}>
                          <span>{selectedDetail.risk}</span>
                          <span>{selectedDetail.status}</span>
                        </div>
                      </div>
                      <span className={styles.summaryHint}>当前展示真实资源预览，证据线索已收起，后续可再扩展。</span>
                    </div>
                  </article>
                </section>

                <section className={styles.section}>
                  <details className={styles.evidenceDetails}>
                    <summary>证据线索（后续增强）</summary>
                    <div className={styles.evidenceGrid}>
                      {selectedDetail.evidencePreview.map((item, index) => (
                        <div key={`${selectedDetail.id}-${item}`} className={`${styles.evidenceThumb} ${PreviewToneClass(selectedDetail.evidenceTone)}`}>
                          {index === selectedDetail.evidencePreview.length - 1 ? (
                            <span className={styles.evidenceCount}>{item}</span>
                          ) : (
                            <span className={styles.evidenceLabel}>{item}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                </section>

                <section className={styles.section}>
                  <h3>当前处理状态:</h3>
                  <div className={styles.statusInlineRow}>
                    <span className={`${styles.statusPill} ${StatusTone(selectedDetail.statusTone)}`}>{selectedDetail.status}</span>
                  </div>

                  <div className={styles.actionSuggestion}>
                    <span className={styles.metaLabel}>联动处理建议:</span>
                    <div className={styles.suggestionButtons}>
                      {selectedDetail.canOfflineTarget ? (
                      <span className={styles.suggestionChip}>下线内容</span>
                    ) : null}
                    {selectedDetail.canHideComment ? (
                      <span className={styles.suggestionChip}>隐藏评论</span>
                    ) : null}
                      <span className={styles.suggestionChip}>
                        {selectedDetail.statusTone === "resolved" || selectedDetail.statusTone === "closed" ? "归档关闭" : "标记已处理"}
                      </span>
                    </div>
                  </div>
                </section>

                <section className={styles.section}>
                  <h3>处理记录:</h3>
                  <div className={styles.logList}>
                    {selectedDetail.timelineEntries.map((entry) => (
                      <article key={`${entry.time}-${entry.actor}-${entry.action}`} className={styles.logItem}>
                        <span className={styles.logDot} />
                        <div className={styles.logBody}>
                          <strong>{entry.time}</strong>
                          <p>
                            {entry.actor} · {entry.action}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.section}>
                  <div className={styles.noteBox}>
                    <span>{selectedDetail.resultNote}</span>
                    <span className={styles.noteCount}>{detailErrorMessage ?? "已连接真实后端"}</span>
                  </div>
                </section>
              </div>

              <footer className={styles.drawerFooter}>
                <form action={markProcessingReportAction}>
                  <input name="reportId" type="hidden" value={selectedDetail.id} />
                  <input name="note" type="hidden" value="后台标记工单处理中" />
                  <input name="q" type="hidden" value={filters.q} />
                  <input name="status" type="hidden" value={filters.status} />
                  <input name="targetType" type="hidden" value={filters.targetType} />
                  <input name="reason" type="hidden" value={filters.reason} />
                  <input name="page" type="hidden" value={String(pageData.pagination.page)} />
                  <button className={styles.primaryAction} disabled={!canMarkProcessing} type="submit">
                    标记处理中
                  </button>
                </form>
                <form action={closeReportAction}>
                  <input name="reportId" type="hidden" value={selectedDetail.id} />
                  <input name="note" type="hidden" value="后台关闭举报工单" />
                  <input name="q" type="hidden" value={filters.q} />
                  <input name="status" type="hidden" value={filters.status} />
                  <input name="targetType" type="hidden" value={filters.targetType} />
                  <input name="reason" type="hidden" value={filters.reason} />
                  <input name="page" type="hidden" value={String(pageData.pagination.page)} />
                  <button className={styles.secondaryAction} disabled={!canResolve && !canArchive} type="submit">
                    {closeActionLabel}
                  </button>
                </form>
                {selectedDetail.canOfflineTarget ? (
                  <form action={offlineReportTargetAction}>
                    <input name="reportId" type="hidden" value={selectedDetail.id} />
                    <input name="note" type="hidden" value="后台联动下线举报目标" />
                    <input name="q" type="hidden" value={filters.q} />
                    <input name="status" type="hidden" value={filters.status} />
                    <input name="targetType" type="hidden" value={filters.targetType} />
                    <input name="reason" type="hidden" value={filters.reason} />
                    <input name="page" type="hidden" value={String(pageData.pagination.page)} />
                    <button className={styles.secondaryAction} disabled={!canOfflineTarget} type="submit">
                      联动下线内容
                    </button>
                  </form>
                ) : null}
                {selectedDetail.canHideComment ? (
                  <form action={hideReportedCommentAction}>
                    <input name="reportId" type="hidden" value={selectedDetail.id} />
                    <input name="note" type="hidden" value="后台联动隐藏被举报评论" />
                    <input name="q" type="hidden" value={filters.q} />
                    <input name="status" type="hidden" value={filters.status} />
                    <input name="targetType" type="hidden" value={filters.targetType} />
                    <input name="reason" type="hidden" value={filters.reason} />
                    <input name="page" type="hidden" value={String(pageData.pagination.page)} />
                    <button className={styles.secondaryAction} disabled={!canHideComment} type="submit">
                      隐藏评论
                    </button>
                  </form>
                ) : null}
              </footer>
            </>
          ) : (
            <div className={styles.drawerEmpty}>
              <strong>{pageData.rows.length === 0 ? "暂无可查看的举报详情" : "请选择一条举报工单"}</strong>
              <span>{detailErrorMessage ?? "选择列表中的举报工单后，可在这里查看详情和执行治理动作。"}</span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
