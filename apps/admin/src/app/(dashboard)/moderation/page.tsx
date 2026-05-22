import Link from "next/link";
import { requireAdminAccess } from "@/lib/admin-auth";
import {
  AdminBackendError,
  getAdminModerationItem,
  listAdminModerationItems,
  type AdminModerationItemDetailData,
  type AdminModerationListData
} from "@/lib/admin-service";
import {
  approveModerationAction,
  offlineModerationAction,
  rejectModerationAction,
  restoreModerationAction
} from "./actions";
import { resolveFeedOpsMediaUrl } from "../feed-ops/shared/feed-ops-media";
import ModerationMediaPreview from "./ModerationMediaPreview";
import ModerationTableInteractive from "./ModerationTableInteractive";
import styles from "./page.module.css";

const PAGE_SIZE = 15;

type Metric = {
  label: string;
  value: string;
  delta: string;
  kind: "pending" | "risk" | "processed" | "offline";
};

type AuditTone = "pending" | "approved" | "rejected" | "offline" | "notRequired";
type RiskTone = "low" | "medium" | "high";
type ContentType = "视频提示词" | "图片提示词" | "工作流" | "帖子" | "视频作品";
type MediaAsset = {
  coverUrl: string | null;
  posterUrl: string | null;
  previewUrl: string | null;
  sourceUrl: string | null;
};

type ModerationRow = {
  id: string;
  targetTypeCode: "video" | "workflow" | "prompt" | "post";
  targetId: string;
  title: string;
  type: ContentType;
  author: string;
  authorId: string | null;
  tags: readonly string[];
  submittedAt: string;
  status: string;
  statusTone: AuditTone;
  risk: string;
  riskTone: RiskTone;
  reviewer: string;
  previewTone: "neon" | "cloud" | "graph" | "studio" | "void";
  excerpt: string;
  media: MediaAsset;
  modelTags: readonly string[];
};

type DetailItem = {
  title: string;
  targetTypeCode: "video" | "workflow" | "prompt" | "post";
  targetId: string;
  type: ContentType;
  author: string;
  authorId: string | null;
  tags: readonly string[];
  submittedAt: string;
  status: string;
  statusTone: AuditTone;
  risk: string;
  riskTone: RiskTone;
  reviewer: string;
  previewTone: ModerationRow["previewTone"];
  excerpt: string;
  contentText: string;
  media: MediaAsset;
  modelTags: readonly string[];
  riskItems: readonly {
    label: string;
    tone: RiskTone;
    detail: string;
  }[];
};

type ModerationFilters = {
  q: string;
  targetType: string;
  status: string;
  page: number;
};

