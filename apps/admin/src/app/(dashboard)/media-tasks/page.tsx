import Link from "next/link";
import { requireAdminAccess } from "@/lib/admin-auth";
import { buildAdminBrowserPath } from "@/lib/admin-routes";
import {
  AdminBackendError,
  getAdminMediaTask,
  listAdminMediaTasks,
  type AdminMediaTaskDetailData,
  type AdminMediaTaskListData
} from "@/lib/admin-service";
import { retryMediaTaskAction } from "./actions";
import MediaTasksTableInteractive from "./MediaTasksTableInteractive";
import styles from "./page.module.css";

const PAGE_SIZE = 15;

type MetricItem = {
  label: string;
  value: string;
  delta: string;
  kind: "failed" | "pending" | "new" | "abnormal";
};

type TaskStatusTone = "failed" | "pending" | "success" | "processing";

type TaskRow = {
  id: string;
  type: string;
  target: string;
  submitter: string;
  submitterId: string | null;
  submittedAt: string;
  currentStatus: string;
  statusTone: TaskStatusTone;
  errorSummary: string;
  retryCount: string;
  targetTypeCode: string;
  targetTypeLabel: string;
  targetId: string;
};

type RequestItem = {
  label: string;
  status: string;
  tone: "success" | "warning" | "danger";
};

type TaskLogItem = {
  time: string;
  text: string;
};

type TaskDetail = {
  id: string;
  title: string;
  targetType: string;
  targetTypeCode: string;
  targetId: string;
  submitter: string;
  submitterId: string;
  targetSummary: string;
  targetStatusCode: string;
  taskType: string;
  queueName: string;
  priorityLabel: string;
  currentStatus: string;
  statusTone: TaskStatusTone;
  errorSummary: string;
  retryCount: string;
  submittedAt: string;
  startedAt: string;
  finishedAt: string;
  retryable: boolean;
  previewFacts: readonly string[];
  requestItems: readonly RequestItem[];
  taskLogs: readonly TaskLogItem[];
  resultSummaryText: string;
  targetLink: string | null;
  userLink: string | null;
};

type MediaTaskFilters = {
  q: string;
  status: string;
  targetType: string;
  page: number;
};

type PageData = {
  hasError: boolean;
  subtitle: string;
  modeDetail: string;
  metrics: readonly MetricItem[];
  rows: readonly TaskRow[];
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

const ZERO_METRICS: readonly MetricItem[] = [
  { label: "失败任务数", value: "0", delta: "当前实时数据", kind: "failed" },
  { label: "待重试任务", value: "0", delta: "当前实时数据", kind: "pending" },
  { label: "今日新增任务", value: "0", delta: "当前实时数据", kind: "new" },
  { label: "处理中任务", value: "0", delta: "当前实时数据", kind: "abnormal" }
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "queued", label: "待处理" },
  { value: "processing", label: "处理中" },
  { value: "succeeded", label: "成功" },
  { value: "failed", label: "失败" }
] as const;

