"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/shared/PageShell";
import type { ApiPromptSummary, ApiWorkflowSummary } from "@/lib/contracts/community-api";
import { isVideoAssetUrl, normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import styles from "./FeaturedArchivePage.module.css";

type FeaturedFilter = "all" | "short" | "prompt" | "workflow" | "tool" | "activity";
type FeaturedSort = "hot" | "latest";
type FeaturedLayout = "hero" | "tall" | "compact" | "wide";

type FeaturedArchiveItem = {
  id: string;
  title: string;
  href: string;
  authorName: string;
  authorAvatarUrl?: string;
  coverUrl?: string;
  resourceType: "PROMPT" | "WORKFLOW";
  likes: number;
  createdAt: string;
  keywords: string[];
  filterGroup: Exclude<FeaturedFilter, "all">;
  layout: FeaturedLayout;
};

const FILTER_OPTIONS: Array<{ id: FeaturedFilter; label: string }> = [
  { id: "all", label: "全部" },
  { id: "short", label: "短片" },
  { id: "prompt", label: "提示词" },
  { id: "workflow", label: "工作流" },
  { id: "tool", label: "图片" },
  { id: "activity", label: "活动" }
];

const SORT_OPTIONS: Array<{ id: FeaturedSort; label: string }> = [
  { id: "hot", label: "最热" },
  { id: "latest", label: "最新" }
];

const layouts: FeaturedLayout[] = [
  "hero",
  "tall",
  "tall",
  "wide",
  "compact",
  "wide",
  "compact",
  "compact",
  "wide",
  "compact",
  "compact",
  "wide"
];

const layoutClassMap: Record<FeaturedLayout, string> = {
  hero: styles.cardHero,
  tall: styles.cardTall,
  compact: styles.cardCompact,
  wide: styles.cardWide
};

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

  return `${chars.slice(0, maxLength).join("")}…`;
}