type PageData = {
  hasError: boolean;
  modeTitle: string;
  modeDetail: string;
  metrics: readonly Metric[];
  rows: readonly ModerationRow[];
  defaultSelectedKey: string | null;
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

const ZERO_METRICS: readonly Metric[] = [
  { label: "待审核内容", value: "0", delta: "当前实时数据", kind: "pending" },
  { label: "高风险内容", value: "0", delta: "当前实时数据", kind: "risk" },
  { label: "今日已处理", value: "0", delta: "当前实时数据", kind: "processed" },
  { label: "已下线内容", value: "0", delta: "当前实时数据", kind: "offline" }
];

const TARGET_TYPE_FILTER_OPTIONS = [
  { value: "", label: "全部内容类型" },
  { value: "image_prompt", label: "图片提示词" },
  { value: "video_prompt", label: "视频提示词" },
  { value: "workflow", label: "工作流" },
  { value: "post", label: "帖子" }
] as const;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "全部审核状态" },
  { value: "pending_review", label: "待审核" },
  { value: "in_review", label: "审核中" },
  { value: "not_required", label: "无需审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
  { value: "taken_down", label: "已下线" }
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

function normalizePageValue(value: string | null | undefined) {
  const parsed = Number.parseInt(value?.trim() || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function rowKey(targetType: string, targetId: string) {
  return `${targetType}:${targetId}`;
}

function typeLabel(item: AdminModerationListData["items"][number]): ContentType {
  if (item.targetType === "workflow") {
    return "工作流";
  }
  if (item.targetType === "post") {
    return "帖子";
  }
  if (item.targetType === "video") {
    return "视频作品";
  }
  if (item.targetType === "prompt") {
    return item.modelTags.includes("图片提示词") ? "图片提示词" : "视频提示词";
  }
  return "视频作品";
}

function previewTone(type: ContentType): ModerationRow["previewTone"] {
  if (type === "图片提示词") {
    return "cloud";
  }
  if (type === "工作流") {
    return "graph";
  }
  if (type === "帖子") {
    return "studio";
  }
  if (type === "视频作品") {
    return "void";
  }
  return "neon";
}

function isVideoContentType(type: ContentType) {
  return type === "视频提示词" || type === "视频作品";
}

function normalizeMedia(media?: Partial<MediaAsset> | null): MediaAsset {
  return {
    coverUrl: resolveFeedOpsMediaUrl(media?.coverUrl) ?? null,
    posterUrl: resolveFeedOpsMediaUrl(media?.posterUrl) ?? null,
    previewUrl: resolveFeedOpsMediaUrl(media?.previewUrl) ?? null,
    sourceUrl: resolveFeedOpsMediaUrl(media?.sourceUrl) ?? null
  };
}

function resolveThumbnailUrl(media?: Partial<MediaAsset> | null) {
  return media?.coverUrl?.trim() || media?.posterUrl?.trim() || null;
}

function resolvePreviewMediaUrl(detail: DetailItem) {
  if (!isVideoContentType(detail.type)) {
    return null;
  }

  return detail.media.previewUrl || detail.media.sourceUrl || null;
}

function statusMeta(code: string) {
  if (code === "not_required") {
    return { status: "无需审核", tone: "notRequired" as const };
  }
  if (code === "approved") {
    return { status: "已通过", tone: "approved" as const };
  }
  if (code === "rejected") {
    return { status: "已驳回", tone: "rejected" as const };
  }
  if (code === "taken_down") {
    return { status: "已下线", tone: "offline" as const };
  }
  return { status: code === "in_review" ? "审核中" : "待审核", tone: "pending" as const };
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

function mapRow(item: AdminModerationListData["items"][number]): ModerationRow {
  const type = typeLabel(item);
  const status = statusMeta(item.statusCode);
  const risk = riskMeta(item.riskLevel);

  return {
    id: rowKey(item.targetType, item.targetId),
    targetTypeCode: item.targetType as ModerationRow["targetTypeCode"],
    targetId: item.targetId,
    title: item.title,
    type,
    author: item.authorDisplayName,
    authorId: item.authorId ?? null,
    tags: item.tagNames,
    submittedAt: formatDateTime(item.submittedAt),
    status: status.status,
    statusTone: status.tone,
    risk: risk.risk,
    riskTone: risk.tone,
    reviewer: item.reviewerDisplayName ?? "—",
    previewTone: previewTone(type),
    excerpt: item.summaryText?.trim() || "当前暂无摘要，后续补充正文内容抽样。",
    media: normalizeMedia(item.media),
    modelTags: item.modelTags
  };
}

function mapDetail(item: AdminModerationItemDetailData): DetailItem {
  const type =
    item.targetType === "workflow"
      ? "工作流"
      : item.targetType === "post"
        ? "帖子"
        : item.targetType === "video"
          ? "视频作品"
          : item.modelTags.includes("图片提示词")
            ? "图片提示词"
            : "视频提示词";
  const status = statusMeta(item.statusCode);
  const risk = riskMeta(item.riskLevel);

  return {
    title: item.title,
    targetTypeCode: item.targetType as DetailItem["targetTypeCode"],
    targetId: item.targetId,
    type,
    author: item.authorDisplayName,
    authorId: item.authorId ?? null,
    tags: item.tagNames,
    submittedAt: formatDateTime(item.submittedAt),
    status: status.status,
    statusTone: status.tone,
    risk: risk.risk,
    riskTone: risk.tone,
    reviewer: item.reviewerDisplayName ?? "—",
    previewTone: previewTone(type),
    excerpt: item.summaryText?.trim() || "当前暂无摘要。",
    contentText: item.contentText?.trim() || item.summaryText?.trim() || "当前暂无正文内容。",
    media: normalizeMedia(item.media),
    modelTags: item.modelTags,
    riskItems: item.riskSignals.map((signal) => ({
      label: signal.label,
      tone: signal.tone === "high" ? "high" : signal.tone === "medium" ? "medium" : "low",
      detail: signal.detail
    }))
  };
}

function buildSummaryDetail(row: ModerationRow): DetailItem {
  return {
    title: row.title,
    targetTypeCode: row.targetTypeCode,
    targetId: row.targetId,
    type: row.type,
    author: row.author,
    authorId: row.authorId,
    tags: row.tags,
    submittedAt: row.submittedAt,
    status: row.status,
    statusTone: row.statusTone,
    risk: row.risk,
    riskTone: row.riskTone,
    reviewer: row.reviewer,
    previewTone: row.previewTone,
    excerpt: row.excerpt,
    contentText: row.excerpt,
    media: normalizeMedia(row.media),
    modelTags: row.modelTags,
    riskItems: [
      {
        label: row.riskTone === "high" ? "当前命中高风险信号" : row.riskTone === "medium" ? "当前命中中风险信号" : "当前未见明显违规风险",
        tone: row.riskTone,
        detail: "详情读取失败，暂时退回列表摘要。"
      }
    ]
  };
}

function readFilters(searchParams?: {
  q?: string;
  targetType?: string;
  status?: string;
  page?: string;
}) {
  return {
    q: normalizeFilterValue(searchParams?.q),
    targetType: normalizeFilterValue(searchParams?.targetType),
    status: normalizeFilterValue(searchParams?.status),
    page: normalizePageValue(searchParams?.page)
  };
}

function hasActiveFilters(filters: ModerationFilters) {
  return Boolean(filters.q || filters.targetType || filters.status);
}

function buildModerationHref(
  filters: ModerationFilters,
  options?: {
    selectedType?: string | null;
    selectedId?: string | null;
    error?: string | null;
    page?: number | null;
  }
) {
  const searchParams = new URLSearchParams();
  if (options?.selectedType?.trim() && options?.selectedId?.trim()) {
    searchParams.set("selectedType", options.selectedType.trim());
    searchParams.set("selectedId", options.selectedId.trim());
  }
  if (filters.q) {
    searchParams.set("q", filters.q);
  }
  if (filters.targetType) {
    searchParams.set("targetType", filters.targetType);
  }
  if (filters.status) {
    searchParams.set("status", filters.status);
  }
  const nextPage = typeof options?.page === "number" && options.page > 0 ? options.page : filters.page;
  if (nextPage > 1) {
    searchParams.set("page", String(nextPage));
  }
  if (options?.error?.trim()) {
    searchParams.set("error", options.error.trim());
  }
  const query = searchParams.toString();
  return query ? `/moderation?${query}` : "/moderation";
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

function buildMetrics(summary: AdminModerationListData["summary"]): readonly Metric[] {
  return [
    {
      label: "待审核内容",
      value: formatMetricValue(summary.pendingItems),
      delta: "当前实时数据",
      kind: "pending"
    },
    {
      label: "高风险内容",
      value: formatMetricValue(summary.highRiskItems),
      delta: "当前实时数据",
      kind: "risk"
    },
    {
      label: "今日已处理",
      value: formatMetricValue(summary.processedToday),
      delta: "当前实时数据",
      kind: "processed"
    },
    {
      label: "已下线内容",
      value: formatMetricValue(summary.offlineItems),
      delta: "当前实时数据",
      kind: "offline"
    }
  ];
}

async function loadPageData(filters: ModerationFilters): Promise<PageData> {
  try {
    const response = await listAdminModerationItems({
      q: filters.q || undefined,
      targetType: filters.targetType || undefined,
      status: filters.status || undefined,
      page: filters.page,
      pageSize: PAGE_SIZE
    });
    const rows = response.data.items.map(mapRow);
    const selected = rows.find((row) => row.statusTone === "pending") ?? rows[0] ?? null;

    if (rows.length === 0) {
      return {
        hasError: false,
        modeTitle: "当前为实时审核数据",
        modeDetail: hasActiveFilters(filters)
          ? "当前筛选条件已走真实后端查询，但没有匹配到对应审核项。"
          : "admin/moderation 已接入真实后端，但当前库里还没有可展示的审核项。",
        metrics: buildMetrics(response.data.summary),
        rows,
        defaultSelectedKey: null,
        totalCountLabel: `第 ${formatMetricValue(response.data.pagination.page)} 页，当前返回 0 条，共匹配 ${formatMetricValue(response.data.pagination.totalItems)} 条`,
        emptyMessage: hasActiveFilters(filters) ? "当前筛选条件下没有匹配的审核项。" : "当前还没有可展示的审核项。",
        pagination: response.data.pagination
      };
    }

    return {
      hasError: false,
      modeTitle: "当前为实时审核数据",
      modeDetail: "审核列表、详情、动作和 q / 内容类型 / 审核状态筛选都已接入真实后端。",
      metrics: buildMetrics(response.data.summary),
      rows,
      defaultSelectedKey: selected?.id ?? null,
      totalCountLabel: `第 ${formatMetricValue(response.data.pagination.page)} 页，当前返回 ${formatMetricValue(rows.length)} 条，共匹配 ${formatMetricValue(response.data.pagination.totalItems)} 条`,
      emptyMessage: null,
      pagination: response.data.pagination
    };
  } catch (error) {
    const requestId =
      error instanceof AdminBackendError && error.requestId
        ? `requestId: ${error.requestId}`
        : "审核接口读取异常";

    return {
      hasError: true,
      modeTitle: "审核数据读取失败",
      modeDetail: `${requestId}，当前不再回退展示占位审核数据，请先排查真实后端请求。`,
      metrics: ZERO_METRICS,
      rows: [],
      defaultSelectedKey: null,
      totalCountLabel: "第 1 页，当前返回 0 条，共匹配 0 条",
      emptyMessage: "当前无法读取审核项，请稍后重试。",
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
  row: ModerationRow | null
): Promise<{
  detail: DetailItem | null;
  errorMessage: string | null;
}> {
  if (!row) {
    return {
      detail: null,
      errorMessage: null
    };
  }

  try {
    const response = await getAdminModerationItem(row.targetTypeCode, row.targetId);
    return {
      detail: mapDetail(response.data),
      errorMessage: null
    };
  } catch {
    return {
      detail: buildSummaryDetail(row),
      errorMessage: "审核详情读取失败，当前仅展示列表摘要。"
    };
  }
}

function MetricIcon({ kind }: { kind: Metric["kind"] }) {
  if (kind === "pending") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 3.75l5 1.5v4.1c0 3.06-2.1 5.87-5 6.9-2.9-1.03-5-3.84-5-6.9v-4.1l5-1.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M8.2 9.95l1.2 1.2 2.5-2.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "risk") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 4.25 16 15H4l6-10.75Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M10 8v3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="10" cy="13.2" fill="currentColor" r="0.85" />
      </svg>
    );
  }

  if (kind === "processed") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.7 10.05 9.3 11.6 12.6 8.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M10 4.25v7.5M6.75 8.5 10 11.75 13.25 8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M4.5 14.75h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function TypeTone(type: ContentType) {
  if (type === "视频提示词" || type === "视频作品") {
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

function StatusTone(tone: AuditTone) {
  if (tone === "notRequired") {
    return styles.statusNotRequired;
  }
  if (tone === "approved") {
    return styles.statusApproved;
  }
  if (tone === "rejected") {
    return styles.statusRejected;
  }
  if (tone === "offline") {
    return styles.statusOffline;
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

function PreviewToneClass(tone: ModerationRow["previewTone"]) {
  if (tone === "cloud") {
    return styles.previewCloud;
  }
  if (tone === "graph") {
    return styles.previewGraph;
  }
  if (tone === "studio") {
    return styles.previewStudio;
  }
  if (tone === "void") {
    return styles.previewVoid;
  }
  return styles.previewNeon;
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" fill="rgba(255,255,255,0.16)" r="10" stroke="rgba(255,255,255,0.92)" strokeWidth="1.5" />
      <path d="M10 8.75 15.5 12 10 15.25v-6.5Z" fill="#ffffff" />
    </svg>
  );
}

function SelectChevron() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path d="M4 6.25 8 10l4-3.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export default async function ModerationPage({
  searchParams
}: {
  searchParams?: Promise<{
    selectedType?: string;
    selectedId?: string;
    error?: string;
    q?: string;
    targetType?: string;
    status?: string;
    page?: string;
  }>;
}) {
  await requireAdminAccess(["admin", "moderator"], "/moderation");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = readFilters(resolvedSearchParams);
  const pageData = await loadPageData(filters);
  const forcedSelectedKey =
    resolvedSearchParams?.selectedType?.trim() && resolvedSearchParams?.selectedId?.trim()
      ? rowKey(resolvedSearchParams.selectedType.trim(), resolvedSearchParams.selectedId.trim())
      : null;
  const selectedRow =
    pageData.rows.find((row) => row.id === forcedSelectedKey) ??
    pageData.rows.find((row) => row.id === pageData.defaultSelectedKey) ??
    pageData.rows[0] ??
    null;
  const selectedDetailState = await loadSelectedDetail(selectedRow);
  const selectedDetail = selectedDetailState.detail;
  const errorMessage = resolvedSearchParams?.error?.trim() || null;
  const selectedThumbnailUrl = selectedDetail ? resolveThumbnailUrl(selectedDetail.media) : null;
  const selectedPreviewUrl = selectedDetail ? resolvePreviewMediaUrl(selectedDetail) : null;
  const selectedPreviewBadgeText =
    selectedDetail && isVideoContentType(selectedDetail.type) ? "点击放大播放" : "真实封面";
  const canAct = !pageData.hasError && Boolean(selectedDetail);
  const isReviewExempt = selectedDetail?.statusTone === "notRequired";
  const canApprove = canAct && !isReviewExempt && selectedDetail?.statusTone !== "approved";
  const canReject = canAct && !isReviewExempt && selectedDetail?.statusTone !== "rejected";
  const canOffline = canAct && !isReviewExempt && selectedDetail?.statusTone !== "offline";
  const canRestore = canAct && selectedDetail?.statusTone === "offline";
  const paginationPages = buildPaginationPages(pageData.pagination.page, pageData.pagination.totalPages);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>内容审核</h1>
          <p className={styles.subtitle}>审核社区内容与发布状态</p>
        </div>
      </header>

      {errorMessage ? (
        <div className={styles.modeBadge}>
          <strong>审核动作失败</strong>
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
            <form action="/moderation" className={styles.filterForm} method="get">
              <input name="page" type="hidden" value="1" />
              <div className={styles.filterGrid}>
                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>搜索关键词</span>
                  <input
                    className={styles.textInput}
                    defaultValue={filters.q}
                    name="q"
                    placeholder="标题 / 作者昵称 / 作者ID"
                    type="search"
                  />
                </label>

                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>内容类型</span>
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
                  <span className={styles.selectLabel}>审核状态</span>
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
              </div>

              <div className={styles.filterFooter}>
                <div className={styles.filterActions}>
                  <a className={styles.resetButton} href="/moderation">
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
              <h2>审核列表</h2>
            </header>

            {pageData.rows.length > 0 ? (
              <>
                <ModerationTableInteractive>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>预览</th>
                          <th>内容标题</th>
                          <th>内容类型</th>
                          <th>作者</th>
                          <th>标签</th>
                          <th>提交时间</th>
                          <th>审核状态</th>
                          <th>风险提示</th>
                          <th>审核人</th>
                          <th>操作入口</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.rows.map((row) => {
                          const rowHref = buildModerationHref(filters, {
                            selectedType: row.targetTypeCode,
                            selectedId: row.targetId
                          });
                          const isSelected = row.id === selectedRow?.id;
                          const thumbnailUrl = resolveThumbnailUrl(row.media);

                          return (
                            <tr
                              key={row.id}
                              aria-selected={isSelected}
                              className={`${styles.tableRow} ${isSelected ? styles.rowSelected : ""}`}
                              data-row-href={rowHref}
                              tabIndex={0}
                            >
                              <td>
                                <div className={`${styles.previewThumb} ${PreviewToneClass(row.previewTone)} ${thumbnailUrl ? styles.previewThumbHasMedia : ""}`}>
                                  {thumbnailUrl ? (
                                    <img
                                      alt=""
                                      className={styles.previewThumbImage}
                                      decoding="async"
                                      loading="lazy"
                                      src={thumbnailUrl}
                                    />
                                  ) : null}
                                  {isVideoContentType(row.type) ? (
                                    <span className={styles.thumbPlay}>
                                      <PlayIcon />
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className={styles.titleCell}>{row.title}</td>
                              <td>
                                <span className={`${styles.typePill} ${TypeTone(row.type)}`}>{row.type}</span>
                              </td>
                              <td>{row.author}</td>
                              <td>
                                <div className={styles.tagList}>
                                  {row.tags.map((tag) => (
                                    <span key={`${row.id}-${tag}`} className={styles.tag}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td>{row.submittedAt}</td>
                              <td>
                                <span className={`${styles.statusPill} ${StatusTone(row.statusTone)}`}>{row.status}</span>
                              </td>
                              <td>
                                <span className={`${styles.riskPill} ${RiskToneClass(row.riskTone)}`}>{row.risk}</span>
                              </td>
                              <td>{row.reviewer}</td>
                              <td>
                                <span className={styles.rowAssist}>
                                  {isSelected ? "当前查看中" : "点击行查看"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </ModerationTableInteractive>

                <footer className={styles.tableFooter}>
                  <span className={styles.count}>{pageData.totalCountLabel}</span>
                  <span className={styles.pageSizeButton}>每页 {pageData.pagination.pageSize} 条</span>
                </footer>
                <div className={styles.paginationArea}>
                  {pageData.pagination.totalPages > 1 ? (
                    <nav aria-label="审核分页" className={styles.pagination}>
                      <Link
                        aria-disabled={!pageData.pagination.hasPrevious}
                        className={styles.pageButton}
                        href={buildModerationHref(filters, {
                          selectedType: selectedRow?.targetTypeCode ?? null,
                          selectedId: selectedRow?.targetId ?? null,
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
                            href={buildModerationHref(filters, {
                              selectedType: selectedRow?.targetTypeCode ?? null,
                              selectedId: selectedRow?.targetId ?? null,
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
                        href={buildModerationHref(filters, {
                          selectedType: selectedRow?.targetTypeCode ?? null,
                          selectedId: selectedRow?.targetId ?? null,
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
            {selectedDetail ? (
              <div className={styles.drawerTitleRow}>
                <h2>审核详情</h2>
                <span className={`${styles.statusPill} ${StatusTone(selectedDetail.statusTone)}`}>{selectedDetail.status}</span>
                <span className={`${styles.typePill} ${TypeTone(selectedDetail.type)}`}>{selectedDetail.type}</span>
              </div>
            ) : (
              <div className={styles.drawerTitleRow}>
                <h2>审核详情</h2>
              </div>
            )}
            <a className={styles.drawerClose} href={buildModerationHref(filters)}>
              ×
            </a>
          </header>

          {selectedDetail ? (
            <>
              <div className={styles.drawerBody}>
                <section className={styles.section}>
                  <h3>1. 基本信息</h3>
                  <dl className={styles.infoGrid}>
                    <div>
                      <dt>内容标题:</dt>
                      <dd>{selectedDetail.title}</dd>
                    </div>
                    <div>
                      <dt>内容ID:</dt>
                      <dd>{selectedDetail.targetId}</dd>
                    </div>
                    <div>
                      <dt>作者昵称:</dt>
                      <dd>{selectedDetail.author}</dd>
                    </div>
                    <div>
                      <dt>作者ID:</dt>
                      <dd>{selectedDetail.authorId ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>提交时间:</dt>
                      <dd>{selectedDetail.submittedAt}</dd>
                    </div>
                    <div>
                      <dt>当前审核状态:</dt>
                      <dd>{selectedDetail.status}</dd>
                    </div>
                    <div>
                      <dt>分类标签:</dt>
                      <dd>{selectedDetail.tags.length > 0 ? selectedDetail.tags.join("、") : "—"}</dd>
                    </div>
                    <div>
                      <dt>模型标签:</dt>
                      <dd>{selectedDetail.modelTags.length > 0 ? selectedDetail.modelTags.join(" / ") : "—"}</dd>
                    </div>
                  </dl>
                </section>

                <section className={styles.section}>
                  <h3>2. 内容摘要卡</h3>
                  <ModerationMediaPreview
                    badgeText={selectedPreviewBadgeText}
                    isVideo={isVideoContentType(selectedDetail.type)}
                    previewUrl={selectedPreviewUrl}
                    sourceUrl={selectedDetail.media.sourceUrl}
                    thumbnailUrl={selectedThumbnailUrl}
                    toneClass={PreviewToneClass(selectedDetail.previewTone)}
                  />
                  <p className={styles.previewHint}>列表只加载缩略图，当前详情按需挂载真实媒体资源。</p>
                  {selectedDetail.media.sourceUrl ? (
                    <a
                      className={styles.mediaSourceLink}
                      href={selectedDetail.media.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      打开原始素材
                    </a>
                  ) : null}
                </section>

                <section className={styles.section}>
                  <h3>3. 提示词/正文内容</h3>
                  <p className={styles.excerpt}>{selectedDetail.contentText}</p>
                  <div className={styles.modelTags}>
                    <span className={styles.metaLabel}>描述标签:</span>
                    <div className={styles.tagList}>
                      {selectedDetail.tags.length > 0 ? (
                        selectedDetail.tags.map((tag) => (
                          <span key={tag} className={styles.tag}>
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className={styles.tag}>暂无标签</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.modelTags}>
                    <span className={styles.metaLabel}>关联模型:</span>
                    <div className={styles.tagList}>
                      {selectedDetail.modelTags.length > 0 ? (
                        selectedDetail.modelTags.map((tag) => (
                          <span key={`model-${tag}`} className={styles.tag}>
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className={styles.tag}>暂无模型标签</span>
                      )}
                    </div>
                  </div>
                </section>

                <section className={`${styles.section} ${styles.riskPanel}`}>
                  <h3>4. 风险提示</h3>
                  <div className={styles.riskList}>
                    {selectedDetail.riskItems.map((item) => (
                      <article key={`${item.label}-${item.detail}`} className={styles.riskItem}>
                        <div className={styles.riskItemTop}>
                          <strong>{item.label}</strong>
                          <span className={`${styles.riskPill} ${RiskToneClass(item.tone)}`}>
                            {item.tone === "high" ? "高风险" : item.tone === "medium" ? "中风险" : "低风险"}
                          </span>
                        </div>
                        <p>{item.detail}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.section}>
                  <h3>5. 审核备注</h3>
                  <div className={styles.noteBox}>
                    <span>当前动作会把备注写入审核记录 detail_json。</span>
                    <span className={styles.noteCount}>{selectedDetailState.errorMessage ?? "已连接真实后端"}</span>
                  </div>
                </section>
              </div>

              <footer className={styles.drawerFooter}>
                <form action={approveModerationAction}>
                  <input name="targetType" type="hidden" value={selectedDetail.targetTypeCode} />
                  <input name="targetId" type="hidden" value={selectedDetail.targetId} />
                  <input name="note" type="hidden" value="后台审核通过" />
                  <input name="q" type="hidden" value={filters.q} />
                  <input name="filterTargetType" type="hidden" value={filters.targetType} />
                  <input name="status" type="hidden" value={filters.status} />
                  <input name="page" type="hidden" value={String(pageData.pagination.page)} />
                  <button className={styles.primaryAction} disabled={!canApprove} type="submit">
                    通过
                  </button>
                </form>
                <form action={rejectModerationAction}>
                  <input name="targetType" type="hidden" value={selectedDetail.targetTypeCode} />
                  <input name="targetId" type="hidden" value={selectedDetail.targetId} />
                  <input name="note" type="hidden" value="后台审核驳回" />
                  <input name="q" type="hidden" value={filters.q} />
                  <input name="filterTargetType" type="hidden" value={filters.targetType} />
                  <input name="status" type="hidden" value={filters.status} />
                  <input name="page" type="hidden" value={String(pageData.pagination.page)} />
                  <button className={styles.secondaryAction} disabled={!canReject} type="submit">
                    驳回
                  </button>
                </form>
                <form action={offlineModerationAction}>
                  <input name="targetType" type="hidden" value={selectedDetail.targetTypeCode} />
                  <input name="targetId" type="hidden" value={selectedDetail.targetId} />
                  <input name="note" type="hidden" value="后台审核下线" />
                  <input name="q" type="hidden" value={filters.q} />
                  <input name="filterTargetType" type="hidden" value={filters.targetType} />
                  <input name="status" type="hidden" value={filters.status} />
                  <input name="page" type="hidden" value={String(pageData.pagination.page)} />
                  <button className={styles.secondaryAction} disabled={!canOffline} type="submit">
                    下线
                  </button>
                </form>
                <form action={restoreModerationAction}>
                  <input name="targetType" type="hidden" value={selectedDetail.targetTypeCode} />
                  <input name="targetId" type="hidden" value={selectedDetail.targetId} />
                  <input name="note" type="hidden" value="后台审核恢复" />
                  <input name="q" type="hidden" value={filters.q} />
                  <input name="filterTargetType" type="hidden" value={filters.targetType} />
                  <input name="status" type="hidden" value={filters.status} />
                  <input name="page" type="hidden" value={String(pageData.pagination.page)} />
                  <button className={styles.secondaryAction} disabled={!canRestore} type="submit">
                    恢复
                  </button>
                </form>
                <a
                  className={styles.secondaryAction}
                  href={buildModerationHref(filters, {
                    selectedType: selectedDetail.targetTypeCode,
                    selectedId: selectedDetail.targetId
                  })}
                >
                  刷新
                </a>
              </footer>
            </>
          ) : (
            <div className={styles.emptyState}>
              <strong>{pageData.rows.length === 0 ? "暂无可查看的审核详情" : "请选择一条审核项"}</strong>
              <span>{pageData.modeDetail}</span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
