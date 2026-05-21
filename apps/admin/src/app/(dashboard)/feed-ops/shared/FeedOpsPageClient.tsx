"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import FeedOpsMediaPreview, { type FeedOpsPreviewItem } from "./FeedOpsMediaPreview";
import type { FeedOpsPageData } from "./feed-ops-types";
import {
  contentMetaText,
  feedOpsPageSubtitle,
  feedOpsPageTitle,
  feedOpsTabItems,
  feedOpsWorkspaceNote,
  trimSummaryText,
  type FeedOpsPageKind
} from "./feed-ops-page";
import { getFeedOpsMediaSources } from "./feed-ops-media";
import styles from "./page.module.css";

type FeedOpsPageClientProps = {
  page: FeedOpsPageKind;
  data: FeedOpsPageData;
  isFallback: boolean;
  modeDetail: string;
  errorMessage: string | null;
  successMessage: string | null;
  saveAction: (formData: FormData) => Promise<void>;
};

type ContentItem = FeedOpsPageData["candidatePool"][number];
type SlotItem = FeedOpsPageData["slots"][number]["items"][number];
type SlotData = FeedOpsPageData["slots"][number];
type SlotKey = FeedOpsPageData["slots"][number]["key"];
type EditableSlotsState = Record<string, SlotItem[]>;
type PreviewSlotKeys = {
  primary: SlotKey | null;
  secondary: SlotKey | null;
};
type CandidatePromptFilter = "all" | "image" | "video";

const MAIN_POOL_PAGE_SIZE = 5;
const ARRANGE_POOL_PAGE_SIZE = 6;
const CANDIDATE_PROMPT_FILTER_OPTIONS: Array<{ value: CandidatePromptFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "image", label: "图片提示词" },
  { value: "video", label: "视频提示词" }
];

function contentItemKey(item: Pick<ContentItem, "targetType" | "targetId">) {
  return `${item.targetType}:${item.targetId}`;
}

function defaultPromptFilterForScene(sceneKey: string): CandidatePromptFilter {
  if (sceneKey === "featured-video-prompt") {
    return "video";
  }

  if (sceneKey === "featured-image-prompt") {
    return "image";
  }

  return "all";
}

function matchesPromptFilter(item: ContentItem, filter: CandidatePromptFilter) {
  if (filter === "all") {
    return true;
  }

  if (item.targetType !== "prompt") {
    return false;
  }

  if (filter === "video") {
    return item.promptModality === "video";
  }

  return item.promptModality !== "video";
}

function toSlotItem(item: ContentItem | SlotItem): SlotItem {
  return {
    ...item,
    publishedAt: item.publishedAt ?? null
  };
}

function hasVideoCapability(item: Pick<ContentItem, "previewUrl" | "sourceUrl" | "posterUrl" | "coverUrl" | "promptModality">) {
  if (item.promptModality === "video") {
    return true;
  }

  const mediaUrl = item.previewUrl ?? item.sourceUrl ?? "";
  return /\.(mp4|mov|webm|m3u8)(\?.*)?$/i.test(mediaUrl) || Boolean(item.previewUrl) || Boolean(item.posterUrl ?? item.coverUrl);
}

function takeUniqueContentItems(items: readonly ContentItem[], count: number, taken: Set<string>) {
  const picked: ContentItem[] = [];

  for (const item of items) {
    const key = contentItemKey(item);
    if (taken.has(key)) {
      continue;
    }

    taken.add(key);
    picked.push(item);
    if (picked.length >= count) {
      break;
    }
  }

  return picked;
}

function fillUniqueContentItems(
  seed: readonly ContentItem[],
  fallbackPool: readonly ContentItem[],
  count: number,
  taken: Set<string>
) {
  const next = [...seed];

  if (next.length >= count) {
    return next.slice(0, count);
  }

  next.push(...takeUniqueContentItems(fallbackPool, count - next.length, taken));
  return next;
}

function buildHomeFallbackSlotItems(candidatePool: readonly ContentItem[]) {
  const prompts = candidatePool.filter((item) => item.targetType === "prompt");
  const workflows = candidatePool.filter((item) => item.targetType === "workflow");
  const videoPrompts = prompts.filter(hasVideoCapability);
  const imagePrompts = prompts.filter((item) => !videoPrompts.some((candidate) => contentItemKey(candidate) === contentItemKey(item)));
  const workflowLeads = workflows.filter(hasVideoCapability);
  const workflowBase = workflowLeads.length > 0 ? workflowLeads : workflows;
  const fallbackPool = [...videoPrompts, ...imagePrompts, ...workflows];
  const heroTaken = new Set<string>();
  const shelfTaken = new Set<string>();

  const homeHero = takeUniqueContentItems([...videoPrompts, ...prompts, ...workflows], 3, heroTaken);
  const recommendedPrimary = fillUniqueContentItems(takeUniqueContentItems(videoPrompts, 4, shelfTaken), fallbackPool, 4, shelfTaken);
  const recommendedSecondary = fillUniqueContentItems(takeUniqueContentItems(workflowBase, 4, shelfTaken), fallbackPool, 4, shelfTaken);
  const canvas = fillUniqueContentItems(takeUniqueContentItems(videoPrompts, 4, shelfTaken), fallbackPool, 4, shelfTaken);
  const commercial = takeUniqueContentItems(fallbackPool, 4, shelfTaken);
  const animation = takeUniqueContentItems(fallbackPool, 4, shelfTaken);
  const narrative = takeUniqueContentItems(fallbackPool, 4, shelfTaken);
  const mv = takeUniqueContentItems(fallbackPool, 4, shelfTaken);
  const creative = takeUniqueContentItems(fallbackPool, 4, shelfTaken);

  return {
    "home-hero": homeHero,
    "recommended-primary": recommendedPrimary,
    "recommended-secondary": recommendedSecondary,
    canvas,
    commercial,
    animation,
    narrative,
    mv,
    creative
  } satisfies Record<string, ContentItem[]>;
}

