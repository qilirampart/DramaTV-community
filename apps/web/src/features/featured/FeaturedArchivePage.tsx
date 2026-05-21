"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition, type MouseEvent as ReactMouseEvent } from "react";
import { useCommunitySession } from "@/components/shared/CommunitySessionProvider";
import { PageShell } from "@/components/shared/PageShell";
import { useInteractiveVideoPreview } from "@/components/shared/useInteractiveVideoPreview";
import { togglePromptLikeAction } from "@/features/community-interactions/actions";
import type { ApiFeaturedArchiveResponse, ApiPromptSummary, ApiWorkflowSummary } from "@/lib/contracts/community-api";
import type { HomeFeedCardView } from "@/lib/contracts/view-models";
import { toIndexedContentCards, type IndexedContentCard } from "@/lib/content-index";
import { normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import { useBackAnchorRestore } from "@/lib/routes/back-anchor";
import { appendBackSource } from "@/lib/routes/redirect-utils";
import {
  IMAGE_PROMPT_CONTENT_OPTIONS,
  IMAGE_PROMPT_MODEL_OPTIONS,
  VIDEO_PROMPT_CONTENT_OPTIONS,
  VIDEO_PROMPT_MODEL_OPTIONS,
  parsePromptTaxonomySelection
} from "@/lib/taxonomy/prompt-taxonomy";
import styles from "./FeaturedArchivePage.module.css";

type FeaturedFilter = "all" | "workflow" | "video_prompt" | "image_prompt" | "activity";
type FeaturedSort = "hot" | "latest";
type FeaturedResourceType = "提示词" | "工作流" | "活动";

type FeaturedArchiveItem = {
  id: string;
  title: string;
  href: string;
  authorName: string;
  authorAvatarUrl?: string;
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  resourceType: FeaturedResourceType;
  sourceKind: "feed" | "prompt_inventory" | "workflow_inventory";
  promptModality?: "image" | "video";
  likeTargetType?: "prompt";
  viewerLiked?: boolean;
  likes: number;
  latestRank: number;
  keywords: string[];
  topicTokens: string[];
  filterGroup: Exclude<FeaturedFilter, "all">;
  pinnedRank?: number;
};

type FeaturedSecondaryOption = {
  id: string;
  label: string;
  count: number;
};

type FeaturedPromptFacetValue = string | null;

type FeaturedPromptFacetOptions = {
  modelOptions: FeaturedSecondaryOption[];
  contentOptions: FeaturedSecondaryOption[];
};

const FILTER_OPTIONS: Array<{ id: FeaturedFilter; label: string }> = [
  { id: "all", label: "全部" },
  { id: "workflow", label: "工作流" },
  { id: "video_prompt", label: "视频提示词" },
  { id: "image_prompt", label: "图片提示词" },
  { id: "activity", label: "活动" }
];

const SORT_OPTIONS: Array<{ id: FeaturedSort; label: string }> = [
  { id: "hot", label: "最热" },
  { id: "latest", label: "最新" }
];

const INITIAL_VISIBLE_ITEMS = 24;
const VISIBLE_ITEMS_STEP = 24;
const SECONDARY_ALL_ID = "all";

const WORKFLOW_SECONDARY_OPTIONS = [
  { id: SECONDARY_ALL_ID, label: "全部工作流" },
  { id: "copyable", label: "可复制" },
  { id: "placeholder", label: "占位" }
] as const;

function buildOptionIdSet(options: ReadonlyArray<{ id: string }>) {
  return new Set(options.map((option) => option.id));
}

const VIDEO_PROMPT_MODEL_OPTION_IDS = buildOptionIdSet(VIDEO_PROMPT_MODEL_OPTIONS);
const VIDEO_PROMPT_CONTENT_OPTION_IDS = buildOptionIdSet(VIDEO_PROMPT_CONTENT_OPTIONS);
const IMAGE_PROMPT_MODEL_OPTION_IDS = buildOptionIdSet(IMAGE_PROMPT_MODEL_OPTIONS);
const IMAGE_PROMPT_CONTENT_OPTION_IDS = buildOptionIdSet(IMAGE_PROMPT_CONTENT_OPTIONS);
const WORKFLOW_SECONDARY_OPTION_IDS = buildOptionIdSet(WORKFLOW_SECONDARY_OPTIONS);

function parseFeaturedFilter(value: string | null): FeaturedFilter {
  return FILTER_OPTIONS.some((option) => option.id === value) ? (value as FeaturedFilter) : "all";
}

function parseFeaturedSort(value: string | null): FeaturedSort {
  return SORT_OPTIONS.some((option) => option.id === value) ? (value as FeaturedSort) : "latest";
}

function parseFeaturedSecondaryFilter(value: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : SECONDARY_ALL_ID;
}

function parseFeaturedPromptFacetFilter(value: string | null): FeaturedPromptFacetValue {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseWorkflowSecondaryFilter(value: string | null) {
  const normalized = parseFeaturedSecondaryFilter(value);
  return WORKFLOW_SECONDARY_OPTION_IDS.has(normalized) ? normalized : SECONDARY_ALL_ID;
}

function parseFeaturedRouteState(searchParams: { get(name: string): string | null }) {
  const filter = parseFeaturedFilter(searchParams.get("filter"));
  const sort = parseFeaturedSort(searchParams.get("sort"));
  const workflowSecondary = parseWorkflowSecondaryFilter(searchParams.get("secondary"));
  const promptFacetSelection = resolvePromptFacetSelection(
    filter,
    parseFeaturedPromptFacetFilter(searchParams.get("model")),
    parseFeaturedPromptFacetFilter(searchParams.get("content")),
    searchParams.get("secondary")
  );

  return {
    filter,
    sort,
    workflowSecondary,
    model: promptFacetSelection.model,
    content: promptFacetSelection.content,
    query: searchParams.get("q") ?? ""
  };
}

function getPromptFacetDefinitions(activeFilter: FeaturedFilter) {
  if (activeFilter === "video_prompt") {
    return {
      modelOptions: VIDEO_PROMPT_MODEL_OPTIONS,
      contentOptions: VIDEO_PROMPT_CONTENT_OPTIONS,
      modelIds: VIDEO_PROMPT_MODEL_OPTION_IDS,
      contentIds: VIDEO_PROMPT_CONTENT_OPTION_IDS
    };
  }

  if (activeFilter === "image_prompt") {
    return {
      modelOptions: IMAGE_PROMPT_MODEL_OPTIONS,
      contentOptions: IMAGE_PROMPT_CONTENT_OPTIONS,
      modelIds: IMAGE_PROMPT_MODEL_OPTION_IDS,
      contentIds: IMAGE_PROMPT_CONTENT_OPTION_IDS
    };
  }

  return null;
}

function resolvePromptFacetSelection(
  activeFilter: FeaturedFilter,
  modelValue: FeaturedPromptFacetValue,
  contentValue: FeaturedPromptFacetValue,
  legacySecondaryValue?: string | null
) {
  const definitions = getPromptFacetDefinitions(activeFilter);
  if (!definitions) {
    return {
      model: null,
      content: null
    };
  }

  let model = modelValue && definitions.modelIds.has(modelValue) ? modelValue : null;
  let content = contentValue && definitions.contentIds.has(contentValue) ? contentValue : null;

  if (!model && !content) {
    const legacyValue = parseFeaturedPromptFacetFilter(legacySecondaryValue ?? null);
    if (legacyValue) {
      if (definitions.modelIds.has(legacyValue)) {
        model = legacyValue;
      } else if (definitions.contentIds.has(legacyValue)) {
        content = legacyValue;
      }
    }
  }

  return { model, content };
}

function getFeaturedCardAnchorId(id: string) {
  return `featured-item-${id}`;
}

function buildFeaturedRoute(
  pathname: string,
  state: {
    filter: FeaturedFilter;
    workflowSecondary: string;
    model: FeaturedPromptFacetValue;
    content: FeaturedPromptFacetValue;
    sort: FeaturedSort;
    query: string;
  },
  anchorId?: string
) {
  const params = new URLSearchParams();

  if (state.filter !== "all") {
    params.set("filter", state.filter);
  }

  if (state.filter === "workflow") {
    if (state.workflowSecondary !== SECONDARY_ALL_ID) {
      params.set("secondary", state.workflowSecondary);
    }
  } else if (state.filter === "video_prompt" || state.filter === "image_prompt") {
    if (state.model) {
      params.set("model", state.model);
    }

    if (state.content) {
      params.set("content", state.content);
    }
  }

  if (state.sort !== "latest") {
    params.set("sort", state.sort);
  }

  const trimmedQuery = state.query.trim();
  if (trimmedQuery.length > 0) {
    params.set("q", trimmedQuery);
  }

  const queryString = params.toString();
  return `${pathname}${queryString ? `?${queryString}` : ""}${anchorId ? `#${anchorId}` : ""}`;
}

function parseFeaturedRouteFromHref(pathname: string, route: string) {
  const normalizedRoute = route.startsWith(pathname) ? route.slice(pathname.length) : route;
  const normalizedQuery = normalizedRoute.startsWith("?") ? normalizedRoute.slice(1) : normalizedRoute;
  const queryString = normalizedQuery.split("#", 1)[0] ?? "";
  return parseFeaturedRouteState(new URLSearchParams(queryString));
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.8-3.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M8 13.1 2.9 8.3a3.1 3.1 0 1 1 4.4-4.4L8 4.6l.7-.7a3.1 3.1 0 1 1 4.4 4.4L8 13.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function compactText(value: string | undefined, fallback: string, maxLength: number) {
  const source = normalizeText(value) ?? fallback;
  const normalized = source.replace(/\s+/g, " ").trim();
  const chars = Array.from(normalized);

  if (chars.length <= maxLength) {
    return normalized;
  }

  return `${chars.slice(0, maxLength).join("")}...`;
}

function normalizeKeywordList(values: string[]) {
  return values
    .map((value) => normalizeText(value))
    .filter((value): value is string => Boolean(value))
    .map((value) => compactText(value, value, 14));
}

function getAvatarFallback(name: string) {
  return name.trim().charAt(0).toUpperCase() || "D";
}

function formatCompactNumber(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toLocaleString("zh-CN");
}

function getPromptFilterGroup(prompt: ApiPromptSummary): FeaturedArchiveItem["filterGroup"] {
  return prompt.modality === "video" ? "video_prompt" : "image_prompt";
}

function getResourceLabel(
  contentKind: "prompt" | "workflow_work" | "post",
  promptModality?: "image" | "video"
): FeaturedResourceType {
  if (contentKind === "workflow_work") {
    return "工作流";
  }

  if (contentKind === "post") {
    return "活动";
  }

  return promptModality === "image" || promptModality === "video" ? "提示词" : "提示词";
}

function getIndexedFilterGroup(item: IndexedContentCard): FeaturedArchiveItem["filterGroup"] {
  if (item.contentKind === "workflow_work") {
    return "workflow";
  }

  if (item.contentKind === "post") {
    return "activity";
  }

  return item.promptModality === "video" ? "video_prompt" : "image_prompt";
}

function getPromptTopicTokens(item: ApiPromptSummary) {
  const taxonomy = parsePromptTaxonomySelection({
    categoryCode: item.modality === "video" ? "video_prompt" : "image_prompt",
    tagNames: item.tagNames,
    modelCategory: item.taxonomy?.modelCategory,
    contentCategory: item.taxonomy?.contentCategory,
    compositionCategory: item.taxonomy?.compositionCategory,
    title: item.title,
    summary: item.summary
  });
  return [...new Set([taxonomy.modelCategory, taxonomy.contentCategory].flatMap((token) => (token ? [token] : [])))];
}

function toPromptArchiveItem(item: ApiPromptSummary, index: number): FeaturedArchiveItem {
  return {
    id: item.id,
    title: compactText(item.title, "未命名提示词", 30),
    href: `/prompts/${item.id}`,
    authorName: compactText(item.author.displayName, "DramaTV Creator", 18),
    authorAvatarUrl: normalizeAssetUrl(item.author.avatarUrl),
    coverUrl: normalizeAssetUrl(item.coverUrl),
    posterUrl: normalizeAssetUrl(item.posterUrl),
    previewUrl: normalizeAssetUrl(item.previewUrl),
    sourceUrl: normalizeAssetUrl(item.sourceUrl),
    resourceType: "提示词",
    sourceKind: "prompt_inventory",
    promptModality: item.modality,
    likeTargetType: "prompt",
    viewerLiked: item.viewerActions?.liked ?? false,
    likes: item.stats.likeCount,
    latestRank: 2_000_000 - index,
    keywords: normalizeKeywordList(item.tagNames),
    topicTokens: getPromptTopicTokens(item),
    filterGroup: getPromptFilterGroup(item)
  };
}

function toWorkflowArchiveItem(item: ApiWorkflowSummary, index: number): FeaturedArchiveItem {
  return {
    id: item.id,
    title: compactText(item.title, "未命名工作流", 30),
    href: `/workflows/${item.id}`,
    authorName: compactText(item.author.displayName, "DramaTV Creator", 18),
    authorAvatarUrl: normalizeAssetUrl(item.author.avatarUrl),
    coverUrl: normalizeAssetUrl(item.coverUrl),
    resourceType: "工作流",
    sourceKind: "workflow_inventory",
    likes: item.likeCount ?? 0,
    latestRank: 1_000_000 - index,
    keywords: normalizeKeywordList([item.allowCopy ? "可复制" : "占位", item.summary ?? "", item.title]),
    topicTokens: [item.allowCopy ? "copyable" : "placeholder"],
    filterGroup: "workflow"
  };
}

function dedupeFeaturedItems(items: FeaturedArchiveItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.href)) {
      return false;
    }

    seen.add(item.href);
    return true;
  });
}

