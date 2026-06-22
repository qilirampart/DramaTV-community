"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type SyntheticEvent
} from "react";
import { useCommunitySession } from "@/components/shared/CommunitySessionProvider";
import { PageShell } from "@/components/shared/PageShell";
import { RouteVideoLoading } from "@/components/shared/RouteVideoLoading";
import { useInteractiveVideoPreview } from "@/components/shared/useInteractiveVideoPreview";
import { togglePromptLikeAction } from "@/features/community-interactions/actions";
import type {
  ApiFeaturedArchiveResponse,
  ApiFeaturedInventoryFilter,
  ApiFeaturedInventoryItem,
  ApiFeaturedInventoryResponse,
  ApiFeaturedWorkflowInventoryType
} from "@/lib/contracts/community-api";
import {
  FEATURED_INVENTORY_SESSION_CACHE_STORAGE_KEY,
  parseFeaturedInventorySessionCache,
  readFeaturedInventoryMemoryCache,
  serializeFeaturedInventorySessionCache,
  writeFeaturedInventoryMemoryCache,
  type FeaturedInventorySessionCacheEntry
} from "@/lib/featured/featured-inventory-session-cache";
import {
  FEATURED_HASH_ROUTE_SNAPSHOT_STORAGE_KEY,
  parseFeaturedHashRouteSnapshot,
  serializeFeaturedHashRouteSnapshot,
  type FeaturedHashRouteSnapshotMasonryState
} from "@/lib/featured/featured-hash-route-snapshot";
import {
  FEATURED_CARD_ANCHOR_PREFIX,
  getFeaturedCardAnchorId,
  isFeaturedCardAnchor,
  shouldAutoLoadFeaturedBackAnchor,
  shouldForceFeaturedBackAnchorRestore,
  shouldShowFeaturedBackAnchorRestoreOverlay
} from "@/lib/featured/featured-back-anchor";
import { shouldAutoCommitBufferedFeaturedPage } from "@/lib/featured/featured-buffered-commit";
import {
  mergeCuratedFeaturedItems,
  shouldUseCuratedFeaturedItems,
  type FeaturedCuratedItemsByFilter
} from "@/lib/featured/featured-curation";
import {
  serializeFeaturedInventoryQuery,
  type FeaturedInventoryQuery
} from "@/lib/featured/featured-inventory-query";
import { resolveCardVideoPlaybackUrl } from "@/lib/media-playback";
import { normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import { useBackAnchorRestore, useStoredRouteScrollRestore } from "@/lib/routes/back-anchor";
import { appendBackSource } from "@/lib/routes/redirect-utils";
import {
  IMAGE_PROMPT_CONTENT_OPTIONS,
  IMAGE_PROMPT_MODEL_OPTIONS,
  VIDEO_PROMPT_CONTENT_OPTIONS,
  VIDEO_PROMPT_MODEL_OPTIONS
} from "@/lib/taxonomy/prompt-taxonomy";
import styles from "./FeaturedArchivePage.module.css";

type FeaturedFilter = ApiFeaturedInventoryFilter;
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
  width?: number;
  height?: number;
  resourceType: FeaturedResourceType;
  promptModality?: "image" | "video";
  allowCopy?: boolean;
  likeTargetType?: "prompt";
  viewerLiked?: boolean;
  likes: number;
  sortRank: number;
  keywords: string[];
  topicTokens: string[];
  filterGroup: Exclude<FeaturedFilter, "all">;
};

type FeaturedLayoutBucket = "portrait" | "square" | "landscape" | "wide";

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

type FeaturedInventoryCacheEntry = {
  summary: ApiFeaturedInventoryResponse["summary"];
  items: ApiFeaturedInventoryItem[];
  nextCursor: string | null;
  hasMore: boolean;
  hasLoaded: boolean;
  isLoading: boolean;
  loadMoreError: boolean;
};

type FeaturedRenderedCard = {
  item: FeaturedArchiveItem;
  itemKey: string;
  bucket: FeaturedLayoutBucket;
  aspectRatio: number;
};

