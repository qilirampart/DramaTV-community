import type { ApiPromptSummary } from "@/lib/contracts/community-api";
import type { HomePageView, WorkflowMiniCardView } from "@/lib/contracts/view-models";
import { toIndexedContentCards, toResourceBadge } from "@/lib/content-index";
import { resolveCardVideoPlaybackUrl } from "@/lib/media-playback";
import { homeDemoCatalog, type HomeDemoCard, type HomeHeroSlide } from "@/lib/prefill/home-resource-catalog";
import { formatEntityTypeBadge, normalizeText } from "@/lib/presentation";
import { mergeCardsPreferCatalogMedia, type MergeableMediaCard } from "./home-card-merge";

export const HOME_PROMPT_FETCH_LIMIT = 30;

const HERO_SLIDE_LIMIT = 6;
const HOME_SHELF_CARD_COUNT = 4;

type HomeCardKind = "prompt" | "workflow";

type HomeSourceCard = MergeableMediaCard & {
  href: string;
  kind: HomeCardKind;
  badge: string;
  likeCount: number;
  likeable?: boolean;
  viewerLiked?: boolean;
  promptModality?: "image" | "video";
};

export type HomeHeroSlideData = {
  id: string;
  title: string;
  href: string;
  imageUrl?: string;
  videoUrl?: string;
};

export type HomeCard = {
  id: string;
  title: string;
  href: string;
  imageUrl?: string;
  playbackUrl?: string;
  authorName: string;
  badge: string;
  likeCount: number;
  likeable?: boolean;
  viewerLiked?: boolean;
};

export type CommunityHomePageData = {
  heroSlides: HomeHeroSlideData[];
  shelves: {
    recommendedPrimary: HomeCard[];
    commercial: HomeCard[];
    animation: HomeCard[];
    narrative: HomeCard[];
    mv: HomeCard[];
    creative: HomeCard[];
  };
};

function toDemoCardFromWorkflow(workflow: WorkflowMiniCardView): HomeSourceCard {
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
    kind: "workflow",
    badge: formatEntityTypeBadge("workflow"),
    likeCount: workflow.likeCount ?? 0
  };
}

function toDemoCardFromPrompt(prompt: ApiPromptSummary): HomeSourceCard {
  return {
    id: prompt.id,
    title: normalizeText(prompt.title) ?? "未命名提示词",
    summary: normalizeText(prompt.summary) ?? "进入详情页继续查看提示词和示例内容。",
    href: `/prompts/${prompt.id}`,
    coverUrl: prompt.coverUrl,
    posterUrl: prompt.posterUrl,
    previewUrl: prompt.previewUrl,
    sourceUrl: prompt.sourceUrl,
    promptModality: prompt.modality,
    author: {
      id: prompt.author.id,
      displayName: normalizeText(prompt.author.displayName) ?? "DramaTV Creator",
      avatarUrl: prompt.author.avatarUrl
    },
    kind: "prompt",
    badge: formatEntityTypeBadge("prompt"),
    likeable: true,
    viewerLiked: prompt.viewerActions?.liked ?? false,
    likeCount: prompt.stats.likeCount
  };
}

function toHeroSlideFromPrompt(prompt: ApiPromptSummary, index: number): HomeHeroSlideData {
  return {
    id: `hero-prompt-${prompt.id}`,
    title: normalizeText(prompt.title) ?? `真实导入内容 ${index + 1}`,
    href: `/prompts/${prompt.id}`,
    imageUrl: prompt.posterUrl ?? prompt.coverUrl,
    videoUrl: resolveCardVideoPlaybackUrl({
      previewUrl: prompt.previewUrl,
      sourceUrl: prompt.sourceUrl,
      promptModality: prompt.modality,
      resourceType: "prompt"
    })
  };
}

function toHeroSlideFromCard(card: HomeSourceCard, index: number): HomeHeroSlideData {
  return {
    id: `hero-card-${card.id}`,
    title: card.title || `真实内容 ${index + 1}`,
    href: card.href,
    imageUrl: card.posterUrl ?? card.coverUrl,
    videoUrl: resolveCardVideoPlaybackUrl({
      previewUrl: card.previewUrl,
      sourceUrl: card.sourceUrl,
      promptModality: card.promptModality,
      resourceType: card.kind
    })
  };
}

function toHomeHeroSlideData(slide: HomeHeroSlide): HomeHeroSlideData {
  return {
    id: slide.id,
    title: slide.title,
    href: slide.href,
    imageUrl: slide.imageUrl,
    videoUrl: slide.videoUrl
  };
}

