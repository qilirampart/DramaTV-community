import Link from "next/link";
import { requireAdminAccess } from "@/lib/admin-auth";
import {
  AdminBackendError,
  getAdminTaxonomy,
  listAdminTaxonomyPrompts,
  type AdminTaxonomyData,
  type AdminTaxonomyItemData,
  type AdminTaxonomyPromptListData
} from "@/lib/admin-service";
import {
  createTaxonomyCategoryAction,
  deleteTaxonomyCategoryAction,
  rebindTaxonomyPromptsAction,
  updateTaxonomyAction
} from "./actions";
import styles from "./page.module.css";

type SectionKey =
  | "image-model"
  | "video-model"
  | "image-content-category"
  | "video-content-category"
  | "video-model-usage";

type ExposureFlag = "homepage" | "featured" | "publish";
type PoolMode = "rebind" | "cleanup";
type PromptModality = "image" | "video";
type ResourceKind = "image" | "video";

type SectionViewModel = {
  key: SectionKey;
  label: string;
  description: string;
  promptCount: number;
  categoryCount: number;
  items: readonly ItemViewModel[];
};

type ItemViewModel = {
  value: string;
  label: string;
  modalityScope: string;
  promptCount: number;
  authorCount: number;
  latestPublishedAt: string;
  sampleTitles: readonly string[];
  governance: {
    hasCustomConfig: boolean;
    statusCode: string;
    sortOrder: number;
    exposureFlags: readonly ExposureFlag[];
    noteText: string | null;
    updatedByDisplayName: string | null;
    updatedAt: string | null;
  };
};

type PromptPoolViewModel = {
  summary: AdminTaxonomyPromptListData["summary"];
  pagination: AdminTaxonomyPromptListData["pagination"];
  items: Array<{
    promptId: string;
    title: string;
    modality: PromptModality;
    authorDisplayName: string;
    modelCategory: string | null;
    contentCategory: string | null;
    compositionCategory: string | null;
    needsAttention: boolean;
    publishedAt: string;
    tagNames: readonly string[];
  }>;
  errorMessage: string | null;
};

type PageState = {
  sections: readonly SectionViewModel[];
  activeSection: SectionViewModel | null;
  activeItem: ItemViewModel | null;
  poolMode: PoolMode;
  promptPool: PromptPoolViewModel;
  pageErrorMessage: string | null;
};

const SECTION_ORDER: readonly SectionKey[] = [
  "image-model",
  "video-model",
  "image-content-category",
  "video-content-category",
  "video-model-usage"
] as const;

const RESOURCE_GROUPS: ReadonlyArray<{
  key: ResourceKind;
  label: string;
  description: string;
  sectionKeys: readonly SectionKey[];
}> = [
  {
    key: "image",
    label: "图片提示词分类",
    description: "管理图片提示词的模型分类和内容分类。",
    sectionKeys: ["image-model", "image-content-category"]
  },
  {
    key: "video",
    label: "视频提示词分类",
    description: "管理视频提示词的模型分类、内容分类和模型使用方式。",
    sectionKeys: ["video-model", "video-content-category", "video-model-usage"]
  }
] as const;

const POOL_PAGE_SIZE = 15;

const EMPTY_PROMPT_POOL_SUMMARY: PromptPoolViewModel["summary"] = {
  totalItems: 0,
  needsAttentionItems: 0,
  imageItems: 0,
  videoItems: 0
};

const EMPTY_PROMPT_POOL_PAGINATION: PromptPoolViewModel["pagination"] = {
  page: 1,
  pageSize: POOL_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false
};

const EXPOSURE_OPTIONS: ReadonlyArray<{
  value: ExposureFlag;
  label: string;
  detail: string;
}> = [
  { value: "homepage", label: "首页", detail: "允许在首页筛选和展示里使用" },
  { value: "featured", label: "精选页", detail: "允许在精选页筛选和展示里使用" },
  { value: "publish", label: "发布页", detail: "允许在发布页面显式选择" }
];

function normalizeFilterValue(value?: string | null) {
  return value?.trim() ?? "";
}