const TARGET_TYPE_FILTER_OPTIONS = [
  { value: "", label: "全部内容类型" },
  { value: "video", label: "视频作品" },
  { value: "prompt", label: "视频提示词" }
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

function resolveTaskTypeLabel(taskType: string) {
  if (taskType === "video_media_process") {
    return "视频媒体处理";
  }
  return taskType || "未知任务";
}

function resolveTargetTypeLabel(targetType: string) {
  if (targetType === "prompt") {
    return "视频提示词";
  }
  if (targetType === "video") {
    return "视频作品";
  }
  return "未知内容";
}

function resolveTargetLink(targetType: string, targetId: string) {
  if (!targetId) {
    return null;
  }
  if (targetType === "video" || targetType === "prompt") {
    return `/moderation?selectedType=${encodeURIComponent(targetType)}&selectedId=${encodeURIComponent(targetId)}`;
  }
  return null;
}

function resolveUserLink(userId: string | null | undefined) {
  if (!userId?.trim()) {
    return null;
  }
  return `/users?selected=${encodeURIComponent(userId.trim())}`;
}

function statusMeta(statusCode: string) {
  if (statusCode === "queued") {
    return { label: "待处理", tone: "pending" as const };
  }
  if (statusCode === "processing") {
    return { label: "处理中", tone: "processing" as const };
  }
  if (statusCode === "succeeded") {
    return { label: "成功", tone: "success" as const };
  }
  return { label: "失败", tone: "failed" as const };
}

function buildRequestItems(detail: AdminMediaTaskDetailData): RequestItem[] {
  const callbackCount = detail.callbackLogs.length;
  const resultReady = !!detail.resultJson?.trim();
  const desiredOutputs = detail.payloadSummary.desiredOutputs.length;

  return [
    {
      label: "原始载荷",
      status: detail.payloadSummary.draftId ? "已记录" : "未记录",
      tone: detail.payloadSummary.draftId ? "success" : "warning"
    },
    {
      label: "目标输出",
      status: desiredOutputs > 0 ? `${desiredOutputs} 项` : "未声明",
      tone: desiredOutputs > 0 ? "success" : "warning"
    },
    {
      label: "回调日志",
      status: callbackCount > 0 ? `已接收 ${callbackCount} 条` : "暂无回调",
      tone: callbackCount > 0 ? "success" : "warning"
    },
    {
      label: "结果数据",
      status: resultReady ? "已返回" : "未返回",
      tone: resultReady ? "success" : detail.statusCode === "failed" ? "danger" : "warning"
    },
    {
      label: "重试能力",
      status: detail.retryable ? "可重试" : "不可重试",
      tone: detail.retryable ? "warning" : detail.statusCode === "failed" ? "danger" : "success"
    }
  ];
}

function buildTaskLogs(detail: AdminMediaTaskDetailData): TaskLogItem[] {
  if (detail.callbackLogs.length === 0) {
    return [
      {
        time: detail.finishedAt ? formatDateTime(detail.finishedAt) : formatDateTime(detail.submittedAt),
        text: detail.errorMessage?.trim() || "当前还没有回调日志。"
      }
    ];
  }

  return detail.callbackLogs.map((item) => {
    const requestIdSuffix = item.requestId?.trim() ? ` / ${item.requestId.trim()}` : "";
    return {
      time: formatDateTime(item.createdAt),
      text: `${item.callbackType} · ${item.sourceName} · ${item.verifyStatus}/${item.processStatus}${requestIdSuffix}`
    };
  });
}

function buildResultSummary(detail: AdminMediaTaskDetailData) {
  if (detail.resultJson?.trim()) {
    return detail.resultJson.trim();
  }

  const payloadParts = [
    detail.payloadSummary.draftId ? `draftId: ${detail.payloadSummary.draftId}` : null,
    detail.payloadSummary.submitMode ? `submitMode: ${detail.payloadSummary.submitMode}` : null,
    detail.payloadSummary.sourceAssetId ? `sourceAssetId: ${detail.payloadSummary.sourceAssetId}` : null,
    detail.payloadSummary.coverAssetId ? `coverAssetId: ${detail.payloadSummary.coverAssetId}` : null,
    detail.payloadSummary.workflowId ? `workflowId: ${detail.payloadSummary.workflowId}` : null,
    detail.payloadSummary.desiredOutputs.length > 0
      ? `desiredOutputs: ${detail.payloadSummary.desiredOutputs.join(", ")}`
      : null
  ].filter(Boolean);

  if (payloadParts.length > 0) {
    return payloadParts.join("\n");
  }

  return "当前暂无结果载荷。";
}

function mapRow(item: AdminMediaTaskListData["items"][number]): TaskRow {
  const status = statusMeta(item.statusCode);
  return {
    id: item.taskId,
    type: resolveTaskTypeLabel(item.taskType),
    target: item.targetTitle,
    submitter: item.targetAuthorDisplayName,
    submitterId: item.targetAuthorId ?? null,
    submittedAt: formatDateTime(item.submittedAt),
    currentStatus: status.label,
    statusTone: status.tone,
    errorSummary: item.errorMessage?.trim() || "当前暂无错误摘要。",
    retryCount: `${item.retryCount} / ${item.maxRetryCount}`,
    targetTypeCode: item.targetType,
    targetTypeLabel: resolveTargetTypeLabel(item.targetType),
    targetId: item.targetId
  };
}

function mapDetail(detail: AdminMediaTaskDetailData): TaskDetail {
  const status = statusMeta(detail.statusCode);
  const previewFacts = [
    `队列 ${detail.queueName}`,
    `优先级 ${detail.priorityLevel}`,
    `提交 ${formatDateTime(detail.submittedAt)}`
  ];

  return {
    id: detail.taskId,
    title: detail.targetTitle,
    targetType: resolveTargetTypeLabel(detail.targetType),
    targetTypeCode: detail.targetType,
    targetId: detail.targetId,
    submitter: detail.targetAuthorDisplayName,
    submitterId: detail.targetAuthorId ?? "未记录",
    targetSummary: detail.targetSummary?.trim() || "当前暂无目标摘要。",
    targetStatusCode: detail.targetStatusCode,
    taskType: resolveTaskTypeLabel(detail.taskType),
    queueName: detail.queueName,
    priorityLabel: `P${detail.priorityLevel}`,
    currentStatus: status.label,
    statusTone: status.tone,
    errorSummary: detail.errorMessage?.trim() || "当前暂无错误摘要。",
    retryCount: `${detail.retryCount} / ${detail.maxRetryCount}`,
    submittedAt: formatDateTime(detail.submittedAt),
    startedAt: formatDateTime(detail.startedAt),
    finishedAt: formatDateTime(detail.finishedAt),
    retryable: detail.retryable,
    previewFacts,
    requestItems: buildRequestItems(detail),
    taskLogs: buildTaskLogs(detail),
    resultSummaryText: buildResultSummary(detail),
    targetLink: resolveTargetLink(detail.targetType, detail.targetId),
    userLink: resolveUserLink(detail.targetAuthorId)
  };
}

function buildSummaryFallbackDetail(row: TaskRow): TaskDetail {
  return {
    id: row.id,
    title: row.target,
    targetType: row.targetTypeLabel,
    targetTypeCode: row.targetTypeCode,
    targetId: row.targetId,
    submitter: row.submitter,
    submitterId: row.submitterId ?? "未记录",
    targetSummary: "详情读取失败，暂时退回列表摘要。",
    targetStatusCode: "unknown",
    taskType: row.type,
    queueName: "未知",
    priorityLabel: "—",
    currentStatus: row.currentStatus,
    statusTone: row.statusTone,
    errorSummary: row.errorSummary,
    retryCount: row.retryCount,
    submittedAt: row.submittedAt,
    startedAt: "未记录",
    finishedAt: "未记录",
    retryable: false,
    previewFacts: ["详情读取失败", "请稍后重试", `任务 ${row.id}`],
    requestItems: [
      { label: "原始载荷", status: "读取失败", tone: "danger" },
      { label: "目标输出", status: "读取失败", tone: "danger" },
      { label: "回调日志", status: "读取失败", tone: "danger" },
      { label: "结果数据", status: "读取失败", tone: "danger" },
      { label: "重试能力", status: "未知", tone: "warning" }
    ],
    taskLogs: [{ time: row.submittedAt, text: "详情读取失败，暂时退回列表摘要。" }],
    resultSummaryText: "详情读取失败，暂时无法展示结果载荷。",
    targetLink: resolveTargetLink(row.targetTypeCode, row.targetId),
    userLink: resolveUserLink(row.submitterId)
  };
}

function buildEmptyDetail(): TaskDetail {
  return {
    id: "",
    title: "暂无可选任务",
    targetType: "未选择",
    targetTypeCode: "",
    targetId: "",
    submitter: "—",
    submitterId: "—",
    targetSummary: "当前还没有可展示的媒体任务。",
    targetStatusCode: "unknown",
    taskType: "—",
    queueName: "—",
    priorityLabel: "—",
    currentStatus: "未选择",
    statusTone: "pending",
    errorSummary: "暂无任务错误摘要。",
    retryCount: "0 / 0",
    submittedAt: "未记录",
    startedAt: "未记录",
    finishedAt: "未记录",
    retryable: false,
    previewFacts: ["暂无任务", "等待任务入库", "可在发布链路触发媒体处理"],
    requestItems: [
      { label: "原始载荷", status: "暂无任务", tone: "warning" },
      { label: "目标输出", status: "暂无任务", tone: "warning" },
      { label: "回调日志", status: "暂无任务", tone: "warning" },
      { label: "结果数据", status: "暂无任务", tone: "warning" },
      { label: "重试能力", status: "暂无任务", tone: "warning" }
    ],
    taskLogs: [{ time: "—", text: "当前没有可展示的任务日志。" }],
    resultSummaryText: "当前没有可展示的任务结果。",
    targetLink: null,
    userLink: null
  };
}

function readFilters(searchParams?: {
  q?: string;
  status?: string;
  targetType?: string;
  page?: string;
}) {
  return {
    q: normalizeFilterValue(searchParams?.q),
    status: normalizeFilterValue(searchParams?.status),
    targetType: normalizeFilterValue(searchParams?.targetType),
    page: normalizePageValue(searchParams?.page)
  };
}

function hasActiveFilters(filters: MediaTaskFilters) {
  return Boolean(filters.q || filters.status || filters.targetType);
}

function buildMediaTasksHref(
  filters: MediaTaskFilters,
  options?: {
    selected?: string | null;
    error?: string | null;
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
  const nextPage = typeof options?.page === "number" && options.page > 0 ? options.page : filters.page;
  if (nextPage > 1) {
    searchParams.set("page", String(nextPage));
  }
  if (options?.error?.trim()) {
    searchParams.set("error", options.error.trim());
  }
  const query = searchParams.toString();
  return query ? `/media-tasks?${query}` : "/media-tasks";
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

async function loadPageData(filters: MediaTaskFilters): Promise<PageData> {
  try {
    const response = await listAdminMediaTasks({
      q: filters.q || undefined,
      status: filters.status || undefined,
      targetType: filters.targetType || undefined,
      page: filters.page,
      pageSize: PAGE_SIZE
    });
    const metrics: MetricItem[] = [
      {
        label: "失败任务数",
        value: formatMetricValue(response.data.summary.failedTasks),
        delta: "当前实时数据",
        kind: "failed"
      },
      {
        label: "待重试任务",
        value: formatMetricValue(response.data.summary.retryableTasks),
        delta: "当前实时数据",
        kind: "pending"
      },
      {
        label: "今日新增任务",
        value: formatMetricValue(response.data.summary.todayTasks),
        delta: "当前实时数据",
        kind: "new"
      },
      {
        label: "处理中任务",
        value: formatMetricValue(response.data.summary.processingTasks),
        delta: "当前实时数据",
        kind: "abnormal"
      }
    ];

    const rows = response.data.items.map(mapRow);
    const preferredSelected =
      rows.find((row) => row.statusTone === "failed")?.id ??
      rows.find((row) => row.statusTone === "processing")?.id ??
      rows[0]?.id ??
      null;

    if (rows.length === 0) {
      return {
        hasError: false,
        subtitle: "查看上传、转码、封面与预览相关任务状态",
        modeDetail: hasActiveFilters(filters)
          ? "当前筛选条件已走真实后端查询，但没有匹配到对应媒体任务。"
          : "admin/media-tasks 已接入真实后端，但库里还没有可展示的媒体任务。",
        metrics,
        rows,
        defaultSelectedId: null,
        totalCountLabel: `第 ${formatMetricValue(response.data.pagination.page)} 页，当前返回 0 条，共匹配 ${formatMetricValue(response.data.pagination.totalItems)} 条`,
        emptyMessage: hasActiveFilters(filters) ? "当前筛选条件下没有匹配的媒体任务。" : "当前还没有可展示的媒体任务。",
        pagination: response.data.pagination
      };
    }

    return {
      hasError: false,
      subtitle: "查看上传、转码、封面与预览相关任务状态",
      modeDetail: "任务列表、详情和 q / 状态 / 内容类型筛选都已接入真实后端。",
      metrics,
      rows,
      defaultSelectedId: preferredSelected,
      totalCountLabel: `第 ${formatMetricValue(response.data.pagination.page)} 页，当前返回 ${formatMetricValue(rows.length)} 条，共匹配 ${formatMetricValue(response.data.pagination.totalItems)} 条`,
      emptyMessage: null,
      pagination: response.data.pagination
    };
  } catch (error) {
    const requestId =
      error instanceof AdminBackendError && error.requestId
        ? `requestId: ${error.requestId}`
        : "媒体任务接口读取异常";

    return {
      hasError: true,
      subtitle: "查看上传、转码、封面与预览相关任务状态",
      modeDetail: `${requestId}，当前不再回退展示占位任务，请先排查真实后端请求。`,
      metrics: ZERO_METRICS,
      rows: [],
      defaultSelectedId: null,
      totalCountLabel: "第 1 页，当前返回 0 条，共匹配 0 条",
      emptyMessage: "当前无法读取媒体任务，请稍后重试。",
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
  row: TaskRow | null
): Promise<{
  detail: TaskDetail | null;
  errorMessage: string | null;
}> {
  if (!row) {
    return {
      detail: null,
      errorMessage: null
    };
  }

  try {
    const response = await getAdminMediaTask(row.id);
    return {
      detail: mapDetail(response.data),
      errorMessage: null
    };
  } catch {
    return {
      detail: buildSummaryFallbackDetail(row),
      errorMessage: "任务详情读取失败，当前仅展示列表摘要。"
    };
  }
}

function MetricIcon({ kind }: { kind: MetricItem["kind"] }) {
  if (kind === "failed") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.5 7.5 12.5 12.5M12.5 7.5 7.5 12.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "pending") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6.5v3.6l2.6 2.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "new") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.5" width="11" x="4.5" y="4.5" />
        <path d="M10 7v6M7 10h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M3.5 10s2.3-4 6.5-4 6.5 4 6.5 4-2.3 4-6.5 4-6.5-4-6.5-4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
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

function statusToneClass(tone: TaskStatusTone) {
  if (tone === "failed") {
    return styles.statusFailed;
  }
  if (tone === "pending") {
    return styles.statusPending;
  }
  if (tone === "success") {
    return styles.statusSuccess;
  }
  return styles.statusProcessing;
}

function requestToneClass(tone: RequestItem["tone"]) {
  if (tone === "danger") {
    return styles.requestDanger;
  }
  if (tone === "warning") {
    return styles.requestWarning;
  }
  return styles.requestSuccess;
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path d="M5.5 4.5 11.5 8l-6 3.5V4.5Z" fill="currentColor" />
    </svg>
  );
}

export default async function MediaTasksPage({
  searchParams
}: {
  searchParams?: Promise<{
    selected?: string;
    error?: string;
    success?: string;
    q?: string;
    status?: string;
    targetType?: string;
    page?: string;
  }>;
}) {
  await requireAdminAccess(["admin", "operator", "moderator"], "/media-tasks");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = readFilters(resolvedSearchParams);
  const pageData = await loadPageData(filters);
  const selectedTaskId = resolvedSearchParams?.selected?.trim() || pageData.defaultSelectedId || "";
  const selectedRow =
    pageData.rows.find((row) => row.id === selectedTaskId) ??
    pageData.rows.find((row) => row.id === pageData.defaultSelectedId) ??
    pageData.rows[0] ??
    null;
  const selectedDetailState = await loadSelectedDetail(selectedRow);
  const selectedDetail = selectedDetailState.detail ?? buildEmptyDetail();
  const errorMessage = resolvedSearchParams?.error?.trim() || null;
  const successMessage = resolvedSearchParams?.success?.trim() || null;
  const canRetry = !pageData.hasError && !!selectedDetail.id && selectedDetail.retryable;
  const paginationPages = buildPaginationPages(pageData.pagination.page, pageData.pagination.totalPages);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>媒体任务</h1>
          <p className={styles.subtitle}>{pageData.subtitle}</p>
        </div>
      </header>

      {successMessage ? (
        <section className={`${styles.noticeCard} ${styles.noticeSuccess}`}>
          <span className={styles.noticeText}>{successMessage}</span>
        </section>
      ) : null}

      {errorMessage ? (
        <section className={`${styles.noticeCard} ${styles.noticeError}`}>
          <span className={styles.noticeText}>{errorMessage}</span>
        </section>
      ) : null}

      <div className={styles.metricsGrid}>
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
      </div>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.filterCard}>
            <form action={buildAdminBrowserPath("/media-tasks")} className={styles.filterForm} method="get">
              <input name="page" type="hidden" value="1" />
              <div className={styles.filterGrid}>
                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>搜索关键词</span>
                  <input
                    className={styles.textInput}
                    defaultValue={filters.q}
                    name="q"
                    placeholder="任务 ID / 标题 / 作者 / 错误摘要"
                    type="search"
                  />
                </label>

                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>任务状态</span>
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
                  <span className={styles.selectLabel}>关联内容类型</span>
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
              </div>

              <div className={styles.filterFooter}>
                <div className={styles.filterActions}>
                  <Link className={styles.resetButton} href="/media-tasks" scroll={false}>
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
              <h2>任务列表</h2>
            </header>

            {pageData.rows.length > 0 ? (
              <>
                <MediaTasksTableInteractive>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>任务 ID</th>
                          <th>任务类型</th>
                          <th>关联内容</th>
                          <th>提交用户</th>
                          <th>提交时间</th>
                          <th>当前状态</th>
                          <th>错误摘要</th>
                          <th>重试次数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.rows.map((row) => {
                          const rowHref = buildMediaTasksHref(filters, { selected: row.id });
                          const isSelected = selectedRow?.id === row.id;

                          return (
                            <tr
                              key={row.id}
                              aria-selected={isSelected}
                              className={`${styles.tableRow} ${isSelected ? styles.rowSelected : ""}`}
                              data-row-href={rowHref}
                              tabIndex={0}
                            >
                              <td>{row.id}</td>
                              <td>{row.type}</td>
                              <td className={styles.targetCell}>{row.target}</td>
                              <td>{row.submitter}</td>
                              <td>{row.submittedAt}</td>
                              <td>
                                <span className={`${styles.statusPill} ${statusToneClass(row.statusTone)}`}>{row.currentStatus}</span>
                              </td>
                              <td className={styles.errorCell}>{row.errorSummary}</td>
                              <td>{row.retryCount}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </MediaTasksTableInteractive>

                <footer className={styles.tableFooter}>
                  <span>{pageData.totalCountLabel}</span>
                  <span className={styles.pageSizeButton}>每页 {pageData.pagination.pageSize} 条</span>
                </footer>
                <div className={styles.paginationArea}>
                  {pageData.pagination.totalPages > 1 ? (
                    <nav aria-label="媒体任务分页" className={styles.pagination}>
                      <Link
                        aria-disabled={!pageData.pagination.hasPrevious}
                        className={styles.pageButton}
                        href={buildMediaTasksHref(filters, {
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
                            href={buildMediaTasksHref(filters, {
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
                        href={buildMediaTasksHref(filters, {
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

        <aside className={styles.detailCard}>
          <header className={styles.detailHeader}>
            <div>
              <h2>任务详情</h2>
            </div>
            <Link className={styles.closeButton} href={buildMediaTasksHref(filters)} aria-label="关闭详情" scroll={false}>
              ×
            </Link>
          </header>

          {selectedRow ? (
            <>
              <div className={styles.detailBody}>
                <div className={styles.metaGroup}>
                  <div className={styles.metaRow}>
                    <span>任务 ID</span>
                    <strong>{selectedDetail.id}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>关联内容标题</span>
                    <strong className={styles.detailTextBox} title={selectedDetail.title}>
                      {selectedDetail.title}
                    </strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>内容类型</span>
                    <strong>{selectedDetail.targetType}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>提交用户</span>
                    <strong>{selectedDetail.submitter}</strong>
                  </div>
                </div>

                <section className={styles.previewSection}>
                  <h3>任务上下文摘要</h3>
                  <div className={styles.previewCard}>
                    <div className={styles.previewThumb}>
                      <span className={styles.previewPlay}>
                        <PlayIcon />
                      </span>
                      <div className={styles.previewTimebar}>
                        <span>{selectedDetail.targetType}</span>
                        <span>{selectedDetail.priorityLabel}</span>
                      </div>
                    </div>

                    <div className={styles.previewMeta}>
                      <strong title={selectedDetail.title}>{selectedDetail.title}</strong>
                      <div className={styles.previewFacts}>
                        {selectedDetail.previewFacts.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className={styles.previewHint}>这里展示的是任务关联内容的摘要上下文，便于排障，不代表已接入真实媒体预览播放器。</p>
                </section>

                <section className={styles.infoSection}>
                  <div className={styles.metaRow}>
                    <span>任务类型</span>
                    <strong>{selectedDetail.taskType}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>当前状态</span>
                    <strong className={selectedDetail.statusTone === "failed" ? styles.dangerText : undefined}>{selectedDetail.currentStatus}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>错误摘要</span>
                    <strong className={styles.detailTextBox} title={selectedDetail.errorSummary}>
                      {selectedDetail.errorSummary}
                    </strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>重试次数</span>
                    <strong>{selectedDetail.retryCount}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>开始时间</span>
                    <strong>{selectedDetail.startedAt}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>完成时间</span>
                    <strong>{selectedDetail.finishedAt}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>目标状态</span>
                    <strong>{selectedDetail.targetStatusCode}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>内容摘要</span>
                    <strong className={styles.detailTextBox} title={selectedDetail.targetSummary}>
                      {selectedDetail.targetSummary}
                    </strong>
                  </div>
                </section>

                <section className={styles.requestSection}>
                  <h3>关键信息</h3>
                  <div className={styles.requestList}>
                    {selectedDetail.requestItems.map((item) => (
                      <div key={item.label} className={styles.requestRow}>
                        <span>{item.label}</span>
                        <strong className={requestToneClass(item.tone)}>{item.status}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={styles.logSection}>
                  <div className={styles.sectionHeader}>
                    <h3>任务日志摘要</h3>
                    <span>{selectedDetail.taskLogs.length} 条记录</span>
                  </div>

                  <ul className={styles.logList}>
                    {selectedDetail.taskLogs.map((item) => (
                      <li key={`${item.time}-${item.text}`}>
                        <span>{item.time}</span>
                        <strong>{item.text}</strong>
                      </li>
                    ))}
                  </ul>
                  {selectedDetailState.errorMessage ? <span className={styles.placeholderNote}>{selectedDetailState.errorMessage}</span> : null}
                </section>

                <section className={styles.noteSection}>
                  <div className={styles.sectionHeader}>
                    <h3>结果载荷</h3>
                    <span>实时后端</span>
                  </div>
                  <textarea readOnly rows={4} value={selectedDetail.resultSummaryText} />
                </section>

                <section className={styles.actionsSection}>
                  <h3>关联入口</h3>
                  <div className={styles.quickActions}>
                    {selectedDetail.targetLink ? (
                      <Link className={styles.quickAction} href={selectedDetail.targetLink} scroll={false}>
                        查看关联内容
                      </Link>
                    ) : null}
                    {selectedDetail.userLink ? (
                      <Link className={styles.quickAction} href={selectedDetail.userLink} scroll={false}>
                        查看用户信息
                      </Link>
                    ) : null}
                    <Link className={styles.quickAction} href={buildMediaTasksHref(filters)} scroll={false}>
                      返回任务列表
                    </Link>
                  </div>
                </section>
              </div>

              <footer className={styles.detailFooter}>
                <form action={retryMediaTaskAction}>
                  <input name="taskId" type="hidden" value={selectedDetail.id} />
                  <input name="q" type="hidden" value={filters.q} />
                  <input name="status" type="hidden" value={filters.status} />
                  <input name="targetType" type="hidden" value={filters.targetType} />
                  <input name="page" type="hidden" value={String(pageData.pagination.page)} />
                  <button className={styles.primaryAction} disabled={!canRetry} type="submit">
                    重试任务
                  </button>
                </form>
                {selectedDetail.targetLink ? (
                  <Link className={styles.secondaryAction} href={selectedDetail.targetLink} scroll={false}>
                    查看关联内容
                  </Link>
                ) : (
                  <Link className={styles.secondaryAction} href={buildMediaTasksHref(filters)} scroll={false}>
                    返回列表
                  </Link>
                )}
              </footer>
            </>
          ) : (
            <div className={styles.emptyState}>
              <strong>{pageData.rows.length === 0 ? "暂无可查看的任务详情" : "请选择一条媒体任务"}</strong>
              <span>{pageData.modeDetail}</span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
