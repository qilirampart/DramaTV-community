"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type MouseEvent as ReactMouseEvent } from "react";
import { useCommunitySession } from "@/components/shared/CommunitySessionProvider";
import { PageShell } from "@/components/shared/PageShell";
import { useInteractiveVideoPreview } from "@/components/shared/useInteractiveVideoPreview";
import { togglePromptLikeAction } from "@/features/community-interactions/actions";
import type { ApiPromptSummary } from "@/lib/contracts/community-api";
import type { HomePageView, WorkflowMiniCardView } from "@/lib/contracts/view-models";
import { toIndexedContentCards, toResourceBadge } from "@/lib/content-index";
import { homeDemoCatalog, type HomeDemoCard, type HomeHeroSlide } from "@/lib/prefill/home-resource-catalog";
import { formatEntityTypeBadge, isVideoAssetUrl, normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import { buildBackAnchorSource, buildCurrentRoute, createBackAnchorId, useBackAnchorRestore } from "@/lib/routes/back-anchor";
import { appendBackSource } from "@/lib/routes/redirect-utils";
import { mergeCardsPreferCatalogMedia } from "./home-card-merge";
import styles from "./CommunityHomePage.module.css";

type CommunityHomePageProps = {
  heroPrompts?: ApiPromptSummary[];
  prompts?: ApiPromptSummary[];
  view: HomePageView;
};

type HomeCard = HomeDemoCard & {
  badge: string;
  likeTargetType?: "prompt";
  viewerLiked?: boolean;
};

type NewsItem = {
  id: string;
  subtitle: string;
  title: string;
  href: string;
};

function ChevronLeftIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3.5 14.4 9l5.6 2.4-5.6 2.4L12 19.5l-2.4-5.7L4 11.4 9.6 9 12 3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
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

function formatCompactNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }

  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toLocaleString("zh-CN");
}

function toDemoCardFromWorkflow(workflow: WorkflowMiniCardView): HomeCard {
  return {
    id: workflow.id,
    title: normalizeText(workflow.title) ?? "未命名工作流",
    summary: normalizeText(workflow.summary) ?? "查看这套工作流背后的镜头组织方式。",
    href: `/workflows/${workflow.id}`,
    coverUrl: workflow.coverUrl,
    author: {
      id: workflow.author.id,
      displayName: normalizeText(workflow.author.displayName) ?? "DramaTV Creator",
      avatarUrl: workflow.author.avatarUrl
    },
    resourceType: "workflow",
    badge: formatEntityTypeBadge("workflow"),
    primaryMetric: workflow.likeCount ?? 0,
    secondaryMetric: workflow.likeCount ?? 0
  };
}

function toDemoCardFromPrompt(prompt: ApiPromptSummary): HomeCard {
  return {
    id: prompt.id,
    title: normalizeText(prompt.title) ?? "未命名提示词",
    summary: normalizeText(prompt.summary) ?? "进入详情页继续查看提示词和示例内容。",
    href: `/prompts/${prompt.id}`,
    coverUrl: prompt.coverUrl,
    posterUrl: prompt.posterUrl,
    previewUrl: prompt.previewUrl,
    sourceUrl: prompt.sourceUrl,
    author: {
      id: prompt.author.id,
      displayName: normalizeText(prompt.author.displayName) ?? "DramaTV Creator",
      avatarUrl: prompt.author.avatarUrl
    },
    resourceType: "prompt",
    badge: formatEntityTypeBadge("prompt"),
    likeTargetType: "prompt",
    viewerLiked: prompt.viewerActions?.liked ?? false,
    primaryMetric: prompt.stats.exampleCount,
    secondaryMetric: prompt.stats.likeCount
  };
}

function toHeroSlideFromPrompt(prompt: ApiPromptSummary, index: number): HomeHeroSlide {
  const firstTag = prompt.tagNames.find((tag) => normalizeText(tag));
  const subtitleBase = prompt.modality === "video" ? "真实视频提示" : "真实图片提示";

  return {
    id: `hero-prompt-${prompt.id}`,
    title: normalizeText(prompt.title) ?? `真实导入内容 ${index + 1}`,
    subtitle: firstTag ? `${subtitleBase} · ${firstTag}` : subtitleBase,
    description: normalizeText(prompt.summary) ?? "当前首页头图已经切到真实导入内容，继续围绕提示词和工作流做社区分发。",
    href: `/prompts/${prompt.id}`,
    imageUrl: prompt.posterUrl ?? prompt.coverUrl,
    videoUrl: prompt.previewUrl,
    resourceType: "prompt"
  };
}