function buildFeaturedPinnedOrder(
  slots: ApiFeaturedArchiveResponse["slots"]
): Partial<Record<FeaturedFilter, Map<string, number>>> {
  const map = new Map<FeaturedFilter, string>([
    ["all", "featured-all"],
    ["workflow", "featured-workflow"],
    ["video_prompt", "featured-video-prompt"],
    ["image_prompt", "featured-image-prompt"],
    ["activity", "featured-activity"]
  ]);
  const pinned: Partial<Record<FeaturedFilter, Map<string, number>>> = {};

  for (const [filter, slotKey] of map.entries()) {
    const slot = slots.find((item) => item.key === slotKey);
    if (!slot) {
      continue;
    }

    const order = new Map<string, number>();
    slot.items.forEach((item, index) => {
      const resolvedKey =
        item.itemType === "workflow" || item.contentKind === "workflow_work"
          ? "workflow"
          : item.itemType === "post" || item.contentKind === "post"
            ? "post"
            : item.promptModality === "video"
              ? "video_prompt"
              : "image_prompt";
      order.set(`${resolvedKey}:${item.targetId}`, index);
    });
    pinned[filter] = order;
  }

  return pinned;
}

function buildFeaturedArchiveItems(prompts: ApiPromptSummary[], workflows: ApiWorkflowSummary[]) {
  return dedupeFeaturedItems([
    ...prompts.map((item, index) => toPromptArchiveItem(item, index)),
    ...workflows.map((item, index) => toWorkflowArchiveItem(item, index))
  ]);
}