function buildFeaturedFallbackSlotItems(candidatePool: readonly ContentItem[]) {
  const prompts = candidatePool.filter((item) => item.targetType === "prompt");
  const workflows = candidatePool.filter((item) => item.targetType === "workflow");
  const posts = candidatePool.filter((item) => item.targetType === "post");

  return {
    "featured-all": candidatePool.slice(0, 12),
    "featured-workflow": workflows.slice(0, 12),
    "featured-video-prompt": prompts.filter((item) => item.promptModality === "video").slice(0, 12),
    "featured-image-prompt": prompts.filter((item) => item.promptModality !== "video").slice(0, 12),
    "featured-activity": posts.slice(0, 12)
  } satisfies Record<string, ContentItem[]>;
}

function buildDiscussionFallbackSlotItems(candidatePool: readonly ContentItem[], slots: readonly SlotData[]) {
  const map: Record<string, ContentItem[]> = {};

  for (const slot of slots) {
    if (slot.key === "discussion-channel-order") {
      map[slot.key] = candidatePool.filter((item) => item.targetType === "channel").slice(0, slot.maxItems);
      continue;
    }

    const channelSlug = discussionSlotChannelSlug(slot.key);
    const scopedPosts = candidatePool.filter((item) => {
      if (item.targetType !== "post") {
        return false;
      }
      if (!channelSlug) {
        return true;
      }
      return item.channelSlug === channelSlug;
    });

    map[slot.key] = scopedPosts.slice(0, slot.maxItems);
  }

  return map;
}

function buildFallbackItemsBySlot(page: FeedOpsPageKind, data: FeedOpsPageData): Record<string, ContentItem[]> {
  if (page === "home") {
    return buildHomeFallbackSlotItems(data.candidatePool);
  }

  if (page === "featured") {
    return buildFeaturedFallbackSlotItems(data.candidatePool);
  }

  return buildDiscussionFallbackSlotItems(data.candidatePool, data.slots);
}

function mergeConfiguredWithFallbackItems(
  configuredItems: readonly SlotItem[],
  fallbackItems: readonly ContentItem[],
  maxItems: number
) {
  const merged = configuredItems.map(toSlotItem);
  const seen = new Set(merged.map(contentItemKey));

  for (const item of fallbackItems) {
    const key = contentItemKey(item);
    if (seen.has(key)) {
      continue;
    }

    merged.push(toSlotItem(item));
    seen.add(key);

    if (merged.length >= maxItems) {
      break;
    }
  }

  return merged.slice(0, maxItems);
}

function dedupeSlotItems(items: readonly SlotItem[], excludedKeys?: ReadonlySet<string>) {
  const seen = new Set<string>();
  const next: SlotItem[] = [];

  for (const item of items) {
    const key = contentItemKey(item);
    if (seen.has(key) || excludedKeys?.has(key)) {
      continue;
    }

    seen.add(key);
    next.push(toSlotItem(item));
  }

  return next;
}

function buildVisibleSlotItems(
  seedItems: readonly SlotItem[],
  fallbackItems: readonly ContentItem[],
  maxItems: number,
  excludedKeys?: ReadonlySet<string>
) {
  const next = dedupeSlotItems(seedItems, excludedKeys);
  const seen = new Set(next.map(contentItemKey));

  for (const item of fallbackItems) {
    const key = contentItemKey(item);
    if (seen.has(key) || excludedKeys?.has(key)) {
      continue;
    }

    seen.add(key);
    next.push(toSlotItem(item));

    if (next.length >= maxItems) {
      break;
    }
  }

  return next.slice(0, maxItems);
}

function paginateItems<T>(items: readonly T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = items.length === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = items.length === 0 ? 0 : Math.min(startIndex + pageSize, items.length);

  return {
    items: items.slice(startIndex, endIndex),
    page: safePage,
    totalPages,
    startIndex,
    endIndex
  };
}

function PaginationBar({
  page,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onChange
}: {
  page: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onChange: (page: number) => void;
}) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={styles.paginationBar}>
      <span className={styles.paginationText}>
        第 {page} / {totalPages} 页 · 显示 {startIndex + 1}-{endIndex} / {totalItems}
      </span>
      <div className={styles.paginationActions}>
        <button
          className={styles.paginationButton}
          disabled={page <= 1}
          type="button"
          onClick={() => onChange(page - 1)}
        >
          上一页
        </button>
        <button
          className={styles.paginationButton}
          disabled={page >= totalPages}
          type="button"
          onClick={() => onChange(page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="9" cy="9" r="5.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <circle cx="5" cy="4" fill="currentColor" r="1" />
      <circle cx="11" cy="4" fill="currentColor" r="1" />
      <circle cx="5" cy="8" fill="currentColor" r="1" />
      <circle cx="11" cy="8" fill="currentColor" r="1" />
      <circle cx="5" cy="12" fill="currentColor" r="1" />
      <circle cx="11" cy="12" fill="currentColor" r="1" />
    </svg>
  );
}

function thumbToneClass(item: Pick<ContentItem, "targetType" | "promptModality" | "channelTitle">) {
  if (item.targetType === "channel") {
    return styles.thumbDiagram;
  }
  if (item.targetType === "post") {
    return item.channelTitle ? styles.thumbPortrait : styles.thumbNeon;
  }
  if (item.promptModality === "image") {
    return styles.thumbSnow;
  }
  if (item.promptModality === "video") {
    return styles.thumbNeon;
  }
  return styles.thumbMountain;
}

