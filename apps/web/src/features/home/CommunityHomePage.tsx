"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/shared/PageShell";
import type { ApiPromptSummary } from "@/lib/contracts/community-api";
import type { HomePageView, WorkflowMiniCardView } from "@/lib/contracts/view-models";
import { homeDemoCatalog, type HomeDemoCard, type HomeHeroSlide } from "@/lib/prefill/home-resource-catalog";
import { isVideoAssetUrl, normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import styles from "./CommunityHomePage.module.css";

type CommunityHomePageProps = {
  prompts: ApiPromptSummary[];
  view: HomePageView;
};

type HomeCard = HomeDemoCard & {
  badge: string;
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
    badge: "workflow",
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
    author: {
      id: prompt.author.id,
      displayName: normalizeText(prompt.author.displayName) ?? "DramaTV Creator",
      avatarUrl: prompt.author.avatarUrl
    },
    resourceType: "prompt",
    badge: "prompt",
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
    imageUrl: prompt.coverUrl,
    videoUrl: isVideoAssetUrl(prompt.coverUrl) ? prompt.coverUrl : undefined,
    resourceType: "prompt"
  };
}

function getHeroMediaUrl(slide?: HomeHeroSlide) {
  return normalizeAssetUrl(slide?.videoUrl) ?? normalizeAssetUrl(slide?.imageUrl);
}

function getHeroSlidesFromPrompts(prompts: ApiPromptSummary[]) {
  const videoPrompts = prompts.filter((prompt) => prompt.modality === "video" && isVideoAssetUrl(prompt.coverUrl));
  const fallbackVideoPrompts = prompts.filter((prompt) => isVideoAssetUrl(prompt.coverUrl));
  const preferredPrompts = videoPrompts.length >= 3 ? videoPrompts : fallbackVideoPrompts;

  if (preferredPrompts.length > 0) {
    return preferredPrompts.slice(0, 3).map(toHeroSlideFromPrompt);
  }

  return homeDemoCatalog.heroSlides.slice(0, 3);
}

function asHomeCard(card: HomeDemoCard): HomeCard {
  return {
    ...card,
    badge: card.resourceType === "workflow" ? "workflow" : "prompt"
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

function HomeArchiveCard({ card, variant = "landscape" }: { card: HomeCard; variant?: "landscape" | "square" }) {
  const imageUrl = normalizeAssetUrl(card.coverUrl);
  const isVideoMedia = isVideoAssetUrl(imageUrl);
  const imageStyle = imageUrl && !isVideoMedia ? { backgroundImage: `url(${imageUrl})` } : undefined;
  const authorName = normalizeText(card.author.displayName) ?? "DramaTV Creator";
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
      className={styles.archiveCard}
      data-variant={variant}
      href={card.href}
      onBlur={handlePreviewStop}
      onFocus={handlePreviewStart}
      onMouseEnter={handlePreviewStart}
      onMouseLeave={handlePreviewStop}
    >
      {isVideoMedia && imageUrl ? (
        <video
          ref={videoRef}
          className={styles.archiveMediaVideo}
          loop
          muted
          playsInline
          preload="metadata"
          src={imageUrl}
        />
      ) : (
        <span className={styles.archiveMedia} style={imageStyle} />
      )}
      <span className={styles.archiveShade} />
      <span className={styles.archiveBadge}>{card.badge}</span>
      <span className={styles.archiveBody}>
        <strong>{card.title}</strong>
        <span className={styles.archiveMeta}>
          <span>@{authorName}</span>
          <span className={styles.archiveMetric}>
            <HeartIcon />
            {formatCompactNumber(card.secondaryMetric || card.primaryMetric)}
          </span>
        </span>
      </span>
    </Link>
  );
}

function ContentShelf({
  title,
  items,
  variant = "landscape"
}: {
  title: string;
  items: HomeCard[];
  variant?: "landscape" | "square";
}) {
  return (
    <section className={styles.shelf}>
      <div className={styles.shelfHeader}>
        <h3>{title}</h3>
        <Link href="/featured">查看全部</Link>
      </div>
      <div className={styles.shelfGrid} data-variant={variant}>
        {items.map((item) => (
          <HomeArchiveCard card={item} key={`${title}-${item.id}`} variant={variant} />
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

export function CommunityHomePage({ prompts, view }: CommunityHomePageProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const heroVideoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const promptCards = prompts.map(toDemoCardFromPrompt);
  const workflowCards = view.hotWorkflows.map(toDemoCardFromWorkflow);
  const realPromptCards = normalizeCards(promptCards, [], Math.max(promptCards.length, 30));
  const heroSlides = getHeroSlidesFromPrompts(prompts);

  const recommended = realPromptCards.slice(0, 6);
  const dramaTv = normalizeCards(workflowCards, homeDemoCatalog.workflowSection, 4);
  const canvas = realPromptCards.slice(6, 10);
  const commercial = realPromptCards.slice(10, 14);
  const animation = realPromptCards.slice(14, 18);
  const narrative = realPromptCards.slice(18, 22);
  const mv = realPromptCards.slice(22, 26);
  const creative = realPromptCards.slice(26, 30);
  const newsItems = heroSlides.map(heroToNewsItem);

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
              const isVideoMedia = isVideoAssetUrl(mediaUrl);
              const isActive = index === activeSlide;

              return (
                <Link
                  aria-hidden={!isActive}
                  className={`${styles.heroMedia} ${isActive ? styles.heroMediaActive : ""}`}
                  href={slide.href}
                  key={slide.id}
                  style={mediaUrl && !isVideoMedia ? { backgroundImage: `url(${mediaUrl})` } : undefined}
                  tabIndex={isActive ? undefined : -1}
                >
                  {isVideoMedia && mediaUrl ? (
                    <video
                      ref={(element) => {
                        heroVideoRefs.current[index] = element;
                      }}
                      autoPlay={isActive}
                      className={styles.heroVideo}
                      loop
                      muted
                      playsInline
                      preload={isActive ? "auto" : "metadata"}
                      src={mediaUrl}
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
                href={item.href}
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
          <Link className={styles.canvasCta} href="/featured">
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
          <ContentShelf items={recommended} title="为你推荐" variant="square" />
          <ContentShelf items={dramaTv} title="为你推荐" />
          <ContentShelf items={canvas} title="精选画布" />
          <ContentShelf items={commercial} title="电视广告" />
          <ContentShelf items={animation} title="动画" />
          <ContentShelf items={narrative} title="叙事短片" />
          <ContentShelf items={mv} title="MV" />
          <ContentShelf items={creative} title="创意" />
        </div>
      </div>
    </PageShell>
  );
}
