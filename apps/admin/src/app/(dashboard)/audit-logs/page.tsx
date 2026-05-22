import Link from "next/link";
import { requireAdminAccess } from "@/lib/admin-auth";
import {
  AdminBackendError,
  getAdminAuditLog,
  listAdminAuditLogs,
  type AdminAuditLogDetailData,
  type AdminAuditLogListData
} from "@/lib/admin-service";
import AuditLogsTableInteractive from "./AuditLogsTableInteractive";
import styles from "./page.module.css";

const PAGE_SIZE = 15;

type MetricItem = {
  label: string;
  value: string;
  delta: string;
  kind: "total" | "sensitive" | "review" | "publish";
};

type ActionTone = "green" | "orange" | "red" | "blue" | "gray";
type ResultTone = "success" | "failed";

type AuditRow = {
  id: string;
  time: string;
  operator: string;
  operatorRole: string;
  module: string;
  moduleCode: string;
  action: string;
  actionCode: string;
  actionTone: ActionTone;
  target: string;
  objectType: string;
  result: string;
  resultTone: ResultTone;
  riskLabel: string;
  note: string;
  requestId: string;
  traceId: string;
  requestPath: string;
  requestMethod: string;
  responseStatus: string;
  moduleRoute: string;
};

type AuditDetail = {
  id: string;
  time: string;
  operator: string;
  operatorRole: string;
  module: string;
  action: string;
  actionTone: ActionTone;
  target: string;
  targetType: string;
  targetId: string;
  result: string;
  resultTone: ResultTone;
  riskLabel: string;
  note: string;
  requestId: string;
  traceId: string;
  requestPath: string;
  requestMethod: string;
  responseStatus: string;
  metadataText: string;
  moduleRoute: string;
};

type AuditFilters = {
  q: string;
  module: string;
  result: string;
  risk: string;
  page: number;
};

type PageData = {
  hasError: boolean;
  modeTitle: string;
  modeDetail: string;
  metrics: readonly MetricItem[];
  rows: readonly AuditRow[];
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
  { label: "今日操作总数", value: "0", delta: "当前实时数据", kind: "total" },
  { label: "敏感操作数", value: "0", delta: "当前实时数据", kind: "sensitive" },
  { label: "审核治理数", value: "0", delta: "当前实时数据", kind: "review" },
  { label: "配置变更数", value: "0", delta: "当前实时数据", kind: "publish" }
];

const MODULE_FILTER_OPTIONS = [
  { value: "", label: "全部模块" },
  { value: "comments", label: "评论治理" },
  { value: "moderation", label: "内容审核" },
  { value: "reports", label: "举报工单" },
  { value: "taxonomy", label: "分类治理" },
  { value: "feed_ops", label: "运营编排" },
  { value: "media_tasks", label: "媒体任务" },
  { value: "auth", label: "后台认证" }
] as const;

const RESULT_FILTER_OPTIONS = [
  { value: "", label: "全部结果" },
  { value: "success", label: "成功" },
  { value: "failed", label: "失败" }
] as const;