function MediaThumb({
  item,
  variant,
  index,
  onOpenPreview
}: {
  item: ContentItem;
  variant: "pool" | "slot" | "hero" | "mini" | "arrange" | "list";
  index?: number;
  onOpenPreview?: () => void;
}) {
  const media = getFeedOpsMediaSources(item);
  const baseClass =
    variant === "pool"
      ? styles.poolThumb
      : variant === "slot"
        ? styles.slotThumb
        : variant === "hero"
          ? styles.previewHero
          : variant === "mini"
            ? styles.previewMiniThumb
            : variant === "list"
              ? styles.previewListThumb
              : styles.arrangeThumb;
  const mediaSrc = media.coverUrl ?? media.posterUrl ?? (media.canPreviewVideo ? null : media.previewUrl ?? media.sourceUrl ?? null);
  const canOpenPreview = typeof onOpenPreview === "function" && Boolean(media.coverUrl ?? media.posterUrl ?? media.previewUrl ?? media.sourceUrl);
  const showBadge = variant !== "slot";
  const badgeText = media.canPreviewVideo ? "视频资源" : mediaSrc ? "封面素材" : "暂无素材";
  const thumbContent = (
    <>
      {mediaSrc ? <img alt="" className={styles.mediaElement} decoding="async" loading="lazy" src={mediaSrc} /> : null}
      {media.canPreviewVideo ? <span className={styles.playBadge}>▶</span> : null}
      {showBadge ? <span className={styles.mediaBadge}>{badgeText}</span> : null}
      {typeof index === "number" ? <span className={styles.previewMiniIndex}>{index}</span> : null}
      {canOpenPreview && variant !== "slot" ? <span className={styles.mediaOpenHint}>点击预览</span> : null}
    </>
  );

  return (
    <div className={`${baseClass} ${styles.mediaFrame} ${mediaSrc ? styles.mediaReady : thumbToneClass(item)}`}>
      {canOpenPreview ? (
        <button aria-label={`预览 ${item.title}`} className={styles.mediaTrigger} type="button" onClick={onOpenPreview}>
          {thumbContent}
        </button>
      ) : (
        thumbContent
      )}
    </div>
  );
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

function statusLabel(statusCode: string) {
  if (statusCode === "published") {
    return "已发布";
  }

  if (statusCode === "draft") {
    return "草稿";
  }

  if (statusCode === "unavailable") {
    return "接口异常";
  }

  return "未配置";
}

function createInitialSlots(data: FeedOpsPageData): EditableSlotsState {
  return Object.fromEntries(data.slots.map((slot) => [slot.key, slot.items])) as EditableSlotsState;
}

function findSlot(data: FeedOpsPageData, slotKey: SlotKey): SlotData {
  const slot = data.slots.find((item) => item.key === slotKey);
  if (!slot) {
    throw new Error(`Missing slot definition: ${slotKey}`);
  }
  return slot;
}

function previewSlotKeys(page: FeedOpsPageKind, slotKeys: SlotKey[]): PreviewSlotKeys {
  const findPreviewKey = (preferredKey: string, fallbackIndex: number) =>
    slotKeys.find((slotKey) => slotKey === preferredKey) ?? slotKeys[fallbackIndex] ?? null;

  if (page === "home") {
    return {
      primary: findPreviewKey("home-hero", 0),
      secondary: findPreviewKey("recommended-primary", 1)
    };
  }

  if (page === "featured") {
    return {
      primary: findPreviewKey("featured-all", 0),
      secondary: findPreviewKey("featured-workflow", 1)
    };
  }

  return {
    primary: findPreviewKey("discussion-all-thread-stream", 1),
    secondary: findPreviewKey("discussion-channel-order", 0)
  };
}

function discussionSlotChannelSlug(slotKey: string) {
  const match = /^discussion-channel-(.+)-thread-stream$/.exec(slotKey);
  return match?.[1] ?? null;
}

function candidateSummary(item: ContentItem) {
  return trimSummaryText(item.summaryText) ?? "当前内容没有补充摘要，进入详情后可查看完整信息。";
}

function previewPanelCopy(page: FeedOpsPageKind, secondarySlotTitle?: string | null) {
  if (page === "home") {
    return {
      panelTitle: "首页结构预览",
      primaryTitle: "首页轮播预览",
      secondaryTitle: secondarySlotTitle ?? "为你推荐（第一组）",
      tertiaryTitle: "首页配置位清单",
      headerHint: "以真实首页首屏结构为准"
    };
  }

  if (page === "featured") {
    return {
      panelTitle: "精选页结构预览",
      primaryTitle: "全部 tab 首屏 12 条",
      secondaryTitle: secondarySlotTitle ?? "工作流 tab",
      tertiaryTitle: "精选 tab 清单",
      headerHint: "与精选页真实 tab 结构同步"
    };
  }

  return {
    panelTitle: "讨论区结构预览",
    primaryTitle: "全部帖子预览",
    secondaryTitle: "话题栏目顺序",
    tertiaryTitle: "讨论工作区清单",
    headerHint: "右侧热门话题与活跃贡献者不手动配置"
  };
}

function slotCounterText(count: number, maxItems: number) {
  return `${count}/${maxItems}`;
}

function SlotColumn({
  slot,
  items,
  disabled,
  onOpenArrange,
  onOpenPreview
}: {
  slot: SlotData;
  items: readonly SlotItem[];
  disabled: boolean;
  onOpenArrange: () => void;
  onOpenPreview: (item: SlotItem) => void;
}) {
  return (
    <section className={styles.slotSection}>
      <header className={styles.slotHeader}>
        <h3>{slot.title}</h3>
        <span>{slotCounterText(items.length, slot.maxItems)}</span>
      </header>

      <div className={styles.slotList}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <article key={`${slot.key}-${item.targetType}-${item.targetId}`} className={styles.slotItem}>
              <span className={styles.slotGrip}>
                <GripIcon />
              </span>
              <span className={styles.slotIndex}>{index + 1}</span>
              <MediaThumb item={item} variant="slot" onOpenPreview={() => onOpenPreview(item)} />
              <div className={styles.slotBody}>
                <strong>{item.title}</strong>
                <span>{contentMetaText(item)}</span>
              </div>
              <span className={styles.slotNote}>{item.available ? "可展示" : "资源失效"}</span>
              <button className={styles.iconGhost} disabled={disabled} type="button" onClick={onOpenArrange}>
                编排
              </button>
            </article>
          ))
        ) : (
          <div className={styles.emptyState}>当前配置位还没有挂载内容。</div>
        )}
      </div>

      <button className={styles.addPlaceholder} disabled={disabled} type="button" onClick={onOpenArrange}>
        + 打开编排器添加内容
      </button>
    </section>
  );
}

