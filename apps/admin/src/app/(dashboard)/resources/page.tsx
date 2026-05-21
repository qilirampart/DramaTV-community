import Link from "next/link";
import { requireAdminAccess } from "@/lib/admin-auth";
import {
  AdminBackendError,
  getAdminResource,
  listAdminResources,
  type AdminResourceDetailData,
  type AdminResourceListData
} from "@/lib/admin-service";
import { offlineResourceAction, restoreResourceAction } from "./actions";
import { resolveFeedOpsMediaUrl } from "../feed-ops/shared/feed-ops-media";
import ModerationMediaPreview from "../moderation/ModerationMediaPreview";
import ModerationTableInteractive from "../moderation/ModerationTableInteractive";
import styles from "../moderation/page.module.css";

const PAGE_SIZE = 20;

type Metric = {
  label: string;
  value: string;
  delta: string;
  kind: "total" | "published" | "pending" | "offline" | "rejected";
};

type GovernanceTone = "published" | "pending" | "rejected" | "offline";
type RiskTone = "low" | "medium" | "high";
type ContentType = "视频提示词" | "图片提示词" | "工作流" | "帖子" | "视频作品";
type MediaAsset = {
  coverUrl: string | null;
  posterUrl: string | null;
  previewUrl: string | null;
  sourceUrl: string | null;
};

type ResourceRow = {
  id: string;
  targetTypeCode: "video" | "workflow" | "prompt" | "post";
  targetId: string;
  title: string;
  type: ContentType;
  author: string;
  authorId: string | null;
  tags: readonly string[];
  publishedAt: string;
  reviewedAt: string;
  publishStatus: string;
  governanceStatus: string;
  statusTone: GovernanceTone;
  risk: string;
  riskTone: RiskTone;
  reviewer: string;
  previewTone: "neon" | "cloud" | "graph" | "studio" | "void";
  excerpt: string;
  channelTitle: string | null;
  bindingTargetType: string | null;
  bindingTargetId: string | null;
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
  publishedAt: string;
  reviewedAt: string;
  publishStatus: string;
  governanceStatus: string;
  statusTone: GovernanceTone;
  risk: string;
  riskTone: RiskTone;
  reviewer: string;
  previewTone: ResourceRow["previewTone"];
  excerpt: string;
  contentText: string;
  channelTitle: string | null;
  bindingTargetType: string | null;
  bindingTargetId: string | null;
  media: MediaAsset;
  modelTags: readonly string[];
  riskItems: readonly {
    label: string;
    tone: RiskTone;
    detail: string;
  }[];
};

type ResourceFilters = {
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
  rows: readonly ResourceRow[];
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
  { label: "资源总量", value: "0", delta: "当前真实数据", kind: "total" },
  { label: "已发布", value: "0", delta: "当前真实数据", kind: "published" },
  { label: "待治理", value: "0", delta: "当前真实数据", kind: "pending" },
  { label: "已下线", value: "0", delta: "当前真实数据", kind: "offline" },
  { label: "已驳回", value: "0", delta: "当前真实数据", kind: "rejected" }
];

const TARGET_TYPE_FILTER_OPTIONS = [
  { value: "", label: "全部资源类型" },
  { value: "video", label: "视频作品" },
  { value: "image_prompt", label: "图片提示词" },
  { value: "video_prompt", label: "视频提示词" },
  { value: "workflow", label: "工作流" },
  { value: "post", label: "帖子" }
] as const;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "全部治理状态" },
  { value: "published", label: "已发布" },
  { value: "pending_review", label: "待治理" },
  { value: "in_review", label: "治理中" },
  { value: "taken_down", label: "已下线" },
  { value: "rejected", label: "已驳回" }
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

function promptTypeLabel(media?: Partial<MediaAsset> | null): ContentType {
  return media?.previewUrl?.trim() || media?.sourceUrl?.trim() ? "视频提示词" : "图片提示词";
}

function typeLabel(item: { targetType: string; media?: Partial<MediaAsset> | null }): ContentType {
  if (item.targetType === "workflow") {
    return "工作流";
  }
  if (item.targetType === "post") {
    return "帖子";
  }
  if (item.targetType === "video") {
    return "视频作品";
  }
  return promptTypeLabel(item.media);
}