const RISK_FILTER_OPTIONS = [
  { value: "", label: "全部风险" },
  { value: "normal", label: "普通" },
  { value: "sensitive", label: "敏感" }
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

function resolveRoleLabel(roleCode: string | null | undefined) {
  switch (roleCode) {
    case "admin":
      return "系统管理员";
    case "operator":
      return "运营管理员";
    case "moderator":
      return "审核员";
    default:
      return roleCode?.trim() || "后台成员";
  }
}

function resolveTargetTypeLabel(targetType: string | null | undefined) {
  switch (targetType) {
    case "session":
      return "登录会话";
    case "comment":
      return "评论";
    case "report_ticket":
      return "举报工单";
    case "taxonomy":
      return "分类治理";
    case "feed_ops_page":
      return "运营页配置";
    case "media_task":
      return "媒体任务";
    case "video":
      return "视频作品";
    case "workflow":
      return "工作流";
    case "prompt":
      return "提示词";
    case "post":
      return "帖子";
    default:
      return targetType?.trim() || "未记录";
  }
}

function resolveModuleRoute(moduleCode: string, targetId?: string | null) {
  if (moduleCode === "comments") {
    return "/comments";
  }
  if (moduleCode === "moderation") {
    return "/moderation";
  }
  if (moduleCode === "reports") {
    return "/reports";
  }
  if (moduleCode === "taxonomy") {
    return "/taxonomy";
  }
  if (moduleCode === "feed_ops") {
    if (targetId === "featured") {
      return "/feed-ops/featured";
    }
    if (targetId === "discussions") {
      return "/feed-ops/discussions";
    }
    return "/feed-ops/home";
  }
  if (moduleCode === "media_tasks") {
    return "/media-tasks";
  }
  return "/dashboard";
}

function resolveActionTone(actionCode: string): ActionTone {
  if (["approve", "restore", "restore_comment"].includes(actionCode)) {
    return "green";
  }
  if (["reject", "processing", "update_page", "update_taxonomy"].includes(actionCode)) {
    return "orange";
  }
  if (["hide_comment", "delete_comment", "offline", "offline_target", "close", "hide_reported_comment"].includes(actionCode)) {
    return "red";
  }
  if (["retry", "login", "logout"].includes(actionCode)) {
    return "blue";
  }
  return "gray";
}

function resolveResultStatus(resultStatus: string) {
  if (resultStatus === "failed") {
    return { label: "失败", tone: "failed" as const };
  }
  return { label: "成功", tone: "success" as const };
}

function resolveRiskLabel(riskLevel: string | null | undefined) {
  return riskLevel === "sensitive" ? "敏感" : "普通";
}

function mapRow(item: AdminAuditLogListData["items"][number]): AuditRow {
  const result = resolveResultStatus(item.resultStatus);
  return {
    id: item.id,
    time: formatDateTime(item.occurredAt),
    operator: item.operatorDisplayName,
    operatorRole: resolveRoleLabel(item.operatorRoleCode),
    module: item.moduleLabel,
    moduleCode: item.moduleCode,
    action: item.actionLabel,
    actionCode: item.actionCode,
    actionTone: resolveActionTone(item.actionCode),
    target: item.targetTitle?.trim() || item.targetId?.trim() || "未记录目标",
    objectType: resolveTargetTypeLabel(item.targetType),
    result: result.label,
    resultTone: result.tone,
    riskLabel: resolveRiskLabel(item.riskLevel),
    note: item.noteText?.trim() || `${item.requestMethod} ${item.requestPath}`,
    requestId: item.requestId?.trim() || "未记录",
    traceId: item.traceId?.trim() || "未记录",
    requestPath: item.requestPath,
    requestMethod: item.requestMethod,
    responseStatus: String(item.responseStatus),
    moduleRoute: resolveModuleRoute(item.moduleCode, item.targetId)
  };
}

function mapDetail(detail: AdminAuditLogDetailData): AuditDetail {
  const result = resolveResultStatus(detail.resultStatus);
  return {
    id: detail.id,
    time: formatDateTime(detail.occurredAt),
    operator: detail.operatorDisplayName,
    operatorRole: resolveRoleLabel(detail.operatorRoleCode),
    module: detail.moduleLabel,
    action: detail.actionLabel,
    actionTone: resolveActionTone(detail.actionCode),
    target: detail.targetTitle?.trim() || detail.targetId?.trim() || "未记录目标",
    targetType: resolveTargetTypeLabel(detail.targetType),
    targetId: detail.targetId?.trim() || "未记录",
    result: result.label,
    resultTone: result.tone,
    riskLabel: resolveRiskLabel(detail.riskLevel),
    note: detail.noteText?.trim() || "当前暂无补充备注。",
    requestId: detail.requestId?.trim() || "未记录",
    traceId: detail.traceId?.trim() || "未记录",
    requestPath: detail.requestPath,
    requestMethod: detail.requestMethod,
    responseStatus: String(detail.responseStatus),
    metadataText: detail.metadataText?.trim() || "当前暂无扩展上下文。",
    moduleRoute: resolveModuleRoute(detail.moduleCode, detail.targetId)
  };
}

function buildRowSummaryDetail(row: AuditRow): AuditDetail {
  return {
    id: row.id,
    time: row.time,
    operator: row.operator,
    operatorRole: row.operatorRole,
    module: row.module,
    action: row.action,
    actionTone: row.actionTone,
    target: row.target,
    targetType: row.objectType,
    targetId: row.target,
    result: row.result,
    resultTone: row.resultTone,
    riskLabel: row.riskLabel,
    note: row.note,
    requestId: row.requestId,
    traceId: row.traceId,
    requestPath: row.requestPath,
    requestMethod: row.requestMethod,
    responseStatus: row.responseStatus,
    metadataText: "详情读取失败，当前仅展示列表摘要，扩展上下文暂不可用。",
    moduleRoute: row.moduleRoute
  };
}

function buildEmptyDetail(): AuditDetail {
  return {
    id: "",
    time: "未记录",
    operator: "暂无日志",
    operatorRole: "后台成员",
    module: "未选择",
    action: "未选择",
    actionTone: "gray",
    target: "当前没有可展示的审计记录。",
    targetType: "未记录",
    targetId: "未记录",
    result: "成功",
    resultTone: "success",
    riskLabel: "普通",
    note: "当前没有可展示的审计记录。",
    requestId: "未记录",
    traceId: "未记录",
    requestPath: "未记录",
    requestMethod: "未记录",
    responseStatus: "未记录",
    metadataText: "等待后台治理动作写入。",
    moduleRoute: "/dashboard"
  };
}

function readFilters(searchParams?: {
  q?: string;
  module?: string;
  result?: string;
  risk?: string;
  page?: string;
}) {
  return {
    q: normalizeFilterValue(searchParams?.q),
    module: normalizeFilterValue(searchParams?.module),
    result: normalizeFilterValue(searchParams?.result),
    risk: normalizeFilterValue(searchParams?.risk),
    page: normalizePageValue(searchParams?.page)
  };
}

function hasActiveFilters(filters: AuditFilters) {
  return Boolean(filters.q || filters.module || filters.result || filters.risk);
}

function buildAuditLogsHref(
  filters: AuditFilters,
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
  if (filters.module) {
    searchParams.set("module", filters.module);
  }
  if (filters.result) {
    searchParams.set("result", filters.result);
  }
  if (filters.risk) {
    searchParams.set("risk", filters.risk);
  }
  const nextPage = typeof options?.page === "number" && options.page > 0 ? options.page : filters.page;
  if (nextPage > 1) {
    searchParams.set("page", String(nextPage));
  }
  const query = searchParams.toString();
  return query ? `/audit-logs?${query}` : "/audit-logs";
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

function buildMetrics(summary: AdminAuditLogListData["summary"]): readonly MetricItem[] {
  return [
    { label: "今日操作总数", value: formatMetricValue(summary.totalLogs), delta: "今日实时", kind: "total" },
    { label: "敏感操作数", value: formatMetricValue(summary.sensitiveLogs), delta: "今日实时", kind: "sensitive" },
    { label: "审核治理数", value: formatMetricValue(summary.reviewLogs), delta: "今日实时", kind: "review" },
    { label: "配置变更数", value: formatMetricValue(summary.publishLogs), delta: "今日实时", kind: "publish" }
  ];
}

async function loadPageData(filters: AuditFilters): Promise<PageData> {
  try {
    const response = await listAdminAuditLogs({
      q: filters.q || undefined,
      module: filters.module || undefined,
      result: filters.result || undefined,
      risk: filters.risk || undefined,
      page: filters.page,
      pageSize: PAGE_SIZE
    });
    const rows = response.data.items.map(mapRow);
    const filtered = hasActiveFilters(filters);

    if (rows.length === 0) {
      return {
        hasError: false,
        modeTitle: "当前为实时审计数据",
        modeDetail: filtered
          ? "当前筛选条件已走真实后端查询，但没有匹配到对应操作日志。"
          : "admin/audit-logs 已接入真实后端，但当前还没有可展示的后台审计记录。",
        metrics: buildMetrics(response.data.summary),
        rows,
        defaultSelectedId: null,
        totalCountLabel: `第 ${formatMetricValue(response.data.pagination.page)} 页，当前返回 0 条，共匹配 ${formatMetricValue(response.data.pagination.totalItems)} 条`,
        emptyMessage: filtered ? "当前筛选条件下没有匹配的操作日志。" : "当前还没有可展示的后台审计记录。",
        pagination: response.data.pagination
      };
    }

    return {
      hasError: false,
      modeTitle: "当前为实时审计数据",
      modeDetail: "操作日志列表、详情和 q / 模块 / 结果 / 风险筛选都已接入真实后端。",
      metrics: buildMetrics(response.data.summary),
      rows,
      defaultSelectedId: rows[0]?.id ?? null,
      totalCountLabel: `第 ${formatMetricValue(response.data.pagination.page)} 页，当前返回 ${formatMetricValue(rows.length)} 条，共匹配 ${formatMetricValue(response.data.pagination.totalItems)} 条`,
      emptyMessage: null,
      pagination: response.data.pagination
    };
  } catch (error) {
    const requestId =
      error instanceof AdminBackendError && error.requestId
        ? `requestId: ${error.requestId}`
        : "操作日志接口读取异常";

    return {
      hasError: true,
      modeTitle: "操作日志读取失败",
      modeDetail: `${requestId}，当前不再回退展示占位日志，请先排查真实后端请求。`,
      metrics: ZERO_METRICS,
      rows: [],
      defaultSelectedId: null,
      totalCountLabel: "第 1 页，当前返回 0 条，共匹配 0 条",
      emptyMessage: "当前无法读取后台操作日志，请稍后重试。",
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
  row: AuditRow | null
): Promise<{
  detail: AuditDetail | null;
  errorMessage: string | null;
}> {
  if (!row) {
    return {
      detail: null,
      errorMessage: null
    };
  }

  try {
    const response = await getAdminAuditLog(row.id);
    return {
      detail: mapDetail(response.data),
      errorMessage: null
    };
  } catch {
    return {
      detail: buildRowSummaryDetail(row),
      errorMessage: "日志详情读取失败，当前仅展示列表摘要。"
    };
  }
}

function MetricIcon({ kind }: { kind: MetricItem["kind"] }) {
  if (kind === "total") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M5 3.75h6l4 4v8.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M11 3.75v4h4M7.25 11h5.5M7.25 14h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "sensitive") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 3.25 15.75 5.5v4.25c0 3.35-2.2 5.79-5.75 7-3.55-1.21-5.75-3.65-5.75-7V5.5L10 3.25Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M10 7.1v3.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="10" cy="13" fill="currentColor" r="0.8" />
      </svg>
    );
  }

  if (kind === "review") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="m7.25 10.1 1.8 1.8 3.9-4.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M10 4.25v2.1M10 13.65v2.1M4.25 10h2.1M13.65 10h2.1M6 6l1.5 1.5M12.5 12.5 14 14M14 6l-1.5 1.5M7.5 12.5 6 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="3.05" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path d="M12.25 6.5a4.75 4.75 0 1 0 .5 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M10.5 3.75h2.75V6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
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

function actionToneClass(tone: ActionTone) {
  if (tone === "green") {
    return styles.actionGreen;
  }
  if (tone === "orange") {
    return styles.actionOrange;
  }
  if (tone === "red") {
    return styles.actionRed;
  }
  if (tone === "blue") {
    return styles.actionBlue;
  }
  return styles.actionGray;
}

function resultToneClass(tone: ResultTone) {
  return tone === "failed" ? styles.resultFailed : styles.resultSuccess;
}

export default async function AuditLogsPage({
  searchParams
}: {
  searchParams?: Promise<{
    selected?: string;
    q?: string;
    module?: string;
    result?: string;
    risk?: string;
    page?: string;
  }>;
}) {
  await requireAdminAccess(["admin", "operator", "moderator"], "/audit-logs");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = readFilters(resolvedSearchParams);
  const pageData = await loadPageData(filters);
  const selectedId = resolvedSearchParams?.selected?.trim() || pageData.defaultSelectedId || "";
  const selectedRow =
    pageData.rows.find((row) => row.id === selectedId) ??
    pageData.rows.find((row) => row.id === pageData.defaultSelectedId) ??
    pageData.rows[0] ??
    null;
  const selectedDetailState = await loadSelectedDetail(selectedRow);
  const selectedDetail = selectedDetailState.detail ?? buildEmptyDetail();
  const avatarText = selectedDetail.operator.trim().charAt(0) || "A";
  const paginationPages = buildPaginationPages(pageData.pagination.page, pageData.pagination.totalPages);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>操作日志</h1>
          <p className={styles.subtitle}>查看后台关键操作、失败回放与 requestId / traceId 线索。</p>
        </div>
      </header>

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
            <form action="/audit-logs" className={styles.filterForm} method="get">
              <input name="page" type="hidden" value="1" />
              <div className={styles.formGrid}>
                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>搜索关键词</span>
                  <input
                    className={styles.textInput}
                    defaultValue={filters.q}
                    name="q"
                    placeholder="操作人 / 模块 / requestId / 目标 / 路径"
                    type="search"
                  />
                </label>

                <label className={styles.selectField}>
                  <span className={styles.selectLabel}>操作模块</span>
                  <div className={styles.selectWrap}>
                    <select className={styles.selectControl} defaultValue={filters.module} name="module">
                      {MODULE_FILTER_OPTIONS.map((item) => (
                        <option key={item.value || "all-modules"} value={item.value}>
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
                  <span className={styles.selectLabel}>执行结果</span>
                  <div className={styles.selectWrap}>
                    <select className={styles.selectControl} defaultValue={filters.result} name="result">
                      {RESULT_FILTER_OPTIONS.map((item) => (
                        <option key={item.value || "all-results"} value={item.value}>
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
                  <span className={styles.selectLabel}>风险等级</span>
                  <div className={styles.selectWrap}>
                    <select className={styles.selectControl} defaultValue={filters.risk} name="risk">
                      {RISK_FILTER_OPTIONS.map((item) => (
                        <option key={item.value || "all-risks"} value={item.value}>
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
                  <a className={styles.resetButton} href="/audit-logs">
                    <span className={styles.resetIcon}>
                      <RefreshIcon />
                    </span>
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
            {pageData.rows.length > 0 ? (
              <>
                <AuditLogsTableInteractive>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>操作时间</th>
                          <th>操作人</th>
                          <th>操作模块</th>
                          <th>操作类型</th>
                          <th>目标对象</th>
                          <th>对象类型</th>
                          <th>结果</th>
                          <th>摘要</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.rows.map((row) => {
                          const rowHref = buildAuditLogsHref(filters, { selected: row.id });
                          const isSelected = selectedRow?.id === row.id;

                          return (
                            <tr
                              key={row.id}
                              aria-selected={isSelected}
                              className={`${styles.tableRow} ${isSelected ? styles.rowSelected : ""}`}
                              data-row-href={rowHref}
                              tabIndex={0}
                            >
                              <td>{row.time}</td>
                              <td>{row.operator}</td>
                              <td>{row.module}</td>
                              <td>
                                <span className={`${styles.actionPill} ${actionToneClass(row.actionTone)}`}>{row.action}</span>
                              </td>
                              <td className={styles.targetCell}>{row.target}</td>
                              <td>{row.objectType}</td>
                              <td>
                                <span className={`${styles.resultPill} ${resultToneClass(row.resultTone)}`}>{row.result}</span>
                              </td>
                              <td className={styles.noteCell}>{row.note}</td>
                              <td>
                                <span className={styles.rowAssist}>{isSelected ? "当前查看中" : "点击行查看"}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </AuditLogsTableInteractive>

                <footer className={styles.tableFooter}>
                  <span>{pageData.totalCountLabel}</span>
                  <span className={styles.pageSizeButton}>每页 {pageData.pagination.pageSize} 条</span>
                </footer>
                <div className={styles.paginationArea}>
                  {pageData.pagination.totalPages > 1 ? (
                    <nav aria-label="操作日志分页" className={styles.pagination}>
                      <Link
                        aria-disabled={!pageData.pagination.hasPrevious}
                        className={styles.pageButton}
                        href={buildAuditLogsHref(filters, {
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
                            href={buildAuditLogsHref(filters, {
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
                        href={buildAuditLogsHref(filters, {
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
            <h2>日志详情</h2>
            <Link className={styles.closeButton} href={buildAuditLogsHref(filters)} aria-label="关闭详情" scroll={false}>
              ×
            </Link>
          </header>

          {selectedRow ? (
            <>
              <div className={styles.detailBody}>
                <section className={styles.sectionBlock}>
                  <h3>基础信息</h3>

                  <div className={styles.personRow}>
                    <span className={styles.avatar}>{avatarText}</span>
                    <div className={styles.personMeta}>
                      <strong>{selectedDetail.operator}</strong>
                      <span>{selectedDetail.operatorRole}</span>
                    </div>
                  </div>

                  <div className={styles.metaGrid}>
                    <div className={styles.metaRow}>
                      <span>操作时间</span>
                      <strong>{selectedDetail.time}</strong>
                    </div>
                    <div className={styles.metaRow}>
                      <span>操作模块</span>
                      <strong>{selectedDetail.module}</strong>
                    </div>
                    <div className={styles.metaRow}>
                      <span>操作类型</span>
                      <div className={styles.metaPills}>
                        <span className={`${styles.actionPill} ${actionToneClass(selectedDetail.actionTone)}`}>{selectedDetail.action}</span>
                        <span className={`${styles.actionPill} ${selectedDetail.riskLabel === "敏感" ? styles.actionRed : styles.actionGray}`}>
                          {selectedDetail.riskLabel}
                        </span>
                      </div>
                    </div>
                    <div className={styles.metaRow}>
                      <span>目标对象 ID</span>
                      <strong>{selectedDetail.targetId}</strong>
                    </div>
                    <div className={styles.metaRow}>
                      <span>目标对象</span>
                      <strong>{selectedDetail.target}</strong>
                      <small>{selectedDetail.targetType}</small>
                    </div>
                  </div>
                </section>

                <section className={styles.sectionBlock}>
                  <h3>操作结果</h3>
                  <div className={styles.resultSummary}>
                    <span className={`${styles.resultPill} ${resultToneClass(selectedDetail.resultTone)}`}>{selectedDetail.result}</span>
                  </div>
                </section>

                <section className={styles.sectionBlock}>
                  <h3>请求上下文</h3>
                  <div className={styles.stateCards}>
                    <div className={styles.stateCard}>
                      <div className={styles.stateHeader}>
                        <span>请求信息</span>
                      </div>
                      <div className={styles.stateBody}>
                        <span>method: {selectedDetail.requestMethod}</span>
                        <span>path: {selectedDetail.requestPath}</span>
                        <span>status: {selectedDetail.responseStatus}</span>
                      </div>
                    </div>

                    <div className={styles.stateCard}>
                      <div className={styles.stateHeader}>
                        <span>扩展上下文</span>
                      </div>
                      <div className={styles.stateBody}>
                        <span>{selectedDetail.metadataText}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.sectionBlock}>
                  <h3>处理备注</h3>
                  <p className={styles.noteText}>{selectedDetail.note}</p>
                  {selectedDetailState.errorMessage ? <span className={styles.placeholderNote}>{selectedDetailState.errorMessage}</span> : null}
                </section>

                <section className={styles.sectionBlock}>
                  <h3>追踪信息</h3>
                  <div className={styles.traceList}>
                    <div className={styles.traceRow}>
                      <span>requestId</span>
                      <strong>{selectedDetail.requestId}</strong>
                    </div>
                    <div className={styles.traceRow}>
                      <span>traceId</span>
                      <strong>{selectedDetail.traceId}</strong>
                    </div>
                    <div className={styles.traceRow}>
                      <span>日志 ID</span>
                      <strong>{selectedDetail.id || "未记录"}</strong>
                    </div>
                  </div>
                </section>

                <section className={styles.sectionBlock}>
                  <h3>关联入口</h3>
                  <div className={styles.quickActions}>
                    <Link className={styles.quickAction} href={selectedDetail.moduleRoute} scroll={false}>
                      前往关联模块
                    </Link>
                    <Link className={styles.quickAction} href={buildAuditLogsHref(filters)} scroll={false}>
                      查看最近日志
                    </Link>
                    <Link className={styles.quickAction} href="/dashboard" scroll={false}>
                      返回后台首页
                    </Link>
                  </div>
                </section>
              </div>

              <footer className={styles.detailFooter}>
                <Link className={styles.secondaryAction} href={buildAuditLogsHref(filters)} scroll={false}>
                  收起详情
                </Link>
                <Link className={styles.primaryAction} href={selectedDetail.moduleRoute} scroll={false}>
                  前往关联模块
                </Link>
              </footer>
            </>
          ) : (
            <div className={styles.drawerEmpty}>
              <strong>{pageData.rows.length === 0 ? "暂无可查看的日志详情" : "请选择一条操作日志"}</strong>
              <span>{pageData.modeDetail}</span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