function toHeroSlideFromCard(card: HomeCard, index: number): HomeHeroSlide {
  const subtitle =
    card.resourceType === "workflow"
      ? "鐪熷疄宸ヤ綔娴佸唴瀹?"
      : card.badge || "鐪熷疄鎻愮ず璇嶅唴瀹?";

  const description =
    normalizeText(card.summary) ??
    (card.resourceType === "workflow"
      ? "褰撳墠棣栭〉澶村浘鍦ㄤ富 feed 鏁版嵁鍐呬紭鍏堜娇鐢ㄧ湡瀹炲伐浣滄祦鍐呭銆?"
      : "褰撳墠棣栭〉澶村浘鍦ㄤ富 feed 鏁版嵁鍐呬紭鍏堜娇鐢ㄧ湡瀹炴彁绀鸿瘝鍐呭銆?");

  return {
    id: `hero-card-${card.id}`,
    title: card.title || `鐪熷疄鍐呭 ${index + 1}`,
    subtitle,
    description,
    href: card.href,
    imageUrl: card.posterUrl ?? card.coverUrl,
    videoUrl: card.previewUrl,
    resourceType: card.resourceType
  };
}

function getHeroMediaUrl(slide?: HomeHeroSlide) {
  return normalizeAssetUrl(slide?.videoUrl) ?? normalizeAssetUrl(slide?.imageUrl);
}

function getHeroSlides(prompts: ApiPromptSummary[], indexedCards: HomeCard[]) {
  const videoPrompts = prompts.filter((prompt) => prompt.modality === "video" && Boolean(normalizeAssetUrl(prompt.previewUrl)));
  const fallbackVideoPrompts = prompts.filter((prompt) => Boolean(normalizeAssetUrl(prompt.previewUrl)));
  const preferredPrompts = videoPrompts.length >= 3 ? videoPrompts : fallbackVideoPrompts;
  const preferredCards = indexedCards.filter((card) => Boolean(normalizeAssetUrl(card.previewUrl)));
  const fallbackCards = indexedCards.filter((card) => Boolean(card.posterUrl ?? card.coverUrl));
  const mergedSlides = [
    ...preferredPrompts.map(toHeroSlideFromPrompt),
    ...preferredCards.map(toHeroSlideFromCard),
    ...fallbackCards.map(toHeroSlideFromCard)
  ];

  if (mergedSlides.length > 0) {
    const seen = new Set<string>();

    return mergedSlides
      .filter((slide) => {
        if (seen.has(slide.href)) {
          return false;
        }

        seen.add(slide.href);
        return true;
      })
      .slice(0, 3);
  }

  return homeDemoCatalog.heroSlides.slice(0, 3);
}

function asHomeCard(card: HomeDemoCard): HomeCard {
  return {
    ...card,
    badge: card.resourceType === "workflow" ? formatEntityTypeBadge("workflow") : formatEntityTypeBadge("prompt")
  };
}

function normalizeCards(cards: HomeCard[], fallback: HomeDemoCard[], count: number) {
  const merged = [...cards, ...fallback.map(asHomeCard)];
  const seen = new Set<string>();

  return merged
    .filter((item) => {
      if (seen.has(item.href)) {
        return false;
      }

      seen.add(item.href);
      return true;
    })
    .slice(0, count);
}

function resolveCardPreviewUrl(card: HomeCard) {
  const previewUrl = normalizeAssetUrl(card.previewUrl);
  if (previewUrl) {
    return previewUrl;
  }

  const sourceUrl = normalizeAssetUrl(card.sourceUrl);
  if (sourceUrl && isVideoAssetUrl(sourceUrl)) {
    return sourceUrl;
  }

  return undefined;
}

function withResolvedVideoPreview(card: HomeCard): HomeCard {
  const previewUrl = resolveCardPreviewUrl(card);
  if (previewUrl === card.previewUrl) {
    return card;
  }

  return {
    ...card,
    previewUrl
  };
}

function hasPlayableVideo(card: HomeCard) {
  return Boolean(resolveCardPreviewUrl(card));
}