function previewTone(type: ContentType): ResourceRow["previewTone"] {
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

function isPromptResource(detail: DetailItem) {
  return detail.targetTypeCode === "prompt";
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

function governanceMeta(code: string) {
  if (code === "taken_down") {
    return { status: "已下线", tone: "offline" as const };
  }
  if (code === "rejected") {
    return { status: "已驳回", tone: "rejected" as const };
  }
  if (code === "pending_review" || code === "in_review") {
    return { status: code === "in_review" ? "治理中" : "待治理", tone: "pending" as const };
  }
  return { status: "已发布", tone: "published" as const };
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

function mapRow(item: AdminResourceListData["items"][number]): ResourceRow {
  const media = normalizeMedia(item.media);
  const type = typeLabel({ targetType: item.targetType, media });
  const status = governanceMeta(item.governanceStatusCode);
  const risk = riskMeta(item.riskLevel);

  return {
    id: rowKey(item.targetType, item.targetId),
    targetTypeCode: item.targetType as ResourceRow["targetTypeCode"],
    targetId: item.targetId,
    title: item.title,
    type,
    author: item.authorDisplayName,
    authorId: item.authorId ?? null,
    tags: item.tagNames,
    publishedAt: formatDateTime(item.publishedAt),
    reviewedAt: formatDateTime(item.reviewedAt),
    publishStatus: item.publishStatusCode,
    governanceStatus: status.status,
    statusTone: status.tone,
    risk: risk.risk,
    riskTone: risk.tone,
    reviewer: item.reviewerDisplayName ?? "—",
    previewTone: previewTone(type),
    excerpt: item.summaryText?.trim() || "当前暂无摘要。",
    channelTitle: item.channelTitle ?? null,
    bindingTargetType: item.bindingTargetType ?? null,
    bindingTargetId: item.bindingTargetId ?? null,
    media,
    modelTags: item.modelTags
  };
}

function mapDetail(item: AdminResourceDetailData): DetailItem {
  const media = normalizeMedia(item.media);
  const type = typeLabel({ targetType: item.targetType, media });
  const status = governanceMeta(item.governanceStatusCode);
  const risk = riskMeta(item.riskLevel);

  return {
    title: item.title,
    targetTypeCode: item.targetType as DetailItem["targetTypeCode"],
    targetId: item.targetId,
    type,
    author: item.authorDisplayName,
    authorId: item.authorId ?? null,
    tags: item.tagNames,
    publishedAt: formatDateTime(item.publishedAt),
    reviewedAt: formatDateTime(item.reviewedAt),
    publishStatus: item.publishStatusCode,
    governanceStatus: status.status,
    statusTone: status.tone,
    risk: risk.risk,
    riskTone: risk.tone,
    reviewer: item.reviewerDisplayName ?? "—",
    previewTone: previewTone(type),
    excerpt: item.summaryText?.trim() || "当前暂无摘要。",
    contentText: item.contentText?.trim() || item.summaryText?.trim() || "当前暂无正文内容。",
    channelTitle: item.channelTitle ?? null,
    bindingTargetType: item.bindingTargetType ?? null,
    bindingTargetId: item.bindingTargetId ?? null,
    media,
    modelTags: item.modelTags,
    riskItems: item.riskSignals.map((signal) => ({
      label: signal.label,
      tone: signal.tone === "high" ? "high" : signal.tone === "medium" ? "medium" : "low",
      detail: signal.detail
    }))
  };
}

function buildSummaryDetail(row: ResourceRow): DetailItem {
  return {
    title: row.title,
    targetTypeCode: row.targetTypeCode,
    targetId: row.targetId,
    type: row.type,
    author: row.author,
    authorId: row.authorId,
    tags: row.tags,
    publishedAt: row.publishedAt,
    reviewedAt: row.reviewedAt,
    publishStatus: row.publishStatus,
    governanceStatus: row.governanceStatus,
    statusTone: row.statusTone,
    risk: row.risk,
    riskTone: row.riskTone,
    reviewer: row.reviewer,
    previewTone: row.previewTone,
    excerpt: row.excerpt,
    contentText: row.excerpt,
    channelTitle: row.channelTitle,
    bindingTargetType: row.bindingTargetType,
    bindingTargetId: row.bindingTargetId,
    media: normalizeMedia(row.media),
    modelTags: row.modelTags,
    riskItems: [
      {
        label: row.riskTone === "high" ? "当前命中高风险信号" : row.riskTone === "medium" ? "当前命中中风险信号" : "当前未见明显违规风险",
        tone: row.riskTone,
        detail: "详情读取失败，当前仅展示列表摘要。"
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

function hasActiveFilters(filters: ResourceFilters) {
  return Boolean(filters.q || filters.targetType || filters.status);
}

function buildResourcesHref(
  filters: ResourceFilters,
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
  return query ? `/resources?${query}` : "/resources";
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

function buildMetrics(summary: AdminResourceListData["summary"]): readonly Metric[] {
  return [
    {
      label: "资源总量",
      value: formatMetricValue(summary.totalItems),
      delta: "当前真实数据",
      kind: "total"
    },
    {
      label: "已发布",
      value: formatMetricValue(summary.publishedItems),
      delta: "当前真实数据",
      kind: "published"
    },
    {
      label: "待治理",
      value: formatMetricValue(summary.pendingItems),
      delta: "当前真实数据",
      kind: "pending"
    },
    {
      label: "已下线",
      value: formatMetricValue(summary.offlineItems),
      delta: "当前真实数据",
      kind: "offline"
    },
    {
      label: "已驳回",
      value: formatMetricValue(summary.rejectedItems),
      delta: "当前真实数据",
      kind: "rejected"
    }
  ];
}

async function loadPageData(filters: ResourceFilters): Promise<PageData> {
  try {
    const response = await listAdminResources({
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
        modeTitle: "当前为真实资源数据",
        modeDetail: hasActiveFilters(filters)
          ? "筛选条件已走真实后端查询，但当前没有命中对应资源。"
          : "资源治理页已接入真实后端，但当前没有可展示资源。",
        metrics: buildMetrics(response.data.summary),
        rows,
        defaultSelectedKey: null,
        totalCountLabel: "共 0 条",
        emptyMessage: hasActiveFilters(filters) ? "当前筛选条件下没有匹配资源。" : "当前还没有可治理资源。",
        pagination: response.data.pagination
      };
    }

    return {
      hasError: false,
      modeTitle: "当前为真实资源数据",
      modeDetail: "资源列表、详情、筛选、分页和下线恢复动作都已连接真实后端。",
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
        : "资源接口读取异常";

    return {
      hasError: true,
      modeTitle: "资源数据读取失败",
      modeDetail: `${requestId}，当前不再回退展示占位资源，请先排查真实后端请求。`,
      metrics: ZERO_METRICS,
      rows: [],
      defaultSelectedKey: null,
      totalCountLabel: "共 0 条",
      emptyMessage: "当前无法读取资源列表，请稍后重试。",
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
  row: ResourceRow | null
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
    const response = await getAdminResource(row.targetTypeCode, row.targetId);
    return {
      detail: mapDetail(response.data),
      errorMessage: null
    };
  } catch {
    return {
      detail: buildSummaryDetail(row),
      errorMessage: "资源详情读取失败，当前仅展示列表摘要。"
    };
  }
}

function MetricIcon({ kind }: { kind: Metric["kind"] }) {
  if (kind === "total") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M4.75 5.5h10.5M4.75 10h10.5M4.75 14.5h10.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === "published") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.7 10.05 9.3 11.6 12.6 8.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === "pending") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 3.75 15 5.25v4.1c0 3.06-2.1 5.87-5 6.9-2.9-1.03-5-3.84-5-6.9v-4.1l5-1.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M10 7.5v3.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="10" cy="13.15" fill="currentColor" r="0.85" />
      </svg>
    );
  }
  if (kind === "offline") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 4.25v7.5M6.75 8.5 10 11.75 13.25 8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M4.5 14.75h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
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

function StatusTone(tone: GovernanceTone) {
  if (tone === "published") {
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

function PreviewToneClass(tone: ResourceRow["previewTone"]) {
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

function bindingTypeLabel(bindingTargetType?: string | null) {
  if (bindingTargetType === "video") {
    return "视频作品";
  }
  if (bindingTargetType === "workflow") {
    return "工作流";
  }
  if (bindingTargetType === "prompt") {
    return "提示词";
  }
  return "—";
}

export default async function ResourcesPage({
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
  await requireAdminAccess(["admin", "moderator"], "/resources");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = readFilters(resolvedSearchParams);
  const pageData = await loadPageData(filters);
  const paginationPages = buildPaginationPages(pageData.pagination.page, pageData.pagination.totalPages);
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
  const canOffline = canAct && selectedDetail?.statusTone !== "offline";
  const canRestore = canAct && selectedDetail?.statusTone === "offline";

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>资源治理</h1>
          <p className={styles.subtitle}>查看社区真实资源，并按资源维度执行下线与恢复</p>
        </div>
      </header>

      {errorMessage ? (
        <div className={styles.modeBadge}>
          <strong>资源动作失败</strong>
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.metricsGrid} style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
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
            <form action="/resources" className={styles.filterForm} method="get">
              <input name="page" type="hidden" value="1" />

              <div className={styles.filterGrid}>
                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>搜索关键词</span>
                  <input
                    className={styles.textInput}
                    defaultValue={filters.q}
                    name="q"
                    placeholder="标题 / 作者昵称 / 资源 ID"
                    type="search"
                  />
                </label>

                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>资源类型</span>
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
                  <span className={styles.selectLabel}>治理状态</span>
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
                  <Link className={styles.resetButton} href="/resources" scroll={false}>
                    重置筛选
                  </Link>
                  <button className={styles.primaryAction} type="submit">
                    应用筛选
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className={styles.tableCard}>
            <header className={styles.tableHeader}>
              <h2>资源列表</h2>
            </header>

            {pageData.rows.length > 0 ? (
              <>
                <ModerationTableInteractive>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>预览</th>
                          <th>资源标题</th>
                          <th>资源类型</th>
                          <th>作者</th>
                          <th>标签</th>
                          <th>发布时间</th>
                          <th>治理状态</th>
                          <th>风险提示</th>
                          <th>处理人</th>
                          <th>操作入口</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.rows.map((row) => {
                          const rowHref = buildResourcesHref(filters, {
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
                              <td>{row.publishedAt}</td>
                              <td>
                                <span className={`${styles.statusPill} ${StatusTone(row.statusTone)}`}>{row.governanceStatus}</span>
                              </td>
                              <td>
                                <span className={`${styles.riskPill} ${RiskToneClass(row.riskTone)}`}>{row.risk}</span>
                              </td>
                              <td>{row.reviewer}</td>
                              <td>
                                <span className={styles.rowAssist}>{isSelected ? "当前查看中" : "点击行查看"}</span>
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
                </footer>

                <div className={styles.paginationArea}>
                  <span className={styles.pageSizeButton}>每页 {pageData.pagination.pageSize} 条</span>
                  <nav aria-label="资源分页" className={styles.pagination}>
                    <Link
                      className={styles.pageButton}
                      href={buildResourcesHref(filters, {
                        selectedType: selectedRow?.targetTypeCode ?? null,
                        selectedId: selectedRow?.targetId ?? null,
                        page: Math.max(1, pageData.pagination.page - 1)
                      })}
                      scroll={false}
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
                          href={buildResourcesHref(filters, {
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
                      className={styles.pageButton}
                      href={buildResourcesHref(filters, {
                        selectedType: selectedRow?.targetTypeCode ?? null,
                        selectedId: selectedRow?.targetId ?? null,
                        page: Math.min(pageData.pagination.totalPages, pageData.pagination.page + 1)
                      })}
                      scroll={false}
                    >
                      下一页
                    </Link>
                  </nav>
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
                <h2>资源详情</h2>
                <span className={`${styles.statusPill} ${StatusTone(selectedDetail.statusTone)}`}>{selectedDetail.governanceStatus}</span>
                <span className={`${styles.typePill} ${TypeTone(selectedDetail.type)}`}>{selectedDetail.type}</span>
              </div>
            ) : (
              <div className={styles.drawerTitleRow}>
                <h2>资源详情</h2>
              </div>
            )}
            <Link className={styles.drawerClose} href={buildResourcesHref(filters)} scroll={false}>
              ×
            </Link>
          </header>

          {selectedDetail ? (
            <>
              <div className={styles.drawerBody}>
                <section className={styles.section}>
                  <h3>1. 基本信息</h3>
                  <dl className={styles.infoGrid}>
                    <div>
                      <dt>资源标题:</dt>
                      <dd>{selectedDetail.title}</dd>
                    </div>
                    <div>
                      <dt>资源 ID:</dt>
                      <dd>{selectedDetail.targetId}</dd>
                    </div>
                    <div>
                      <dt>作者昵称:</dt>
                      <dd>{selectedDetail.author}</dd>
                    </div>
                    <div>
                      <dt>作者 ID:</dt>
                      <dd>{selectedDetail.authorId ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>发布时间:</dt>
                      <dd>{selectedDetail.publishedAt}</dd>
                    </div>
                    <div>
                      <dt>最近治理时间:</dt>
                      <dd>{selectedDetail.reviewedAt}</dd>
                    </div>
                    <div>
                      <dt>发布状态:</dt>
                      <dd>{selectedDetail.publishStatus}</dd>
                    </div>
                    <div>
                      <dt>治理状态:</dt>
                      <dd>{selectedDetail.governanceStatus}</dd>
                    </div>
                    <div>
                      <dt>帖子频道:</dt>
                      <dd>{selectedDetail.channelTitle ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>挂载对象:</dt>
                      <dd>{bindingTypeLabel(selectedDetail.bindingTargetType)}</dd>
                    </div>
                    <div>
                      <dt>挂载对象 ID:</dt>
                      <dd>{selectedDetail.bindingTargetId ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>处理人:</dt>
                      <dd>{selectedDetail.reviewer}</dd>
                    </div>
                    <div>
                      <dt>分类标签:</dt>
                      <dd>{selectedDetail.tags.length > 0 ? selectedDetail.tags.join(" / ") : "—"}</dd>
                    </div>
                    <div>
                      <dt>模型标签:</dt>
                      <dd>{selectedDetail.modelTags.length > 0 ? selectedDetail.modelTags.join(" / ") : "—"}</dd>
                    </div>
                  </dl>
                </section>

                <section className={styles.section}>
                  <h3>2. 内容预览</h3>
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
                  <h3>3. 摘要与正文</h3>
                  <div className={styles.contentStack}>
                    <div className={styles.contentBlock}>
                      <span className={styles.contentLabel}>摘要</span>
                      <p className={styles.excerpt}>{selectedDetail.excerpt}</p>
                    </div>
                    <div className={styles.contentBlock}>
                      <span className={styles.contentLabel}>
                        {isPromptResource(selectedDetail) ? "提示词正文" : "正文"}
                      </span>
                      <p className={`${styles.excerpt} ${styles.contentBody}`}>{selectedDetail.contentText}</p>
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
                  <h3>5. 治理说明</h3>
                  <div className={styles.noteBox}>
                    <span>资源治理页展示的是前台真实资源，执行下线后应立即影响前台公开可见性。</span>
                    <span className={styles.noteCount}>{selectedDetailState.errorMessage ?? "当前详情已连接真实后端。"}</span>
                  </div>
                </section>
              </div>

              <footer className={styles.drawerFooter}>
                <form action={offlineResourceAction}>
                  <input name="targetType" type="hidden" value={selectedDetail.targetTypeCode} />
                  <input name="targetId" type="hidden" value={selectedDetail.targetId} />
                  <input name="q" type="hidden" value={filters.q} />
                  <input name="filterTargetType" type="hidden" value={filters.targetType} />
                  <input name="status" type="hidden" value={filters.status} />
                  <input name="page" type="hidden" value={String(filters.page)} />
                  <input name="note" type="hidden" value="" />
                  <button className={styles.secondaryAction} disabled={!canOffline} type="submit">
                    执行下线
                  </button>
                </form>

                <form action={restoreResourceAction}>
                  <input name="targetType" type="hidden" value={selectedDetail.targetTypeCode} />
                  <input name="targetId" type="hidden" value={selectedDetail.targetId} />
                  <input name="q" type="hidden" value={filters.q} />
                  <input name="filterTargetType" type="hidden" value={filters.targetType} />
                  <input name="status" type="hidden" value={filters.status} />
                  <input name="page" type="hidden" value={String(filters.page)} />
                  <input name="note" type="hidden" value="" />
                  <button className={styles.primaryAction} disabled={!canRestore} type="submit">
                    恢复发布
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className={styles.emptyState}>
              <strong>请选择一条资源</strong>
              <span>支持直接点击左侧行查看详情，并从这里执行下线或恢复。</span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