function normalizePageValue(value?: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePoolMode(value?: string | null): PoolMode {
  return value === "cleanup" ? "cleanup" : "rebind";
}

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

function modalityLabel(value: string) {
  if (value === "image") {
    return "图片提示词";
  }
  if (value === "video") {
    return "视频提示词";
  }
  return "混合";
}

function sectionShortLabel(key: SectionKey) {
  switch (key) {
    case "image-model":
      return "图片模型分类";
    case "video-model":
      return "视频模型分类";
    case "image-content-category":
      return "图片内容分类";
    case "video-content-category":
      return "视频内容分类";
    case "video-model-usage":
      return "视频模型使用方式";
    default:
      return key;
  }
}

function sectionActionLabel(key: SectionKey) {
  switch (key) {
    case "image-model":
      return "新增图片模型";
    case "video-model":
      return "新增视频模型";
    case "image-content-category":
      return "新增图片内容分类";
    case "video-content-category":
      return "新增视频内容分类";
    case "video-model-usage":
      return "新增模型使用方式";
    default:
      return "新增分类";
  }
}

function sectionDimensionLabel(key: SectionKey) {
  switch (key) {
    case "image-model":
    case "video-model":
      return "模型分类";
    case "image-content-category":
    case "video-content-category":
      return "内容分类";
    case "video-model-usage":
      return "模型使用方式";
    default:
      return "分类";
  }
}

function getResourceKindFromSection(sectionKey?: SectionKey | null): ResourceKind {
  if (
    sectionKey === "image-model" ||
    sectionKey === "image-content-category"
  ) {
    return "image";
  }
  return "video";
}

function poolModeLabel(mode: PoolMode) {
  return mode === "cleanup" ? "待补齐优先" : "全量资源池";
}

function buildSectionMap(data: AdminTaxonomyData) {
  const sectionMap = new Map<SectionKey, SectionViewModel>();
  for (const section of data.sections) {
    sectionMap.set(section.key as SectionKey, {
      key: section.key as SectionKey,
      label: section.label,
      description: section.description,
      promptCount: section.promptCount,
      categoryCount: section.categoryCount,
      items: section.items.map((item) => mapItem(item))
    });
  }
  return sectionMap;
}

function mapItem(item: AdminTaxonomyItemData): ItemViewModel {
  return {
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
  };
}

function buildEmptyPromptPool(errorMessage: string | null): PromptPoolViewModel {
  return {
    summary: EMPTY_PROMPT_POOL_SUMMARY,
    pagination: EMPTY_PROMPT_POOL_PAGINATION,
    items: [],
    errorMessage
  };
}

function normalizePromptPoolSummary(
  summary: Partial<PromptPoolViewModel["summary"]> | undefined,
  itemCount: number
): PromptPoolViewModel["summary"] {
  return {
    totalItems: summary?.totalItems ?? itemCount,
    needsAttentionItems: summary?.needsAttentionItems ?? 0,
    imageItems: summary?.imageItems ?? 0,
    videoItems: summary?.videoItems ?? 0
  };
}

function normalizePromptPoolPagination(
  pagination: Partial<PromptPoolViewModel["pagination"]> | undefined,
  itemCount: number,
  requestedPage: number
): PromptPoolViewModel["pagination"] {
  const totalItems = pagination?.totalItems ?? itemCount;
  const pageSize = pagination?.pageSize ?? POOL_PAGE_SIZE;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)));
  const page = Math.min(pagination?.page ?? requestedPage, totalPages);
  const hasPrevious = pagination?.hasPrevious ?? page > 1;
  const hasNext = pagination?.hasNext ?? page < totalPages;

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasPrevious,
    hasNext
  };
}

