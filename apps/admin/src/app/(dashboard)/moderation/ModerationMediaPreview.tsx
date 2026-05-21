"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type ModerationMediaPreviewProps = {
  toneClass: string;
  isVideo: boolean;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  sourceUrl: string | null;
  badgeText: string;
};

function PreviewPlayIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" fill="rgba(255,255,255,0.16)" r="10" stroke="rgba(255,255,255,0.92)" strokeWidth="1.5" />
      <path d="M10 8.75 15.5 12 10 15.25v-6.5Z" fill="#ffffff" />
    </svg>
  );
}

export default function ModerationMediaPreview({
  toneClass,
  isVideo,
  thumbnailUrl,
  previewUrl,
  sourceUrl,
  badgeText
}: ModerationMediaPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalMediaUrl = previewUrl || sourceUrl || thumbnailUrl;
  const canOpenModal = Boolean(modalMediaUrl);
  const canPlayVideo = isVideo && Boolean(previewUrl || sourceUrl);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className={`${styles.previewLarge} ${toneClass} ${canOpenModal ? styles.previewLargeHasMedia : ""}`}>
        {thumbnailUrl ? (
          canOpenModal ? (
            <button
              aria-label={badgeText}
              className={styles.previewMediaTrigger}
              onClick={() => setIsOpen(true)}
              type="button"
            >
              <img alt="" className={styles.previewMediaImage} decoding="async" loading="eager" src={thumbnailUrl} />
              {canPlayVideo ? (
                <span className={styles.previewPlay}>
                  <PreviewPlayIcon />
                </span>
              ) : null}
              <span className={styles.previewOpenHint}>{badgeText}</span>
            </button>
          ) : (
            <img alt="" className={styles.previewMediaImage} decoding="async" loading="eager" src={thumbnailUrl} />
          )
        ) : canOpenModal ? (
          <button
            aria-label={badgeText}
            className={styles.previewMediaTrigger}
            onClick={() => setIsOpen(true)}
            type="button"
          >
            <span className={styles.previewMediaFallback}>点击查看</span>
            {canPlayVideo ? (
              <span className={styles.previewPlay}>
                <PreviewPlayIcon />
              </span>
            ) : null}
            <span className={styles.previewOpenHint}>{badgeText}</span>
          </button>
        ) : null}
        <span className={styles.previewDuration}>{badgeText}</span>
      </div>

      {isOpen ? (
        <div aria-modal="true" className={styles.previewModalBackdrop} onClick={() => setIsOpen(false)} role="dialog">
          <div className={styles.previewModalPanel} onClick={(event) => event.stopPropagation()}>
            <header className={styles.previewModalHeader}>
              <div className={styles.previewModalHeaderText}>
                <strong>放大预览</strong>
                <span>{badgeText}</span>
              </div>
              <button aria-label="关闭预览" className={styles.previewModalClose} onClick={() => setIsOpen(false)} type="button">
                ×
              </button>
            </header>

            <div className={styles.previewModalBody}>
              {canPlayVideo && modalMediaUrl ? (
                <video
                  className={styles.previewModalMedia}
                  controls
                  autoPlay
                  playsInline
                  poster={thumbnailUrl ?? undefined}
                  preload="metadata"
                  src={modalMediaUrl}
                />
              ) : thumbnailUrl ? (
                <img alt="" className={styles.previewModalMedia} decoding="async" src={thumbnailUrl} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
