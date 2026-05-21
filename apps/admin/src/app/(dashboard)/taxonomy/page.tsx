import Link from "next/link";
import { requireAdminAccess } from "@/lib/admin-auth";
import {
  AdminBackendError,
  getAdminTaxonomy,
  listAdminTaxonomyPrompts,
  type AdminTaxonomyPromptListData,
  type AdminTaxonomyData
} from "@/lib/admin-service";
import { bulkApplyTaxonomyAction, updateTaxonomyAction } from "./actions";
import styles from "./page.module.css";

type SectionKey = "image-model" | "video-model" | "content-category" | "composition-category";
type ExposureFlag = "homepage" | "featured" | "publish";

type MetricItem = {
  label: string;
  value: string;
  delta: string;
  kind: "enabled" | "disabled" | "visible" | "pending";
};

type TaxonomyGovernance = {
  hasCustomConfig: boolean;
  statusCode: string;
  sortOrder: number;
  exposureFlags: readonly ExposureFlag[];
  noteText: string | null;
  updatedByDisplayName: string | null;
  updatedAt: string | null;
};

type TaxonomyItem = {
  value: string;
  label: string;
  modalityScope: string;
  promptCount: number;
  authorCount: number;
  latestPublishedAt: string;
  sampleTitles: readonly string[];
  governance: TaxonomyGovernance;
};

type TaxonomySection = {
  key: SectionKey;
  label: string;
  description: string;
  promptCount: number;
  categoryCount: number;
  items: readonly TaxonomyItem[];
};

type PageData = {
  isFallback: boolean;
  modeTitle: string;
  modeDetail: string;
  metrics: readonly MetricItem[];
  sections: readonly TaxonomySection[];
};

type PromptPoolSummary = {
  totalItems: number;
  needsAttentionItems: number;
  imageItems: number;
  videoItems: number;
};

type PromptPoolItem = {
  promptId: string;
  title: string;
  modality: "image" | "video";
  authorId: string;
  authorDisplayName: string;
  modelCategory: string | null;
  contentCategory: string | null;
  compositionCategory: string | null;
  needsAttention: boolean;
  publishedAt: string;
  tagNames: readonly string[];
};

type PromptPoolData = {
  hasError: boolean;
  errorMessage: string | null;
  summary: PromptPoolSummary;
  items: readonly PromptPoolItem[];
};

const EXPOSURE_OPTIONS: ReadonlyArray<{
  value: ExposureFlag;
  label: string;
  detail: string;
}> = [
  { value: "homepage", label: "首页分类入口", detail: "允许作为首页发现区的显式分类口径" },
  { value: "featured", label: "精选分类位", detail: "允许运营在精选页和专题位引用" },
  { value: "publish", label: "发布页透出", detail: "允许在发布页作为推荐分类口径展示" }
];