async function loadPromptPool(input: {
  poolMode: PoolMode;
  activeSection: SectionViewModel | null;
  activeItem: ItemViewModel | null;
  query: string;
  page: number;
}): Promise<PromptPoolViewModel> {
  if (!input.activeSection || !input.activeItem) {
    return buildEmptyPromptPool(null);
  }

  const modality = getResourceKindFromSection(input.activeSection.key);
  const requestQuery = {
    modality,
    q: input.query || undefined,
    page: input.page,
    pageSize: POOL_PAGE_SIZE,
    ...(input.poolMode === "cleanup"
      ? {
          needsAttention: true
        }
      : {})
  } as const;

  try {
    const response = await listAdminTaxonomyPrompts(requestQuery);
    const responseItems = Array.isArray(response.data?.items) ? response.data.items : [];
    return {
      summary: normalizePromptPoolSummary(response.data?.summary, responseItems.length),
      pagination: normalizePromptPoolPagination(response.data?.pagination, responseItems.length, input.page),
      items: responseItems.map((item) => ({
        promptId: item.promptId,
        title: item.title,
        modality: item.modality === "video" ? "video" : "image",
        authorDisplayName: item.authorDisplayName,
        modelCategory: item.modelCategory ?? null,
        contentCategory: item.contentCategory ?? null,
        compositionCategory: item.compositionCategory ?? null,
        needsAttention: item.needsAttention,
        publishedAt: formatDateTime(item.publishedAt),
        tagNames: item.tagNames
      })),
      errorMessage: null
    };
  } catch (error) {
    const message =
      error instanceof AdminBackendError && error.requestId
        ? `${error.message}（requestId: ${error.requestId}）`
        : "候选资源读取失败。";
    return buildEmptyPromptPool(message);
  }
}

function buildTaxonomyHref(options: {
  section?: string | null;
  selected?: string | null;
  q?: string | null;
  poolMode?: PoolMode;
  poolQ?: string | null;
  poolPage?: number | null;
}) {
  const query = new URLSearchParams();
  if (options.section?.trim()) {
    query.set("section", options.section.trim());
  }
  if (options.selected?.trim()) {
    query.set("selected", options.selected.trim());
  }
  if (options.q?.trim()) {
    query.set("q", options.q.trim());
  }
  if (options.poolMode) {
    query.set("poolMode", options.poolMode);
  }
  if (options.poolQ?.trim()) {
    query.set("poolQ", options.poolQ.trim());
  }
  if (options.poolPage && options.poolPage > 1) {
    query.set("page", String(options.poolPage));
  }
  const queryString = query.toString();
  return queryString ? `/taxonomy?${queryString}` : "/taxonomy";
}

async function loadPageState(searchParams?: {
  section?: string;
  selected?: string;
  q?: string;
  poolMode?: string;
  poolQ?: string;
  page?: string;
}): Promise<PageState> {
  try {
    const taxonomy = await getAdminTaxonomy();
    const sectionMap = buildSectionMap(taxonomy.data);
    const orderedSections = SECTION_ORDER.map((key) => sectionMap.get(key)).filter(Boolean) as SectionViewModel[];

    const requestedSection = normalizeFilterValue(searchParams?.section) as SectionKey;
    const activeSection = orderedSections.find((section) => section.key === requestedSection) ?? orderedSections[0] ?? null;
    const requestedSelected = normalizeFilterValue(searchParams?.selected);
    const activeItem = activeSection?.items.find((item) => item.value === requestedSelected) ?? activeSection?.items[0] ?? null;

    const poolMode = normalizePoolMode(searchParams?.poolMode);
    const poolQuery = normalizeFilterValue(searchParams?.poolQ);
    const poolPage = normalizePageValue(searchParams?.page);
    const promptPool = await loadPromptPool({
      poolMode,
      activeSection,
      activeItem,
      query: poolQuery,
      page: poolPage
    });

    return {
      sections: orderedSections,
      activeSection,
      activeItem,
      poolMode,
      promptPool,
      pageErrorMessage: null
    };
  } catch (error) {
    const message =
      error instanceof AdminBackendError && error.requestId
        ? `${error.message}（requestId: ${error.requestId}）`
        : "分类页数据读取失败。";
    return {
      sections: [],
      activeSection: null,
      activeItem: null,
      poolMode: normalizePoolMode(searchParams?.poolMode),
      promptPool: buildEmptyPromptPool(null),
      pageErrorMessage: message
    };
  }
}

