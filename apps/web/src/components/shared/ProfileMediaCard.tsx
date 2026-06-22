"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useInteractiveVideoPreview } from "@/components/shared/useInteractiveVideoPreview";
import { resolveCardVideoPlaybackUrl } from "@/lib/media-playback";
import { normalizeAssetUrl } from "@/lib/presentation";
import { buildBackAnchorSource } from "@/lib/routes/back-anchor";
import { appendBackSource } from "@/lib/routes/redirect-utils";
import styles from "./ProfileMediaCard.module.css";

export type ProfileMediaCardMetric = {
  icon: "heart" | "play" | "clock" | "save";
  label: string;
};

export type ProfileMediaCardView = {
  id: string;
  href: string;
  badge: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  promptModality?: "image" | "video";
  resourceType?: "workflow";
  authorName: string;
  authorAvatarUrl?: string;
  metrics: ProfileMediaCardMetric[];
};

function getAvatarFallback(name: string) {
  return name.trim().charAt(0).toUpperCase() || "D";
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M8 13.2 2.8 8.3A3.2 3.2 0 1 1 7.4 3.8L8 4.4l.6-.6a3.2 3.2 0 1 1 4.6 4.5L8 13.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M5.2 3.8a.8.8 0 0 1 1.2-.7l5.2 3.1a.8.8 0 0 1 0 1.4L6.4 10.7a.8.8 0 0 1-1.2-.7V3.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="5.7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.8v3.5l2.2 1.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M4.6 2.8h6.8c.6 0 1 .4 1 1v9.4L8 10.4l-4.4 2.8V3.8c0-.6.4-1 1-1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function renderMetricIcon(icon: ProfileMediaCardMetric["icon"]) {
  switch (icon) {
    case "heart":
      return <HeartIcon />;
    case "play":
      return <PlayIcon />;
    case "clock":
      return <ClockIcon />;
    case "save":
      return <SaveIcon />;
    default:
      return null;
  }
}

type ProfileMediaCardProps = {
  item: ProfileMediaCardView;
  backSource: string;
  anchorId: string;
  previewGroup: string;
  hideTextBlock?: boolean;
};

export function ProfileMediaCard({
  item,
  backSource,
  anchorId,
  previewGroup,
  hideTextBlock = false
}: ProfileMediaCardProps) {
  const imageUrl = normalizeAssetUrl(item.posterUrl) ?? normalizeAssetUrl(item.coverUrl);
  const playbackUrl = resolveCardVideoPlaybackUrl({
    previewUrl: item.previewUrl,
    sourceUrl: item.sourceUrl,
    promptModality: item.promptModality,
    resourceType: item.resourceType,
    allowSourceFallback: false
  });
  const isVideoMedia = Boolean(playbackUrl);
  const [imageFailed, setImageFailed] = useState(false);
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
    loadOnViewport: false,
    unloadDelayMs: 1200,
    previewGroup,
    previewStartDelayMs: 160
  });

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl, item.id]);

  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <Link
      className={styles.card}
      href={appendBackSource(item.href, buildBackAnchorSource(backSource, anchorId))}
      id={anchorId}
      prefetch={false}
      onBlur={handlePreviewStop}
      onFocus={handlePreviewImmediateStart}
      onMouseEnter={handlePreviewStart}
      onMouseLeave={handlePreviewStop}
    >
      {isVideoMedia && playbackUrl ? (
        <span className={styles.mediaSlot} ref={mediaRef}>
          <span className={styles.media} />
          {showImage ? (
            <img
              alt={item.title}
              className={styles.mediaImage}
              decoding="async"
              draggable={false}
              loading="lazy"
              onError={() => setImageFailed(true)}
              sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={imageUrl}
            />
          ) : null}
          {shouldLoadVideo ? (
            <video
              ref={videoRef}
              className={`${styles.mediaVideo} ${isVideoReady ? styles.mediaVideoReady : ""}`}
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
          className={styles.mediaImage}
          decoding="async"
          draggable={false}
          loading="lazy"
          onError={() => setImageFailed(true)}
          sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw"
          src={imageUrl}
        />
      ) : (
        <span className={styles.media} />
      )}

      <span className={styles.shade} />
      <span className={styles.badge}>{item.badge}</span>

      <span className={`${styles.footer} ${hideTextBlock ? styles.footerCompact : ""}`}>
        {!hideTextBlock ? (
          <span className={styles.textBlock}>
            <strong className={styles.title}>{item.title}</strong>
            {item.subtitle ? <span className={styles.subtitle}>{item.subtitle}</span> : null}
          </span>
        ) : null}

        <span className={styles.metaRow}>
          <span className={styles.author}>
            <span className={styles.avatar}>
              {item.authorAvatarUrl ? (
                <span className={styles.avatarImage} style={{ backgroundImage: `url(${item.authorAvatarUrl})` }} />
              ) : (
                <span className={styles.avatarFallback}>{getAvatarFallback(item.authorName)}</span>
              )}
            </span>
            <span className={styles.authorName}>{item.authorName}</span>
          </span>

          <span className={styles.metrics}>
            {item.metrics.map((metric) => (
              <span className={styles.metric} key={`${item.id}-${metric.icon}-${metric.label}`}>
                {renderMetricIcon(metric.icon)}
                <span>{metric.label}</span>
              </span>
            ))}
          </span>
        </span>
      </span>
    </Link>
  );
}