export default function FeedOpsPageClient({
  page,
  data,
  isFallback,
  modeDetail,
  errorMessage,
  successMessage,
  saveAction
}: FeedOpsPageClientProps) {
  const slotKeys = useMemo(() => data.slots.map((slot) => slot.key), [data.slots]);
  const initialSlotKey = (slotKeys[0] ?? "") as SlotKey;
  const [activeSceneKey, setActiveSceneKey] = useState<SlotKey>(initialSlotKey);
  const [isArrangeModalOpen, setIsArrangeModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [candidatePromptFilter, setCandidatePromptFilter] = useState<CandidatePromptFilter>(
    defaultPromptFilterForScene(initialSlotKey)
  );
  const [poolPage, setPoolPage] = useState(1);
  const [arrangePoolPage, setArrangePoolPage] = useState(1);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);
  const [previewItem, setPreviewItem] = useState<FeedOpsPreviewItem | null>(null);
  const [statusCode, setStatusCode] = useState(data.summary.statusCode);
  const [editableSlots, setEditableSlots] = useState<EditableSlotsState>(() => createInitialSlots(data));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const nextInitialSlotKey = (data.slots[0]?.key ?? "") as SlotKey;
    setStatusCode(data.summary.statusCode);
    setEditableSlots(createInitialSlots(data));
    setActiveSceneKey(nextInitialSlotKey);
    setCandidatePromptFilter(defaultPromptFilterForScene(nextInitialSlotKey));
    setPoolPage(1);
    setArrangePoolPage(1);
    setReplaceTargetIndex(null);
    setPreviewItem(null);
  }, [data]);

  useEffect(() => {
    setCandidatePromptFilter(defaultPromptFilterForScene(activeSceneKey));
  }, [activeSceneKey]);

  useEffect(() => {
    setPoolPage(1);
    setArrangePoolPage(1);
    setReplaceTargetIndex(null);
  }, [activeSceneKey, candidatePromptFilter, searchKeyword]);

  useEffect(() => {
    if (!isArrangeModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && previewItem === null) {
        setIsArrangeModalOpen(false);
        setReplaceTargetIndex(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isArrangeModalOpen, previewItem]);

  const effectiveSceneKey = (slotKeys.includes(activeSceneKey) ? activeSceneKey : initialSlotKey) as SlotKey;
  const activeScene = findSlot(data, effectiveSceneKey);
  const activeItems = editableSlots[effectiveSceneKey] ?? [];
  const fallbackItemsBySlot = useMemo(() => buildFallbackItemsBySlot(page, data), [data, page]);
  const displayedItemsBySlot = useMemo(() => {
    const entries = data.slots.map((slot) => [
      slot.key,
      mergeConfiguredWithFallbackItems(editableSlots[slot.key] ?? [], fallbackItemsBySlot[slot.key] ?? [], slot.maxItems)
    ]);

    return Object.fromEntries(entries) as EditableSlotsState;
  }, [data.slots, editableSlots, fallbackItemsBySlot]);
  const displayedItems = displayedItemsBySlot[effectiveSceneKey] ?? [];
  const activeFallbackItems = fallbackItemsBySlot[effectiveSceneKey] ?? [];
  const activeConfiguredKeys = useMemo(() => new Set(activeItems.map(contentItemKey)), [activeItems]);
  const previewKeys = previewSlotKeys(page, slotKeys);
  const primaryPreviewSlot = previewKeys.primary ? findSlot(data, previewKeys.primary) : null;
  const secondaryPreviewSlot = previewKeys.secondary ? findSlot(data, previewKeys.secondary) : null;
  const previewCopy = previewPanelCopy(page, secondaryPreviewSlot?.title);
  const primaryItems =
    previewKeys.primary === null
      ? []
      : (displayedItemsBySlot[previewKeys.primary] ?? []).slice(0, page === "home" ? 3 : page === "featured" ? 12 : 4);
  const secondaryItems =
    previewKeys.secondary === null
      ? []
      : (displayedItemsBySlot[previewKeys.secondary] ?? []).slice(0, page === "home" ? 4 : page === "featured" ? 4 : 8);
  const workspaceNote = feedOpsWorkspaceNote(page);
  const canSave = !isFallback && !isPending;
  const supportsPromptFilter = activeScene.allowedTargetTypes.includes("prompt");
  const modeTitle = isFallback ? "接口异常，只读预览" : "真实数据，可写配置";

  const filteredPool = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const allowedTargetTypes = new Set(activeScene.allowedTargetTypes);
    const scopedDiscussionChannelSlug = page === "discussions" ? discussionSlotChannelSlug(activeScene.key) : null;

    return data.candidatePool.filter((item) => {
      if (!allowedTargetTypes.has(item.targetType)) {
        return false;
      }

      if (page === "discussions" && item.targetType === "post" && scopedDiscussionChannelSlug && item.channelSlug !== scopedDiscussionChannelSlug) {
        return false;
      }

      if (!matchesPromptFilter(item, candidatePromptFilter)) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = `${item.title} ${item.authorDisplayName} ${item.channelTitle ?? ""} ${item.itemTypeLabel} ${item.summaryText ?? ""}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [activeScene.allowedTargetTypes, activeScene.key, candidatePromptFilter, data.candidatePool, page, searchKeyword]);
  const candidateCountLabel =
    candidatePromptFilter === "image"
      ? `${filteredPool.length} 条图片提示词`
      : candidatePromptFilter === "video"
        ? `${filteredPool.length} 条视频提示词`
        : `${filteredPool.length} 条`;
  const pagedPool = useMemo(
    () => paginateItems(filteredPool, poolPage, MAIN_POOL_PAGE_SIZE),
    [filteredPool, poolPage]
  );
  const pagedArrangePool = useMemo(
    () => paginateItems(filteredPool, arrangePoolPage, ARRANGE_POOL_PAGE_SIZE),
    [arrangePoolPage, filteredPool]
  );

  const openArrangeModal = (sceneKey: SlotKey) => {
    setActiveSceneKey(sceneKey);
    setReplaceTargetIndex(null);
    setIsArrangeModalOpen(true);
  };

  const closeArrangeModal = () => {
    setIsArrangeModalOpen(false);
    setReplaceTargetIndex(null);
    setPreviewItem(null);
  };
  const openPreview = (item: FeedOpsPreviewItem) => setPreviewItem(item);
  const renderPromptFilterGroup = (_ariaLabel: string) =>
    supportsPromptFilter ? (
      <div aria-label="candidate-prompt-filter" className={styles.filterSegment} role="tablist">
        {CANDIDATE_PROMPT_FILTER_OPTIONS.map((option) => {
          const isActive = candidatePromptFilter === option.value;

          return (
            <button
              key={option.value}
              aria-pressed={isActive}
              className={`${styles.filterSegmentButton} ${isActive ? styles.filterSegmentButtonActive : ""}`}
              type="button"
              onClick={() => setCandidatePromptFilter(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    ) : null;

  const syncDisplayedItemsToEditableSlot = (nextVisibleItems: readonly SlotItem[], excludedKeys?: ReadonlySet<string>) => {
    setEditableSlots((current) => ({
      ...current,
      [effectiveSceneKey]: buildVisibleSlotItems(nextVisibleItems, activeFallbackItems, activeScene.maxItems, excludedKeys)
    }));
  };

  const addItemToActiveSlot = (item: ContentItem) => {
    if (replaceTargetIndex !== null) {
      if (replaceTargetIndex < 0 || replaceTargetIndex >= displayedItems.length) {
        return;
      }

      const currentDisplayedItem = displayedItems[replaceTargetIndex];
      if (currentDisplayedItem?.targetType === item.targetType && currentDisplayedItem?.targetId === item.targetId) {
        return;
      }

      const replacedKey = currentDisplayedItem ? contentItemKey(currentDisplayedItem) : null;
      const nextVisibleItems = displayedItems.map((displayedItem, index) =>
        index === replaceTargetIndex ? toSlotItem(item) : toSlotItem(displayedItem)
      );

      syncDisplayedItemsToEditableSlot(
        nextVisibleItems,
        replacedKey ? new Set<string>([replacedKey]) : undefined
      );
      setReplaceTargetIndex(null);
      return;
    }

    setEditableSlots((current) => {
      const nextItems = current[effectiveSceneKey] ?? [];
      if (displayedItems.some((existing) => existing.targetType === item.targetType && existing.targetId === item.targetId)) {
        return current;
      }
      if (nextItems.length >= activeScene.maxItems) {
        return current;
      }
      return {
        ...current,
        [effectiveSceneKey]: [...nextItems, { ...item, publishedAt: item.publishedAt ?? null }]
      };
    });
    setReplaceTargetIndex(null);
  };

  const moveDisplayedItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= displayedItems.length) {
      return;
    }

    const nextVisibleItems = displayedItems.map(toSlotItem);
    const [moved] = nextVisibleItems.splice(index, 1);
    nextVisibleItems.splice(nextIndex, 0, moved);
    syncDisplayedItemsToEditableSlot(nextVisibleItems);
  };

  const removeDisplayedItem = (index: number) => {
    if (index < 0 || index >= displayedItems.length) {
      return;
    }

    const removedItem = displayedItems[index];
    const nextVisibleItems = displayedItems.filter((_, itemIndex) => itemIndex !== index).map(toSlotItem);
    syncDisplayedItemsToEditableSlot(
      nextVisibleItems,
      removedItem ? new Set<string>([contentItemKey(removedItem)]) : undefined
    );
    setReplaceTargetIndex((currentIndex) => {
      if (currentIndex === null) {
        return currentIndex;
      }
      if (currentIndex === index) {
        return null;
      }
      return currentIndex > index ? currentIndex - 1 : currentIndex;
    });
  };

  const clearSlot = (slotKey: SlotKey) => {
    setEditableSlots((current) => ({ ...current, [slotKey]: [] }));
    setReplaceTargetIndex(null);
  };

  const resetAll = () => {
    setStatusCode(data.summary.statusCode);
    setEditableSlots(createInitialSlots(data));
  };

  const saveCurrentState = (nextStatusCode: string) => {
    if (!canSave) {
      return;
    }

    const payload = {
      statusCode: nextStatusCode,
      slots: slotKeys.map((slotKey) => ({
        slotKey,
        items: (editableSlots[slotKey] ?? []).map((item) => ({
          targetType: item.targetType,
          targetId: item.targetId
        }))
      }))
    };

    const formData = new FormData();
    formData.set("payload", JSON.stringify(payload));
    setStatusCode(nextStatusCode);
    startTransition(() => {
      void saveAction(formData);
    });
  };

  return (
      <section className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <h1 className={styles.title}>{feedOpsPageTitle(page)}</h1>
            <p className={styles.subtitle}>{feedOpsPageSubtitle(page)}</p>
          </div>
        </header>

      {errorMessage ? (
        <div className={styles.errorBanner}>
          <strong>保存结果提示</strong>
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div className={styles.successBanner}>
          <strong>保存成功</strong>
          <span>{successMessage}</span>
        </div>
      ) : null}

      <div className={styles.tabRow}>
        {feedOpsTabItems(page).map((tab) =>
          tab.active ? (
            <button key={tab.key} className={`${styles.tab} ${styles.tabActive}`} type="button">
              {tab.label}
            </button>
          ) : (
            <Link key={tab.key} className={styles.tabLink} href={tab.href}>
              {tab.label}
            </Link>
          )
        )}
      </div>

      <div className={styles.stage}>
        <div className={styles.layout}>
          <section className={styles.poolCard}>
            <header className={styles.cardHeader}>
              <h2>候选内容池</h2>
            </header>

            <div className={styles.poolToolbar}>
              <label className={styles.searchField}>
                <span className={styles.searchIcon}>
                  <SearchIcon />
                </span>
                <input
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="搜索标题、作者、频道或摘要"
                  value={searchKeyword}
                />
              </label>
              {renderPromptFilterGroup("候选内容类型筛选")}
              <button className={styles.filterButton} disabled type="button">
                {filteredPool.length} 条
              </button>
            </div>

            <div className={styles.poolListViewport}>
              <div className={styles.poolList}>
              {filteredPool.length > 0 ? (
                pagedPool.items.map((item) => {
                  const selected = activeItems.some(
                    (existing) => existing.targetType === item.targetType && existing.targetId === item.targetId
                  );
                  const reachedLimit = activeItems.length >= activeScene.maxItems;
                  return (
                    <article key={`${item.targetType}-${item.targetId}`} className={styles.poolItem}>
                      <MediaThumb item={item} variant="pool" onOpenPreview={() => openPreview(item)} />
                      <div className={styles.poolBody}>
                        <strong>{item.title}</strong>
                        <span>{contentMetaText(item)}</span>
                        <div className={styles.metaRow}>
                          <span className={styles.metaTag}>{item.itemTypeLabel}</span>
                          <span className={styles.metaTag}>{formatDateTime(item.publishedAt)}</span>
                        </div>
                        <p className={styles.poolSummary}>{candidateSummary(item)}</p>
                      </div>
                      <button
                        className={styles.primaryGhost}
                        disabled={isFallback || selected || reachedLimit}
                        type="button"
                        onClick={() => addItemToActiveSlot(item)}
                      >
                        {selected ? "已加入" : reachedLimit ? "当前位已满" : "加入当前配置位"}
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className={styles.emptyState}>当前筛选下没有可挂载内容。</div>
              )}
              </div>
            </div>

            {filteredPool.length > 0 ? (
              <div className={styles.poolPaginationRow}>
                <PaginationBar
                  endIndex={pagedPool.endIndex}
                  page={pagedPool.page}
                  startIndex={pagedPool.startIndex}
                  totalItems={filteredPool.length}
                  totalPages={pagedPool.totalPages}
                  onChange={setPoolPage}
                />
              </div>
            ) : null}

            <footer className={styles.poolFooter}>
              <span>候选池共 {data.summary.candidateItemCount} 条内容</span>
              <button className={styles.footerLink} disabled type="button">
                {page === "discussions" && discussionSlotChannelSlug(activeScene.key)
                  ? "已按当前话题栏目自动过滤帖子"
                  : "仅显示当前配置位可挂载类型"}
              </button>
            </footer>
          </section>

          <section className={styles.workspaceCard}>
            <header className={styles.cardHeaderRow}>
              <div>
                <h2>编排工作区</h2>
                <p>{workspaceNote}</p>
              </div>
              <div className={styles.workspaceHeaderActions}>
                <button
                  className={styles.filterButton}
                  disabled={isFallback}
                  type="button"
                  onClick={() => openArrangeModal(effectiveSceneKey)}
                >
                  打开编排器
                </button>
                <button className={styles.filterButton} disabled={isFallback} type="button" onClick={resetAll}>
                  恢复初始
                </button>
              </div>
            </header>

            <div className={styles.workspaceGrid}>
              {data.slots.map((slot) => (
                <SlotColumn
                  key={slot.key}
                  disabled={isFallback}
                  items={editableSlots[slot.key] ?? []}
                  onOpenArrange={() => openArrangeModal(slot.key)}
                  onOpenPreview={openPreview}
                  slot={slot}
                />
              ))}
            </div>
          </section>

          <aside className={styles.previewCard}>
            <header className={styles.cardHeaderRow}>
              <h2>{previewCopy.panelTitle}</h2>
              <button className={styles.footerLink} disabled type="button">
                {previewCopy.headerHint}
              </button>
            </header>

            <div className={styles.previewSection}>
              <h3>{previewCopy.primaryTitle}</h3>
              {primaryItems.length > 0 ? (
                page === "discussions" ? (
                    <div className={styles.previewList}>
                      {primaryItems.map((item) => (
                        <article key={`${item.targetType}-${item.targetId}`} className={styles.previewListItem}>
                        <MediaThumb item={item} variant="list" onOpenPreview={() => openPreview(item)} />
                        <div>
                          <strong>{item.title}</strong>
                          <span>{contentMetaText(item)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.previewThumbRow}>
                    {primaryItems.map((item, index) => (
                      <article key={`${item.targetType}-${item.targetId}`} className={styles.previewMiniCard}>
                        <MediaThumb index={index + 1} item={item} variant="mini" onOpenPreview={() => openPreview(item)} />
                        <strong>{item.title}</strong>
                      </article>
                    ))}
                  </div>
                )
              ) : (
                <div className={styles.emptyState}>
                  {primaryPreviewSlot
                    ? `当前还没有给“${primaryPreviewSlot.title}”挂载内容。`
                    : "当前预览位还没有挂载内容。"}
                </div>
              )}
            </div>

            <div className={styles.previewSection}>
              <div className={styles.previewSectionHeader}>
                <h3>{previewCopy.secondaryTitle}</h3>
                <button className={styles.footerLink} disabled type="button">
                  {page === "discussions" ? "对应左侧话题栏目" : "对应真实首屏卡位"}
                </button>
              </div>
              {secondaryItems.length > 0 ? (
                page === "discussions" ? (
                  <div className={styles.previewList}>
                    {secondaryItems.map((item, index) => (
                      <article key={`${item.targetType}-${item.targetId}`} className={styles.previewListItem}>
                        <MediaThumb index={index + 1} item={item} variant="list" onOpenPreview={() => openPreview(item)} />
                        <div>
                          <strong>{item.title}</strong>
                          <span>{trimSummaryText(item.summaryText) ?? item.itemTypeLabel}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.previewThumbRow}>
                    {secondaryItems.map((item, index) => (
                      <article key={`${item.targetType}-${item.targetId}`} className={styles.previewMiniCard}>
                        <MediaThumb index={index + 1} item={item} variant="mini" onOpenPreview={() => openPreview(item)} />
                        <strong>{item.title}</strong>
                      </article>
                    ))}
                  </div>
                )
              ) : (
                <div className={styles.emptyState}>
                  {secondaryPreviewSlot
                    ? `当前还没有给“${secondaryPreviewSlot.title}”挂载内容。`
                    : "当前分区还没有挂载内容。"}
                </div>
              )}
            </div>

            <div className={styles.previewSection}>
              <div className={styles.previewSectionHeader}>
                <h3>{previewCopy.tertiaryTitle}</h3>
                <button className={styles.footerLink} disabled type="button">
                  共 {data.slots.length} 个工作区
                </button>
              </div>
              <div className={styles.previewList}>
                {data.slots.map((slot) => (
                  <article key={slot.key} className={styles.previewListItem}>
                    <div>
                      <strong>{slot.title}</strong>
                      <span>{slot.description}</span>
                    </div>
                    <strong>{slotCounterText((displayedItemsBySlot[slot.key] ?? []).length, slot.maxItems)}</strong>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.statusCard}>
              <div className={styles.statusRow}>
                <span>当前状态</span>
                <strong>{statusLabel(statusCode)}</strong>
              </div>
              <div className={styles.statusRow}>
                <span>最近更新时间</span>
                <strong>{formatDateTime(data.summary.updatedAt)}</strong>
              </div>
              <div className={styles.statusRow}>
                <span>最近更新人</span>
                <strong>{data.summary.updatedByDisplayName ?? "未记录"}</strong>
              </div>
              <div className={styles.statusRow}>
                <span>最近发布时间</span>
                <strong>{formatDateTime(data.summary.publishedAt)}</strong>
              </div>
            </div>

            <div className={styles.previewActions}>
              <button className={styles.primaryAction} disabled={!canSave} type="button" onClick={() => saveCurrentState("draft")}>
                {isPending ? "保存中..." : "保存草稿"}
              </button>
              <button className={styles.secondaryAction} disabled={!canSave} type="button" onClick={() => saveCurrentState("published")}>
                {isPending ? "发布中..." : "发布配置"}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {isArrangeModalOpen ? (
        <div className={styles.modalScrim} onClick={closeArrangeModal}>
          <section
            aria-labelledby="feed-ops-arrange-title"
            aria-modal="true"
            className={styles.arrangeModal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className={styles.arrangeHeader}>
              <div className={styles.arrangeHeading}>
                <div className={styles.arrangeTitleRow}>
                  <h3 id="feed-ops-arrange-title">编排工作区</h3>
                  <span className={styles.arrangeScene}>{activeScene.title}</span>
                </div>
              </div>
              <div className={styles.arrangeHeaderActions}>
                <span className={styles.arrangeStatus}>{statusLabel(statusCode)}</span>
                <button aria-label="关闭编排器" className={styles.modalCloseButton} type="button" onClick={closeArrangeModal}>
                  ×
                </button>
              </div>
            </header>

            <div className={styles.arrangeBody}>
              <section className={styles.arrangeSection}>
                <div className={styles.arrangeSectionTitle}>1. 当前配置位</div>
                <div className={styles.configGrid}>
                  <div>
                    <span>配置位</span>
                    <strong>{activeScene.title}</strong>
                  </div>
                  <div>
                    <span>所属页面</span>
                    <strong>{feedOpsPageTitle(page)}</strong>
                  </div>
                  <div>
                    <span>已挂载内容</span>
                    <strong>{activeItems.length}</strong>
                  </div>
                  <div>
                    <span>最大可挂载</span>
                    <strong>{activeScene.maxItems}</strong>
                  </div>
                  <div>
                    <span>配置状态</span>
                    <strong className={styles.configStatus}>{statusLabel(statusCode)}</strong>
                  </div>
                </div>
                <p className={styles.arrangePreviewNote}>{activeScene.description}</p>
                {displayedItems.length > 0 ? (
                  <div className={styles.arrangePreviewStrip}>
                    {displayedItems.map((item, index) => {
                      const isReplaceTarget = replaceTargetIndex === index;
                      const isConfiguredItem = activeConfiguredKeys.has(contentItemKey(item));
                      return (
                        <article
                          key={`preview-${effectiveSceneKey}-${item.targetType}-${item.targetId}`}
                          className={`${styles.arrangePreviewCard} ${isReplaceTarget ? styles.arrangePreviewCardActive : ""}`}
                        >
                          <div className={styles.arrangePreviewFrame}>
                            <MediaThumb item={item} variant="hero" onOpenPreview={() => openPreview(item)} />
                            <span className={styles.arrangePreviewIndex}>{index + 1}</span>
                            <span className={styles.arrangePreviewBadge}>{index === 0 ? "当前首位" : "已展示"}</span>
                          </div>
                          <strong>{item.title}</strong>
                          <button
                            className={styles.arrangeGhost}
                            disabled={isFallback}
                            type="button"
                            onClick={() => setReplaceTargetIndex(isReplaceTarget ? null : index)}
                          >
                            {isReplaceTarget ? "取消替换目标" : isConfiguredItem ? `替换第 ${index + 1} 位` : `接管第 ${index + 1} 位`}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.emptyState}>这里展示的是前台当前会看到的真实内容；如果还没有手工编排，会按系统回退规则补位。</div>
                )}
              </section>

              <div className={styles.arrangeColumns}>
                <section className={styles.arrangePanel}>
                  <div className={styles.arrangePanelHeader}>
                    <div className={styles.arrangeSectionTitle}>2. 候选内容池</div>
                    <span>这里只展示当前配置位允许挂载的内容类型。</span>
                  </div>
                  <div className={styles.arrangePanelToolbar}>
                    {renderPromptFilterGroup("编排候选内容类型筛选")}
                  </div>
                  <div className={styles.arrangePanelListViewport}>
                    <div className={styles.arrangePanelList}>
                    {filteredPool.length > 0 ? (
                      pagedArrangePool.items.map((item) => {
                        const selected = displayedItems.some(
                          (existing) => existing.targetType === item.targetType && existing.targetId === item.targetId
                        );
                        const reachedLimit = activeItems.length >= activeScene.maxItems;
                        const replacementItem = replaceTargetIndex !== null ? displayedItems[replaceTargetIndex] : null;
                        const replacingSameItem =
                          replacementItem?.targetType === item.targetType && replacementItem?.targetId === item.targetId;
                        return (
                          <article key={`candidate-${item.targetType}-${item.targetId}`} className={styles.arrangeCandidate}>
                            <MediaThumb item={item} variant="arrange" onOpenPreview={() => openPreview(item)} />
                            <div className={styles.arrangeCandidateBody}>
                              <strong>{item.title}</strong>
                              <span>{contentMetaText(item)}</span>
                              <div className={styles.arrangeMetaRow}>
                                <span>{item.itemTypeLabel}</span>
                                <span>{formatDateTime(item.publishedAt)}</span>
                              </div>
                            </div>
                            <button
                              className={styles.arrangeGhost}
                              disabled={
                                isFallback ||
                                (replaceTargetIndex === null ? selected || reachedLimit : replacingSameItem)
                              }
                              type="button"
                              onClick={() => addItemToActiveSlot(item)}
                            >
                              {replaceTargetIndex !== null
                                ? replacingSameItem
                                  ? "当前即该内容"
                                  : `替换第 ${replaceTargetIndex + 1} 位`
                                : selected
                                  ? "前台已展示"
                                  : reachedLimit
                                    ? "已满"
                                    : "加入"}
                            </button>
                          </article>
                        );
                      })
                    ) : (
                      <div className={styles.emptyState}>当前筛选结果为空，先调整搜索词或切换到别的配置位。</div>
                    )}
                    </div>
                  </div>
                  {filteredPool.length > 0 ? (
                    <PaginationBar
                      endIndex={pagedArrangePool.endIndex}
                      page={pagedArrangePool.page}
                      startIndex={pagedArrangePool.startIndex}
                      totalItems={filteredPool.length}
                      totalPages={pagedArrangePool.totalPages}
                      onChange={setArrangePoolPage}
                    />
                  ) : null}
                </section>

                <section className={styles.arrangePanel}>
                  <div className={styles.arrangePanelHeader}>
                    <div className={styles.arrangeSectionTitle}>3. 前台真实展示内容</div>
                    <span>可在这里调整顺序、删除内容，第一位通常是首个曝光位。</span>
                  </div>
                  <div className={styles.arrangePanelList}>
                    {displayedItems.length > 0 ? (
                      displayedItems.map((item, index) => {
                        const isConfiguredItem = activeConfiguredKeys.has(contentItemKey(item));

                        return (
                          <article
                            key={`arranged-${effectiveSceneKey}-${item.targetType}-${item.targetId}`}
                            className={`${styles.arrangeSelected} ${replaceTargetIndex === index ? styles.arrangeSelectedActive : ""}`}
                          >
                            <span className={styles.arrangeOrderGrip}>⋮⋮</span>
                            <span className={styles.arrangeOrderIndex}>{index + 1}</span>
                            <MediaThumb item={item} variant="arrange" onOpenPreview={() => openPreview(item)} />
                            <div className={styles.arrangeCandidateBody}>
                              <strong>{item.title}</strong>
                              <span>{contentMetaText(item)}</span>
                            </div>
                            <span className={styles.arrangePrimaryTag}>
                              {replaceTargetIndex === index
                                ? "替换目标"
                                : index === 0
                                  ? "首位曝光"
                                  : isConfiguredItem
                                    ? "手工配置"
                                    : "系统补位"}
                            </span>
                            <div className={styles.arrangeControlRow}>
                              <button
                                className={styles.arrangeGhost}
                                disabled={isFallback}
                                type="button"
                                onClick={() => setReplaceTargetIndex(replaceTargetIndex === index ? null : index)}
                              >
                                {replaceTargetIndex === index ? "取消替换" : isConfiguredItem ? "替换此位" : "接管此位"}
                              </button>
                              <button
                                className={styles.arrangeGhost}
                                disabled={isFallback || index === 0}
                                type="button"
                                onClick={() => moveDisplayedItem(index, -1)}
                              >
                                上移
                              </button>
                              <button
                                className={styles.arrangeGhost}
                                disabled={isFallback || index === displayedItems.length - 1}
                                type="button"
                                onClick={() => moveDisplayedItem(index, 1)}
                              >
                                下移
                              </button>
                              <button
                                className={styles.arrangeGhost}
                                disabled={isFallback}
                                type="button"
                                onClick={() => removeDisplayedItem(index)}
                              >
                                移除
                              </button>
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className={styles.emptyState}>当前前台真实展示内容为空，可先从左侧候选池加入或编排内容。</div>
                    )}
                  </div>
                  <div className={styles.arrangeHintRow}>
                    <span>
                      当前手工配置 {activeItems.length}/{activeScene.maxItems}，前台真实展示 {displayedItems.length}/{activeScene.maxItems}。
                      {activeItems.length < displayedItems.length ? " 标记为“系统补位”的内容，操作后会自动接管成手工编排。" : ""}
                    </span>
                    <button
                      className={styles.arrangeGhost}
                      disabled={isFallback || activeItems.length === 0}
                      type="button"
                      onClick={() => clearSlot(effectiveSceneKey)}
                    >
                      清空当前配置位
                    </button>
                  </div>
                </section>
              </div>
            </div>

            <footer className={styles.arrangeFooter}>
              <button className={styles.arrangeFooterGhost} type="button" onClick={closeArrangeModal}>
                关闭
              </button>
              <div className={styles.arrangeFooterActions}>
                <button className={styles.arrangeFooterGhost} disabled={!canSave} type="button" onClick={() => saveCurrentState("draft")}>
                  保存草稿
                </button>
                <button className={styles.arrangeFooterPrimary} disabled={!canSave} type="button" onClick={() => saveCurrentState("published")}>
                  发布配置
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      {previewItem ? <FeedOpsMediaPreview item={previewItem} onClose={() => setPreviewItem(null)} /> : null}
    </section>
  );
}