function getHeroSlides(prompts: ApiPromptSummary[], indexedCards: HomeSourceCard[]) {
  const videoPrompts = prompts.filter(
    (prompt) =>
      prompt.modality === "video"
      && Boolean(
        resolveCardVideoPlaybackUrl({
          previewUrl: prompt.previewUrl,
          sourceUrl: prompt.sourceUrl,
          promptModality: prompt.modality,
          resourceType: "prompt"
        })
      )
  );
  const fallbackVideoPrompts = prompts.filter((prompt) =>
    Boolean(
      resolveCardVideoPlaybackUrl({
        previewUrl: prompt.previewUrl,
        sourceUrl: prompt.sourceUrl,
        promptModality: prompt.modality,
        resourceType: "prompt"
      })
    )
  );
  const preferredPrompts = videoPrompts.length >= 3 ? videoPrompts : fallbackVideoPrompts;
  const preferredCards = indexedCards.filter(hasPlayableVideo);
  const fallbackCards = indexedCards.filter((card) => Boolean(card.posterUrl ?? card.coverUrl));
  const demoFallbackSlides = [
    ...homeDemoCatalog.heroSlides.map(toHomeHeroSlideData),
    ...homeDemoCatalog.filmstrip.map((card, index) => toHeroSlideFromCard(asHomeCard(card), index))
  ];
  const mergedSlides = [
    ...preferredPrompts.map(toHeroSlideFromPrompt),
    ...preferredCards.map(toHeroSlideFromCard),
    ...fallbackCards.map(toHeroSlideFromCard),
    ...demoFallbackSlides
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
      .slice(0, HERO_SLIDE_LIMIT);
  }

  return demoFallbackSlides.slice(0, HERO_SLIDE_LIMIT);
}

function asHomeCard(card: HomeDemoCard): HomeSourceCard {
  return {
    ...card,
    kind: card.resourceType,
    badge: card.resourceType === "workflow" ? formatEntityTypeBadge("workflow") : formatEntityTypeBadge("prompt"),
    likeCount: card.secondaryMetric,
    likeable: card.resourceType === "prompt",
    viewerLiked: false
  };
}