function stableHash(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function sortCardsBySeed(cards: HomeCard[], seed: string) {
  return [...cards].sort((left, right) => {
    const leftRank = stableHash(`${seed}:${left.id}`);
    const rightRank = stableHash(`${seed}:${right.id}`);

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.id.localeCompare(right.id);
  });
}

function takeUniqueCards(cards: HomeCard[], count: number, takenIds: Set<string>) {
  const picked: HomeCard[] = [];

  for (const card of cards) {
    if (takenIds.has(card.id)) {
      continue;
    }

    takenIds.add(card.id);
    picked.push(card);

    if (picked.length >= count) {
      break;
    }
  }

  return picked;
}

function pickSectionCards(pools: HomeCard[][], count: number, takenIds: Set<string>, seed: string) {
  const orderedCards = pools
    .flatMap((pool, poolIndex) =>
      sortCardsBySeed(pool, `${seed}:${poolIndex}`).map((card) => ({
        card,
        poolIndex
      }))
    )
    .sort((left, right) => {
      if (left.poolIndex !== right.poolIndex) {
        return left.poolIndex - right.poolIndex;
      }

      return left.card.id.localeCompare(right.card.id);
    })
    .map(({ card }) => card);

  return takeUniqueCards(orderedCards, count, takenIds);
}

function slotItemsToHomeCards(items: HomePageView["feedItems"]): HomeCard[] {
  return toIndexedContentCards(items)
    .filter((item) => item.contentKind !== "post")
    .map((item): HomeCard => ({
      id: item.id,
      title: item.title,
      summary:
        item.summary ??
        (item.contentKind === "workflow_work"
          ? item.workflowTitle ?? "进入详情页继续查看作品与关联工作流。"
          : "进入详情页继续查看提示词和示例内容。"),
      href: item.href,
      coverUrl: item.coverUrl,
      posterUrl: item.posterUrl,
      previewUrl: item.previewUrl,
      sourceUrl: item.sourceUrl,
      author: item.author,
      resourceType: item.contentKind === "workflow_work" ? "workflow" : "prompt",
      badge: toResourceBadge(item.contentKind),
      likeTargetType: item.contentKind === "prompt" ? "prompt" : undefined,
      viewerLiked: false,
      primaryMetric: item.primaryMetric,
      secondaryMetric: item.secondaryMetric
    }))
    .map(withResolvedVideoPreview);
}

function findHomeLayoutSlot(view: HomePageView, slotKey: string) {
  return view.homeLayoutSlots?.find((slot) => slot.key === slotKey)?.items ?? [];
}

function HomeArchiveCard({
  card,
  variant = "landscape",
  backSource,
  anchorId,
  currentRoute
}: {
  card: HomeCard;
  variant?: "landscape" | "square";
  backSource: string;
  anchorId: string;
  currentRoute: string;
}) {
  const router = useRouter();
  const { currentUser } = useCommunitySession();
  const imageUrl = normalizeAssetUrl(card.posterUrl) ?? normalizeAssetUrl(card.coverUrl);
  const previewUrl = normalizeAssetUrl(card.previewUrl);
  const isVideoMedia = Boolean(previewUrl);
  const authorName = normalizeText(card.author.displayName) ?? "DramaTV Creator";
  const isPromptLikeCard = card.likeTargetType === "prompt";
  const [liked, setLiked] = useState(card.viewerLiked ?? false);
  const [likeCount, setLikeCount] = useState(card.secondaryMetric ?? card.primaryMetric);
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
    previewGroup: "community-home-grid",
    previewStartDelayMs: 160
    });
  const cardHref = appendBackSource(card.href, buildBackAnchorSource(backSource, anchorId));

  useEffect(() => {
    setLiked(card.viewerLiked ?? false);
    setLikeCount(card.secondaryMetric ?? card.primaryMetric);
  }, [card.id, card.primaryMetric, card.secondaryMetric, card.viewerLiked]);

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
        promptId: card.id,
        active: nextActive
      });

      if (!result.ok) {
        setLiked(previousLiked);
        setLikeCount(previousLikeCount);
        console.warn(`[community-home-card-like] ${result.message}`);
        return;
      }

      setLiked(result.view.viewerActions.liked);
      setLikeCount(result.view.stats.likeCount);
      router.refresh();
    });
  }

  return (
    <Link
      className={styles.archiveCard}
      data-variant={variant}
      href={cardHref}
      id={anchorId}
      onBlur={handlePreviewStop}
      onFocus={handlePreviewImmediateStart}
      onMouseEnter={handlePreviewStart}
      onMouseLeave={handlePreviewStop}
    >
      {isVideoMedia && previewUrl ? (
        <span className={styles.archiveMediaSlot} ref={mediaRef}>
          {imageUrl ? (
            <img
              alt={card.title}
              className={styles.archiveMediaImage}
              decoding="async"
              draggable={false}
              loading="lazy"
              sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 25vw"
              src={imageUrl}
            />
          ) : (
            <span className={styles.archiveMedia} />
          )}
          {shouldLoadVideo ? (
            <video
              ref={videoRef}
              className={`${styles.archiveMediaVideo} ${isVideoReady ? styles.archiveMediaVideoReady : ""}`}
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
          alt={card.title}
          className={styles.archiveMediaImage}
          decoding="async"
          draggable={false}
          loading="lazy"
          sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 25vw"
          src={imageUrl}
        />
      ) : (
        <span className={styles.archiveMedia} />
      )}
      <span className={styles.archiveShade} />
      <span className={styles.archiveBadge}>{card.badge}</span>
      <span className={styles.archiveBody}>
        <strong>{card.title}</strong>
        <span className={styles.archiveMeta}>
          <span>@{authorName}</span>
          {isPromptLikeCard ? (
            <button
              aria-label={liked ? "取消点赞" : "点赞"}
              aria-pressed={liked}
              className={`${styles.archiveMetricButton}${liked ? ` ${styles.archiveMetricButtonActive}` : ""}`}
              disabled={pending}
              type="button"
              onClick={handleLikeClick}
            >
              <HeartIcon />
              {formatCompactNumber(likeCount)}
            </button>
          ) : (
            <span className={styles.archiveMetric}>
              <HeartIcon />
              {formatCompactNumber(card.secondaryMetric ?? card.primaryMetric)}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

function ContentShelf({
  title,
  items,
  variant = "landscape",
  sectionKey,
  backSource,
  currentRoute
}: {
  title: string;
  items: HomeCard[];
  variant?: "landscape" | "square";
  sectionKey: string;
  backSource: string;
  currentRoute: string;
}) {
  return (
    <section className={styles.shelf}>
      <div className={styles.shelfHeader}>
        <h3>{title}</h3>
        <Link href="/featured">查看全部</Link>
      </div>
      <div className={styles.shelfGrid} data-variant={variant}>
        {items.map((item, index) => (
          <HomeArchiveCard
            anchorId={createBackAnchorId("home-card", `${sectionKey}-${index}-${item.id}`)}
            backSource={backSource}
            card={item}
            currentRoute={currentRoute}
            key={`${title}-${item.id}`}
            variant={variant}
          />
        ))}
      </div>
    </section>
  );
}

function heroToNewsItem(slide: HomeHeroSlide, index: number): NewsItem {
  return {
    id: slide.id,
    subtitle: slide.subtitle || (index === 0 ? "重构 · 碰撞 · 进化" : "全面升级AI视频创作体验"),
    title: slide.title,
    href: slide.href
  };
}

export function CommunityHomePage({ heroPrompts = [], prompts = [], view }: CommunityHomePageProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroVideoReadyMap, setHeroVideoReadyMap] = useState<Record<string, boolean>>({});
  const heroVideoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const indexedCards = useMemo(
    () =>
      toIndexedContentCards(view.feedItems)
        .filter((item) => item.contentKind !== "post")
        .map(
          (item): HomeCard => ({
      id: item.id,
      title: item.title,
      summary:
        item.summary ??
        (item.contentKind === "workflow_work"
            ? item.workflowTitle ?? "进入详情页继续查看作品与关联工作流。"
            : "进入详情页继续查看提示词和示例内容。"),
      href: item.href,
      coverUrl: item.coverUrl,
      posterUrl: item.posterUrl,
      previewUrl: item.previewUrl,
      sourceUrl: item.sourceUrl,
      author: item.author,
      resourceType: item.contentKind === "workflow_work" ? "workflow" : "prompt",
      badge: toResourceBadge(item.contentKind),
      likeTargetType: item.contentKind === "prompt" ? "prompt" : undefined,
      viewerLiked: false,
      primaryMetric: item.primaryMetric,
      secondaryMetric: item.secondaryMetric
          })
        ),
    [view.feedItems]
  );
  const promptCards = useMemo(() => prompts.map(toDemoCardFromPrompt), [prompts]);
  const workflowCards = useMemo(() => view.hotWorkflows.map(toDemoCardFromWorkflow).map(withResolvedVideoPreview), [view.hotWorkflows]);
  const mergedPromptCards = useMemo(
    () => mergeCardsPreferCatalogMedia(indexedCards, promptCards).map(withResolvedVideoPreview),
    [indexedCards, promptCards]
  );
  const realPromptCards = useMemo(
    () => normalizeCards(mergedPromptCards, [], Math.max(mergedPromptCards.length, 30)),
    [mergedPromptCards]
  );
  const heroSlotCards = useMemo(() => slotItemsToHomeCards(findHomeLayoutSlot(view, "home-hero")), [view]);
  const recommendedPrimarySlotCards = useMemo(
    () => slotItemsToHomeCards(findHomeLayoutSlot(view, "recommended-primary")),
    [view]
  );
  const recommendedSecondarySlotCards = useMemo(
    () => slotItemsToHomeCards(findHomeLayoutSlot(view, "recommended-secondary")),
    [view]
  );
  const canvasSlotCards = useMemo(() => slotItemsToHomeCards(findHomeLayoutSlot(view, "canvas")), [view]);
  const commercialSlotCards = useMemo(() => slotItemsToHomeCards(findHomeLayoutSlot(view, "commercial")), [view]);
  const animationSlotCards = useMemo(() => slotItemsToHomeCards(findHomeLayoutSlot(view, "animation")), [view]);
  const narrativeSlotCards = useMemo(() => slotItemsToHomeCards(findHomeLayoutSlot(view, "narrative")), [view]);
  const mvSlotCards = useMemo(() => slotItemsToHomeCards(findHomeLayoutSlot(view, "mv")), [view]);
  const creativeSlotCards = useMemo(() => slotItemsToHomeCards(findHomeLayoutSlot(view, "creative")), [view]);
  const workflowCardsNormalized = useMemo(
    () => normalizeCards(workflowCards, homeDemoCatalog.workflowSection, Math.max(workflowCards.length, 12)),
    [workflowCards]
  );
  const homeShuffleSeed = useMemo(
    () =>
      [
        "home",
        heroPrompts.map((item) => item.id).join(","),
        prompts.map((item) => item.id).join(","),
        view.feedItems.map((item) => item.targetId).join(","),
        view.hotWorkflows.map((item) => item.id).join(",")
      ].join("|"),
    [heroPrompts, prompts, view.feedItems, view.hotWorkflows]
  );
  const videoPromptCards = useMemo(
    () => realPromptCards.filter((card) => card.resourceType === "prompt" && hasPlayableVideo(card)),
    [realPromptCards]
  );
  const nonVideoPromptCards = useMemo(
    () => realPromptCards.filter((card) => card.resourceType === "prompt" && !hasPlayableVideo(card)),
    [realPromptCards]
  );
  const heroSlides = useMemo(() => {
    const heroPromptSlides = getHeroSlides(heroPrompts.length > 0 ? heroPrompts : prompts, realPromptCards).filter(
      (slide) => Boolean(normalizeAssetUrl(slide.videoUrl))
    );
    const heroSlotVideoSlides = heroSlotCards.filter(hasPlayableVideo).slice(0, 3).map(toHeroSlideFromCard);
    const catalogVideoSlides = homeDemoCatalog.heroSlides.filter((slide) => Boolean(normalizeAssetUrl(slide.videoUrl)));
    const mergedSlides = [...heroSlotVideoSlides, ...heroPromptSlides, ...catalogVideoSlides];
    const seen = new Set<string>();

    return mergedSlides
      .filter((slide) => {
        if (seen.has(slide.href)) {
          return false;
        }

        seen.add(slide.href);
        return true;
      })
      .slice(0, 3);
  }, [heroPrompts, heroSlotCards, prompts, realPromptCards]);
  const homeShelves = useMemo(() => {
    const takenIds = new Set<string>();
    const videoWorkflowCards = workflowCardsNormalized.filter(hasPlayableVideo);
    const promptAndWorkflowPool = [...videoPromptCards, ...videoWorkflowCards];
    const mixedPool = [...promptAndWorkflowPool, ...nonVideoPromptCards, ...workflowCardsNormalized];

    return {
      recommendedPrimary: pickSectionCards(
        [recommendedPrimarySlotCards, promptAndWorkflowPool, mixedPool],
        4,
        takenIds,
        `${homeShuffleSeed}:recommended-primary`
      ),
      recommendedSecondary: pickSectionCards(
        [recommendedSecondarySlotCards, promptAndWorkflowPool, mixedPool],
        4,
        takenIds,
        `${homeShuffleSeed}:recommended-secondary`
      ),
      featuredCanvas: pickSectionCards([canvasSlotCards, promptAndWorkflowPool, mixedPool], 4, takenIds, `${homeShuffleSeed}:featured-canvas`),
      commercial: pickSectionCards([commercialSlotCards, mixedPool], 4, takenIds, `${homeShuffleSeed}:commercial`),
      animation: pickSectionCards([animationSlotCards, mixedPool], 4, takenIds, `${homeShuffleSeed}:animation`),
      narrative: pickSectionCards([narrativeSlotCards, mixedPool], 4, takenIds, `${homeShuffleSeed}:narrative`),
      mv: pickSectionCards([mvSlotCards, mixedPool], 4, takenIds, `${homeShuffleSeed}:mv`),
      creative: pickSectionCards([creativeSlotCards, mixedPool], 4, takenIds, `${homeShuffleSeed}:creative`)
    };
  }, [homeShuffleSeed, nonVideoPromptCards, videoPromptCards, workflowCardsNormalized]);
  const recommended = homeShelves.recommendedPrimary;
  const dramaTv = homeShelves.recommendedSecondary;
  const canvas = homeShelves.featuredCanvas;
  const commercial = homeShelves.commercial;
  const animation = homeShelves.animation;
  const narrative = homeShelves.narrative;
  const mv = homeShelves.mv;
  const creative = homeShelves.creative;
  const newsItems = useMemo(() => heroSlides.map(heroToNewsItem), [heroSlides]);
  const currentRoute = useMemo(() => buildCurrentRoute(pathname, searchParams), [pathname, searchParams]);
  const canvasPlaceholderHref = "/canvas/d2a551f9-8cd4-4fb3-bd72-b90a830f91e3";

  function setHeroVideoReady(slideId: string, ready: boolean) {
    setHeroVideoReadyMap((current) => {
      if ((current[slideId] ?? false) === ready) {
        return current;
      }

      return {
        ...current,
        [slideId]: ready
      };
    });
  }

  useEffect(() => {
    setHeroVideoReadyMap((current) => {
      const nextEntries = heroSlides.map((slide) => [slide.id, current[slide.id] ?? false] as const);
      const next = Object.fromEntries(nextEntries);
      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);

      if (
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => current[key] === next[key])
      ) {
        return current;
      }

      return next;
    });
  }, [heroSlides]);

  useEffect(() => {
    setHeroVideoReadyMap((current) => {
      const next = Object.fromEntries(
        heroSlides.map((slide, index) => {
          const video = heroVideoRefs.current[index];
          return [slide.id, Boolean(video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)] as const;
        })
      );
      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);

      if (
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => current[key] === next[key])
      ) {
        return current;
      }

      return next;
    });
  }, [activeSlide, heroSlides]);

  useBackAnchorRestore([heroSlides.length, newsItems.length, recommended.length, dramaTv.length, canvas.length, commercial.length, animation.length, narrative.length, mv.length, creative.length]);

  function goToPreviousSlide() {
    setActiveSlide((value) => (value > 0 ? value - 1 : heroSlides.length - 1));
  }

  function goToNextSlide() {
    setActiveSlide((value) => (value < heroSlides.length - 1 ? value + 1 : 0));
  }

  useEffect(() => {
    if (activeSlide >= heroSlides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((value) => (value < heroSlides.length - 1 ? value + 1 : 0));
    }, 6500);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    heroVideoRefs.current.forEach((video, index) => {
      if (!video) {
        return;
      }

      if (index === activeSlide) {
        video.muted = true;
        void video.play().catch(() => {});
        return;
      }

      video.pause();

      try {
        video.currentTime = 0;
      } catch {}
    });
  }, [activeSlide, heroSlides.length]);

  return (
    <PageShell showHomeFloatingDock variant="home" topNavActive="home">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroFrame}>
            {heroSlides.map((slide, index) => {
              const mediaUrl = getHeroMediaUrl(slide);
              const posterUrl = normalizeAssetUrl(slide.imageUrl);
              const isVideoMedia = isVideoAssetUrl(mediaUrl);
              const isActive = index === activeSlide;
              const shouldWarmVideo = heroSlides.length <= 1 || index === ((activeSlide + 1) % heroSlides.length);
              const shouldRenderVideo = isVideoMedia && mediaUrl && (isActive || shouldWarmVideo);

              return (
                <Link
                  aria-hidden={!isActive}
                  className={`${styles.heroMedia} ${isActive ? styles.heroMediaActive : ""}`}
                  href={appendBackSource(
                    slide.href,
                    buildBackAnchorSource(currentRoute, createBackAnchorId("home-hero", `${index}-${slide.id}`))
                  )}
                  id={createBackAnchorId("home-hero", `${index}-${slide.id}`)}
                  key={slide.id}
                  style={posterUrl ? { backgroundImage: `url(${posterUrl})` } : mediaUrl && !isVideoMedia ? { backgroundImage: `url(${mediaUrl})` } : undefined}
                  tabIndex={isActive ? undefined : -1}
                >
                  {shouldRenderVideo ? (
                    <video
                      ref={(element) => {
                        heroVideoRefs.current[index] = element;
                      }}
                      autoPlay={isActive}
                      className={`${styles.heroVideo} ${heroVideoReadyMap[slide.id] ? styles.heroVideoReady : ""}`}
                      loop
                      muted
                      onCanPlay={() => setHeroVideoReady(slide.id, true)}
                      onEmptied={() => setHeroVideoReady(slide.id, false)}
                      onLoadedData={() => setHeroVideoReady(slide.id, true)}
                      playsInline
                      poster={posterUrl ?? undefined}
                      preload={isActive ? "auto" : shouldWarmVideo ? "metadata" : "none"}
                      src={mediaUrl}
                      style={{ opacity: heroVideoReadyMap[slide.id] ? 1 : 0 }}
                    />
                  ) : null}
                  <span className={styles.heroShade} />
                </Link>
              );
            })}

            <button aria-label="上一张" className={styles.heroArrow} data-side="left" onClick={goToPreviousSlide} type="button">
              <ChevronLeftIcon />
            </button>
            <button aria-label="下一张" className={styles.heroArrow} data-side="right" onClick={goToNextSlide} type="button">
              <ChevronRightIcon />
            </button>
          </div>

          <div className={styles.newsStrip}>
            {newsItems.map((item, index) => (
              <Link
                className={index === activeSlide ? styles.newsItemActive : styles.newsItem}
                href={appendBackSource(
                  item.href,
                  buildBackAnchorSource(currentRoute, createBackAnchorId("home-news", `${index}-${item.id}`))
                )}
                id={createBackAnchorId("home-news", `${index}-${item.id}`)}
                key={item.id}
                onMouseEnter={() => setActiveSlide(index)}
              >
                <span>{item.subtitle}</span>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </div>

          <div className={styles.dots}>
            {heroSlides.map((slide, index) => (
              <button
                aria-label={`切换到 ${slide.title}`}
                className={index === activeSlide ? styles.dotActive : styles.dot}
                key={slide.id}
                onClick={() => setActiveSlide(index)}
                type="button"
              />
            ))}
          </div>
        </section>

        <section className={styles.inspiration}>
          <h2>灵感迸发</h2>
          <Link className={styles.canvasCta} href={canvasPlaceholderHref}>
            <span className={styles.canvasIcon}>
              <SparkIcon />
            </span>
            <span>
              <strong>进入无限画布</strong>
              <em>立即开启您的创意之旅</em>
            </span>
          </Link>
        </section>

        <div className={styles.shelves}>
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={recommended} sectionKey="recommended-primary" title="为你推荐" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={dramaTv} sectionKey="recommended-secondary" title="为你推荐" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={canvas} sectionKey="canvas" title="精选画布" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={commercial} sectionKey="commercial" title="电视广告" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={animation} sectionKey="animation" title="动画" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={narrative} sectionKey="narrative" title="叙事短片" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={mv} sectionKey="mv" title="MV" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={creative} sectionKey="creative" title="创意" />
        </div>
      </div>
    </PageShell>
  );
}