const FALLBACK_DATA: PageData = {
  isFallback: true,
  modeTitle: "taxonomy 数据读取失败",
  modeDetail: "当前不再回退展示静态 taxonomy 示例数据，请先排查真实后端请求。",
  metrics: [
    { label: "提示词总量", value: "0", delta: "接口异常", kind: "enabled" },
    { label: "完整分类提示词", value: "0", delta: "接口异常", kind: "visible" },
    { label: "待整理提示词", value: "0", delta: "接口异常", kind: "pending" },
    { label: "分类项总数", value: "0", delta: "接口异常", kind: "disabled" }
  ],
  sections: []
};

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatDateTime(input?: string | null) {
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

function scopeLabel(scope: string) {
  if (scope === "image") {
    return "图片提示词";
  }
  if (scope === "video") {
    return "视频提示词";
  }
  return "图片 / 视频混合";
}

function governanceStatusLabel(statusCode: string) {
  return statusCode === "disabled" ? "已停用" : "已启用";
}

function governanceStatusTone(statusCode: string) {
  return statusCode === "disabled" ? styles.statusDanger : styles.statusSuccess;
}

function promptModalityLabel(modality: string) {
  return modality === "video" ? "视频提示词" : "图片提示词";
}

function emptyCategoryLabel(value: string | null) {
  return value?.trim() || "待补";
}

function buildPageData(data: AdminTaxonomyData): PageData {
  const totalCategoryCount =
    data.summary.imageModelCategories +
    data.summary.videoModelCategories +
    data.summary.contentCategories +
    data.summary.compositionCategories;

  return {
    isFallback: false,
    modeTitle: "当前为实时 taxonomy 数据",
    modeDetail: "分类统计、分类项治理和待修正提示词批量回写都已接入真实后端；当前页既能管理分类项治理，也能批量修正真实 prompt taxonomy 字段。",
    metrics: [
      {
        label: "提示词总量",
        value: formatNumber(data.summary.totalPrompts),
        delta: "当前实时数据",
        kind: "enabled"
      },
      {
        label: "完整分类提示词",
        value: formatNumber(data.summary.fullyCategorizedPrompts),
        delta: "当前实时数据",
        kind: "visible"
      },
      {
        label: "待整理提示词",
        value: formatNumber(data.summary.needsAttentionPrompts),
        delta: "当前实时数据",
        kind: "pending"
      },
      {
        label: "分类项总数",
        value: formatNumber(totalCategoryCount),
        delta: "当前实时数据",
        kind: "disabled"
      }
    ],
    sections: data.sections.map((section) => ({
      key: section.key as SectionKey,
      label: section.label,
      description: section.description,
      promptCount: section.promptCount,
      categoryCount: section.categoryCount,
      items: section.items.map((item) => ({
        value: item.value,
        label: item.label,
        modalityScope: item.modalityScope,
        promptCount: item.promptCount,
        authorCount: item.authorCount,
        latestPublishedAt: formatDateTime(item.latestPublishedAt ?? null),
        sampleTitles: item.sampleTitles,
        governance: {
          hasCustomConfig: item.governance.hasCustomConfig,
          statusCode: item.governance.statusCode,
          sortOrder: item.governance.sortOrder,
          exposureFlags: (item.governance.exposureFlags as ExposureFlag[]) ?? [],
          noteText: item.governance.noteText ?? null,
          updatedByDisplayName: item.governance.updatedByDisplayName ?? null,
          updatedAt: item.governance.updatedAt ? formatDateTime(item.governance.updatedAt) : null
        }
      }))
    }))
  };
}

async function loadPageData(): Promise<PageData> {
  try {
    const response = await getAdminTaxonomy();
    return buildPageData(response.data);
  } catch (error) {
    if (error instanceof AdminBackendError && error.requestId) {
      return {
        ...FALLBACK_DATA,
        modeDetail: `${error.message}（requestId: ${error.requestId}）`
      };
    }
    return FALLBACK_DATA;
  }
}

function buildPromptPoolData(data: AdminTaxonomyPromptListData): PromptPoolData {
  return {
    hasError: false,
    errorMessage: null,
    summary: data.summary,
    items: data.items.map((item: AdminTaxonomyPromptListData["items"][number]) => ({
      promptId: item.promptId,
      title: item.title,
      modality: item.modality === "video" ? "video" : "image",
      authorId: item.authorId,
      authorDisplayName: item.authorDisplayName,
      modelCategory: item.modelCategory ?? null,
      contentCategory: item.contentCategory ?? null,
      compositionCategory: item.compositionCategory ?? null,
      needsAttention: item.needsAttention,
      publishedAt: formatDateTime(item.publishedAt),
      tagNames: item.tagNames
    }))
  };
}

async function loadPromptPoolData(input: {
  modality?: string;
  query?: string;
}): Promise<PromptPoolData> {
  try {
    const response = await listAdminTaxonomyPrompts({
      modality: input.modality,
      q: input.query,
      needsAttention: "true"
    });
    return buildPromptPoolData(response.data);
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
        : "待修正提示词池读取失败。";

    return {
      hasError: true,
      errorMessage: message,
      summary: {
        totalItems: 0,
        needsAttentionItems: 0,
        imageItems: 0,
        videoItems: 0
      },
      items: []
    };
  }
}

function MetricIcon({ kind }: { kind: MetricItem["kind"] }) {
  if (kind === "enabled") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 3.5 15.75 6.5v7L10 16.5 4.25 13.5v-7L10 3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="m7.25 10 1.75 1.75 3.75-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "disabled") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6.8v3.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="10" cy="13.7" fill="currentColor" r="0.8" />
      </svg>
    );
  }

  if (kind === "visible") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M2.75 10s2.5-4.25 7.25-4.25 7.25 4.25 7.25 4.25-2.5 4.25-7.25 4.25S2.75 10 2.75 10Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.25V10l2.5 2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