function buildFixedSecondaryOptions(
  items: FeaturedArchiveItem[],
  config: ReadonlyArray<{ id: string; label: string }>
) {
  return config.map((option) => ({
    id: option.id,
    label: option.label,
    count: option.id === SECONDARY_ALL_ID ? items.length : items.filter((item) => item.topicTokens.includes(option.id)).length
  }));
}

function buildPromptFacetOptionCounts(
  items: FeaturedArchiveItem[],
  config: ReadonlyArray<{ id: string; label: string }>
) {
  return config.map((option) => ({
    id: option.id,
    label: option.label,
    count: items.filter((item) => item.topicTokens.includes(option.id)).length
  }));
}

function FeaturedCard({
  item,
  backSource,
  currentRoute
}: {
  item: FeaturedArchiveItem;
  backSource: string;
  currentRoute: string;
}) {
  const router = useRouter();
  const { currentUser } = useCommunitySession();
  const imageUrl = normalizeAssetUrl(item.posterUrl) ?? normalizeAssetUrl(item.coverUrl);
  const previewUrl = normalizeAssetUrl(item.previewUrl);
  const isVideoMedia = Boolean(previewUrl);
  const isPromptLikeCard = item.likeTargetType === "prompt";
  const [liked, setLiked] = useState(item.viewerLiked ?? false);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [pending, startTransition] = useTransition();
  const {
    handlePreviewImmediateStart,
    handlePreviewStart,
    handlePreviewStop,
    isVideoReady,
    mediaRef,
    shouldLoadVideo,
    videoRef
  } =
    useInteractiveVideoPreview({
    enabled: isVideoMedia,
    loadOnViewport: false,
    unloadDelayMs: 1200,
    previewGroup: "featured-grid",
    previewStartDelayMs: 160
    });
  const cardHref = appendBackSource(item.href, backSource);

  useEffect(() => {
    setLiked(item.viewerLiked ?? false);
    setLikeCount(item.likes);
  }, [item.id, item.likes, item.viewerLiked]);

  function handleLikeClick(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!isPromptLikeCard) {
      return;
    }

    if (!currentUser) {
      router.push(`/login?redirectTo=${encodeURIComponent(currentRoute)}`);
      return;
    }

    const previousLiked = liked;
    const previousLikeCount = likeCount;
    const nextActive = !liked;

    setLiked(nextActive);
    setLikeCount((current) => Math.max(0, current + (nextActive ? 1 : -1)));

    startTransition(async () => {
      const result = await togglePromptLikeAction({
        promptId: item.id,
        active: nextActive
      });

      if (!result.ok) {
        setLiked(previousLiked);
        setLikeCount(previousLikeCount);
        console.warn(`[featured-card-like] ${result.message}`);
        return;
      }

      setLiked(result.view.viewerActions.liked);
      setLikeCount(result.view.stats.likeCount);
      router.refresh();
    });
  }

  return (
    <Link
      className={styles.card}
      data-filter-group={item.filterGroup}
      href={cardHref}
      id={getFeaturedCardAnchorId(item.id)}
      onBlur={handlePreviewStop}
      onFocus={handlePreviewImmediateStart}
      onMouseEnter={handlePreviewStart}
      onMouseLeave={handlePreviewStop}
    >
      {isVideoMedia && previewUrl ? (
        <span className={styles.cardMediaSlot} ref={mediaRef}>
          <span
            className={styles.cardMedia}
            style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
          />
          {shouldLoadVideo ? (
            <video
              ref={videoRef}
              className={`${styles.cardMediaVideo} ${isVideoReady ? styles.cardMediaVideoReady : ""}`}
              loop
              muted
              playsInline
              preload="metadata"
              src={previewUrl}
            />
          ) : null}
        </span>
      ) : imageUrl ? (
        <img
          alt={item.title}
          className={styles.cardMediaImage}
          decoding="async"
          draggable={false}
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 860px) 50vw, 33vw"
          src={imageUrl}
        />
      ) : (
        <span className={styles.cardMedia} />
      )}

      <span className={styles.cardShade} />
      <span className={styles.cardBadge}>{item.resourceType}</span>

      <span className={styles.cardFooter}>
        <strong className={styles.cardTitle}>{item.title}</strong>
        <span className={styles.cardMeta}>
          <span className={styles.cardAuthor}>
            <span className={styles.cardAvatar}>
              {item.authorAvatarUrl ? (
                <span className={styles.cardAvatarImage} style={{ backgroundImage: `url(${item.authorAvatarUrl})` }} />
              ) : (
                <span className={styles.cardAvatarFallback}>{getAvatarFallback(item.authorName)}</span>
              )}
            </span>
            <span className={styles.cardAuthorName}>{item.authorName}</span>
          </span>

          {isPromptLikeCard ? (
            <button
              aria-label={liked ? "取消点赞" : "点赞"}
              aria-pressed={liked}
              className={`${styles.cardMetricButton}${liked ? ` ${styles.cardMetricButtonActive}` : ""}`}
              disabled={pending}
              type="button"
              onClick={handleLikeClick}
            >
              <HeartIcon />
              <span>{formatCompactNumber(likeCount)}</span>
            </button>
          ) : (
            <span className={styles.cardMetric}>
              <HeartIcon />
              <span>{formatCompactNumber(item.likes)}</span>
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

function matchesFilterGroup(
  item: FeaturedArchiveItem,
  filter: FeaturedFilter,
  keyword: string,
  prefersPromptInventory: boolean,
  prefersWorkflowInventory: boolean
) {
  const matchesFilter =
    filter === "all"
      ? true
      : filter === "activity"
        ? false
        : item.filterGroup === filter;

  const haystack = `${item.title} ${item.authorName} ${item.keywords.join(" ")}`.toLowerCase();
  const matchesSearch = keyword.length === 0 ? true : haystack.includes(keyword);
  const hidesFeedPromptCards = prefersPromptInventory && item.sourceKind === "feed";
  const hidesFeedWorkflowCards = prefersWorkflowInventory && item.sourceKind === "feed";

  return matchesFilter && matchesSearch && !hidesFeedPromptCards && !hidesFeedWorkflowCards;
}

function buildWorkflowSecondaryOptions(items: FeaturedArchiveItem[]) {
  const options = buildFixedSecondaryOptions(items, WORKFLOW_SECONDARY_OPTIONS);
  return items.some((item) => item.topicTokens.length > 0) ? options : [];
}

function buildPromptFacetOptions(
  items: FeaturedArchiveItem[],
  activeFilter: FeaturedFilter,
  activeModelFilter: FeaturedPromptFacetValue,
  activeContentFilter: FeaturedPromptFacetValue
): FeaturedPromptFacetOptions | null {
  const definitions = getPromptFacetDefinitions(activeFilter);
  if (!definitions) {
    return null;
  }

  return {
    modelOptions: buildPromptFacetOptionCounts(items, definitions.modelOptions),
    contentOptions: buildPromptFacetOptionCounts(items, definitions.contentOptions)
  };
}

export function FeaturedArchivePage({
  feedItems,
  featuredSlots,
  prompts = [],
  lazyPromptInventoryUrl,
  workflows
}: {
  feedItems: HomeFeedCardView[];
  featuredSlots: ApiFeaturedArchiveResponse["slots"];
  prompts?: ApiPromptSummary[];
  lazyPromptInventoryUrl?: string;
  workflows: ApiWorkflowSummary[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearchParams = searchParams.toString();
  const actualRoute = `${pathname}${currentSearchParams ? `?${currentSearchParams}` : ""}`;
  const parsedUrlState = useMemo(() => parseFeaturedRouteState(searchParams), [currentSearchParams]);
  const canonicalUrlRoute = useMemo(() => buildFeaturedRoute(pathname, parsedUrlState), [pathname, parsedUrlState]);
  const [desiredRoute, setDesiredRoute] = useState<string | null>(null);
  const inFlightRouteRef = useRef<string | null>(null);
  const desiredRouteState = useMemo(
    () => (desiredRoute ? parseFeaturedRouteFromHref(pathname, desiredRoute) : null),
    [desiredRoute, pathname]
  );
  const effectiveRouteState = desiredRouteState ?? parsedUrlState;
  const activeFilter = effectiveRouteState.filter;
  const activeSort = effectiveRouteState.sort;
  const activeWorkflowSecondary = effectiveRouteState.workflowSecondary;
  const activeModelFilter = effectiveRouteState.model;
  const activeContentFilter = effectiveRouteState.content;
  const [promptInventory, setPromptInventory] = useState<ApiPromptSummary[]>(prompts);
  const [searchQuery, setSearchQuery] = useState(parsedUrlState.query);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ITEMS);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPromptInventory(prompts);
  }, [prompts]);

  useEffect(() => {
    if (!lazyPromptInventoryUrl || prompts.length > 0) {
      return;
    }

    const controller = new AbortController();

    void fetch(lazyPromptInventoryUrl, {
      method: "GET",
      cache: "force-cache",
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`featured prompt inventory fetch failed: ${response.status}`);
        }

        return (await response.json()) as {
          items?: ApiPromptSummary[];
        };
      })
      .then((payload) => {
        if (controller.signal.aborted) {
          return;
        }

        setPromptInventory(Array.isArray(payload.items) ? payload.items : []);
      })
      .catch((error: unknown) => {
        if ((error as { name?: string } | null)?.name === "AbortError") {
          return;
        }

        console.warn("[featured-archive] failed to hydrate public prompt inventory", error);
      });

    return () => controller.abort();
  }, [lazyPromptInventoryUrl, prompts.length]);

  const replaceRoute = (
    state: {
      filter: FeaturedFilter;
      workflowSecondary: string;
      model: FeaturedPromptFacetValue;
      content: FeaturedPromptFacetValue;
      sort: FeaturedSort;
      query: string;
    }
  ) => {
    const nextRoute = buildFeaturedRoute(pathname, state);

    setDesiredRoute((current) => (current === nextRoute ? current : nextRoute));

    if (nextRoute === actualRoute) {
      inFlightRouteRef.current = null;
      return;
    }

    if (inFlightRouteRef.current) {
      return;
    }

    inFlightRouteRef.current = nextRoute;
    router.replace(nextRoute, { scroll: false });
  };

  const handleFilterChange = (nextFilter: FeaturedFilter) => {
    if (nextFilter === activeFilter) {
      return;
    }

    replaceRoute({
      filter: nextFilter,
      workflowSecondary: SECONDARY_ALL_ID,
      model: null,
      content: null,
      sort: activeSort,
      query: searchQuery
    });
  };

  const handleWorkflowSecondaryFilterChange = (nextSecondaryFilter: string) => {
    if (nextSecondaryFilter === activeWorkflowSecondary) {
      return;
    }

    replaceRoute({
      filter: activeFilter,
      workflowSecondary: nextSecondaryFilter,
      model: null,
      content: null,
      sort: activeSort,
      query: searchQuery
    });
  };

  const handleModelFilterChange = (nextModelFilter: string) => {
    replaceRoute({
      filter: activeFilter,
      workflowSecondary: SECONDARY_ALL_ID,
      model: activeModelFilter === nextModelFilter ? null : nextModelFilter,
      content: activeContentFilter,
      sort: activeSort,
      query: searchQuery
    });
  };

  const handleContentFilterChange = (nextContentFilter: string) => {
    replaceRoute({
      filter: activeFilter,
      workflowSecondary: SECONDARY_ALL_ID,
      model: activeModelFilter,
      content: activeContentFilter === nextContentFilter ? null : nextContentFilter,
      sort: activeSort,
      query: searchQuery
    });
  };

  const handleSortChange = (nextSort: FeaturedSort) => {
    if (nextSort === activeSort) {
      return;
    }

    replaceRoute({
      filter: activeFilter,
      workflowSecondary: activeWorkflowSecondary,
      model: activeModelFilter,
      content: activeContentFilter,
      sort: nextSort,
      query: searchQuery
    });
  };

  const featuredArchiveItems = useMemo(() => {
    const indexed = toIndexedContentCards(feedItems)
      .map((item, index): FeaturedArchiveItem => ({
        id: item.id,
        title: compactText(item.title, "未命名内容", 30),
        href:
          item.contentKind === "post"
            ? item.href
            : item.href,
        authorName: compactText(item.author.displayName, "DramaTV Creator", 18),
        authorAvatarUrl: normalizeAssetUrl(item.author.avatarUrl),
        coverUrl: normalizeAssetUrl(item.coverUrl),
        posterUrl: normalizeAssetUrl(item.posterUrl),
        previewUrl: normalizeAssetUrl(item.previewUrl),
        sourceUrl: normalizeAssetUrl(item.sourceUrl),
        resourceType: getResourceLabel(item.contentKind, item.promptModality),
        sourceKind: "feed",
        promptModality: item.promptModality,
        likeTargetType: item.contentKind === "prompt" ? "prompt" : undefined,
        viewerLiked: false,
        likes: item.secondaryMetric,
        latestRank: 500_000 - index,
        keywords: normalizeKeywordList([
          item.contentKind === "workflow_work"
            ? "工作流"
            : item.promptModality === "video"
              ? "视频提示词"
              : "图片提示词",
          item.workflowTitle ?? "",
          item.summary ?? "",
          item.title
        ]),
        topicTokens: [],
        filterGroup: getIndexedFilterGroup(item)
      }));

    const promptItems = promptInventory.map((item, index) => toPromptArchiveItem(item, index));
    const workflowItems = workflows.map((item, index) => toWorkflowArchiveItem(item, index));
    const liveItems = dedupeFeaturedItems([...promptItems, ...workflowItems, ...indexed]);

    return liveItems.length > 0 ? liveItems : buildFeaturedArchiveItems(promptInventory, workflows);
  }, [feedItems, promptInventory, workflows]);

  const pinnedOrderByFilter = useMemo(() => buildFeaturedPinnedOrder(featuredSlots), [featuredSlots]);

  useEffect(() => {
    if (inFlightRouteRef.current === actualRoute) {
      inFlightRouteRef.current = null;
    }
  }, [actualRoute]);

  useEffect(() => {
    setDesiredRoute((current) => (current === actualRoute ? null : current));
  }, [actualRoute]);

  useEffect(() => {
    if (!desiredRoute || desiredRoute === actualRoute || inFlightRouteRef.current) {
      return;
    }

    inFlightRouteRef.current = desiredRoute;
    router.replace(desiredRoute, { scroll: false });
  }, [actualRoute, desiredRoute, router]);

  useEffect(() => {
    if (actualRoute === canonicalUrlRoute || desiredRoute || inFlightRouteRef.current) {
      return;
    }

    inFlightRouteRef.current = canonicalUrlRoute;
    router.replace(canonicalUrlRoute, { scroll: false });
  }, [actualRoute, canonicalUrlRoute, desiredRoute, router]);

  useEffect(() => {
    const nextQuery = desiredRouteState?.query ?? parsedUrlState.query;
    setSearchQuery((current) => (current === nextQuery ? current : nextQuery));
  }, [desiredRouteState?.query, parsedUrlState.query]);

  const effectivePromptFacetSelection = useMemo(
    () => resolvePromptFacetSelection(activeFilter, activeModelFilter, activeContentFilter),
    [activeContentFilter, activeFilter, activeModelFilter]
  );

  const keyword = deferredSearchQuery.trim().toLowerCase();
  const prefersPromptInventory =
    (activeFilter === "image_prompt" || activeFilter === "video_prompt") && promptInventory.length > 0;
  const prefersWorkflowInventory = activeFilter === "workflow" && workflows.length > 0;

  const primaryPool = useMemo(
    () =>
      featuredArchiveItems.filter((item) =>
        matchesFilterGroup(item, activeFilter, keyword, prefersPromptInventory, prefersWorkflowInventory)
      ),
    [activeFilter, featuredArchiveItems, keyword, prefersPromptInventory, prefersWorkflowInventory]
  );

  const workflowSecondaryOptions = useMemo(
    () => (activeFilter === "workflow" ? buildWorkflowSecondaryOptions(primaryPool) : []),
    [activeFilter, primaryPool]
  );

  const promptFacetOptions = useMemo(
    () =>
      buildPromptFacetOptions(
        primaryPool,
        activeFilter,
        effectivePromptFacetSelection.model,
        effectivePromptFacetSelection.content
      ),
    [activeFilter, effectivePromptFacetSelection.content, effectivePromptFacetSelection.model, primaryPool]
  );

  useEffect(() => {
    const routeQuery = desiredRouteState?.query ?? parsedUrlState.query;
    if (searchQuery === routeQuery) {
      return;
    }

    replaceRoute({
      filter: activeFilter,
      workflowSecondary: activeWorkflowSecondary,
      model: effectivePromptFacetSelection.model,
      content: effectivePromptFacetSelection.content,
      sort: activeSort,
      query: searchQuery
    });
  }, [
    activeFilter,
    activeSort,
    activeWorkflowSecondary,
    desiredRouteState?.query,
    effectivePromptFacetSelection.content,
    effectivePromptFacetSelection.model,
    parsedUrlState.query,
    searchQuery
  ]);

  const visibleItems = useMemo(() => {
    const filteredBySecondary = primaryPool.filter((item) => {
      if (activeFilter === "workflow") {
        return activeWorkflowSecondary === SECONDARY_ALL_ID
          ? true
          : item.topicTokens.includes(activeWorkflowSecondary);
      }

      const matchesModel = effectivePromptFacetSelection.model
        ? item.topicTokens.includes(effectivePromptFacetSelection.model)
        : true;
      const matchesContent = effectivePromptFacetSelection.content
        ? item.topicTokens.includes(effectivePromptFacetSelection.content)
        : true;

      return matchesModel && matchesContent;
    });

    const pinnedOrder = pinnedOrderByFilter[activeFilter];
    const withPinnedRank = filteredBySecondary.map((item) => {
      const key =
        item.filterGroup === "workflow"
          ? `workflow:${item.id}`
          : item.filterGroup === "activity"
            ? `post:${item.id}`
            : `${item.filterGroup}:${item.id}`;
      return {
        ...item,
        pinnedRank: pinnedOrder?.get(key)
      };
    });

    return [...withPinnedRank].sort((left, right) => {
      const leftPinned = typeof left.pinnedRank === "number";
      const rightPinned = typeof right.pinnedRank === "number";

      if (leftPinned && rightPinned) {
        return (left.pinnedRank ?? 0) - (right.pinnedRank ?? 0);
      }

      if (leftPinned) {
        return -1;
      }

      if (rightPinned) {
        return 1;
      }

      return activeSort === "hot"
        ? right.likes - left.likes || right.latestRank - left.latestRank
        : right.latestRank - left.latestRank || right.likes - left.likes;
    });
  }, [
    activeFilter,
    activeSort,
    activeWorkflowSecondary,
    effectivePromptFacetSelection.content,
    effectivePromptFacetSelection.model,
    pinnedOrderByFilter,
    primaryPool
  ]);

  const filterCounts = useMemo<Record<FeaturedFilter, number>>(() => {
    const keyword = deferredSearchQuery.trim().toLowerCase();

    return {
      all: featuredArchiveItems.filter((item) => {
        const prefersPromptInventory =
          (item.filterGroup === "image_prompt" || item.filterGroup === "video_prompt") && promptInventory.length > 0;
        const prefersWorkflowInventory = item.filterGroup === "workflow" && workflows.length > 0;

        return matchesFilterGroup(item, "all", keyword, prefersPromptInventory, prefersWorkflowInventory);
      }).length,
      workflow: featuredArchiveItems.filter((item) =>
        matchesFilterGroup(item, "workflow", keyword, false, workflows.length > 0)
      ).length,
      video_prompt: featuredArchiveItems.filter((item) =>
        matchesFilterGroup(item, "video_prompt", keyword, promptInventory.length > 0, false)
      ).length,
      image_prompt: featuredArchiveItems.filter((item) =>
        matchesFilterGroup(item, "image_prompt", keyword, promptInventory.length > 0, false)
      ).length,
      activity: 0
    };
  }, [deferredSearchQuery, featuredArchiveItems, promptInventory.length, workflows.length]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ITEMS);
  }, [
    activeFilter,
    activeSort,
    activeWorkflowSecondary,
    effectivePromptFacetSelection.content,
    effectivePromptFacetSelection.model,
    searchQuery,
    featuredArchiveItems.length
  ]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleCount >= visibleItems.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) {
          return;
        }

        setVisibleCount((current) => Math.min(current + VISIBLE_ITEMS_STEP, visibleItems.length));
      },
      {
        rootMargin: "560px 0px"
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, visibleItems.length]);

  const currentRoute = useMemo(
    () =>
      buildFeaturedRoute(pathname, {
        filter: activeFilter,
        workflowSecondary: activeWorkflowSecondary,
        model: effectivePromptFacetSelection.model,
        content: effectivePromptFacetSelection.content,
        sort: activeSort,
        query: searchQuery
      }),
    [
      activeFilter,
      activeSort,
      activeWorkflowSecondary,
      effectivePromptFacetSelection.content,
      effectivePromptFacetSelection.model,
      pathname,
      searchQuery
    ]
  );
  const renderedItems = useMemo(() => visibleItems.slice(0, visibleCount), [visibleCount, visibleItems]);
  const hashAnchorId = useBackAnchorRestore([renderedItems.length, visibleItems.length]);
  const hashAnchorIndex = useMemo(
    () => (hashAnchorId ? visibleItems.findIndex((item) => getFeaturedCardAnchorId(item.id) === hashAnchorId) : -1),
    [hashAnchorId, visibleItems]
  );

  useEffect(() => {
    if (hashAnchorIndex < 0) {
      return;
    }

    const requiredVisibleCount = Math.min(
      visibleItems.length,
      Math.max(INITIAL_VISIBLE_ITEMS, Math.ceil((hashAnchorIndex + 1) / VISIBLE_ITEMS_STEP) * VISIBLE_ITEMS_STEP)
    );

    setVisibleCount((current) => (current >= requiredVisibleCount ? current : requiredVisibleCount));
  }, [hashAnchorIndex, visibleItems.length]);

  return (
    <PageShell showHomeFloatingDock variant="home" topNavActive="featured">
      <div className={styles.page}>
        <section className={styles.toolbar}>
          <div className={styles.filterWrap}>
            <div className={styles.filterGroup}>
              {FILTER_OPTIONS.map((option) => (
                <button
                  className={activeFilter === option.id ? styles.filterChipActive : styles.filterChip}
                  key={option.id}
                  onClick={() => handleFilterChange(option.id)}
                  type="button"
                >
                  <span className={styles.filterChipLabel}>{option.label}</span>
                  <span className={styles.filterChipCount}>{filterCounts[option.id].toLocaleString("zh-CN")}</span>
                </button>
              ))}
            </div>
          </div>

          <label className={styles.searchField}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索提示词、作者或工作流..."
              type="search"
              value={searchQuery}
            />
          </label>

          <div className={styles.sortGroup}>
            {SORT_OPTIONS.map((option) => (
              <button
                className={activeSort === option.id ? styles.sortChipActive : styles.sortChip}
                key={option.id}
                onClick={() => handleSortChange(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {workflowSecondaryOptions.length > 0 ? (
          <section className={styles.secondarySection}>
            <div className={styles.secondaryGroup}>
              {workflowSecondaryOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={activeWorkflowSecondary === option.id ? styles.secondaryChipActive : styles.secondaryChip}
                  onClick={() => handleWorkflowSecondaryFilterChange(option.id)}
                >
                  <span className={styles.secondaryChipLabel}>{option.label}</span>
                  <span className={styles.secondaryChipCount}>{option.count.toLocaleString("zh-CN")}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {promptFacetOptions ? (
          <section className={styles.secondarySection}>
            <div className={styles.secondaryPromptGroup}>
              <div className={styles.secondaryFacetGroup}>
                {promptFacetOptions.modelOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={effectivePromptFacetSelection.model === option.id ? styles.secondaryChipActive : styles.secondaryChip}
                    onClick={() => handleModelFilterChange(option.id)}
                  >
                    <span className={styles.secondaryChipLabel}>{option.label}</span>
                    <span className={styles.secondaryChipCount}>{option.count.toLocaleString("zh-CN")}</span>
                  </button>
                ))}
              </div>

              <span aria-hidden="true" className={styles.secondaryDivider} />

              <div className={styles.secondaryFacetGroup}>
                {promptFacetOptions.contentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={effectivePromptFacetSelection.content === option.id ? styles.secondaryChipActive : styles.secondaryChip}
                    onClick={() => handleContentFilterChange(option.id)}
                  >
                    <span className={styles.secondaryChipLabel}>{option.label}</span>
                    <span className={styles.secondaryChipCount}>{option.count.toLocaleString("zh-CN")}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {visibleItems.length > 0 ? (
          <section className={styles.contentSection}>
            <div className={styles.contentGrid}>
              {renderedItems.map((item) => (
                <FeaturedCard
                  backSource={`${currentRoute}#${getFeaturedCardAnchorId(item.id)}`}
                  currentRoute={currentRoute}
                  item={item}
                  key={item.id}
                />
              ))}
            </div>
            {renderedItems.length < visibleItems.length ? (
              <div className={styles.loadMoreSentinel} ref={loadMoreRef}>
                <span className={styles.loadMoreText}>继续加载更多内容...</span>
              </div>
            ) : null}
          </section>
        ) : (
          <div className={styles.emptyState}>
            <strong>当前筛选下还没有内容</strong>
            <p>可以切换分类、修改搜索词，或者返回全部继续浏览。</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