function normalizeKeywordList(values: string[]) {
  return values
    .map((value) => normalizeText(value))
    .filter((value): value is string => Boolean(value))
    .map((value) => compactText(value, value, 12));
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

function estimateCardHeight(layout: FeaturedLayout) {
  switch (layout) {
    case "hero":
      return 300;
    case "tall":
      return 284;
    case "wide":
      return 164;
    case "compact":
    default:
      return 164;
  }
}

function distributeIntoColumns(items: FeaturedArchiveItem[], columnCount: number) {
  const columns = Array.from({ length: columnCount }, () => [] as FeaturedArchiveItem[]);
  const heights = Array.from({ length: columnCount }, () => 0);

  items.forEach((item) => {
    let targetIndex = 0;

    for (let index = 1; index < columnCount; index += 1) {
      if (heights[index] < heights[targetIndex]) {
        targetIndex = index;
      }
    }

    columns[targetIndex].push(item);
    heights[targetIndex] += estimateCardHeight(item.layout);
  });

  return columns;
}

function getPromptFilterGroup(prompt: ApiPromptSummary): FeaturedArchiveItem["filterGroup"] {
  return prompt.modality === "image" ? "tool" : "short";
}

function getWorkflowFilterGroup(workflow: ApiWorkflowSummary, index: number): FeaturedArchiveItem["filterGroup"] {
  if (normalizeText(workflow.summary)?.includes("图片")) {
    return "tool";
  }

  return index % 3 === 1 ? "tool" : "workflow";
}

function buildFeaturedArchiveItems(prompts: ApiPromptSummary[], workflows: ApiWorkflowSummary[]): FeaturedArchiveItem[] {
  return [
    ...prompts.map((item, index) => ({
      id: item.id,
      title: compactText(item.title, "未命名提示词", 22),
      href: `/prompts/${item.id}`,
      authorName: compactText(item.author.displayName, "DramaTV Creator", 18),
      authorAvatarUrl: normalizeAssetUrl(item.author.avatarUrl),
      coverUrl: normalizeAssetUrl(item.coverUrl),
      resourceType: "PROMPT" as const,
      likes: item.stats.likeCount,
      createdAt: `${10000000000000 - index}`,
      keywords: normalizeKeywordList(item.tagNames),
      filterGroup: getPromptFilterGroup(item),
      layout: layouts[index % layouts.length] ?? "compact"
    })),
    ...workflows.map((item, index) => ({
      id: item.id,
      title: compactText(item.title, "未命名工作流", 22),
      href: `/workflows/${item.id}`,
      authorName: compactText(item.author.displayName, "DramaTV Creator", 18),
      authorAvatarUrl: normalizeAssetUrl(item.author.avatarUrl),
      coverUrl: normalizeAssetUrl(item.coverUrl),
      resourceType: "WORKFLOW" as const,
      likes: item.likeCount ?? 0,
      createdAt: `2026-04-${String(10 - index).padStart(2, "0")}`,
      keywords: normalizeKeywordList([item.allowCopy ? "可复制" : "只读流程", item.summary ?? "", item.title]),
      filterGroup: getWorkflowFilterGroup(item, index),
      layout: layouts[prompts.length + index] ?? "wide"
    }))
  ];
}

function FeaturedCard({ item, className }: { item: FeaturedArchiveItem; className?: string }) {
  const mediaUrl = normalizeAssetUrl(item.coverUrl);
  const isVideoMedia = isVideoAssetUrl(mediaUrl);
  const mediaStyle = mediaUrl && !isVideoMedia ? { backgroundImage: `url(${mediaUrl})` } : undefined;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  async function handlePreviewStart() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    try {
      await video.play();
    } catch {}
  }

  function handlePreviewStop() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.pause();

    try {
      video.currentTime = 0;
    } catch {}
  }

  return (
    <Link
      className={`${styles.card}${className ? ` ${className}` : ""}`}
      data-resource-type={item.resourceType.toLowerCase()}
      href={item.href}
      onBlur={handlePreviewStop}
      onFocus={handlePreviewStart}
      onMouseEnter={handlePreviewStart}
      onMouseLeave={handlePreviewStop}
    >
      {isVideoMedia && mediaUrl ? (
        <video
          ref={videoRef}
          className={styles.cardMediaVideo}
          loop
          muted
          playsInline
          preload="metadata"
          src={mediaUrl}
        />
      ) : (
        <span className={styles.cardMedia} style={mediaStyle} />
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
          <span className={styles.cardMetric}>
            <HeartIcon />
            <span>{formatCompactNumber(item.likes)}</span>
          </span>
        </span>
      </span>
    </Link>
  );
}

export function FeaturedArchivePage({
  prompts,
  workflows
}: {
  prompts: ApiPromptSummary[];
  workflows: ApiWorkflowSummary[];
}) {
  const [activeFilter, setActiveFilter] = useState<FeaturedFilter>("all");
  const [activeSort, setActiveSort] = useState<FeaturedSort>("hot");
  const [searchQuery, setSearchQuery] = useState("");
  const featuredArchiveItems = useMemo(() => buildFeaturedArchiveItems(prompts, workflows), [prompts, workflows]);

  const visibleItems = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return [...featuredArchiveItems]
      .filter((item) => {
        const matchesFilter =
          activeFilter === "all"
            ? true
            : activeFilter === "prompt"
              ? item.resourceType === "PROMPT"
              : activeFilter === "workflow"
                ? item.resourceType === "WORKFLOW"
                : item.filterGroup === activeFilter;

        const haystack = `${item.title} ${item.authorName} ${item.keywords.join(" ")}`.toLowerCase();
        const matchesSearch = keyword.length === 0 ? true : haystack.includes(keyword);

        return matchesFilter && matchesSearch;
      })
      .sort((left, right) =>
        activeSort === "hot"
          ? right.likes - left.likes
          : new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
  }, [activeFilter, activeSort, searchQuery]);

  const leadPattern: FeaturedLayout[] = ["hero", "tall", "tall", "compact", "compact", "wide"];
  const leadItems = visibleItems.slice(0, Math.min(6, visibleItems.length));
  const masonryColumns = useMemo(() => distributeIntoColumns(visibleItems.slice(leadItems.length), 4), [leadItems.length, visibleItems]);

  return (
    <PageShell showHomeFloatingDock variant="home" topNavActive="featured">
      <div className={styles.page}>
        <section className={styles.toolbar}>
          <div className={styles.filterGroup}>
            {FILTER_OPTIONS.map((option) => (
              <button
                className={activeFilter === option.id ? styles.filterChipActive : styles.filterChip}
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className={styles.searchField}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索灵感、提示词、工作流..."
              type="search"
              value={searchQuery}
            />
          </label>

          <div className={styles.sortGroup}>
            {SORT_OPTIONS.map((option) => (
              <button
                className={activeSort === option.id ? styles.sortChipActive : styles.sortChip}
                key={option.id}
                onClick={() => setActiveSort(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.leadGrid}>
          {leadItems.map((item, index) => (
            <FeaturedCard item={item} key={item.id} className={layoutClassMap[leadPattern[index] ?? "compact"]} />
          ))}
        </section>

        {masonryColumns.some((column) => column.length > 0) ? (
          <section className={styles.masonry}>
            {masonryColumns.map((column, index) => (
              <div className={styles.masonryColumn} key={`column-${index}`}>
                {column.map((item) => (
                  <FeaturedCard item={item} key={item.id} className={layoutClassMap[item.layout]} />
                ))}
              </div>
            ))}
          </section>
        ) : null}

        {visibleItems.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>没有找到匹配内容</strong>
            <p>换个关键词，或者切回“全部”继续看当前精选档案。</p>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