type SearchParams = {
  section?: string;
  selected?: string;
  error?: string;
  success?: string;
  q?: string;
  scope?: string;
  status?: string;
  exposure?: string;
  config?: string;
  bulkModality?: string;
  poolQ?: string;
};

function normalizeSearch(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function matchesSearch(text: string, query: string) {
  return query.length === 0 || text.toLowerCase().includes(query);
}

function normalizeFilterValue(value?: string | null) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : "";
}

export default async function TaxonomyPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requireAdminAccess(["admin", "operator"], "/taxonomy");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageData = await loadPageData();
  const requestedSection = resolvedSearchParams?.section?.trim() as SectionKey | undefined;
  const activeSection = pageData.sections.find((section) => section.key === requestedSection) ?? pageData.sections[0];
  const requestedSelected = resolvedSearchParams?.selected?.trim();
  const selectedItem = activeSection?.items.find((item) => item.value === requestedSelected) ?? activeSection?.items[0];
  const errorMessage = resolvedSearchParams?.error?.trim() || null;
  const successMessage = resolvedSearchParams?.success?.trim() || null;
  const searchQuery = normalizeSearch(resolvedSearchParams?.q);
  const scopeFilter = normalizeFilterValue(resolvedSearchParams?.scope);
  const statusFilter = normalizeFilterValue(resolvedSearchParams?.status);
  const exposureFilter = normalizeFilterValue(resolvedSearchParams?.exposure);
  const configFilter = normalizeFilterValue(resolvedSearchParams?.config);
  const bulkModalityFilter = normalizeFilterValue(resolvedSearchParams?.bulkModality) || "image";
  const poolQuery = resolvedSearchParams?.poolQ?.trim() ?? "";
  const filteredSections = pageData.sections.map((section) => {
    const items = section.items.filter((item) => {
      const matchQuery =
        matchesSearch(section.label, searchQuery) ||
        matchesSearch(section.description, searchQuery) ||
        matchesSearch(item.label, searchQuery) ||
        matchesSearch(item.value, searchQuery) ||
        item.sampleTitles.some((title) => matchesSearch(title, searchQuery));

      const matchScope = scopeFilter ? item.modalityScope.toLowerCase() === scopeFilter : true;
      const matchStatus = statusFilter ? item.governance.statusCode.toLowerCase() === statusFilter : true;
      const matchExposure = exposureFilter
        ? item.governance.exposureFlags.map((flag) => flag.toLowerCase()).includes(exposureFilter)
        : true;
      const matchConfig =
        configFilter === "configured"
          ? item.governance.hasCustomConfig
          : configFilter === "default"
            ? !item.governance.hasCustomConfig
            : true;

      return matchQuery && matchScope && matchStatus && matchExposure && matchConfig;
    });

    return {
      ...section,
      promptCount: items.reduce((total, item) => total + item.promptCount, 0),
      categoryCount: items.length,
      items
    };
  });
  const visibleSections = filteredSections.filter((section) => section.items.length > 0);
  const visibleItemCount = visibleSections.reduce((total, section) => total + section.items.length, 0);
  const querySummaryParts = [
    searchQuery ? `关键词「${resolvedSearchParams?.q?.trim()}」` : null,
    scopeFilter ? `范围 ${scopeLabel(scopeFilter)}` : null,
    statusFilter ? `状态 ${statusFilter === "enabled" ? "启用" : "停用"}` : null,
    exposureFilter ? `曝光 ${exposureFilter}` : null,
    configFilter ? (configFilter === "configured" ? "仅看已配置" : "仅看默认项") : null
  ].filter(Boolean) as string[];
  const filterQueryParams = new URLSearchParams();
  if (searchQuery) {
    filterQueryParams.set("q", resolvedSearchParams?.q?.trim() ?? "");
  }
  if (scopeFilter) {
    filterQueryParams.set("scope", scopeFilter);
  }
  if (statusFilter) {
    filterQueryParams.set("status", statusFilter);
  }
  if (exposureFilter) {
    filterQueryParams.set("exposure", exposureFilter);
  }
  if (configFilter) {
    filterQueryParams.set("config", configFilter);
  }
  if (bulkModalityFilter) {
    filterQueryParams.set("bulkModality", bulkModalityFilter);
  }
  if (poolQuery) {
    filterQueryParams.set("poolQ", poolQuery);
  }
  const currentItemHref = (() => {
    if (!activeSection || !selectedItem) {
      return "/taxonomy";
    }

    const hrefQuery = new URLSearchParams(filterQueryParams);
    hrefQuery.set("section", activeSection.key);
    hrefQuery.set("selected", selectedItem.value);
    return `/taxonomy?${hrefQuery.toString()}`;
  })();
  const activeFilteredSection = filteredSections.find((section) => section.key === activeSection?.key) ?? null;
  const activeFilteredItems = activeFilteredSection?.items ?? [];
  const filteredSelectedItem =
    activeFilteredItems.find((item) => item.value === requestedSelected) ?? activeFilteredItems[0] ?? null;
  const promptPool = await loadPromptPoolData({
    modality: bulkModalityFilter,
    query: poolQuery
  });

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>分类管理</h1>
          <p className={styles.subtitle}>围绕 prompt taxonomy 的实时统计、分类项和治理配置</p>
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

      {pageData.sections.length > 0 ? (
        <div className={styles.tabRow}>
          {pageData.sections.map((section) => {
            const hrefQuery = new URLSearchParams(filterQueryParams);
            hrefQuery.set("section", section.key);
            const href = `/taxonomy?${hrefQuery.toString()}`;
            return (
              <Link
                key={section.key}
                className={`${styles.tabButton} ${activeSection?.key === section.key ? styles.tabButtonActive : ""}`}
                href={href}
              >
                {section.label}
              </Link>
            );
          })}
        </div>
      ) : null}

      <form className={styles.filterBar} method="get">
        <input name="section" type="hidden" value={activeSection?.key ?? ""} />
        <input name="selected" type="hidden" value={selectedItem?.value ?? ""} />
        <div className={styles.filterField}>
          <label htmlFor="taxonomy-q">关键词</label>
          <input id="taxonomy-q" name="q" placeholder="搜索分类名称、编码、样例标题" defaultValue={resolvedSearchParams?.q ?? ""} />
        </div>
        <div className={styles.filterField}>
          <label htmlFor="taxonomy-scope">范围</label>
          <select id="taxonomy-scope" name="scope" defaultValue={scopeFilter}>
            <option value="">全部</option>
            <option value="image">图片提示词</option>
            <option value="video">视频提示词</option>
            <option value="mixed">图片 / 视频混合</option>
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="taxonomy-status">状态</label>
          <select id="taxonomy-status" name="status" defaultValue={statusFilter}>
            <option value="">全部</option>
            <option value="enabled">启用</option>
            <option value="disabled">停用</option>
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="taxonomy-exposure">曝光</label>
          <select id="taxonomy-exposure" name="exposure" defaultValue={exposureFilter}>
            <option value="">全部</option>
            <option value="homepage">首页分类入口</option>
            <option value="featured">精选分类位</option>
            <option value="publish">发布页透出</option>
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="taxonomy-config">配置</label>
          <select id="taxonomy-config" name="config" defaultValue={configFilter}>
            <option value="">全部</option>
            <option value="configured">仅看已配置</option>
            <option value="default">仅看默认项</option>
          </select>
        </div>
        <div className={styles.filterActions}>
          <button className={styles.primaryAction} type="submit">
            应用筛选
          </button>
          <Link className={styles.secondaryAction} href="/taxonomy">
            清空筛选
          </Link>
        </div>
      </form>

      <div className={styles.filterSummary}>
        <strong>当前可见 {formatNumber(visibleItemCount)} 项</strong>
        <span>{querySummaryParts.length > 0 ? querySummaryParts.join(" · ") : "未启用筛选条件"}</span>
      </div>

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
        <aside className={styles.treeCard}>
          <header className={styles.cardHeader}>
            <div>
              <h2>分类结构</h2>
              <p>按真实 taxonomy 字段聚合</p>
            </div>
          </header>

          <div className={styles.treeBody}>
            {visibleSections.length > 0 ? visibleSections.map((section) => (
              <section key={section.key} className={styles.treeGroup}>
                <div className={styles.treeGroupTitle}>
                  <strong>{section.label}</strong>
                  <span className={styles.treeCount}>{formatNumber(section.categoryCount)} 项</span>
                </div>
                <p className={styles.cardDescription}>{section.description}</p>
                <div className={styles.treeItems}>
                  {section.items.length > 0 ? (
                    section.items.map((item) => {
                      const hrefQuery = new URLSearchParams(filterQueryParams);
                      hrefQuery.set("section", section.key);
                      hrefQuery.set("selected", item.value);
                      const href = `/taxonomy?${hrefQuery.toString()}`;
                      const isActive = activeSection?.key === section.key && selectedItem?.value === item.value;
                      return (
                        <Link
                          key={`${section.key}-${item.value}`}
                          className={`${styles.treeItem} ${isActive ? styles.treeItemActive : ""}`}
                          href={href}
                        >
                          <span>{item.label}</span>
                          <span className={styles.treeCount}>{formatNumber(item.promptCount)}</span>
                        </Link>
                      );
                    })
                  ) : (
                    <div className={styles.emptyState}>当前板块还没有可展示的分类项。</div>
                  )}
                </div>
              </section>
            )) : <div className={styles.emptyState}>当前筛选条件下没有可展示的分类项。</div>}
          </div>
        </aside>

        <section className={styles.tableCard}>
          <header className={styles.tableHeader}>
            <div>
              <h2>{activeSection?.label ?? "分类项列表"}</h2>
              <p>
                {activeFilteredSection
                  ? `${formatNumber(activeFilteredSection.categoryCount)} 个分类项，覆盖 ${formatNumber(activeFilteredSection.promptCount)} 条提示词`
                  : querySummaryParts.length > 0
                    ? "当前筛选条件下该板块没有匹配项"
                    : "当前暂无分类项"}
              </p>
            </div>
          </header>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>分类名称</th>
                  <th>适用范围</th>
                  <th>关联提示词</th>
                  <th>治理状态</th>
                  <th>曝光位</th>
                  <th>最近发布时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                  {activeFilteredItems.length ? (
                    activeFilteredItems.map((item) => {
                      const hrefQuery = new URLSearchParams(filterQueryParams);
                      hrefQuery.set("section", activeSection?.key ?? item.value);
                      hrefQuery.set("selected", item.value);
                      const href = `/taxonomy?${hrefQuery.toString()}`;
                      const isSelected = filteredSelectedItem?.value === item.value;
                      return (
                      <tr key={`${activeSection?.key}-${item.value}`} className={`${styles.tableRow} ${isSelected ? styles.rowSelected : ""}`}>
                        <td>
                          <strong className={styles.cellTitle}>{item.label}</strong>
                        </td>
                        <td>
                          <span className={styles.statusPill}>{scopeLabel(item.modalityScope)}</span>
                        </td>
                        <td>{formatNumber(item.promptCount)}</td>
                        <td>
                          <span className={`${styles.statusPill} ${governanceStatusTone(item.governance.statusCode)}`}>
                            {governanceStatusLabel(item.governance.statusCode)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.exposureList}>
                            {item.governance.exposureFlags.length > 0 ? (
                              item.governance.exposureFlags.map((flag) => <span key={`${item.value}-${flag}`}>{flag}</span>)
                            ) : (
                              <span>未配置</span>
                            )}
                          </div>
                        </td>
                        <td>{item.latestPublishedAt}</td>
                        <td>
                          <span className={styles.rowAssist}>{isSelected ? "当前查看中" : "点击左侧树或当前行对应项查看"}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className={styles.emptyState} colSpan={7}>
                      当前筛选条件下没有匹配的分类项。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={styles.editorCard}>
          <header className={styles.cardHeader}>
            <div>
              <h2>治理配置</h2>
              <p>{filteredSelectedItem ? filteredSelectedItem.label : "请选择一个分类项"}</p>
            </div>
            <span className={styles.livePill}>{pageData.isFallback ? "接口异常，只读" : "真实可写"}</span>
          </header>

          <div className={styles.editorBody}>
            {filteredSelectedItem ? (
              <>
                <p className={styles.editorNote}>
                  上半区用于管理分类项的启停、排序、曝光位和备注；下半区的待修正提示词池会直接回写 prompt_entries 里的真实 taxonomy 字段。
                </p>

                <div className={styles.detailBlock}>
                  <span className={styles.fieldLabel}>所属板块</span>
                  <strong>{activeSection?.label}</strong>
                  <p className={styles.detailHint}>{activeSection?.description}</p>
                </div>

                <div className={styles.detailGrid}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>分类编码</span>
                    <div className={styles.infoValue}>{filteredSelectedItem.value}</div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>适用范围</span>
                    <div className={styles.infoValue}>{scopeLabel(filteredSelectedItem.modalityScope)}</div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>关联提示词</span>
                    <div className={styles.infoValue}>{formatNumber(filteredSelectedItem.promptCount)}</div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>覆盖作者</span>
                    <div className={styles.infoValue}>{formatNumber(filteredSelectedItem.authorCount)}</div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>最近发布时间</span>
                    <div className={styles.infoValue}>{filteredSelectedItem.latestPublishedAt}</div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>最近治理更新</span>
                    <div className={styles.infoValue}>
                      {filteredSelectedItem.governance.updatedAt
                        ? `${filteredSelectedItem.governance.updatedAt}${filteredSelectedItem.governance.updatedByDisplayName ? ` · ${filteredSelectedItem.governance.updatedByDisplayName}` : ""}`
                        : "未配置"}
                    </div>
                  </div>
                </div>

                <form action={updateTaxonomyAction} className={styles.governanceForm}>
                  <input name="sectionKey" type="hidden" value={activeSection?.key ?? ""} />
                  <input name="categoryValue" type="hidden" value={filteredSelectedItem.value} />
                  <input name="q" type="hidden" value={resolvedSearchParams?.q ?? ""} />
                  <input name="scope" type="hidden" value={scopeFilter} />
                  <input name="status" type="hidden" value={statusFilter} />
                  <input name="exposure" type="hidden" value={exposureFilter} />
                  <input name="config" type="hidden" value={configFilter} />
                  <input name="bulkModality" type="hidden" value={bulkModalityFilter} />
                  <input name="poolQ" type="hidden" value={poolQuery} />

                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>
                      治理状态 <em>*</em>
                    </span>
                    <select defaultValue={filteredSelectedItem.governance.statusCode} disabled={pageData.isFallback} name="statusCode">
                      <option value="enabled">启用</option>
                      <option value="disabled">停用</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>
                      排序值 <em>*</em>
                    </span>
                    <div className={styles.inputShell}>
                      <input
                        defaultValue={String(filteredSelectedItem.governance.sortOrder)}
                        disabled={pageData.isFallback}
                        inputMode="numeric"
                        max={9999}
                        min={0}
                        name="sortOrder"
                        type="number"
                      />
                      <span>0-9999</span>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>前台曝光位</span>
                    <div className={styles.checkboxGrid}>
                      {EXPOSURE_OPTIONS.map((option) => (
                        <label key={option.value} className={styles.checkboxItem}>
                          <input
                            defaultChecked={filteredSelectedItem.governance.exposureFlags.includes(option.value)}
                            disabled={pageData.isFallback}
                            name="exposureFlags"
                            type="checkbox"
                            value={option.value}
                          />
                          <span>
                            <strong>{option.label}</strong>
                            <small className={styles.checkboxHint}>{option.detail}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>治理备注</span>
                    <div className={styles.textareaShell}>
                      <textarea
                        defaultValue={filteredSelectedItem.governance.noteText ?? ""}
                        disabled={pageData.isFallback}
                        maxLength={500}
                        name="noteText"
                      />
                      <span>最多 500 字</span>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>样例标题</span>
                    <div className={styles.stackList}>
                      {filteredSelectedItem.sampleTitles.length > 0 ? (
                        filteredSelectedItem.sampleTitles.map((title) => <span key={`${filteredSelectedItem.value}-${title}`}>{title}</span>)
                      ) : (
                        <span>暂无样例标题</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.noteBox}>
                    <span>
                      {filteredSelectedItem.governance.hasCustomConfig
                        ? "当前项已存在自定义治理配置，保存后会直接覆盖现有配置。"
                        : "当前项还没有自定义治理配置，保存后会创建配置记录。"}
                    </span>
                    <span className={styles.noteCount}>{pageData.isFallback ? "当前不可写" : "保存后即写入后端"}</span>
                  </div>

                  <div className={styles.editorFooter}>
                    <button className={styles.secondaryAction} disabled={pageData.isFallback} type="submit">
                      保存治理配置
                    </button>
                    <Link className={styles.rowAction} href={currentItemHref}>
                      刷新当前项
                    </Link>
                  </div>
                </form>

                <section className={styles.bulkCard}>
                  <div className={styles.bulkCardHeader}>
                    <div>
                      <h3>待修正提示词池</h3>
                      <p>只展示真实已发布、仍缺少 taxonomy 字段的提示词，批量提交后会直接回写真实分类字段。</p>
                    </div>
                    <span className={styles.readonlyPill}>
                      {promptPool.hasError ? "接口异常" : `当前候选 ${formatNumber(promptPool.items.length)} 条`}
                    </span>
                  </div>

                  <form className={styles.bulkFilterBar} method="get">
                    <input name="section" type="hidden" value={activeSection?.key ?? ""} />
                    <input name="selected" type="hidden" value={filteredSelectedItem.value} />
                    <input name="q" type="hidden" value={resolvedSearchParams?.q ?? ""} />
                    <input name="scope" type="hidden" value={scopeFilter} />
                    <input name="status" type="hidden" value={statusFilter} />
                    <input name="exposure" type="hidden" value={exposureFilter} />
                    <input name="config" type="hidden" value={configFilter} />
                    <div className={styles.filterField}>
                      <label htmlFor="taxonomy-bulk-modality">候选范围</label>
                      <select id="taxonomy-bulk-modality" name="bulkModality" defaultValue={bulkModalityFilter}>
                        <option value="image">图片提示词</option>
                        <option value="video">视频提示词</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label htmlFor="taxonomy-pool-q">候选搜索</label>
                      <input id="taxonomy-pool-q" name="poolQ" defaultValue={poolQuery} placeholder="标题 / 作者 / 业务标签" />
                    </div>
                    <div className={styles.bulkFilterActions}>
                      <button className={styles.primaryAction} type="submit">
                        刷新候选池
                      </button>
                    </div>
                  </form>

                  <div className={styles.bulkSummary}>
                    <span>待修正 {formatNumber(promptPool.summary.needsAttentionItems)} 条</span>
                    <span>图片 {formatNumber(promptPool.summary.imageItems)} / 视频 {formatNumber(promptPool.summary.videoItems)}</span>
                    <span>当前列表只统计待修正候选，不代表该分类下全部真实已挂载内容</span>
                  </div>

                  {promptPool.hasError ? (
                    <div className={styles.errorBanner}>
                      <strong>候选池读取失败</strong>
                      <span>{promptPool.errorMessage}</span>
                    </div>
                  ) : (
                    <form action={bulkApplyTaxonomyAction} className={styles.bulkApplyForm}>
                      <input name="sectionKey" type="hidden" value={activeSection?.key ?? ""} />
                      <input name="categoryValue" type="hidden" value={filteredSelectedItem.value} />
                      <input name="q" type="hidden" value={resolvedSearchParams?.q ?? ""} />
                      <input name="scope" type="hidden" value={scopeFilter} />
                      <input name="status" type="hidden" value={statusFilter} />
                      <input name="exposure" type="hidden" value={exposureFilter} />
                      <input name="config" type="hidden" value={configFilter} />
                      <input name="bulkModality" type="hidden" value={bulkModalityFilter} />
                      <input name="poolQ" type="hidden" value={poolQuery} />

                      <div className={styles.bulkFieldGrid}>
                        <div className={styles.field}>
                          <span className={styles.fieldLabel}>批量模态</span>
                          <div className={styles.infoValue}>{promptModalityLabel(bulkModalityFilter)}</div>
                        </div>
                        <div className={styles.field}>
                          <span className={styles.fieldLabel}>模型分类</span>
                          <input
                            name="bulkModelCategory"
                            defaultValue={
                              activeSection?.key === "image-model" || activeSection?.key === "video-model"
                                ? filteredSelectedItem.value
                                : ""
                            }
                            placeholder="如 gpt-image-2 / seedance"
                          />
                        </div>
                        <div className={styles.field}>
                          <span className={styles.fieldLabel}>内容分类</span>
                          <input
                            name="bulkContentCategory"
                            defaultValue={activeSection?.key === "content-category" ? filteredSelectedItem.value : ""}
                            placeholder="如 real-person / animation / scene"
                          />
                        </div>
                        <div className={styles.field}>
                          <span className={styles.fieldLabel}>构图分类</span>
                          <input
                            name="bulkCompositionCategory"
                            defaultValue={activeSection?.key === "composition-category" ? filteredSelectedItem.value : ""}
                            placeholder="single-model / multi-model"
                          />
                        </div>
                      </div>

                      <div className={styles.poolTableWrap}>
                        <table className={styles.poolTable}>
                          <thead>
                            <tr>
                              <th>选择</th>
                              <th>标题</th>
                              <th>模态</th>
                              <th>作者</th>
                              <th>当前分类</th>
                              <th>发布时间</th>
                            </tr>
                          </thead>
                          <tbody>
                            {promptPool.items.length > 0 ? (
                              promptPool.items.map((item) => (
                                <tr key={item.promptId}>
                                  <td>
                                    <input name="promptIds" type="checkbox" value={item.promptId} />
                                  </td>
                                  <td>
                                    <div className={styles.poolTitleCell}>
                                      <strong>{item.title}</strong>
                                      <span>{item.tagNames.join(" / ") || "无业务标签"}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={styles.statusPill}>{promptModalityLabel(item.modality)}</span>
                                  </td>
                                  <td>{item.authorDisplayName}</td>
                                  <td>
                                    <div className={styles.poolCategoryCell}>
                                      <span>模型: {emptyCategoryLabel(item.modelCategory)}</span>
                                      <span>内容: {emptyCategoryLabel(item.contentCategory)}</span>
                                      <span>构图: {emptyCategoryLabel(item.compositionCategory)}</span>
                                    </div>
                                  </td>
                                  <td>{item.publishedAt}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td className={styles.emptyState} colSpan={6}>
                                  当前条件下没有待修正提示词。
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className={styles.bulkNoteBox}>
                        <span>批量修正会同步更新真实分类字段和 taxonomy 标签，但保留非 taxonomy 业务标签。</span>
                        <button className={styles.secondaryAction} disabled={promptPool.items.length === 0} type="submit">
                          批量应用到已勾选提示词
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              </>
            ) : (
              <div className={styles.emptyState}>
                {querySummaryParts.length > 0 ? "当前筛选条件下没有可编辑的分类项，请清空筛选或切换板块。" : "当前没有可选分类项。"}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
