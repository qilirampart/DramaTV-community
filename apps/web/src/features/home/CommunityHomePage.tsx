"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { useCommunitySession } from "@/components/shared/CommunitySessionProvider";
import { PageShell } from "@/components/shared/PageShell";
import { RouteVideoLoading } from "@/components/shared/RouteVideoLoading";
import { useInteractiveVideoPreview } from "@/components/shared/useInteractiveVideoPreview";
import { togglePromptLikeAction } from "@/features/community-interactions/actions";
import { isVideoAssetUrl, normalizeAssetUrl } from "@/lib/presentation";
import { buildBackAnchorSource, buildCurrentRoute, createBackAnchorId } from "@/lib/routes/back-anchor";
import { useListPageBackRestore } from "@/lib/routes/list-page-back-restore";
import { appendBackSource } from "@/lib/routes/redirect-utils";
import type { CommunityHomePageData, HomeCard, HomeHeroSlideData } from "./home-page-data";
import styles from "./CommunityHomePage.module.css";

type CommunityHomePageProps = {
  pageData: CommunityHomePageData;
};

const HERO_AUTOPLAY_MS = 6500;
const HERO_EDGE_DISTANCE = 2;

type HeroCardLayout = {
  brightness: number;
  distance: number;
  opacity: number;
  rotate: number;
  scale: number;
  translateX: string;
  translateY: string;
  translateZ: string;
  visible: boolean;
  zIndex: number;
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

function getHeroMediaUrl(slide?: HomeHeroSlideData) {
  return normalizeAssetUrl(slide?.videoUrl) ?? normalizeAssetUrl(slide?.imageUrl);
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
  const imageUrl = normalizeAssetUrl(card.imageUrl);
  const playbackUrl = normalizeAssetUrl(card.playbackUrl);
  const isVideoMedia = Boolean(playbackUrl);
  const authorName = card.authorName || "DramaTV Creator";
  const isPromptLikeCard = card.likeable === true;
  const [liked, setLiked] = useState(card.viewerLiked ?? false);
  const [likeCount, setLikeCount] = useState(card.likeCount);
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
    setLikeCount(card.likeCount);
  }, [card.id, card.likeCount, card.viewerLiked]);

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
      {isVideoMedia && playbackUrl ? (
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
              src={playbackUrl}
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
              {formatCompactNumber(card.likeCount)}
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
  const featuredHref = appendBackSource("/featured", currentRoute);

  return (
    <section className={styles.shelf}>
      <div className={styles.shelfHeader}>
        <h3>{title}</h3>
        <Link href={featuredHref}>查看全部</Link>
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

function getWrappedSlideDistance(index: number, activeIndex: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  let distance = index - activeIndex;
  const half = total / 2;

  if (distance > half) {
    distance -= total;
  } else if (distance < -half) {
    distance += total;
  }

  return distance;
}

function getHeroCardLayout(distance: number): HeroCardLayout {
  const direction = distance < 0 ? -1 : 1;
  const absoluteDistance = Math.abs(distance);

  if (absoluteDistance === 0) {
    return {
      brightness: 1,
      distance: 0,
      opacity: 1,
      rotate: 0,
      scale: 1,
      translateX: "0px",
      translateY: "0px",
      translateZ: "0px",
      visible: true,
      zIndex: 4
    };
  }

  if (absoluteDistance === 1) {
    return {
      brightness: 0.76,
      distance: absoluteDistance,
      opacity: 0.92,
      rotate: direction * -8,
      scale: 0.85,
      translateX:
        direction < 0
          ? "calc(-1 * clamp(248px, 30vw, 500px))"
          : "clamp(248px, 30vw, 500px)",
      translateY: "14px",
      translateZ: "-72px",
      visible: true,
      zIndex: 3
    };
  }

  if (absoluteDistance === HERO_EDGE_DISTANCE) {
    return {
      brightness: 0.48,
      distance: absoluteDistance,
      opacity: 0,
      rotate: direction * -14,
      scale: 0.72,
      translateX:
        direction < 0
          ? "calc(-1 * clamp(348px, 40vw, 620px))"
          : "clamp(348px, 40vw, 620px)",
      translateY: "22px",
      translateZ: "-148px",
      visible: false,
      zIndex: 2
    };
  }

  return {
    brightness: 0.42,
    distance: absoluteDistance,
    opacity: 0,
    rotate: direction * -22,
    scale: 0.68,
    translateX:
      direction < 0
        ? "calc(-1 * clamp(420px, 48vw, 620px))"
        : "clamp(420px, 48vw, 620px)",
    translateY: "30px",
    translateZ: "-180px",
    visible: false,
    zIndex: 1
  };
}

export function CommunityHomePage({ pageData }: CommunityHomePageProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [heroVideoReadyMap, setHeroVideoReadyMap] = useState<Record<string, boolean>>({});
  const heroVideoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const heroSlides = pageData.heroSlides;
  const recommended = pageData.shelves.recommendedPrimary;
  const commercial = pageData.shelves.commercial;
  const animation = pageData.shelves.animation;
  const narrative = pageData.shelves.narrative;
  const mv = pageData.shelves.mv;
  const creative = pageData.shelves.creative;
  const currentRoute = useMemo(() => buildCurrentRoute(pathname, searchParams), [pathname, searchParams]);

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

  const { isBackAnchorRestoring } = useListPageBackRestore({
    currentRoute,
    dependencies: [heroSlides.length, recommended.length, commercial.length, animation.length, narrative.length, mv.length, creative.length]
  });

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
    if (heroSlides.length <= 1 || isHeroHovered) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((value) => (value < heroSlides.length - 1 ? value + 1 : 0));
    }, HERO_AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [heroSlides.length, isHeroHovered]);

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

  function handleHeroCardClick(index: number, isActive: boolean, event: ReactMouseEvent<HTMLAnchorElement>) {
    if (isActive) {
      return;
    }

    event.preventDefault();
    setActiveSlide(index);
  }

  return (
    <PageShell showHomeFloatingDock variant="home" topNavActive="home">
      <div
        aria-hidden={isBackAnchorRestoring}
        className={`${styles.page}${isBackAnchorRestoring ? ` ${styles.pageRestoring}` : ""}`}
      >
        <section className={styles.hero}>
          <div
            className={styles.heroFrame}
            onMouseEnter={() => setIsHeroHovered(true)}
            onMouseLeave={() => setIsHeroHovered(false)}
          >
            <div className={styles.heroStage}>
              {heroSlides.map((slide, index) => {
                const mediaUrl = getHeroMediaUrl(slide);
                const posterUrl = normalizeAssetUrl(slide.imageUrl);
                const isVideoMedia = isVideoAssetUrl(mediaUrl);
                const wrappedDistance = getWrappedSlideDistance(index, activeSlide, heroSlides.length);
                const layout = getHeroCardLayout(wrappedDistance);
                const isActive = wrappedDistance === 0;
                const shouldWarmVideo = heroSlides.length <= 1 || Math.abs(wrappedDistance) <= 1;
                const shouldRenderVideo = isVideoMedia && mediaUrl && (layout.visible || shouldWarmVideo);
                const heroCardStyle = {
                  ...(posterUrl
                    ? { backgroundImage: `url(${posterUrl})` }
                    : mediaUrl && !isVideoMedia
                      ? { backgroundImage: `url(${mediaUrl})` }
                      : null),
                  "--hero-card-brightness": String(layout.brightness),
                  "--hero-card-opacity": String(layout.opacity),
                  "--hero-card-rotate": `${layout.rotate}deg`,
                  "--hero-card-scale": String(layout.scale),
                  "--hero-card-translate-x": layout.translateX,
                  "--hero-card-translate-y": layout.translateY,
                  "--hero-card-translate-z": layout.translateZ,
                  "--hero-card-z-index": String(layout.zIndex)
                } as CSSProperties;

                return (
                  <Link
                    aria-hidden={!layout.visible}
                    aria-label={isActive ? `打开 ${slide.title}` : `切换到 ${slide.title}`}
                    className={[
                      styles.heroMedia,
                      layout.visible ? styles.heroMediaVisible : styles.heroMediaHidden,
                      layout.distance === HERO_EDGE_DISTANCE ? styles.heroMediaEdge : "",
                      isActive ? styles.heroMediaActive : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-active={isActive ? "true" : "false"}
                    data-distance={layout.distance}
                    href={appendBackSource(
                      slide.href,
                      buildBackAnchorSource(currentRoute, createBackAnchorId("home-hero", `${index}-${slide.id}`))
                    )}
                    id={createBackAnchorId("home-hero", `${index}-${slide.id}`)}
                    key={slide.id}
                    onClick={(event) => handleHeroCardClick(index, isActive, event)}
                    onFocus={() => setActiveSlide(index)}
                    onMouseEnter={() => {
                      if (layout.visible && !isActive) {
                        setActiveSlide(index);
                      }
                    }}
                    style={heroCardStyle}
                    tabIndex={layout.visible ? undefined : -1}
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
            </div>

            {heroSlides.length > 1 ? (
              <button aria-label="上一张" className={styles.heroArrow} data-side="left" onClick={goToPreviousSlide} type="button">
                <ChevronLeftIcon />
              </button>
            ) : null}
            {heroSlides.length > 1 ? (
              <button aria-label="下一张" className={styles.heroArrow} data-side="right" onClick={goToNextSlide} type="button">
                <ChevronRightIcon />
              </button>
            ) : null}

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
          </div>
        </section>

        <div className={styles.shelves}>
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={recommended} sectionKey="recommended-primary" title="为你推荐" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={commercial} sectionKey="commercial" title="电视广告" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={animation} sectionKey="animation" title="动画" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={narrative} sectionKey="narrative" title="叙事短片" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={mv} sectionKey="mv" title="MV" />
          <ContentShelf backSource={currentRoute} currentRoute={currentRoute} items={creative} sectionKey="creative" title="创意" />
        </div>
      </div>
      {isBackAnchorRestoring ? (
        <div className={styles.backAnchorRestoreOverlay}>
          <RouteVideoLoading
            activeNav="home"
            label="Restoring home position"
            useVideo={false}
            videoActive={false}
          />
        </div>
      ) : null}
    </PageShell>
  );
}