type FeaturedInventoryBufferedPage = {
  summary: ApiFeaturedInventoryResponse["summary"];
  items: ApiFeaturedInventoryItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

type FeaturedRouteState = ReturnType<typeof parseFeaturedRouteState>;

type FeaturedMasonryAssignmentsState = {
  routeKey: string;
  columnCount: number;
  orderedKeys: string[];
  assignments: Record<string, number>;
};

type FeaturedSnapshotRestoreState = {
  routeKey: string | null;
  phase: "idle" | "restoring-list" | "restoring-layout" | "restoring-viewport" | "completed";
};

type FeaturedRestoreCandidate = {
  source: "route-snapshot" | "memory-cache" | "session-cache";
  entry: FeaturedInventorySessionCacheEntry;
  aspectRatioEntries?: Record<string, number>;
  masonryAssignments?: FeaturedHashRouteSnapshotMasonryState;
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

const SECONDARY_ALL_ID = "all";
const EMPTY_FEATURED_SUMMARY: ApiFeaturedInventoryResponse["summary"] = {
  counts: {
    all: 0,
    workflow: 0,
    videoPrompt: 0,
    imagePrompt: 0,
    activity: 0
  },
  workflowFacets: {
    copyable: 0,
    placeholder: 0
  },
  videoPromptFacets: {
    modelCounts: {},
    contentCounts: {}
  },
  imagePromptFacets: {
    modelCounts: {},
    contentCounts: {}
  }
};
const EMPTY_FEATURED_INVENTORY: ApiFeaturedInventoryResponse = {
  summary: EMPTY_FEATURED_SUMMARY,
  page: {
    items: [],
    nextCursor: null,
    hasMore: false
  }
};
const FEATURED_PREWARM_VIDEO_CARD_LIMIT = 6;
const FEATURED_PREFETCH_TRIGGER_DISTANCE_PX = 1100;
const FEATURED_BUFFER_COMMIT_DISTANCE_PX = 520;
const FEATURED_ASPECT_RATIO_SESSION_CACHE_STORAGE_KEY = "dramatv:featured-aspect-ratios:v1";
const FEATURED_ASPECT_RATIO_SESSION_CACHE_VERSION = 1;
const FEATURED_ASPECT_RATIO_SESSION_CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const FEATURED_LAYOUT_BUCKET_RATIO_FALLBACKS: Record<FeaturedLayoutBucket, number> = {
  portrait: 3 / 4,
  square: 1,
  landscape: 4 / 3,
  wide: 16 / 9
};
const FEATURED_LAYOUT_BUCKET_CLASS_NAMES: Record<FeaturedLayoutBucket, string> = {
  portrait: styles.cardPortrait,
  square: styles.cardSquare,
  landscape: styles.cardLandscape,
  wide: styles.cardWide
};
const FEATURED_DEFAULT_COLUMN_COUNT = 3;
const EMPTY_FEATURED_MASONRY_ASSIGNMENTS: FeaturedMasonryAssignmentsState = {
  routeKey: "",
  columnCount: FEATURED_DEFAULT_COLUMN_COUNT,
  orderedKeys: [],
  assignments: {}
};

const EMPTY_FEATURED_SNAPSHOT_RESTORE_STATE: FeaturedSnapshotRestoreState = {
  routeKey: null,
  phase: "idle"
};

const WORKFLOW_SECONDARY_OPTIONS = [
  { id: SECONDARY_ALL_ID, label: "全部工作流" },
  { id: "copyable", label: "可复制" },
  { id: "placeholder", label: "占位" }
] as const;

const FEATURED_PROMPT_MODEL_LABEL_BY_ID = new Map<string, string>(
  [...IMAGE_PROMPT_MODEL_OPTIONS, ...VIDEO_PROMPT_MODEL_OPTIONS].map((option) => [option.id, option.label])
);

const FEATURED_PROMPT_CONTENT_LABEL_BY_ID = new Map<string, string>(
  [...IMAGE_PROMPT_CONTENT_OPTIONS, ...VIDEO_PROMPT_CONTENT_OPTIONS].map((option) => [option.id, option.label])
);

function dedupeFeaturedInventoryItems(items: ApiFeaturedInventoryItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.itemType}:${item.targetId}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function createFeaturedInventoryCacheEntry(
  inventory: ApiFeaturedInventoryResponse,
  overrides: Partial<Pick<FeaturedInventoryCacheEntry, "hasLoaded" | "isLoading">> = {}
): FeaturedInventoryCacheEntry {
  return {
    summary: inventory.summary ?? EMPTY_FEATURED_SUMMARY,
    items: dedupeFeaturedInventoryItems(inventory.page?.items ?? []),
    nextCursor: inventory.page?.nextCursor ?? null,
    hasMore: inventory.page?.hasMore ?? false,
    hasLoaded: overrides.hasLoaded ?? true,
    isLoading: overrides.isLoading ?? false,
    loadMoreError: false
  };
}

function createFeaturedInventoryCacheEntryFromSession(
  entry: FeaturedInventorySessionCacheEntry
): FeaturedInventoryCacheEntry {
  return {
    summary: entry.summary ?? EMPTY_FEATURED_SUMMARY,
    items: dedupeFeaturedInventoryItems(entry.items ?? []),
    nextCursor: entry.nextCursor ?? null,
    hasMore: entry.hasMore,
    hasLoaded: entry.hasLoaded,
    isLoading: false,
    loadMoreError: false
  };
}

function toFeaturedInventorySessionCacheEntry(
  entry: FeaturedInventoryCacheEntry
): FeaturedInventorySessionCacheEntry | null {
  if (!entry.hasLoaded) {
    return null;
  }

  return {
    summary: entry.summary,
    items: entry.items,
    nextCursor: entry.nextCursor ?? null,
    hasMore: entry.hasMore,
    hasLoaded: true
  };
}

function buildFeaturedInventoryQuery(input: {
  filter: FeaturedFilter;
  sort: FeaturedSort;
  query: string;
  workflowSecondary: string;
  model: FeaturedPromptFacetValue;
  content: FeaturedPromptFacetValue;
}): FeaturedInventoryQuery {
  return {
    filter: input.filter,
    sort: input.sort,
    q: input.query.trim() || undefined,
    workflowType:
      input.filter === "workflow" && input.workflowSecondary !== SECONDARY_ALL_ID
        ? (input.workflowSecondary as ApiFeaturedWorkflowInventoryType)
        : undefined,
    modelCategory:
      input.filter === "video_prompt" || input.filter === "image_prompt" ? input.model ?? undefined : undefined,
    contentCategory:
      input.filter === "video_prompt" || input.filter === "image_prompt" ? input.content ?? undefined : undefined
  };
}

function buildFeaturedInventoryCacheKey(query: FeaturedInventoryQuery) {
  return serializeFeaturedInventoryQuery(query);
}

async function requestFeaturedInventoryPage(
  endpoint: string,
  query: FeaturedInventoryQuery & { cursor?: string | null },
  signal?: AbortSignal
): Promise<ApiFeaturedInventoryResponse> {
  const queryString = serializeFeaturedInventoryQuery({
    ...query,
    cursor: query.cursor ?? undefined
  });
  const requestUrl = queryString.length > 0 ? `${endpoint}?${queryString}` : endpoint;
  const response = await fetch(requestUrl, {
    method: "GET",
    cache: "force-cache",
    signal,
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`featured prompt inventory fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    summary?: ApiFeaturedInventoryResponse["summary"];
    page?: ApiFeaturedInventoryResponse["page"];
  };

  return {
    summary: payload.summary ?? EMPTY_FEATURED_SUMMARY,
    page: {
      items: payload.page?.items ?? [],
      nextCursor: payload.page?.nextCursor ?? null,
      hasMore: payload.page?.hasMore ?? false
    }
  };
}

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
  return SORT_OPTIONS.some((option) => option.id === value) ? (value as FeaturedSort) : "hot";
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

  if (state.sort !== "hot") {
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

function getFeaturedItemKey(item: Pick<FeaturedArchiveItem, "filterGroup" | "id">) {
  return `${item.filterGroup}:${item.id}`;
}

function getFeaturedRestoreAnchorTargetId(anchorId: string | null | undefined) {
  if (!isFeaturedCardAnchor(anchorId)) {
    return null;
  }

  return anchorId ? anchorId.slice(FEATURED_CARD_ANCHOR_PREFIX.length) : null;
}

function featuredRestoreEntryContainsTargetId(
  entry: Pick<FeaturedInventorySessionCacheEntry, "items">,
  targetId: string | null
) {
  if (!targetId) {
    return true;
  }

  return entry.items.some((item) => item.targetId === targetId);
}

function choosePreferredFeaturedRestoreCandidate(
  candidates: FeaturedRestoreCandidate[],
  targetId: string | null
) {
  const sourcePriority: Record<FeaturedRestoreCandidate["source"], number> = {
    "route-snapshot": 3,
    "memory-cache": 2,
    "session-cache": 1
  };

  let bestCandidate: FeaturedRestoreCandidate | null = null;

  for (const candidate of candidates) {
    if (!candidate.entry.hasLoaded || candidate.entry.items.length === 0) {
      continue;
    }

    if (!bestCandidate) {
      bestCandidate = candidate;
      continue;
    }

    const candidateContainsTarget = featuredRestoreEntryContainsTargetId(candidate.entry, targetId);
    const bestContainsTarget = featuredRestoreEntryContainsTargetId(bestCandidate.entry, targetId);

    if (candidateContainsTarget !== bestContainsTarget) {
      if (candidateContainsTarget) {
        bestCandidate = candidate;
      }
      continue;
    }

    if (candidate.entry.items.length !== bestCandidate.entry.items.length) {
      if (candidate.entry.items.length > bestCandidate.entry.items.length) {
        bestCandidate = candidate;
      }
      continue;
    }

    if (sourcePriority[candidate.source] > sourcePriority[bestCandidate.source]) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function estimateFeaturedCardHeightScore(card: Pick<FeaturedRenderedCard, "aspectRatio">) {
  return 1 / Math.max(card.aspectRatio, 0.01);
}

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function startsWithSequence(candidate: string[], prefix: string[]) {
  if (prefix.length > candidate.length) {
    return false;
  }

  return prefix.every((value, index) => candidate[index] === value);
}

function createFeaturedMasonryAssignments(cards: FeaturedRenderedCard[], columnCount: number) {
  const nextAssignments: Record<string, number> = {};
  const columnHeights = Array.from({ length: columnCount }, () => 0);

  for (const card of cards) {
    let targetColumnIndex = 0;
    for (let index = 1; index < columnHeights.length; index += 1) {
      if (columnHeights[index] < columnHeights[targetColumnIndex]) {
        targetColumnIndex = index;
      }
    }

    nextAssignments[card.itemKey] = targetColumnIndex;
    columnHeights[targetColumnIndex] += estimateFeaturedCardHeightScore(card);
  }

  return nextAssignments;
}

function buildNextFeaturedMasonryAssignmentsState(input: {
  cards: FeaturedRenderedCard[];
  columnCount: number;
  currentRoute: string;
  previous: FeaturedMasonryAssignmentsState;
  forceReset?: boolean;
}): FeaturedMasonryAssignmentsState {
  const { cards, columnCount, currentRoute, previous, forceReset = false } = input;
  const orderedKeys = cards.map((card) => card.itemKey);
  const routeChanged = previous.routeKey !== currentRoute;
  const columnCountChanged = previous.columnCount !== columnCount;
  const shouldResetAssignments =
    forceReset || routeChanged || columnCountChanged || !startsWithSequence(orderedKeys, previous.orderedKeys);

  if (shouldResetAssignments) {
    return {
      routeKey: currentRoute,
      columnCount,
      orderedKeys,
      assignments: createFeaturedMasonryAssignments(cards, columnCount)
    };
  }

  if (arraysEqual(orderedKeys, previous.orderedKeys)) {
    return previous;
  }

  const nextAssignments = { ...previous.assignments };
  const appendedCards = cards.filter((card) => !(card.itemKey in nextAssignments));
  if (appendedCards.length === 0) {
    return previous.orderedKeys.length === orderedKeys.length ? previous : { ...previous, orderedKeys };
  }

  const columnHeights = Array.from({ length: columnCount }, () => 0);
  for (const card of cards) {
    const assignedColumnIndex = nextAssignments[card.itemKey];
    if (
      typeof assignedColumnIndex !== "number" ||
      assignedColumnIndex < 0 ||
      assignedColumnIndex >= columnHeights.length
    ) {
      continue;
    }

    columnHeights[assignedColumnIndex] += estimateFeaturedCardHeightScore(card);
  }

  for (const card of appendedCards) {
    let targetColumnIndex = 0;
    for (let index = 1; index < columnHeights.length; index += 1) {
      if (columnHeights[index] < columnHeights[targetColumnIndex]) {
        targetColumnIndex = index;
      }
    }

    nextAssignments[card.itemKey] = targetColumnIndex;
    columnHeights[targetColumnIndex] += estimateFeaturedCardHeightScore(card);
  }

  return {
    routeKey: currentRoute,
    columnCount,
    orderedKeys,
    assignments: nextAssignments
  };
}

function isValidFeaturedMasonryAssignmentsState(
  value: FeaturedHashRouteSnapshotMasonryState | null | undefined
): value is FeaturedMasonryAssignmentsState {
  if (!value) {
    return false;
  }

  if (!Number.isFinite(value.columnCount) || value.columnCount <= 0) {
    return false;
  }

  if (!Array.isArray(value.orderedKeys) || typeof value.assignments !== "object" || !value.assignments) {
    return false;
  }

  return value.orderedKeys.every((itemKey) => typeof itemKey === "string") && Object.values(value.assignments).every((column) => {
    return typeof column === "number" && Number.isFinite(column) && column >= 0 && column < value.columnCount;
  });
}


function deriveFeaturedColumnCount(viewportWidth: number) {
  if (viewportWidth <= 520) {
    return 1;
  }

  if (viewportWidth <= 860) {
    return 2;
  }

  return 3;
}

function normalizeMeasuredAspectRatio(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return null;
  }

  return Math.min(2.4, Math.max(0.6, value));
}

function normalizeMediaDimension(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function resolveFeaturedBackendAspectRatio(item: Pick<FeaturedArchiveItem, "width" | "height">) {
  const width = normalizeMediaDimension(item.width);
  const height = normalizeMediaDimension(item.height);
  return width && height ? normalizeMeasuredAspectRatio(width / height) : null;
}

function classifyFeaturedLayoutBucketFromAspectRatio(aspectRatio: number): FeaturedLayoutBucket {
  if (aspectRatio >= 1.72) {
    return "wide";
  }

  if (aspectRatio >= 1.15) {
    return "landscape";
  }

  if (aspectRatio >= 0.88) {
    return "square";
  }

  return "portrait";
}

const EMPTY_FEATURED_ASPECT_RATIO_MAP: Record<string, number> = Object.freeze({});

function parseFeaturedAspectRatioSessionCache(
  raw: string | null,
  now = Date.now()
): Record<string, number> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as {
      version?: number;
      storedAt?: number;
      entries?: Record<string, number>;
    };

    if (
      parsed.version !== FEATURED_ASPECT_RATIO_SESSION_CACHE_VERSION ||
      !Number.isFinite(parsed.storedAt) ||
      now - Number(parsed.storedAt) > FEATURED_ASPECT_RATIO_SESSION_CACHE_MAX_AGE_MS ||
      !parsed.entries ||
      typeof parsed.entries !== "object"
    ) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed.entries).flatMap(([itemKey, aspectRatio]) => {
        const normalizedAspectRatio = normalizeMeasuredAspectRatio(aspectRatio);
        return normalizedAspectRatio ? [[itemKey, normalizedAspectRatio]] : [];
      })
    );
  } catch {
    return {};
  }
}

function serializeFeaturedAspectRatioSessionCache(
  entries: Record<string, number>,
  now = Date.now()
) {
  if (Object.keys(entries).length === 0) {
    return null;
  }

  return JSON.stringify({
    version: FEATURED_ASPECT_RATIO_SESSION_CACHE_VERSION,
    storedAt: now,
    entries
  });
}

function getFeaturedRemainingDistanceToBottom() {
  if (typeof window === "undefined") {
    return Number.POSITIVE_INFINITY;
  }

  return document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
}

function shouldAllowFeaturedBufferedCommit(force = false) {
  if (typeof window === "undefined") {
    return false;
  }

  if (force) {
    return true;
  }

  return getFeaturedRemainingDistanceToBottom() <= FEATURED_BUFFER_COMMIT_DISTANCE_PX;
}

function resolveFeaturedCardBucket(
  item: FeaturedArchiveItem,
  measuredAspectRatioByItemKey: Record<string, number> | undefined,
  fallbackIndex: number
): FeaturedLayoutBucket {
  const safeMeasuredAspectRatioByItemKey =
    measuredAspectRatioByItemKey ?? EMPTY_FEATURED_ASPECT_RATIO_MAP;
  const preferredAspectRatio =
    resolveFeaturedBackendAspectRatio(item) ??
    normalizeMeasuredAspectRatio(safeMeasuredAspectRatioByItemKey[getFeaturedItemKey(item)]);
  if (preferredAspectRatio) {
    return classifyFeaturedLayoutBucketFromAspectRatio(preferredAspectRatio);
  }

  if (item.filterGroup === "workflow") {
    return fallbackIndex % 2 === 0 ? "landscape" : "wide";
  }

  if (item.filterGroup === "activity") {
    return fallbackIndex % 2 === 0 ? "landscape" : "square";
  }

  if (item.promptModality === "video") {
    return fallbackIndex % 3 === 0 ? "wide" : "landscape";
  }

  return fallbackIndex % 3 === 0 ? "portrait" : fallbackIndex % 2 === 0 ? "square" : "portrait";
}

function resolveFeaturedCardAspectRatio(
  item: FeaturedArchiveItem,
  measuredAspectRatioByItemKey: Record<string, number> | undefined,
  fallbackIndex: number
) {
  const safeMeasuredAspectRatioByItemKey =
    measuredAspectRatioByItemKey ?? EMPTY_FEATURED_ASPECT_RATIO_MAP;
  const measuredAspectRatio = normalizeMeasuredAspectRatio(safeMeasuredAspectRatioByItemKey[getFeaturedItemKey(item)]);
  const backendAspectRatio = resolveFeaturedBackendAspectRatio(item);

  if (backendAspectRatio) {
    return backendAspectRatio;
  }

  if (measuredAspectRatio) {
    return measuredAspectRatio;
  }

  const bucket = resolveFeaturedCardBucket(item, measuredAspectRatioByItemKey, fallbackIndex);
  return FEATURED_LAYOUT_BUCKET_RATIO_FALLBACKS[bucket];
}

function getFeaturedItemProbeImageUrl(item: FeaturedArchiveItem) {
  return normalizeAssetUrl(item.posterUrl) ?? normalizeAssetUrl(item.coverUrl);
}

function shouldProbeFeaturedItemAspectRatio(item: FeaturedArchiveItem) {
  return Boolean(!resolveFeaturedBackendAspectRatio(item) && getFeaturedItemProbeImageUrl(item));
}

async function probeFeaturedImageAspectRatio(src: string): Promise<number | null> {
  return await new Promise<number | null>((resolve) => {
    const image = new Image();

    image.decoding = "async";
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        resolve(normalizeMeasuredAspectRatio(image.naturalWidth / image.naturalHeight));
        return;
      }

      resolve(null);
    };
    image.onerror = () => resolve(null);
    image.src = src;

    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      resolve(normalizeMeasuredAspectRatio(image.naturalWidth / image.naturalHeight));
    }
  });
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

function getInventoryFilterGroup(item: ApiFeaturedInventoryItem): FeaturedArchiveItem["filterGroup"] {
  if (item.itemType === "workflow" || item.contentKind === "workflow_work") {
    return "workflow";
  }

  if (item.itemType === "post" || item.contentKind === "post") {
    return "activity";
  }

  return item.promptModality === "video" ? "video_prompt" : "image_prompt";
}

function buildFeaturedItemHref(item: ApiFeaturedInventoryItem) {
  if (item.itemType === "workflow") {
    return `/workflows/${item.targetId}`;
  }

  if (item.itemType === "post") {
    if (item.targetSlug?.trim()) {
      return `/discussions/${item.targetSlug.trim()}`;
    }

    if (item.channelSlug?.trim()) {
      return `/discussions?channel=${encodeURIComponent(item.channelSlug.trim())}`;
    }

    return "/discussions";
  }

  return `/prompts/${item.targetId}`;
}

function getFeaturedItemTopicTokens(item: ApiFeaturedInventoryItem) {
  const filterGroup = getInventoryFilterGroup(item);
  if (filterGroup === "workflow") {
    if (typeof item.allowCopy !== "boolean") {
      return [];
    }

    return [item.allowCopy ? "copyable" : "placeholder"];
  }

  if (filterGroup === "activity") {
    return [];
  }

  return [...new Set([item.modelCategory, item.contentCategory].flatMap((token) => (token ? [token] : [])))];
}

function getFeaturedItemSearchTerms(item: ApiFeaturedInventoryItem, filterGroup: FeaturedArchiveItem["filterGroup"]) {
  return normalizeKeywordList([
    ...item.tagNames,
    item.summary ?? "",
    item.title,
    item.author.displayName,
    item.modelCategory ?? "",
    FEATURED_PROMPT_MODEL_LABEL_BY_ID.get(item.modelCategory ?? "") ?? "",
    item.contentCategory ?? "",
    FEATURED_PROMPT_CONTENT_LABEL_BY_ID.get(item.contentCategory ?? "") ?? "",
    item.promptModality === "video" ? "视频" : item.promptModality === "image" ? "图片" : "",
    filterGroup === "workflow" && typeof item.allowCopy === "boolean" ? (item.allowCopy ? "可复制" : "占位") : "",
    filterGroup === "workflow" ? "工作流" : "",
    filterGroup === "activity" ? "活动" : ""
  ]);
}

function toFeaturedArchiveItem(item: ApiFeaturedInventoryItem, index: number): FeaturedArchiveItem {
  const filterGroup = getInventoryFilterGroup(item);
  const keywords = getFeaturedItemSearchTerms(item, filterGroup);

  return {
    id: item.targetId,
    title: compactText(item.title, item.itemType === "workflow" ? "未命名工作流" : item.itemType === "post" ? "未命名活动" : "未命名提示词", 30),
    href: buildFeaturedItemHref(item),
    authorName: compactText(item.author.displayName, "DramaTV Creator", 18),
    authorAvatarUrl: normalizeAssetUrl(item.author.avatarUrl),
    coverUrl: normalizeAssetUrl(item.coverUrl),
    posterUrl: normalizeAssetUrl(item.posterUrl),
    previewUrl: normalizeAssetUrl(item.previewUrl),
    sourceUrl: normalizeAssetUrl(item.sourceUrl),
    width: normalizeMediaDimension(item.width),
    height: normalizeMediaDimension(item.height),
    resourceType: getResourceLabel(item.contentKind, item.promptModality),
    promptModality: filterGroup === "video_prompt" || filterGroup === "image_prompt" ? item.promptModality : undefined,
    allowCopy: filterGroup === "workflow" ? item.allowCopy : undefined,
    likeTargetType: item.itemType === "prompt" ? "prompt" : undefined,
    viewerLiked: item.viewerActions?.liked ?? false,
    likes: item.stats.likeCount ?? 0,
    sortRank: index,
    keywords,
    topicTokens: getFeaturedItemTopicTokens(item),
    filterGroup
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

function toFeaturedArchiveItemFromSlot(
  item: ApiFeaturedArchiveResponse["slots"][number]["items"][number],
  index: number
): FeaturedArchiveItem {
  const inventoryLikeItem: ApiFeaturedInventoryItem = {
    contentKind: item.contentKind,
    promptModality: item.promptModality,
    itemType: item.itemType === "video" ? "prompt" : item.itemType,
    targetId: item.targetId,
    targetSlug: item.targetSlug,
    channelSlug: item.channelSlug,
    title: item.title,
    summary: item.summary,
    coverUrl: item.coverUrl,
    posterUrl: item.posterUrl,
    previewUrl: item.previewUrl,
    sourceUrl: item.sourceUrl,
    width: item.width,
    height: item.height,
    author: item.author,
    stats: item.stats ?? {},
    tagNames: [],
    allowCopy: undefined
  };

  return toFeaturedArchiveItem(inventoryLikeItem, index);
}

function buildCuratedFeaturedItemsByFilter(
  slots: ApiFeaturedArchiveResponse["slots"]
): FeaturedCuratedItemsByFilter<FeaturedArchiveItem> {
  const slotKeyByFilter = new Map<FeaturedFilter, string>([
    ["all", "featured-all"],
    ["workflow", "featured-workflow"],
    ["video_prompt", "featured-video-prompt"],
    ["image_prompt", "featured-image-prompt"],
    ["activity", "featured-activity"]
  ]);
  const curatedItemsByFilter: FeaturedCuratedItemsByFilter<FeaturedArchiveItem> = {};

  for (const [filter, slotKey] of slotKeyByFilter.entries()) {
    const slot = slots.find((item) => item.key === slotKey);
    if (!slot) {
      continue;
    }

    curatedItemsByFilter[filter] = dedupeFeaturedItems(
      slot.items.map((item, index) => toFeaturedArchiveItemFromSlot(item, index))
    );
  }

  return curatedItemsByFilter;
}

function sortActivityCuratedItems(items: FeaturedArchiveItem[], sort: FeaturedSort) {
  if (sort !== "hot") {
    return items;
  }

  return [...items].sort((left, right) => {
    const likeCompare = right.likes - left.likes;
    if (likeCompare !== 0) {
      return likeCompare;
    }

    return left.sortRank - right.sortRank;
  });
}

function FeaturedCard({
  item,
  backSource,
  currentRoute,
  aspectRatio,
  bucket,
  onAspectRatioChange,
  prewarmInViewport = false,
}: {
  item: FeaturedArchiveItem;
  backSource: string;
  currentRoute: string;
  aspectRatio: number;
  bucket: FeaturedLayoutBucket;
  onAspectRatioChange?: (itemKey: string, aspectRatio: number) => void;
  prewarmInViewport?: boolean;
}) {
  const router = useRouter();
  const { currentUser } = useCommunitySession();
  const itemKey = getFeaturedItemKey(item);
  const mediaImageRef = useRef<HTMLImageElement | null>(null);
  const reportedAspectRatioRef = useRef<number | null>(null);
  const imageUrl = normalizeAssetUrl(item.posterUrl) ?? normalizeAssetUrl(item.coverUrl);
  const playbackUrl = resolveCardVideoPlaybackUrl({
    previewUrl: item.previewUrl,
    sourceUrl: item.sourceUrl,
    promptModality: item.promptModality,
    resourceType: item.filterGroup === "workflow" ? "workflow" : undefined,
    allowSourceFallback: false
  });
  const isVideoMedia = Boolean(playbackUrl);
  const isPromptLikeCard = item.likeTargetType === "prompt";
  const [imageFailed, setImageFailed] = useState(false);
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
  } = useInteractiveVideoPreview({
    enabled: isVideoMedia,
    loadOnViewport: prewarmInViewport,
    unloadDelayMs: 1200,
    previewGroup: "featured-grid",
    previewStartDelayMs: 160
  });
  const cardHref = appendBackSource(item.href, backSource);

  useEffect(() => {
    setLiked(item.viewerLiked ?? false);
    setLikeCount(item.likes);
  }, [item.id, item.likes, item.viewerLiked]);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl, item.id]);

  const reportAspectRatio = useEffectEvent((nextAspectRatio: number) => {
    if (!onAspectRatioChange) {
      return;
    }

    const normalizedAspectRatio = normalizeMeasuredAspectRatio(nextAspectRatio);
    if (!normalizedAspectRatio || reportedAspectRatioRef.current === normalizedAspectRatio) {
      return;
    }

    reportedAspectRatioRef.current = normalizedAspectRatio;
    onAspectRatioChange(itemKey, normalizedAspectRatio);
  });

  useEffect(() => {
    const imageElement = mediaImageRef.current;
    if (!imageElement || !imageElement.complete) {
      return;
    }

    if (imageElement.naturalWidth <= 0 || imageElement.naturalHeight <= 0) {
      return;
    }

    reportAspectRatio(imageElement.naturalWidth / imageElement.naturalHeight);
  }, [imageUrl, itemKey, reportAspectRatio]);

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

  function handleMediaImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const naturalWidth = event.currentTarget.naturalWidth;
    const naturalHeight = event.currentTarget.naturalHeight;

    if (naturalWidth <= 0 || naturalHeight <= 0) {
      return;
    }

    reportAspectRatio(naturalWidth / naturalHeight);
  }

  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <Link
      className={`${styles.card} ${FEATURED_LAYOUT_BUCKET_CLASS_NAMES[bucket]}`}
      data-layout-bucket={bucket}
      data-filter-group={item.filterGroup}
      href={cardHref}
      id={getFeaturedCardAnchorId(item.id)}
      prefetch={false}
      onBlur={handlePreviewStop}
      onFocus={handlePreviewImmediateStart}
      onMouseEnter={handlePreviewStart}
      onMouseLeave={handlePreviewStop}
      style={
        {
          "--featured-card-aspect-ratio": aspectRatio
        } as CSSProperties
      }
    >
      {isVideoMedia && playbackUrl ? (
        <span className={styles.cardMediaSlot} ref={mediaRef}>
          {showImage ? (
            <img
              alt={item.title}
              className={`${styles.cardMediaImage} ${styles.cardMediaHasImage}`}
              decoding="async"
              draggable={false}
              loading="lazy"
              onError={() => setImageFailed(true)}
              onLoad={handleMediaImageLoad}
              ref={mediaImageRef}
              sizes="(max-width: 640px) 100vw, (max-width: 860px) 50vw, 33vw"
              src={imageUrl}
            />
          ) : (
            <span className={styles.cardMedia} />
          )}
          {shouldLoadVideo ? (
            <video
              ref={videoRef}
              className={`${styles.cardMediaVideo} ${isVideoReady ? styles.cardMediaVideoReady : ""}`}
              loop
              muted
              playsInline
              preload="metadata"
              src={playbackUrl}
            />
          ) : null}
        </span>
      ) : showImage ? (
        <img
          alt={item.title}
          className={`${styles.cardMediaImage} ${styles.cardMediaHasImage}`}
          decoding="async"
          draggable={false}
          loading="lazy"
          onError={() => setImageFailed(true)}
          onLoad={handleMediaImageLoad}
          ref={mediaImageRef}
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
  keyword: string
) {
  const haystack = `${item.title} ${item.authorName} ${item.keywords.join(" ")} ${item.topicTokens.join(" ")}`.toLowerCase();
  return keyword.length === 0 ? true : haystack.includes(keyword);
}

function buildWorkflowSecondaryOptions(summary: ApiFeaturedInventoryResponse["summary"]) {
  return WORKFLOW_SECONDARY_OPTIONS.map((option) => ({
    id: option.id,
    label: option.label,
    count:
      option.id === SECONDARY_ALL_ID
        ? summary.counts.workflow
        : option.id === "copyable"
          ? summary.workflowFacets.copyable
          : summary.workflowFacets.placeholder
  }));
}

function buildPromptFacetOptions(
  summary: ApiFeaturedInventoryResponse["summary"],
  activeFilter: FeaturedFilter
): FeaturedPromptFacetOptions | null {
  const definitions = getPromptFacetDefinitions(activeFilter);
  if (!definitions) {
    return null;
  }

  const facetSummary =
    activeFilter === "video_prompt" ? summary.videoPromptFacets : summary.imagePromptFacets;

  return {
    modelOptions: definitions.modelOptions.map((option) => ({
      id: option.id,
      label: option.label,
      count: facetSummary.modelCounts[option.id] ?? 0
    })),
    contentOptions: definitions.contentOptions.map((option) => ({
      id: option.id,
      label: option.label,
      count: facetSummary.contentCounts[option.id] ?? 0
    }))
  };
}

function getFeaturedIdlePrefetchFilters(activeFilter: FeaturedFilter): FeaturedFilter[] {
  switch (activeFilter) {
    case "all":
      return ["video_prompt", "image_prompt"];
    case "video_prompt":
      return ["all", "image_prompt"];
    case "image_prompt":
      return ["all", "video_prompt"];
    case "workflow":
    case "activity":
      return ["all"];
    default:
      return [];
  }
}

export function FeaturedArchivePage({
  deferInitialInventory = false,
  featuredSlots,
  featuredInventory = EMPTY_FEATURED_INVENTORY,
  lazyFeaturedInventoryUrl
}: {
  deferInitialInventory?: boolean;
  featuredSlots: ApiFeaturedArchiveResponse["slots"];
  featuredInventory?: ApiFeaturedInventoryResponse;
  lazyFeaturedInventoryUrl?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearchParams = searchParams.toString();
  const actualRoute = `${pathname}${currentSearchParams ? `?${currentSearchParams}` : ""}`;
  const parsedUrlState = useMemo(() => parseFeaturedRouteState(searchParams), [currentSearchParams]);
  const canonicalUrlRoute = useMemo(() => buildFeaturedRoute(pathname, parsedUrlState), [pathname, parsedUrlState]);
  const [desiredRoute, setDesiredRoute] = useState<string | null>(null);
  const routeReleaseTimerRef = useRef<number | null>(null);
  const loadCursorInFlightRef = useRef<string | null>(null);
  const bufferedPageRef = useRef<FeaturedInventoryBufferedPage | null>(null);
  const bufferedPageKeyRef = useRef<string | null>(null);
  const softHashAnchorCenteredRouteRef = useRef<string | null>(null);
  const [bufferedPageVersion, setBufferedPageVersion] = useState(0);
  const desiredRouteState = useMemo(
    () => (desiredRoute ? parseFeaturedRouteFromHref(pathname, desiredRoute) : null),
    [desiredRoute, pathname]
  );
  const effectiveRouteState = desiredRouteState ?? parsedUrlState;
  const effectiveRouteStateRef = useRef<FeaturedRouteState>(effectiveRouteState);
  effectiveRouteStateRef.current = effectiveRouteState;
  const activeFilter = effectiveRouteState.filter;
  const activeSort = effectiveRouteState.sort;
  const activeWorkflowSecondary = effectiveRouteState.workflowSecondary;
  const activeModelFilter = effectiveRouteState.model;
  const activeContentFilter = effectiveRouteState.content;
  const [searchQuery, setSearchQuery] = useState(parsedUrlState.query);
  const [snapshotRestoreState, setSnapshotRestoreState] = useState<FeaturedSnapshotRestoreState>(
    EMPTY_FEATURED_SNAPSHOT_RESTORE_STATE
  );
  const [measuredAspectRatioByItemKey, setMeasuredAspectRatioByItemKey] = useState<Record<string, number>>({});
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const prefetchedFeaturedQueryKeysRef = useRef(new Set<string>());
  const prefetchInFlightQueryKeysRef = useRef(new Set<string>());
  const serverFeaturedInventoryQuery = useMemo(
    () =>
      buildFeaturedInventoryQuery({
        filter: parsedUrlState.filter,
        sort: parsedUrlState.sort,
        query: parsedUrlState.query,
        workflowSecondary: parsedUrlState.workflowSecondary,
        model: parsedUrlState.model,
        content: parsedUrlState.content
      }),
    [parsedUrlState]
  );
  const serverFeaturedInventoryCacheKey = useMemo(
    () => buildFeaturedInventoryCacheKey(serverFeaturedInventoryQuery),
    [serverFeaturedInventoryQuery]
  );
  const [featuredInventoryCache, setFeaturedInventoryCache] = useState<Record<string, FeaturedInventoryCacheEntry>>(
    () => {
      const initialCache: Record<string, FeaturedInventoryCacheEntry> = {
        [serverFeaturedInventoryCacheKey]: createFeaturedInventoryCacheEntry(featuredInventory, {
          hasLoaded: !deferInitialInventory,
          isLoading: false
        })
      };

      if (typeof window === "undefined") {
        return initialCache;
      }

      try {
        const memoryEntries = readFeaturedInventoryMemoryCache();
        for (const [cacheKey, entry] of Object.entries(memoryEntries)) {
          if (cacheKey === serverFeaturedInventoryCacheKey) {
            continue;
          }

          initialCache[cacheKey] = createFeaturedInventoryCacheEntryFromSession(entry);
        }

        const persistedEntries = parseFeaturedInventorySessionCache(
          window.sessionStorage.getItem(FEATURED_INVENTORY_SESSION_CACHE_STORAGE_KEY)
        );

        for (const [cacheKey, entry] of Object.entries(persistedEntries)) {
          if (cacheKey === serverFeaturedInventoryCacheKey) {
            continue;
          }

          initialCache[cacheKey] = createFeaturedInventoryCacheEntryFromSession(entry);
        }
      } catch {}

      return initialCache;
    }
  );
  const featuredInventoryQuery = useMemo(
    () =>
      buildFeaturedInventoryQuery({
        filter: activeFilter,
        sort: activeSort,
        query: effectiveRouteState.query,
        workflowSecondary: activeWorkflowSecondary,
        model: activeModelFilter,
        content: activeContentFilter
      }),
    [activeContentFilter, activeFilter, activeModelFilter, activeSort, activeWorkflowSecondary, effectiveRouteState.query]
  );
  const featuredInventoryCacheKey = useMemo(
    () => buildFeaturedInventoryCacheKey(featuredInventoryQuery),
    [featuredInventoryQuery]
  );
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const currentFeaturedInventoryEntry =
    featuredInventoryCache[featuredInventoryCacheKey] ??
    createFeaturedInventoryCacheEntry(EMPTY_FEATURED_INVENTORY, {
      hasLoaded: false,
      isLoading: false
    });
  const serverFeaturedInventoryEntry =
    featuredInventoryCache[serverFeaturedInventoryCacheKey] ??
    createFeaturedInventoryCacheEntry(featuredInventory, {
      hasLoaded: !deferInitialInventory,
      isLoading: false
    });
  const currentFeaturedInventorySummary =
    (currentFeaturedInventoryEntry.hasLoaded ? currentFeaturedInventoryEntry.summary : serverFeaturedInventoryEntry.summary) ??
    EMPTY_FEATURED_SUMMARY;

  const prefetchFeaturedInventory = useEffectEvent((query: FeaturedInventoryQuery) => {
    if (!lazyFeaturedInventoryUrl) {
      return;
    }

    const cacheKey = buildFeaturedInventoryCacheKey(query);
    const existingEntry = featuredInventoryCache[cacheKey];
      if (existingEntry?.hasLoaded || existingEntry?.isLoading || prefetchInFlightQueryKeysRef.current.has(cacheKey)) {
        return;
      }

    prefetchInFlightQueryKeysRef.current.add(cacheKey);
    setFeaturedInventoryCache((current) => {
      const existing = current[cacheKey];
      if (existing?.hasLoaded || existing?.isLoading) {
        return current;
      }

      return {
        ...current,
        [cacheKey]: existing
          ? {
              ...existing,
              isLoading: true
            }
          : createFeaturedInventoryCacheEntry(EMPTY_FEATURED_INVENTORY, {
              hasLoaded: false,
              isLoading: true
            })
      };
    });

    void requestFeaturedInventoryPage(lazyFeaturedInventoryUrl, query)
      .then((inventory) => {
        setFeaturedInventoryCache((current) => ({
          ...current,
          [cacheKey]: createFeaturedInventoryCacheEntry(inventory)
        }));
      })
      .catch((error: unknown) => {
        prefetchedFeaturedQueryKeysRef.current.delete(cacheKey);

        if ((error as { name?: string } | null)?.name !== "AbortError") {
          console.warn("[featured-archive] failed to prefetch featured inventory", error);
        }

        setFeaturedInventoryCache((current) => {
          const existing = current[cacheKey];
          if (!existing) {
            return current;
          }

          return {
            ...current,
            [cacheKey]: {
              ...existing,
              isLoading: false
            }
          };
        });
      })
      .finally(() => {
        prefetchInFlightQueryKeysRef.current.delete(cacheKey);
      });
  });

  const primeFeaturedRouteState = useEffectEvent(
    (state: {
      filter: FeaturedFilter;
      workflowSecondary: string;
      model: FeaturedPromptFacetValue;
      content: FeaturedPromptFacetValue;
      sort: FeaturedSort;
      query: string;
    }) => {
      const nextQuery = buildFeaturedInventoryQuery(state);
      const cacheKey = buildFeaturedInventoryCacheKey(nextQuery);

      if (!prefetchedFeaturedQueryKeysRef.current.has(cacheKey)) {
        prefetchedFeaturedQueryKeysRef.current.add(cacheKey);
        prefetchFeaturedInventory(nextQuery);
      }

      router.prefetch(buildFeaturedRoute(pathname, state));
    }
  );

  useEffect(() => {
    setFeaturedInventoryCache((current) => {
      const previous = current[serverFeaturedInventoryCacheKey];
      const nextEntry = createFeaturedInventoryCacheEntry(featuredInventory, {
        hasLoaded: !deferInitialInventory,
        isLoading: false
      });

      if (previous && previous.items.length > nextEntry.items.length) {
        return {
          ...current,
          [serverFeaturedInventoryCacheKey]: {
            ...previous,
            summary: nextEntry.summary,
            hasLoaded: true,
            isLoading: false
          }
        };
      }

      return {
        ...current,
        [serverFeaturedInventoryCacheKey]: nextEntry
      };
    });
  }, [deferInitialInventory, featuredInventory, serverFeaturedInventoryCacheKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hashAnchorId = window.location.hash.replace(/^#/, "");
    const hashAnchorTargetId = getFeaturedRestoreAnchorTargetId(hashAnchorId);
    const currentRouteStorageKey = `dramatv:back-scroll:${actualRoute}`;
    const shouldRestoreFromSession =
      isFeaturedCardAnchor(hashAnchorId) || Boolean(window.sessionStorage.getItem(currentRouteStorageKey));

    if (!shouldRestoreFromSession) {
      setSnapshotRestoreState((current) =>
        current.routeKey === null && current.phase === "idle" ? current : EMPTY_FEATURED_SNAPSHOT_RESTORE_STATE
      );
      return;
    }

    let restoredFromCandidate = false;
    const nextSnapshotRouteKey = actualRoute;

    setSnapshotRestoreState({
      routeKey: nextSnapshotRouteKey,
      phase: "restoring-list"
    });

    try {
      const restoreCandidates: FeaturedRestoreCandidate[] = [];
      let routeSnapshotCandidate: FeaturedRestoreCandidate | null = null;

      const routeSnapshot = parseFeaturedHashRouteSnapshot(
        window.sessionStorage.getItem(FEATURED_HASH_ROUTE_SNAPSHOT_STORAGE_KEY)
      );
      if (
        routeSnapshot &&
        (routeSnapshot.routeKey === actualRoute ||
          routeSnapshot.routeKey === `${actualRoute}${hashAnchorId ? `#${hashAnchorId}` : ""}`) &&
        routeSnapshot.cacheKey === serverFeaturedInventoryCacheKey
      ) {
        routeSnapshotCandidate = {
          source: "route-snapshot",
          entry: routeSnapshot,
          aspectRatioEntries: routeSnapshot.aspectRatioEntries,
          masonryAssignments: routeSnapshot.masonryAssignments
        };
        restoreCandidates.push(routeSnapshotCandidate);
      }

      const memoryEntries = readFeaturedInventoryMemoryCache();
      const memoryEntry = memoryEntries[serverFeaturedInventoryCacheKey];
      if (memoryEntry) {
        restoreCandidates.push({
          source: "memory-cache",
          entry: memoryEntry
        });
      }

      const persistedEntries = parseFeaturedInventorySessionCache(
        window.sessionStorage.getItem(FEATURED_INVENTORY_SESSION_CACHE_STORAGE_KEY)
      );
      const persistedEntry = persistedEntries[serverFeaturedInventoryCacheKey];
      if (persistedEntry) {
        restoreCandidates.push({
          source: "session-cache",
          entry: persistedEntry
        });
      }

      const preferredRestoreCandidate = choosePreferredFeaturedRestoreCandidate(
        restoreCandidates,
        hashAnchorTargetId
      );

      if (preferredRestoreCandidate) {
        const restoredEntry = createFeaturedInventoryCacheEntryFromSession(preferredRestoreCandidate.entry);
        setFeaturedInventoryCache((current) => {
          const existing = current[serverFeaturedInventoryCacheKey];
          if (existing && existing.items.length >= restoredEntry.items.length) {
            return current;
          }

          return {
            ...current,
            [serverFeaturedInventoryCacheKey]: restoredEntry
          };
        });

        const restoredAspectRatioEntries = preferredRestoreCandidate.aspectRatioEntries;
        if (restoredAspectRatioEntries && Object.keys(restoredAspectRatioEntries).length > 0) {
          setMeasuredAspectRatioByItemKey((current) => {
            const safeCurrent = current ?? EMPTY_FEATURED_ASPECT_RATIO_MAP;
            let changed = false;
            const nextMap: Record<string, number> = { ...safeCurrent };

            for (const [itemKey, aspectRatio] of Object.entries(restoredAspectRatioEntries)) {
              const normalizedAspectRatio = normalizeMeasuredAspectRatio(aspectRatio);
              if (!normalizedAspectRatio || safeCurrent[itemKey] === normalizedAspectRatio) {
                continue;
              }

              nextMap[itemKey] = normalizedAspectRatio;
              changed = true;
            }

            return changed ? nextMap : safeCurrent;
          });
        }

        const canReuseSnapshotMasonry =
          preferredRestoreCandidate.source === "route-snapshot" &&
          isValidFeaturedMasonryAssignmentsState(preferredRestoreCandidate.masonryAssignments);

        if (canReuseSnapshotMasonry && preferredRestoreCandidate.masonryAssignments) {
          const snapshotMasonryAssignments = preferredRestoreCandidate.masonryAssignments;
          masonryAssignmentsRef.current = {
            routeKey: actualRoute,
            columnCount: snapshotMasonryAssignments.columnCount,
            orderedKeys: snapshotMasonryAssignments.orderedKeys,
            assignments: snapshotMasonryAssignments.assignments
          };

          setSnapshotRestoreState({
            routeKey: nextSnapshotRouteKey,
            phase: "restoring-layout"
          });
        } else {
          setSnapshotRestoreState({
            routeKey: nextSnapshotRouteKey,
            phase: "restoring-viewport"
          });
        }

        restoredFromCandidate = true;
      }
    } catch {}

    if (!restoredFromCandidate) {
      setSnapshotRestoreState((current) =>
        current.routeKey === nextSnapshotRouteKey
          ? {
              routeKey: nextSnapshotRouteKey,
              phase: "restoring-viewport"
            }
          : current
      );
    }

    if (
      restoredFromCandidate &&
      !Boolean(window.sessionStorage.getItem(currentRouteStorageKey)) &&
      hashAnchorId &&
      isFeaturedCardAnchor(hashAnchorId)
    ) {
      requestAnimationFrame(() => {
        const target = document.getElementById(hashAnchorId);
        if (target) {
          target.scrollIntoView({ block: "center" });
        }
      });
    }
  }, [actualRoute, serverFeaturedInventoryCacheKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const sessionEntries = Object.fromEntries(
        Object.entries(featuredInventoryCache).reduce<Array<[string, FeaturedInventorySessionCacheEntry]>>(
          (current, [cacheKey, entry]) => {
            const sessionEntry = toFeaturedInventorySessionCacheEntry(entry);
            if (sessionEntry) {
              current.push([cacheKey, sessionEntry]);
            }
            return current;
          },
          []
        )
      );
      writeFeaturedInventoryMemoryCache(sessionEntries);
      const payload = serializeFeaturedInventorySessionCache(sessionEntries);

      if (!payload) {
        window.sessionStorage.removeItem(FEATURED_INVENTORY_SESSION_CACHE_STORAGE_KEY);
        return;
      }

      window.sessionStorage.setItem(FEATURED_INVENTORY_SESSION_CACHE_STORAGE_KEY, payload);
    } catch {}
  }, [featuredInventoryCache]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const snapshotEntry = featuredInventoryCache[serverFeaturedInventoryCacheKey];
      if (!snapshotEntry?.hasLoaded || snapshotEntry.items.length === 0) {
        return;
      }

      const safeAspectRatioEntries = Object.fromEntries(
        Object.entries(measuredAspectRatioByItemKey).filter(([, aspectRatio]) => Boolean(normalizeMeasuredAspectRatio(aspectRatio)))
      );

      const payload = serializeFeaturedHashRouteSnapshot({
        routeKey: actualRoute,
        cacheKey: serverFeaturedInventoryCacheKey,
        summary: snapshotEntry.summary,
        items: snapshotEntry.items,
        nextCursor: snapshotEntry.nextCursor ?? null,
        hasMore: snapshotEntry.hasMore,
        hasLoaded: true,
        aspectRatioEntries: Object.keys(safeAspectRatioEntries).length > 0 ? safeAspectRatioEntries : undefined,
        masonryAssignments: masonryAssignmentsRef.current.orderedKeys.length > 0
          ? {
              columnCount: masonryAssignmentsRef.current.columnCount,
              orderedKeys: masonryAssignmentsRef.current.orderedKeys,
              assignments: masonryAssignmentsRef.current.assignments
            }
          : undefined
      });

      if (!payload) {
        return;
      }

      window.sessionStorage.setItem(FEATURED_HASH_ROUTE_SNAPSHOT_STORAGE_KEY, payload);
    } catch {}
  }, [actualRoute, featuredInventoryCache, measuredAspectRatioByItemKey, serverFeaturedInventoryCacheKey]);

  useEffect(() => {
    if (!lazyFeaturedInventoryUrl || currentFeaturedInventoryEntry.hasLoaded || currentFeaturedInventoryEntry.isLoading) {
      return;
    }

    const controller = new AbortController();
    setFeaturedInventoryCache((current) => ({
      ...current,
      [featuredInventoryCacheKey]: {
        ...(current[featuredInventoryCacheKey] ??
          createFeaturedInventoryCacheEntry(EMPTY_FEATURED_INVENTORY, {
            hasLoaded: false,
            isLoading: false
          })),
        isLoading: true
      }
    }));

    void requestFeaturedInventoryPage(lazyFeaturedInventoryUrl, featuredInventoryQuery, controller.signal)
      .then((inventory) => {
        if (controller.signal.aborted) {
          return;
        }

        setFeaturedInventoryCache((current) => ({
          ...current,
          [featuredInventoryCacheKey]: createFeaturedInventoryCacheEntry(inventory)
        }));
      })
      .catch((error: unknown) => {
        if ((error as { name?: string } | null)?.name === "AbortError") {
          return;
        }

        console.warn("[featured-archive] failed to load featured inventory page", error);
        setFeaturedInventoryCache((current) => ({
          ...current,
          [featuredInventoryCacheKey]: {
            ...(current[featuredInventoryCacheKey] ??
              createFeaturedInventoryCacheEntry(EMPTY_FEATURED_INVENTORY, {
                hasLoaded: false,
                isLoading: false
              })),
            hasLoaded: true,
            isLoading: false
          }
        }));
      });

    return () => controller.abort();
  }, [
    currentFeaturedInventoryEntry.hasLoaded,
    currentFeaturedInventoryEntry.isLoading,
    lazyFeaturedInventoryUrl,
    featuredInventoryCacheKey,
    featuredInventoryQuery
  ]);

  useEffect(() => {
    if (
      !lazyFeaturedInventoryUrl ||
      !currentFeaturedInventoryEntry.hasLoaded ||
      effectiveRouteState.query.trim().length > 0 ||
      activeWorkflowSecondary !== SECONDARY_ALL_ID ||
      activeModelFilter ||
      activeContentFilter
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      for (const filter of getFeaturedIdlePrefetchFilters(activeFilter)) {
        primeFeaturedRouteState({
          filter,
          workflowSecondary: SECONDARY_ALL_ID,
          model: null,
          content: null,
          sort: activeSort,
          query: effectiveRouteState.query
        });
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [
    activeContentFilter,
    activeFilter,
    activeModelFilter,
    activeSort,
    activeWorkflowSecondary,
    currentFeaturedInventoryEntry.hasLoaded,
    effectiveRouteState.query,
    lazyFeaturedInventoryUrl,
    primeFeaturedRouteState
  ]);

  const releaseDesiredRoute = useEffectEvent((route: string) => {
    setDesiredRoute((current) => (current === route ? null : current));
  });

  const replacePathRoute = useEffectEvent((nextRoute: string) => {
    if (nextRoute === actualRoute) {
      releaseDesiredRoute(nextRoute);
      return;
    }

    router.replace(nextRoute, { scroll: false });

    if (typeof window === "undefined") {
      return;
    }

    if (routeReleaseTimerRef.current !== null) {
      window.clearTimeout(routeReleaseTimerRef.current);
    }

    routeReleaseTimerRef.current = window.setTimeout(() => {
      routeReleaseTimerRef.current = null;
      releaseDesiredRoute(nextRoute);
    }, 1200);
  });

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

    effectiveRouteStateRef.current = state;
    setDesiredRoute((current) => (current === nextRoute ? current : nextRoute));
    replacePathRoute(nextRoute);
  };

  const getInteractiveRouteState = () => effectiveRouteStateRef.current;

  const handleFilterChange = (nextFilter: FeaturedFilter) => {
    const currentState = getInteractiveRouteState();
    if (nextFilter === currentState.filter) {
      return;
    }

    const nextState = {
      filter: nextFilter,
      workflowSecondary: SECONDARY_ALL_ID,
      model: null,
      content: null,
      sort: currentState.sort,
      query: searchQuery
    };

    primeFeaturedRouteState(nextState);
    replaceRoute(nextState);
  };

  const handleWorkflowSecondaryFilterChange = (nextSecondaryFilter: string) => {
    const currentState = getInteractiveRouteState();
    if (nextSecondaryFilter === currentState.workflowSecondary) {
      return;
    }

    const nextState = {
      filter: currentState.filter,
      workflowSecondary: nextSecondaryFilter,
      model: null,
      content: null,
      sort: currentState.sort,
      query: searchQuery
    };

    primeFeaturedRouteState(nextState);
    replaceRoute(nextState);
  };

  const handleModelFilterChange = (nextModelFilter: string) => {
    const currentState = getInteractiveRouteState();
    const nextState = {
      filter: currentState.filter,
      workflowSecondary: SECONDARY_ALL_ID,
      model: currentState.model === nextModelFilter ? null : nextModelFilter,
      content: currentState.content,
      sort: currentState.sort,
      query: searchQuery
    };

    primeFeaturedRouteState(nextState);
    replaceRoute(nextState);
  };

  const handleContentFilterChange = (nextContentFilter: string) => {
    const currentState = getInteractiveRouteState();
    const nextState = {
      filter: currentState.filter,
      workflowSecondary: SECONDARY_ALL_ID,
      model: currentState.model,
      content: currentState.content === nextContentFilter ? null : nextContentFilter,
      sort: currentState.sort,
      query: searchQuery
    };

    primeFeaturedRouteState(nextState);
    replaceRoute(nextState);
  };

  const handleSortChange = (nextSort: FeaturedSort) => {
    const currentState = getInteractiveRouteState();
    if (nextSort === currentState.sort) {
      return;
    }

    const nextState = {
      filter: currentState.filter,
      workflowSecondary: currentState.workflowSecondary,
      model: currentState.model,
      content: currentState.content,
      sort: nextSort,
      query: searchQuery
    };

    primeFeaturedRouteState(nextState);
    replaceRoute(nextState);
  };

  const handleFilterIntent = (nextFilter: FeaturedFilter) => {
    const currentState = getInteractiveRouteState();
    if (nextFilter === currentState.filter) {
      return;
    }

    primeFeaturedRouteState({
      filter: nextFilter,
      workflowSecondary: SECONDARY_ALL_ID,
      model: null,
      content: null,
      sort: currentState.sort,
      query: searchQuery
    });
  };

  const handleWorkflowSecondaryIntent = (nextSecondaryFilter: string) => {
    const currentState = getInteractiveRouteState();
    if (nextSecondaryFilter === currentState.workflowSecondary) {
      return;
    }

    primeFeaturedRouteState({
      filter: currentState.filter,
      workflowSecondary: nextSecondaryFilter,
      model: null,
      content: null,
      sort: currentState.sort,
      query: searchQuery
    });
  };

  const handleModelFilterIntent = (nextModelFilter: string) => {
    const currentState = getInteractiveRouteState();
    primeFeaturedRouteState({
      filter: currentState.filter,
      workflowSecondary: SECONDARY_ALL_ID,
      model: currentState.model === nextModelFilter ? null : nextModelFilter,
      content: currentState.content,
      sort: currentState.sort,
      query: searchQuery
    });
  };

  const handleContentFilterIntent = (nextContentFilter: string) => {
    const currentState = getInteractiveRouteState();
    primeFeaturedRouteState({
      filter: currentState.filter,
      workflowSecondary: SECONDARY_ALL_ID,
      model: currentState.model,
      content: currentState.content === nextContentFilter ? null : nextContentFilter,
      sort: currentState.sort,
      query: searchQuery
    });
  };

  const handleSortIntent = (nextSort: FeaturedSort) => {
    const currentState = getInteractiveRouteState();
    if (nextSort === currentState.sort) {
      return;
    }

    primeFeaturedRouteState({
      filter: currentState.filter,
      workflowSecondary: currentState.workflowSecondary,
      model: currentState.model,
      content: currentState.content,
      sort: nextSort,
      query: searchQuery
    });
  };

  const featuredArchiveItems = useMemo(
    () => dedupeFeaturedItems(currentFeaturedInventoryEntry.items.map((item, index) => toFeaturedArchiveItem(item, index))),
    [currentFeaturedInventoryEntry.items]
  );

  const curatedItemsByFilter = useMemo(() => buildCuratedFeaturedItemsByFilter(featuredSlots), [featuredSlots]);

  useEffect(() => {
    if (routeReleaseTimerRef.current !== null && desiredRoute === actualRoute) {
      window.clearTimeout(routeReleaseTimerRef.current);
      routeReleaseTimerRef.current = null;
    }
  }, [actualRoute, desiredRoute]);

  useEffect(() => {
    if (desiredRoute !== actualRoute) {
      return;
    }

    setDesiredRoute(null);
  }, [actualRoute]);

  useEffect(() => {
    if (!desiredRoute || desiredRoute === actualRoute) {
      return;
    }

    replacePathRoute(desiredRoute);
  }, [actualRoute, desiredRoute, replacePathRoute]);

  useEffect(() => {
    if (actualRoute === canonicalUrlRoute || desiredRoute) {
      return;
    }

    replacePathRoute(canonicalUrlRoute);
  }, [actualRoute, canonicalUrlRoute, desiredRoute, replacePathRoute]);

  useEffect(() => {
    return () => {
      if (routeReleaseTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(routeReleaseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const nextQuery = desiredRouteState?.query ?? parsedUrlState.query;
    setSearchQuery((current) => (current === nextQuery ? current : nextQuery));
  }, [desiredRouteState?.query, parsedUrlState.query]);

  const effectivePromptFacetSelection = useMemo(
    () => resolvePromptFacetSelection(activeFilter, activeModelFilter, activeContentFilter),
    [activeContentFilter, activeFilter, activeModelFilter]
  );

  const keyword = deferredSearchQuery.trim().toLowerCase();
  const filteredFeaturedItems = useMemo(
    () => featuredArchiveItems.filter((item) => matchesFilterGroup(item, keyword)),
    [featuredArchiveItems, keyword]
  );
  const curatedActivityItems = useMemo(
    () => dedupeFeaturedItems((curatedItemsByFilter.activity ?? []).filter((item) => matchesFilterGroup(item, keyword))),
    [curatedItemsByFilter, keyword]
  );

  const workflowSecondaryOptions = useMemo(
    () => (activeFilter === "workflow" ? buildWorkflowSecondaryOptions(currentFeaturedInventorySummary) : []),
    [activeFilter, currentFeaturedInventorySummary]
  );

  const promptFacetOptions = useMemo(
    () => buildPromptFacetOptions(currentFeaturedInventorySummary, activeFilter),
    [activeFilter, currentFeaturedInventorySummary]
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
    if (activeFilter === "activity") {
      return sortActivityCuratedItems(curatedActivityItems, activeSort);
    }

    const mergedInventoryItems = mergeCuratedFeaturedItems({
      state: {
        filter: activeFilter,
        sort: activeSort,
        keyword,
        workflowSecondary: activeWorkflowSecondary,
        model: effectivePromptFacetSelection.model,
        content: effectivePromptFacetSelection.content
      },
      inventoryItems: filteredFeaturedItems,
      curatedItemsByFilter
    });

    if (shouldUseCuratedFeaturedItems({
      filter: activeFilter,
      sort: activeSort,
      keyword,
      workflowSecondary: activeWorkflowSecondary,
      model: effectivePromptFacetSelection.model,
      content: effectivePromptFacetSelection.content
    })) {
      return mergedInventoryItems;
    }

    return filteredFeaturedItems;
  }, [
    activeFilter,
    activeSort,
    activeWorkflowSecondary,
    curatedActivityItems,
    curatedItemsByFilter,
    effectivePromptFacetSelection.content,
    effectivePromptFacetSelection.model,
    filteredFeaturedItems,
    keyword,
  ]);

  const filterCounts = useMemo<Record<FeaturedFilter, number>>(
    () => ({
      all: currentFeaturedInventorySummary.counts.all,
      workflow: currentFeaturedInventorySummary.counts.workflow,
      video_prompt: currentFeaturedInventorySummary.counts.videoPrompt,
      image_prompt: currentFeaturedInventorySummary.counts.imagePrompt,
      activity: Math.max(currentFeaturedInventorySummary.counts.activity, curatedItemsByFilter.activity?.length ?? 0)
    }),
    [currentFeaturedInventorySummary, curatedItemsByFilter]
  );

  const hasBufferedFeaturedInventory = Boolean(
    bufferedPageKeyRef.current === featuredInventoryCacheKey && bufferedPageRef.current?.items.length
  );
  const hasLoadableMoreInventory = Boolean(
    lazyFeaturedInventoryUrl &&
      (hasBufferedFeaturedInventory || (currentFeaturedInventoryEntry.hasMore && currentFeaturedInventoryEntry.nextCursor))
  );
  const restoredBackAnchorId = useBackAnchorRestore();
  const storedRouteRestoreState = useStoredRouteScrollRestore();
  const [hasFeaturedStoredBackScroll, setHasFeaturedStoredBackScroll] = useState(false);
  const [hasFeaturedHashAnchorTarget, setHasFeaturedHashAnchorTarget] = useState(false);
  const featuredBackAnchorRouteKey =
    isFeaturedCardAnchor(restoredBackAnchorId) && restoredBackAnchorId ? `${actualRoute}#${restoredBackAnchorId}` : null;
  const isFeaturedBackAnchorActive = shouldForceFeaturedBackAnchorRestore({
    anchorId: restoredBackAnchorId,
    hasStoredScroll: hasFeaturedStoredBackScroll
  });
  const isFeaturedSoftHashRestoreActive = Boolean(featuredBackAnchorRouteKey) &&
    !hasFeaturedStoredBackScroll &&
    !hasFeaturedHashAnchorTarget;
  const isFeaturedRestorePagingActive = isFeaturedBackAnchorActive || isFeaturedSoftHashRestoreActive;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const routeKey = featuredBackAnchorRouteKey;
    if (!routeKey) {
      setHasFeaturedStoredBackScroll(false);
      return;
    }

    try {
      setHasFeaturedStoredBackScroll(Boolean(window.sessionStorage.getItem(`dramatv:back-scroll:${routeKey}`)));
    } catch {
      setHasFeaturedStoredBackScroll(false);
    }
  }, [featuredBackAnchorRouteKey]);
  useEffect(() => {
    if (typeof document === "undefined" || !restoredBackAnchorId || !isFeaturedCardAnchor(restoredBackAnchorId)) {
      setHasFeaturedHashAnchorTarget(false);
      return;
    }

    setHasFeaturedHashAnchorTarget(Boolean(document.getElementById(restoredBackAnchorId)));
  }, [restoredBackAnchorId, currentFeaturedInventoryEntry.items.length, serverFeaturedInventoryEntry.items.length]);

  const handleFeaturedInventoryPrefetchNextPage = useEffectEvent(() => {
    if (
      !lazyFeaturedInventoryUrl ||
      currentFeaturedInventoryEntry.isLoading ||
      !currentFeaturedInventoryEntry.hasMore ||
      !currentFeaturedInventoryEntry.nextCursor
    ) {
      return;
    }

    const nextCursor = currentFeaturedInventoryEntry.nextCursor;
    if (loadCursorInFlightRef.current === `${featuredInventoryCacheKey}:${nextCursor}`) {
      return;
    }

    loadCursorInFlightRef.current = `${featuredInventoryCacheKey}:${nextCursor}`;

    void requestFeaturedInventoryPage(
      lazyFeaturedInventoryUrl,
      {
        ...featuredInventoryQuery,
        cursor: nextCursor
      }
    )
      .then(async (inventory) => {
        const bufferedItems = dedupeFeaturedItems(
          (inventory.page.items ?? []).map((item, index) => toFeaturedArchiveItem(item, index))
        );
        await prepareFeaturedItemAspectRatios(bufferedItems);

        bufferedPageKeyRef.current = featuredInventoryCacheKey;
        bufferedPageRef.current = {
          summary: inventory.summary,
          items: dedupeFeaturedInventoryItems(inventory.page.items ?? []),
          nextCursor: inventory.page.nextCursor ?? null,
          hasMore: inventory.page.hasMore ?? false
        };
        setBufferedPageVersion((current) => current + 1);
      })
      .catch((error: unknown) => {
        console.warn("[featured-archive] failed to load more featured inventory", error);
        setFeaturedInventoryCache((current) => ({
          ...current,
          [featuredInventoryCacheKey]: {
            ...(current[featuredInventoryCacheKey] ?? currentFeaturedInventoryEntry),
            isLoading: false,
            loadMoreError: true
          }
        }));
      })
      .finally(() => {
        if (loadCursorInFlightRef.current === `${featuredInventoryCacheKey}:${nextCursor}`) {
          loadCursorInFlightRef.current = null;
        }
      });
  });

  const handleFeaturedInventoryLoadMore = useEffectEvent(() => {
    if (
      hasBufferedFeaturedInventory &&
      bufferedPageKeyRef.current === featuredInventoryCacheKey &&
      bufferedPageRef.current &&
      shouldAllowFeaturedBufferedCommit(isFeaturedRestorePagingActive)
    ) {
      const bufferedPage = bufferedPageRef.current;
      bufferedPageRef.current = null;
      bufferedPageKeyRef.current = null;
      setBufferedPageVersion((current) => current + 1);

      setFeaturedInventoryCache((current) => {
        const previous = current[featuredInventoryCacheKey] ?? currentFeaturedInventoryEntry;
        return {
          ...current,
          [featuredInventoryCacheKey]: {
            ...previous,
            summary: bufferedPage.summary,
            items: dedupeFeaturedInventoryItems([...previous.items, ...bufferedPage.items]),
            nextCursor: bufferedPage.nextCursor,
            hasMore: bufferedPage.hasMore,
            hasLoaded: true,
            isLoading: false,
            loadMoreError: false
          }
        };
      });
      return;
    }

    if (
      !lazyFeaturedInventoryUrl ||
      currentFeaturedInventoryEntry.isLoading ||
      !currentFeaturedInventoryEntry.hasMore ||
      !currentFeaturedInventoryEntry.nextCursor
    ) {
      return;
    }

    setFeaturedInventoryCache((current) => ({
      ...current,
      [featuredInventoryCacheKey]: {
        ...(current[featuredInventoryCacheKey] ?? currentFeaturedInventoryEntry),
        isLoading: true,
        loadMoreError: false
      }
    }));

    handleFeaturedInventoryPrefetchNextPage();
  });

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

  useEffect(() => {
    if (bufferedPageKeyRef.current !== featuredInventoryCacheKey) {
      bufferedPageRef.current = null;
      bufferedPageKeyRef.current = null;
      setBufferedPageVersion((current) => current + 1);
    }
  }, [featuredInventoryCacheKey]);
  const [columnCount, setColumnCount] = useState(FEATURED_DEFAULT_COLUMN_COUNT);
  const aspectProbeInFlightRef = useRef(new Set<string>());
  const masonryAssignmentsRef = useRef<FeaturedMasonryAssignmentsState>(EMPTY_FEATURED_MASONRY_ASSIGNMENTS);
  const renderedItems = visibleItems;
  const renderedCards = useMemo(
    () =>
      renderedItems.map((item, index) => ({
        item,
        itemKey: getFeaturedItemKey(item),
        bucket: resolveFeaturedCardBucket(item, measuredAspectRatioByItemKey, index),
        aspectRatio: resolveFeaturedCardAspectRatio(item, measuredAspectRatioByItemKey, index)
      })),
    [measuredAspectRatioByItemKey, renderedItems]
  );
  const prewarmedVideoCardKeys = useMemo(() => {
    const nextKeys = new Set<string>();

    for (const item of renderedItems) {
      if (!item.previewUrl && !item.sourceUrl) {
        continue;
      }

      nextKeys.add(getFeaturedItemKey(item));
      if (nextKeys.size >= FEATURED_PREWARM_VIDEO_CARD_LIMIT) {
        break;
      }
    }

    return nextKeys;
  }, [renderedItems]);
  const handleCardAspectRatioChange = useEffectEvent((itemKey: string, aspectRatio: number) => {
    const normalizedAspectRatio = normalizeMeasuredAspectRatio(aspectRatio);
    if (!normalizedAspectRatio) {
      return;
    }

    setMeasuredAspectRatioByItemKey((current) => {
      const safeCurrent = current ?? EMPTY_FEATURED_ASPECT_RATIO_MAP;
      return safeCurrent[itemKey] === normalizedAspectRatio
        ? safeCurrent
        : { ...safeCurrent, [itemKey]: normalizedAspectRatio };
    });
  });
  const prepareFeaturedItemAspectRatios = useEffectEvent(async (items: FeaturedArchiveItem[]) => {
    if (typeof window === "undefined" || items.length === 0) {
      return;
    }

    const probeCandidates = items.filter((item) => {
      const itemKey = getFeaturedItemKey(item);
      return (
        shouldProbeFeaturedItemAspectRatio(item) &&
        !measuredAspectRatioByItemKey[itemKey] &&
        !aspectProbeInFlightRef.current.has(itemKey)
      );
    });

    if (probeCandidates.length === 0) {
      return;
    }

    for (const item of probeCandidates) {
      aspectProbeInFlightRef.current.add(getFeaturedItemKey(item));
    }

    const probeResults = await Promise.all(
      probeCandidates.map(async (item) => {
        const itemKey = getFeaturedItemKey(item);
        const imageUrl = getFeaturedItemProbeImageUrl(item);

        if (!imageUrl) {
          return null;
        }

        const aspectRatio = await probeFeaturedImageAspectRatio(imageUrl);
        return aspectRatio ? ([itemKey, aspectRatio] as const) : null;
      })
    );

    for (const item of probeCandidates) {
      aspectProbeInFlightRef.current.delete(getFeaturedItemKey(item));
    }

    const nextEntries = Object.fromEntries(
      probeResults.filter((entry): entry is readonly [string, number] => Boolean(entry))
    );

    if (Object.keys(nextEntries).length === 0) {
      return;
    }

    setMeasuredAspectRatioByItemKey((current) => {
      const safeCurrent = current ?? EMPTY_FEATURED_ASPECT_RATIO_MAP;
      let changed = false;
      const mergedEntries: Record<string, number> = { ...safeCurrent };

      for (const [itemKey, aspectRatio] of Object.entries(nextEntries)) {
        if (safeCurrent[itemKey] === aspectRatio) {
          continue;
        }

        mergedEntries[itemKey] = aspectRatio;
        changed = true;
      }

      return changed ? mergedEntries : safeCurrent;
    });
  });
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncColumnCount = () => {
      const nextColumnCount = deriveFeaturedColumnCount(window.innerWidth);
      setColumnCount((current) => (current === nextColumnCount ? current : nextColumnCount));
    };

    syncColumnCount();
    window.addEventListener("resize", syncColumnCount);
    return () => window.removeEventListener("resize", syncColumnCount);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const payload = serializeFeaturedAspectRatioSessionCache(measuredAspectRatioByItemKey);
      if (!payload) {
        window.sessionStorage.removeItem(FEATURED_ASPECT_RATIO_SESSION_CACHE_STORAGE_KEY);
        return;
      }

      window.sessionStorage.setItem(FEATURED_ASPECT_RATIO_SESSION_CACHE_STORAGE_KEY, payload);
    } catch {}
  }, [measuredAspectRatioByItemKey]);
  const masonryAssignments = useMemo(() => {
    const nextState = buildNextFeaturedMasonryAssignmentsState({
      cards: renderedCards,
      columnCount,
      currentRoute,
      previous: masonryAssignmentsRef.current,
      forceReset: isFeaturedBackAnchorActive && snapshotRestoreState.phase !== "restoring-layout"
    });
    masonryAssignmentsRef.current = nextState;
    return nextState;
  }, [columnCount, currentRoute, isFeaturedBackAnchorActive, renderedCards, snapshotRestoreState.phase]);
  const masonryColumns = useMemo(() => {
    const nextColumns = Array.from({ length: columnCount }, () => [] as FeaturedRenderedCard[]);

    for (const card of renderedCards) {
      const assignedColumnIndex = masonryAssignments.assignments[card.itemKey] ?? 0;
      const safeColumnIndex = Math.min(columnCount - 1, Math.max(0, assignedColumnIndex));
      nextColumns[safeColumnIndex].push(card);
    }

    return nextColumns;
  }, [columnCount, masonryAssignments.assignments, renderedCards]);
  const isInventoryLoadingState = !currentFeaturedInventoryEntry.hasLoaded;

  useEffect(() => {
    if (snapshotRestoreState.routeKey !== actualRoute || snapshotRestoreState.phase !== "restoring-layout") {
      return;
    }

    const layoutReady =
      masonryAssignments.routeKey === currentRoute &&
      renderedCards.every((card) => typeof masonryAssignments.assignments[card.itemKey] === "number");

    if (!layoutReady) {
      return;
    }

    setSnapshotRestoreState({
      routeKey: actualRoute,
      phase: "restoring-viewport"
    });
  }, [actualRoute, currentRoute, masonryAssignments, renderedCards, snapshotRestoreState.phase, snapshotRestoreState.routeKey]);
  useEffect(() => {
    if (typeof window === "undefined" || !isFeaturedCardAnchor(restoredBackAnchorId)) {
      return;
    }

    try {
      const restoredAspectRatioMap = parseFeaturedAspectRatioSessionCache(
        window.sessionStorage.getItem(FEATURED_ASPECT_RATIO_SESSION_CACHE_STORAGE_KEY)
      );

      if (Object.keys(restoredAspectRatioMap).length === 0) {
        return;
      }

      setMeasuredAspectRatioByItemKey((current) => {
        const safeCurrent = current ?? EMPTY_FEATURED_ASPECT_RATIO_MAP;
        let changed = false;
        const nextMap: Record<string, number> = { ...safeCurrent };

        for (const [itemKey, aspectRatio] of Object.entries(restoredAspectRatioMap)) {
          if (safeCurrent[itemKey] === aspectRatio) {
            continue;
          }

          nextMap[itemKey] = aspectRatio;
          changed = true;
        }

        return changed ? nextMap : safeCurrent;
      });
    } catch {}
  }, [restoredBackAnchorId]);

  useEffect(() => {
    if (!featuredBackAnchorRouteKey) {
      softHashAnchorCenteredRouteRef.current = null;
      return;
    }

    if (softHashAnchorCenteredRouteRef.current && softHashAnchorCenteredRouteRef.current !== featuredBackAnchorRouteKey) {
      softHashAnchorCenteredRouteRef.current = null;
    }
  }, [featuredBackAnchorRouteKey]);

  useEffect(() => {
    if (
      typeof document === "undefined" ||
      !restoredBackAnchorId ||
      !isFeaturedCardAnchor(restoredBackAnchorId) ||
      isFeaturedBackAnchorActive ||
      !featuredBackAnchorRouteKey
    ) {
      return;
    }

    if (softHashAnchorCenteredRouteRef.current === featuredBackAnchorRouteKey) {
      return;
    }

    const target = document.getElementById(restoredBackAnchorId);
    if (!target) {
      return;
    }

    softHashAnchorCenteredRouteRef.current = featuredBackAnchorRouteKey;

    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (!cancelled) {
          target.scrollIntoView({ block: "center" });
        }
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [featuredBackAnchorRouteKey, isFeaturedBackAnchorActive, restoredBackAnchorId, snapshotRestoreState.phase]);

  const [backAnchorRestoreState, setBackAnchorRestoreState] = useState<{
    routeKey: string | null;
    completed: boolean;
  }>({
    routeKey: null,
    completed: true
  });

  const continueLoadingForBackAnchor = useEffectEvent(() => {
    if (typeof document === "undefined") {
      return;
    }

    const targetExists = Boolean(restoredBackAnchorId && document.getElementById(restoredBackAnchorId));
    if (
      !shouldAutoLoadFeaturedBackAnchor({
        anchorId: restoredBackAnchorId,
        targetExists,
        hasMore: hasLoadableMoreInventory,
        isLoading: currentFeaturedInventoryEntry.isLoading,
        loadMoreError: currentFeaturedInventoryEntry.loadMoreError
      })
    ) {
      return;
    }

    handleFeaturedInventoryLoadMore();
  });

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoadableMoreInventory || currentFeaturedInventoryEntry.isLoading) {
      return;
    }

    if (currentFeaturedInventoryEntry.loadMoreError) {
      return;
    }

    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        if (hasBufferedFeaturedInventory) {
          if (shouldAllowFeaturedBufferedCommit(isFeaturedRestorePagingActive)) {
            handleFeaturedInventoryLoadMore();
          }
          return;
        }

        handleFeaturedInventoryPrefetchNextPage();
      },
      {
        rootMargin: `0px 0px ${FEATURED_PREFETCH_TRIGGER_DISTANCE_PX}px 0px`
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    hasBufferedFeaturedInventory,
    currentFeaturedInventoryEntry.isLoading,
    currentFeaturedInventoryEntry.loadMoreError,
    handleFeaturedInventoryLoadMore,
    handleFeaturedInventoryPrefetchNextPage,
    hasLoadableMoreInventory,
    isFeaturedRestorePagingActive
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasBufferedFeaturedInventory) {
      return;
    }

    const remainingDistance = getFeaturedRemainingDistanceToBottom();
    if (
      !shouldAutoCommitBufferedFeaturedPage({
        hasBufferedPage: hasBufferedFeaturedInventory,
        isLoading: currentFeaturedInventoryEntry.isLoading,
        forceCommit: isFeaturedRestorePagingActive,
        remainingDistanceToBottom: remainingDistance,
        commitDistancePx: FEATURED_BUFFER_COMMIT_DISTANCE_PX
      })
    ) {
      return;
    }

    handleFeaturedInventoryLoadMore();
  }, [
    currentFeaturedInventoryEntry.isLoading,
    handleFeaturedInventoryLoadMore,
    hasBufferedFeaturedInventory,
    isFeaturedRestorePagingActive,
    renderedItems.length
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoadableMoreInventory || currentFeaturedInventoryEntry.isLoading) {
      return;
    }

    if (currentFeaturedInventoryEntry.loadMoreError) {
      return;
    }

    const triggerLoadMoreNearBottom = () => {
      const remainingDistance = getFeaturedRemainingDistanceToBottom();
      if (!hasBufferedFeaturedInventory && remainingDistance <= FEATURED_PREFETCH_TRIGGER_DISTANCE_PX) {
        handleFeaturedInventoryPrefetchNextPage();
        return;
      }

      if (
        remainingDistance <= FEATURED_BUFFER_COMMIT_DISTANCE_PX &&
        shouldAllowFeaturedBufferedCommit(isFeaturedRestorePagingActive)
      ) {
        handleFeaturedInventoryLoadMore();
      }
    };

    window.addEventListener("scroll", triggerLoadMoreNearBottom, { passive: true });
    window.addEventListener("resize", triggerLoadMoreNearBottom);
    return () => {
      window.removeEventListener("scroll", triggerLoadMoreNearBottom);
      window.removeEventListener("resize", triggerLoadMoreNearBottom);
    };
  }, [
    hasBufferedFeaturedInventory,
    currentFeaturedInventoryEntry.isLoading,
    currentFeaturedInventoryEntry.loadMoreError,
    handleFeaturedInventoryLoadMore,
    handleFeaturedInventoryPrefetchNextPage,
    hasLoadableMoreInventory,
    isFeaturedRestorePagingActive
  ]);

  useEffect(() => {
    if (!featuredBackAnchorRouteKey || !isFeaturedRestorePagingActive) {
      setBackAnchorRestoreState((current) =>
        current.routeKey === null && current.completed ? current : { routeKey: null, completed: true }
      );
      return;
    }

    setBackAnchorRestoreState((current) =>
      current.routeKey === featuredBackAnchorRouteKey ? current : { routeKey: featuredBackAnchorRouteKey, completed: false }
    );
  }, [featuredBackAnchorRouteKey, isFeaturedRestorePagingActive]);

  useEffect(() => {
    if (snapshotRestoreState.routeKey !== actualRoute) {
      return;
    }

    if (snapshotRestoreState.phase !== "restoring-viewport") {
      return;
    }

    const hasBlockingBackAnchor =
      Boolean(featuredBackAnchorRouteKey) &&
      isFeaturedRestorePagingActive &&
      (!hasFeaturedHashAnchorTarget || isFeaturedBackAnchorActive);

    if (hasBlockingBackAnchor || storedRouteRestoreState.restoring) {
      return;
    }

    setSnapshotRestoreState({
      routeKey: actualRoute,
      phase: "completed"
    });
  }, [
    actualRoute,
    featuredBackAnchorRouteKey,
    hasFeaturedHashAnchorTarget,
    isFeaturedBackAnchorActive,
    isFeaturedRestorePagingActive,
    snapshotRestoreState.phase,
    snapshotRestoreState.routeKey,
    storedRouteRestoreState.restoring
  ]);

  useEffect(() => {
    if (
      !featuredBackAnchorRouteKey ||
      !isFeaturedRestorePagingActive ||
      (isFeaturedBackAnchorActive && backAnchorRestoreState.completed) ||
      (!isFeaturedBackAnchorActive && hasFeaturedHashAnchorTarget)
    ) {
      return;
    }

    continueLoadingForBackAnchor();
  }, [
    continueLoadingForBackAnchor,
    backAnchorRestoreState.completed,
    currentFeaturedInventoryEntry.hasMore,
    currentFeaturedInventoryEntry.isLoading,
    currentFeaturedInventoryEntry.loadMoreError,
    currentFeaturedInventoryEntry.nextCursor,
    isFeaturedBackAnchorActive,
    isFeaturedRestorePagingActive,
    hasFeaturedHashAnchorTarget,
    renderedItems.length,
    restoredBackAnchorId
  ]);
  useEffect(() => {
    if (typeof document === "undefined" || !featuredBackAnchorRouteKey || !isFeaturedBackAnchorActive) {
      return;
    }

    if (
      backAnchorRestoreState.routeKey !== featuredBackAnchorRouteKey ||
      backAnchorRestoreState.completed
    ) {
      return;
    }

    const targetExists = Boolean(restoredBackAnchorId && document.getElementById(restoredBackAnchorId));
    if (!targetExists) {
      if (
        !lazyFeaturedInventoryUrl ||
        (currentFeaturedInventoryEntry.hasLoaded &&
          (!currentFeaturedInventoryEntry.hasMore || currentFeaturedInventoryEntry.loadMoreError))
      ) {
        setBackAnchorRestoreState({
          routeKey: featuredBackAnchorRouteKey,
          completed: true
        });
      }
      return;
    }

    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (!cancelled) {
          setBackAnchorRestoreState({
            routeKey: featuredBackAnchorRouteKey,
            completed: true
          });
        }
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [
    backAnchorRestoreState.completed,
    backAnchorRestoreState.routeKey,
    currentFeaturedInventoryEntry.hasLoaded,
    currentFeaturedInventoryEntry.hasMore,
    currentFeaturedInventoryEntry.loadMoreError,
    featuredBackAnchorRouteKey,
    isFeaturedBackAnchorActive,
    lazyFeaturedInventoryUrl,
    renderedItems.length,
    restoredBackAnchorId
  ]);

  const isHashBackAnchorRestoring = shouldShowFeaturedBackAnchorRestoreOverlay({
    routeKey: featuredBackAnchorRouteKey,
    restoreStateRouteKey: backAnchorRestoreState.routeKey,
    restoreCompleted: backAnchorRestoreState.completed,
    restoreActive: isFeaturedBackAnchorActive
  });
  const isStoredRouteRestoring = Boolean(storedRouteRestoreState.restoring);
  const isBackAnchorRestoring = isHashBackAnchorRestoring || isStoredRouteRestoring;

  return (
    <PageShell showHomeFloatingDock variant="home" topNavActive="featured">
      <div
        aria-hidden={isBackAnchorRestoring}
        className={`${styles.page}${isBackAnchorRestoring ? ` ${styles.pageRestoring}` : ""}`}
      >
        <section className={styles.toolbar}>
          <div className={styles.filterWrap}>
            <div className={styles.filterGroup}>
              {FILTER_OPTIONS.map((option) => (
                <button
                  className={activeFilter === option.id ? styles.filterChipActive : styles.filterChip}
                  key={option.id}
                  onFocus={() => handleFilterIntent(option.id)}
                  onMouseEnter={() => handleFilterIntent(option.id)}
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
              placeholder="搜索提示词、作者、工作流或活动..."
              type="search"
              value={searchQuery}
            />
          </label>

          <div className={styles.sortGroup}>
            {SORT_OPTIONS.map((option) => (
              <button
                className={activeSort === option.id ? styles.sortChipActive : styles.sortChip}
                key={option.id}
                onFocus={() => handleSortIntent(option.id)}
                onMouseEnter={() => handleSortIntent(option.id)}
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
                  onFocus={() => handleWorkflowSecondaryIntent(option.id)}
                  onMouseEnter={() => handleWorkflowSecondaryIntent(option.id)}
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
                    onFocus={() => handleModelFilterIntent(option.id)}
                    onMouseEnter={() => handleModelFilterIntent(option.id)}
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
                    onFocus={() => handleContentFilterIntent(option.id)}
                    onMouseEnter={() => handleContentFilterIntent(option.id)}
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

        {renderedItems.length > 0 ? (
          <section className={styles.contentSection}>
            <div className={styles.contentGrid}>
              {masonryColumns.map((columnCards, columnIndex) => (
                <div className={styles.contentColumn} key={`featured-column-${columnIndex}`}>
                  {columnCards.map((card) => (
                    <FeaturedCard
                      aspectRatio={card.aspectRatio}
                      backSource={`${currentRoute}#${getFeaturedCardAnchorId(card.item.id)}`}
                      bucket={card.bucket}
                      currentRoute={currentRoute}
                      item={card.item}
                      key={card.itemKey}
                      onAspectRatioChange={handleCardAspectRatioChange}
                      prewarmInViewport={prewarmedVideoCardKeys.has(card.itemKey)}
                    />
                  ))}
                </div>
              ))}
            </div>
            {hasLoadableMoreInventory ? (
              <div aria-hidden="true" className={styles.loadMoreTrigger} ref={loadMoreSentinelRef} />
            ) : null}
            {currentFeaturedInventoryEntry.isLoading ? (
              <div className={styles.loadMoreSentinel}>
                <span className={styles.loadMoreText}>加载中...</span>
              </div>
            ) : null}
            {currentFeaturedInventoryEntry.loadMoreError ? (
              <div className={styles.loadMoreSentinel}>
                <button
                  className={styles.loadMoreButton}
                  disabled={currentFeaturedInventoryEntry.isLoading}
                  onClick={handleFeaturedInventoryLoadMore}
                  type="button"
                >
                  <span className={styles.loadMoreText}>加载失败，点击重试</span>
                </button>
              </div>
            ) : null}
          </section>
        ) : isInventoryLoadingState ? (
          <div className={styles.emptyState}>
            <strong>精选内容加载中</strong>
            <p>正在拉取当前分类的真实库存，请稍候。</p>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <strong>当前筛选下还没有内容</strong>
            <p>可以切换分类、修改搜索词，或者返回全部继续浏览。</p>
          </div>
        )}
      </div>
      {isBackAnchorRestoring ? (
        <div className={styles.backAnchorRestoreOverlay}>
          <RouteVideoLoading
            activeNav="featured"
            label="Restoring featured position"
            useVideo={false}
            videoActive={false}
          />
        </div>
      ) : null}
    </PageShell>
  );
}