export default async function TaxonomyPage({
  searchParams
}: {
  searchParams?: Promise<{
    section?: string;
    selected?: string;
    q?: string;
    poolMode?: string;
    poolQ?: string;
    page?: string;
    error?: string;
    success?: string;
  }>;
}) {
  await requireAdminAccess(["admin", "operator", "moderator"], "/taxonomy");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const state = await loadPageState(resolvedSearchParams);
  const pageErrorMessage = resolvedSearchParams?.error?.trim() || state.pageErrorMessage;
  const successMessage = resolvedSearchParams?.success?.trim() || null;
  const categorySearch = normalizeFilterValue(resolvedSearchParams?.q).toLowerCase();
  const poolQuery = normalizeFilterValue(resolvedSearchParams?.poolQ);
  const promptPool = state.promptPool ?? buildEmptyPromptPool(null);

  const filteredSections = state.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (section.key === state.activeSection?.key && item.value === state.activeItem?.value) {
          return true;
        }
        if (!categorySearch) {
          return true;
        }
        return (
          item.label.toLowerCase().includes(categorySearch) ||
          item.value.toLowerCase().includes(categorySearch) ||
          item.sampleTitles.some((title) => title.toLowerCase().includes(categorySearch))
        );
      })
    }))
    .filter((section) => section.items.length > 0 || !categorySearch);

  const activeSection =
    filteredSections.find((section) => section.key === state.activeSection?.key) ??
    filteredSections[0] ??
    null;
  const activeItem =
    activeSection?.items.find((item) => item.value === state.activeItem?.value) ?? activeSection?.items[0] ?? null;

  const activeResourceKind = getResourceKindFromSection(activeSection?.key ?? null);
  const resourceTabs = RESOURCE_GROUPS.map((group) => {
    const targetSection =
      filteredSections.find((section) => group.sectionKeys.includes(section.key)) ??
      state.sections.find((section) => group.sectionKeys.includes(section.key)) ??
      null;
    const targetItem = targetSection?.items[0] ?? null;
    return {
      ...group,
      href:
        targetSection && targetItem
          ? buildTaxonomyHref({
              section: targetSection.key,
              selected: targetItem.value,
              q: resolvedSearchParams?.q ?? "",
              poolMode: state.poolMode,
              poolQ: poolQuery
            })
          : "/taxonomy",
      active: group.key === activeResourceKind
    };
  });

  const visibleSections = filteredSections.filter(
    (section) => getResourceKindFromSection(section.key) === activeResourceKind
  );

  const currentGroup = RESOURCE_GROUPS.find((group) => group.key === activeResourceKind) ?? RESOURCE_GROUPS[0];
  const sectionHrefBase = {
    q: resolvedSearchParams?.q ?? "",
    poolMode: state.poolMode,
    poolQ: poolQuery
  };

  const enabledExposureLabels = activeItem
    ? EXPOSURE_OPTIONS.filter((option) => activeItem.governance.exposureFlags.includes(option.value)).map((option) => option.label)
    : [];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <span className={styles.kicker}>content taxonomy</span>
          <h1 className={styles.title}>分类管理</h1>
          <p className={styles.subtitle}>
            这里只做三件事：维护分类、决定分类是否可用、把真实提示词重新挂到正确分类上。
          </p>
        </div>
      </header>

      {pageErrorMessage ? (
        <div className={styles.errorBanner}>
          <strong>页面读取失败</strong>
          <span>{pageErrorMessage}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div className={styles.successBanner}>
          <strong>操作成功</strong>
          <span>{successMessage}</span>
        </div>
      ) : null}

      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>页面目标</span>
          <h2>把分类定义和提示词重绑拆开做，不再把一堆治理术语堆在同一页。</h2>
          <p>
            图片和视频分开管理。图片提示词只有模型分类和内容分类，视频提示词额外有模型使用方式。你后续要做的增删改绑，都应该从这页完成。
          </p>
        </div>

        <div className={styles.heroStats}>
          <article className={styles.statCard}>
            <span>当前资源类型</span>
            <strong>{currentGroup.label}</strong>
            <em>{currentGroup.description}</em>
          </article>
          <article className={styles.statCard}>
            <span>分类总数</span>
            <strong>{formatNumber(visibleSections.reduce((sum, section) => sum + section.categoryCount, 0))}</strong>
            <em>{visibleSections.length} 个分类维度</em>
          </article>
          <article className={styles.statCard}>
            <span>候选资源</span>
            <strong>{formatNumber(promptPool.pagination.totalItems)}</strong>
            <em>{poolModeLabel(state.poolMode)}</em>
          </article>
        </div>
      </section>

      <nav className={styles.resourceTabs} aria-label="资源类型切换">
        {resourceTabs.map((group) => (
          <Link
            className={`${styles.resourceTab} ${group.active ? styles.resourceTabActive : ""}`}
            href={group.href}
            key={group.key}
            scroll={false}
          >
            <strong>{group.label}</strong>
            <span>{group.description}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.panelStep}>A</span>
                <h2>分类定义区</h2>
                <p>先选资源类型下的分类维度，再维护分类项本身。</p>
              </div>
            </header>

            <div className={styles.sectionRail}>
              {visibleSections.map((section, index) => {
                const isActive = section.key === activeSection?.key;
                const targetItem = section.items.find((item) => item.value === activeItem?.value) ?? section.items[0] ?? null;
                const href = buildTaxonomyHref({
                  ...sectionHrefBase,
                  section: section.key,
                  selected: targetItem?.value ?? ""
                });

                return (
                  <Link
                    className={`${styles.sectionRailCard} ${isActive ? styles.sectionRailCardActive : ""}`}
                    href={href}
                    key={section.key}
                    scroll={false}
                  >
                    <span className={styles.sectionIndex}>0{index + 1}</span>
                    <div className={styles.sectionRailBody}>
                      <strong>{section.label}</strong>
                      <p>{section.description}</p>
                    </div>
                    <span className={styles.sectionCount}>{formatNumber(section.categoryCount)} 项</span>
                  </Link>
                );
              })}
            </div>

            <form className={styles.searchBar} method="get">
              <input name="section" type="hidden" value={activeSection?.key ?? ""} />
              <input name="selected" type="hidden" value={activeItem?.value ?? ""} />
              <input name="poolMode" type="hidden" value={state.poolMode} />
              <input name="poolQ" type="hidden" value={poolQuery} />
              <label className={styles.searchField}>
                <span>分类搜索</span>
                <input defaultValue={resolvedSearchParams?.q ?? ""} name="q" placeholder="分类名、编码、示例标题" />
              </label>
              <button className={styles.secondaryButton} type="submit">
                刷新
              </button>
            </form>

            {activeSection ? (
              <div className={styles.defineWorkspace}>
                <div className={styles.defineHeader}>
                  <div>
                    <span className={styles.miniEyebrow}>{sectionDimensionLabel(activeSection.key)}</span>
                    <h3>{activeSection.label}</h3>
                    <p>{activeSection.description}</p>
                  </div>
                  <span className={styles.defineSummary}>
                    {formatNumber(activeSection.categoryCount)} 项 · {formatNumber(activeSection.promptCount)} 条提示词
                  </span>
                </div>

                <form action={createTaxonomyCategoryAction} className={styles.createForm}>
                  <input name="sectionKey" type="hidden" value={activeSection.key} />
                  <input name="q" type="hidden" value={resolvedSearchParams?.q ?? ""} />
                  <input name="poolMode" type="hidden" value={state.poolMode} />
                  <input name="poolQ" type="hidden" value={poolQuery} />
                  <label className={styles.inlineField}>
                    <span>{sectionActionLabel(activeSection.key)}</span>
                    <input name="categoryValue" placeholder={`输入新的${sectionShortLabel(activeSection.key)}`} />
                  </label>
                  <button className={styles.primaryButton} type="submit">
                    新增
                  </button>
                </form>

                <div className={styles.itemList}>
                  {activeSection.items.length > 0 ? (
                    activeSection.items.map((item) => {
                      const href = buildTaxonomyHref({
                        ...sectionHrefBase,
                        section: activeSection.key,
                        selected: item.value
                      });
                      const isActive = item.value === activeItem?.value;
                      return (
                        <Link
                          className={`${styles.itemRow} ${isActive ? styles.itemRowActive : ""}`}
                          href={href}
                          key={`${activeSection.key}-${item.value}`}
                          scroll={false}
                        >
                          <div className={styles.itemMeta}>
                            <strong>{item.label}</strong>
                            <span>{item.value}</span>
                          </div>
                          <div className={styles.itemStats}>
                            <span>{formatNumber(item.promptCount)} 条</span>
                            <span>{formatNumber(item.authorCount)} 位作者</span>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className={styles.emptyState}>
                      <strong>当前维度还没有分类项</strong>
                      <span>先在上面新增一个分类，再开始绑定资源。</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <strong>当前没有可用分类维度</strong>
                <span>先确保后端 taxonomy 数据已经正常返回。</span>
              </div>
            )}
          </section>
        </aside>

        <div className={styles.main}>
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.panelStep}>B</span>
                <h2>分类设置</h2>
                <p>这里不是改资源，而是改这个分类本身是否启用、排序值和适用页面。</p>
              </div>
            </header>

            {activeSection && activeItem ? (
              <div className={styles.detailBody}>
                <div className={styles.detailHero}>
                  <div className={styles.detailHeroCopy}>
                    <span className={styles.detailLabel}>{sectionDimensionLabel(activeSection.key)}</span>
                    <h3>{activeItem.label}</h3>
                    <p>
                      {currentGroup.label} · {sectionShortLabel(activeSection.key)}
                    </p>
                  </div>

                  <form action={deleteTaxonomyCategoryAction}>
                    <input name="sectionKey" type="hidden" value={activeSection.key} />
                    <input name="categoryValue" type="hidden" value={activeItem.value} />
                    <input name="q" type="hidden" value={resolvedSearchParams?.q ?? ""} />
                    <input name="poolMode" type="hidden" value={state.poolMode} />
                    <input name="poolQ" type="hidden" value={poolQuery} />
                    <button className={styles.dangerButton} type="submit">
                      删除这个分类
                    </button>
                  </form>
                </div>

                <div className={styles.metaGrid}>
                  <div className={styles.metaCard}>
                    <span>分类编码</span>
                    <strong>{activeItem.value}</strong>
                  </div>
                  <div className={styles.metaCard}>
                    <span>关联提示词</span>
                    <strong>{formatNumber(activeItem.promptCount)}</strong>
                  </div>
                  <div className={styles.metaCard}>
                    <span>覆盖作者</span>
                    <strong>{formatNumber(activeItem.authorCount)}</strong>
                  </div>
                  <div className={styles.metaCard}>
                    <span>最近内容</span>
                    <strong>{activeItem.latestPublishedAt}</strong>
                  </div>
                </div>

                <div className={styles.infoStrip}>
                  <div>
                    <span>当前状态</span>
                    <strong>{activeItem.governance.statusCode === "enabled" ? "启用中" : "已停用"}</strong>
                  </div>
                  <div>
                    <span>适用页面</span>
                    <strong>{enabledExposureLabels.length > 0 ? enabledExposureLabels.join(" / ") : "暂未投放"}</strong>
                  </div>
                  <div>
                    <span>最后更新</span>
                    <strong>
                      {activeItem.governance.updatedAt
                        ? `${activeItem.governance.updatedAt}${activeItem.governance.updatedByDisplayName ? ` · ${activeItem.governance.updatedByDisplayName}` : ""}`
                        : "未配置"}
                    </strong>
                  </div>
                </div>

                <div className={styles.sampleBox}>
                  <span>这个分类下最近出现的内容</span>
                  <div className={styles.sampleList}>
                    {activeItem.sampleTitles.length > 0 ? (
                      activeItem.sampleTitles.map((title) => <span key={title}>{title}</span>)
                    ) : (
                      <em>这个分类暂时还没有实际挂载内容。</em>
                    )}
                  </div>
                </div>

                <form action={updateTaxonomyAction} className={styles.governanceForm}>
                  <input name="sectionKey" type="hidden" value={activeSection.key} />
                  <input name="categoryValue" type="hidden" value={activeItem.value} />
                  <input name="q" type="hidden" value={resolvedSearchParams?.q ?? ""} />
                  <input name="poolMode" type="hidden" value={state.poolMode} />
                  <input name="poolQ" type="hidden" value={poolQuery} />
                  <input name="page" type="hidden" value={String(promptPool.pagination.page)} />

                  <div className={styles.formGrid}>
                    <label className={styles.formField}>
                      <span>是否启用</span>
                      <select defaultValue={activeItem.governance.statusCode} name="statusCode">
                        <option value="enabled">启用</option>
                        <option value="disabled">停用</option>
                      </select>
                    </label>
                    <label className={styles.formField}>
                      <span>排序值</span>
                      <input defaultValue={String(activeItem.governance.sortOrder)} name="sortOrder" type="number" />
                    </label>
                  </div>

                  <div className={styles.checkboxSection}>
                    <span>允许出现在哪些页面</span>
                    <div className={styles.checkboxGrid}>
                      {EXPOSURE_OPTIONS.map((option) => {
                        const checked = activeItem.governance.exposureFlags.includes(option.value);
                        return (
                          <label className={styles.checkboxItem} key={option.value}>
                            <input defaultChecked={checked} name="exposureFlags" type="checkbox" value={option.value} />
                            <span>
                              <strong>{option.label}</strong>
                              <em>{option.detail}</em>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <label className={styles.formField}>
                    <span>备注</span>
                    <textarea
                      defaultValue={activeItem.governance.noteText ?? ""}
                      name="noteText"
                      placeholder="记录这个分类的使用规则、临时说明或运营备注。"
                      rows={4}
                    />
                  </label>

                  <div className={styles.formFooter}>
                    <p className={styles.footerHint}>
                      如果这个分类还挂着真实提示词，删除会被系统拒绝。先把资源重新绑走，再删这个分类。
                    </p>
                    <button className={styles.primaryButton} type="submit">
                      保存分类设置
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <strong>先选一个分类</strong>
                <span>左侧选中分类项后，这里才会出现分类设置。</span>
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.panelStep}>C</span>
                <h2>提示词重绑区</h2>
                <p>从真实提示词池里挑资源，重新绑定到当前分类。这里的修改会直接落库。</p>
              </div>
            </header>

            {activeSection && activeItem ? (
              <div className={styles.poolBody}>
                <div className={styles.poolTopbar}>
                  <div className={styles.poolTarget}>
                    <span>当前目标</span>
                    <strong>{activeItem.label}</strong>
                    <em>
                      {sectionShortLabel(activeSection.key)} · {currentGroup.label}
                    </em>
                  </div>

                  <div className={styles.poolModeSwitch}>
                    <Link
                      className={`${styles.modeButton} ${state.poolMode === "rebind" ? styles.modeButtonActive : ""}`}
                      href={buildTaxonomyHref({
                        ...sectionHrefBase,
                        section: activeSection.key,
                        selected: activeItem.value,
                        poolMode: "rebind",
                        poolQ: poolQuery
                      })}
                      scroll={false}
                    >
                      全量资源池
                    </Link>
                    <Link
                      className={`${styles.modeButton} ${state.poolMode === "cleanup" ? styles.modeButtonActive : ""}`}
                      href={buildTaxonomyHref({
                        ...sectionHrefBase,
                        section: activeSection.key,
                        selected: activeItem.value,
                        poolMode: "cleanup",
                        poolQ: poolQuery
                      })}
                      scroll={false}
                    >
                      待补齐优先
                    </Link>
                  </div>
                </div>

                <form className={styles.poolSearch} method="get">
                  <input name="section" type="hidden" value={activeSection.key} />
                  <input name="selected" type="hidden" value={activeItem.value} />
                  <input name="q" type="hidden" value={resolvedSearchParams?.q ?? ""} />
                  <input name="poolMode" type="hidden" value={state.poolMode} />
                  <label className={styles.searchField}>
                    <span>搜索候选资源</span>
                    <input defaultValue={poolQuery} name="poolQ" placeholder="按标题、作者、标签搜索" />
                  </label>
                  <button className={styles.secondaryButton} type="submit">
                    刷新
                  </button>
                </form>

                <div className={styles.poolSummary}>
                  <span>当前模式：{poolModeLabel(state.poolMode)}</span>
                  <span>共 {formatNumber(promptPool.pagination.totalItems)} 条</span>
                  <span>待补齐 {formatNumber(promptPool.summary.needsAttentionItems)} 条</span>
                  <span>图片 {formatNumber(promptPool.summary.imageItems)} / 视频 {formatNumber(promptPool.summary.videoItems)}</span>
                </div>

                {promptPool.errorMessage ? (
                  <div className={styles.errorBanner}>
                    <strong>候选池读取失败</strong>
                    <span>{promptPool.errorMessage}</span>
                  </div>
                ) : null}

                <form action={rebindTaxonomyPromptsAction} className={styles.rebindForm}>
                  <input name="sectionKey" type="hidden" value={activeSection.key} />
                  <input name="categoryValue" type="hidden" value={activeItem.value} />
                  <input name="q" type="hidden" value={resolvedSearchParams?.q ?? ""} />
                  <input name="poolMode" type="hidden" value={state.poolMode} />
                  <input name="poolQ" type="hidden" value={poolQuery} />
                  <input name="page" type="hidden" value={String(promptPool.pagination.page)} />

                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>选择</th>
                          <th>提示词标题</th>
                          <th>类型</th>
                          <th>作者</th>
                          <th>当前绑定情况</th>
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
                                <div className={styles.promptCell}>
                                  <strong>{item.title}</strong>
                                  <span>{item.tagNames.join(" / ") || "无业务标签"}</span>
                                </div>
                              </td>
                              <td>
                                <span className={styles.typePill}>{modalityLabel(item.modality)}</span>
                              </td>
                              <td>{item.authorDisplayName}</td>
                              <td>
                                <div className={styles.categoryCell}>
                                  <span>模型：{item.modelCategory || "未填"}</span>
                                  <span>内容：{item.contentCategory || "未填"}</span>
                                  {item.modality === "video" ? (
                                    <span>模型使用方式：{item.compositionCategory || "未填"}</span>
                                  ) : null}
                                </div>
                              </td>
                              <td>{item.publishedAt}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className={styles.emptyCell} colSpan={6}>
                              当前条件下没有可重绑的提示词。
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.paginationRow}>
                    <span className={styles.countText}>
                      第 {formatNumber(promptPool.pagination.page)} 页，共 {formatNumber(promptPool.pagination.totalPages)} 页
                    </span>
                    <div className={styles.pagination}>
                      {promptPool.pagination.hasPrevious ? (
                        <Link
                          className={styles.pageButton}
                          href={buildTaxonomyHref({
                            ...sectionHrefBase,
                            section: activeSection.key,
                            selected: activeItem.value,
                            poolPage: promptPool.pagination.page - 1
                          })}
                          scroll={false}
                        >
                          上一页
                        </Link>
                      ) : null}
                      <span className={`${styles.pageButton} ${styles.pageButtonCurrent}`}>{promptPool.pagination.page}</span>
                      {promptPool.pagination.hasNext ? (
                        <Link
                          className={styles.pageButton}
                          href={buildTaxonomyHref({
                            ...sectionHrefBase,
                            section: activeSection.key,
                            selected: activeItem.value,
                            poolPage: promptPool.pagination.page + 1
                          })}
                          scroll={false}
                        >
                          下一页
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.formFooter}>
                    <p className={styles.footerHint}>
                      这里的重绑只会改当前这个分类维度。其它分类维度和业务标签会保留，不会被一并冲掉。
                    </p>
                    <button className={styles.primaryButton} disabled={promptPool.items.length === 0} type="submit">
                      绑定到当前分类
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <strong>先选分类再绑定资源</strong>
                <span>选中左侧分类项后，这里才会读取对应的真实提示词资源。</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