function normalizeCards(cards: HomeSourceCard[], fallback: HomeDemoCard[], count: number) {
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

function toHomeCardPayload(card: HomeSourceCard): HomeCard {
  return {
    id: card.id,
    title: card.title,
    href: card.href,
    imageUrl: card.posterUrl ?? card.coverUrl,
    playbackUrl: resolveCardVideoPlaybackUrl({
      previewUrl: card.previewUrl,
      sourceUrl: card.sourceUrl,
      promptModality: card.promptModality,
      resourceType: card.kind
    }),
    authorName: normalizeText(card.author.displayName) ?? "DramaTV Creator",
    badge: card.badge,
    likeCount: card.likeCount,
    likeable: card.likeable ?? false,
    viewerLiked: card.viewerLiked ?? false
  };
}

function hasPlayableVideo(card: HomeSourceCard) {
  return Boolean(
    resolveCardVideoPlaybackUrl({
      previewUrl: card.previewUrl,
      sourceUrl: card.sourceUrl,
      promptModality: card.promptModality,
      resourceType: card.kind
    })
  );
}

function stableHash(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function sortCardsBySeed(cards: HomeSourceCard[], seed: string) {
  return [...cards].sort((left, right) => {
    const leftRank = stableHash(`${seed}:${left.id}`);
    const rightRank = stableHash(`${seed}:${right.id}`);

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.id.localeCompare(right.id);
  });
}

function takeUniqueCards(cards: HomeSourceCard[], count: number, takenIds: Set<string>) {
  const picked: HomeSourceCard[] = [];

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

function pickSectionCards(pools: HomeSourceCard[][], count: number, takenIds: Set<string>, seed: string) {
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

function slotItemsToHomeCards(items: HomePageView["feedItems"]): HomeSourceCard[] {
  return toIndexedContentCards(items)
    .filter((item) => item.contentKind !== "post")
    .map((item): HomeSourceCard => ({
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
      promptModality: item.promptModality,
      author: item.author,
      kind: item.contentKind === "workflow_work" ? "workflow" : "prompt",
      badge: toResourceBadge(item.contentKind),
      likeable: item.contentKind === "prompt",
      viewerLiked: false,
      likeCount: item.secondaryMetric
    }));
}

function findHomeLayoutSlot(view: HomePageView, slotKey: string) {
  return view.homeLayoutSlots?.find((slot) => slot.key === slotKey)?.items ?? [];
}

export function buildCommunityHomePageData(
  view: HomePageView,
  prompts: ApiPromptSummary[] = []
): CommunityHomePageData {
  const indexedCards = toIndexedContentCards(view.feedItems)
    .filter((item) => item.contentKind !== "post")
    .map(
      (item): HomeSourceCard => ({
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
        promptModality: item.promptModality,
        author: item.author,
        kind: item.contentKind === "workflow_work" ? "workflow" : "prompt",
        badge: toResourceBadge(item.contentKind),
        likeable: item.contentKind === "prompt",
        viewerLiked: false,
        likeCount: item.secondaryMetric
      })
    );
  const promptCards = prompts.map(toDemoCardFromPrompt);
  const workflowCards = view.hotWorkflows.map(toDemoCardFromWorkflow);
  const mergedPromptCards = mergeCardsPreferCatalogMedia(indexedCards, promptCards);
  const realPromptCards = normalizeCards(mergedPromptCards, [], Math.max(mergedPromptCards.length, 30));
  const heroSlotCards = slotItemsToHomeCards(findHomeLayoutSlot(view, "home-hero"));
  const recommendedPrimarySlotCards = slotItemsToHomeCards(findHomeLayoutSlot(view, "recommended-primary"));
  const commercialSlotCards = slotItemsToHomeCards(findHomeLayoutSlot(view, "commercial"));
  const animationSlotCards = slotItemsToHomeCards(findHomeLayoutSlot(view, "animation"));
  const narrativeSlotCards = slotItemsToHomeCards(findHomeLayoutSlot(view, "narrative"));
  const mvSlotCards = slotItemsToHomeCards(findHomeLayoutSlot(view, "mv"));
  const creativeSlotCards = slotItemsToHomeCards(findHomeLayoutSlot(view, "creative"));
  const workflowCardsNormalized = normalizeCards(
    workflowCards,
    homeDemoCatalog.workflowSection,
    Math.max(workflowCards.length, 12)
  );
  const homeShuffleSeed = [
    "home",
    prompts.map((item) => item.id).join(","),
    view.feedItems.map((item) => item.targetId).join(","),
    view.hotWorkflows.map((item) => item.id).join(",")
  ].join("|");
  const videoPromptCards = realPromptCards.filter((card) => card.kind === "prompt" && hasPlayableVideo(card));
  const nonVideoPromptCards = realPromptCards.filter((card) => card.kind === "prompt" && !hasPlayableVideo(card));
  const heroPromptSlides = getHeroSlides(prompts, realPromptCards).filter((slide) => Boolean(slide.videoUrl));
  const heroSlotVideoSlides = heroSlotCards.filter(hasPlayableVideo).slice(0, HERO_SLIDE_LIMIT).map(toHeroSlideFromCard);
  const catalogVideoSlides = getHeroSlides([], []).filter((slide) => Boolean(slide.videoUrl));
  const mergedHeroSlides = [...heroSlotVideoSlides, ...heroPromptSlides, ...catalogVideoSlides];
  const seenHeroHrefs = new Set<string>();
  const heroSlides = mergedHeroSlides
    .filter((slide) => {
      if (seenHeroHrefs.has(slide.href)) {
        return false;
      }

      seenHeroHrefs.add(slide.href);
      return true;
    })
    .slice(0, HERO_SLIDE_LIMIT);
  const takenIds = new Set<string>();
  const videoWorkflowCards = workflowCardsNormalized.filter(hasPlayableVideo);
  const promptAndWorkflowPool = [...videoPromptCards, ...videoWorkflowCards];
  const mixedPool = [...promptAndWorkflowPool, ...nonVideoPromptCards, ...workflowCardsNormalized];

  return {
    heroSlides,
    shelves: {
      recommendedPrimary: pickSectionCards(
        [recommendedPrimarySlotCards, promptAndWorkflowPool, mixedPool],
        HOME_SHELF_CARD_COUNT,
        takenIds,
        `${homeShuffleSeed}:recommended-primary`
      ).map(toHomeCardPayload),
      commercial: pickSectionCards(
        [commercialSlotCards, mixedPool],
        HOME_SHELF_CARD_COUNT,
        takenIds,
        `${homeShuffleSeed}:commercial`
      ).map(toHomeCardPayload),
      animation: pickSectionCards(
        [animationSlotCards, mixedPool],
        HOME_SHELF_CARD_COUNT,
        takenIds,
        `${homeShuffleSeed}:animation`
      ).map(toHomeCardPayload),
      narrative: pickSectionCards(
        [narrativeSlotCards, mixedPool],
        HOME_SHELF_CARD_COUNT,
        takenIds,
        `${homeShuffleSeed}:narrative`
      ).map(toHomeCardPayload),
      mv: pickSectionCards(
        [mvSlotCards, mixedPool],
        HOME_SHELF_CARD_COUNT,
        takenIds,
        `${homeShuffleSeed}:mv`
      ).map(toHomeCardPayload),
      creative: pickSectionCards(
        [creativeSlotCards, mixedPool],
        HOME_SHELF_CARD_COUNT,
        takenIds,
        `${homeShuffleSeed}:creative`
      ).map(toHomeCardPayload)
    }
  };
}
