"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type ReportsMediaPreviewProps = {
  badgeText: string;
  isVideo: boolean;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  sourceUrl: string | null;
  toneClass: string;
};

function PreviewPlayIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" fill="rgba(255,255,255,0.16)" r="10" stroke="rgba(255,255,255,0.92)" strokeWidth="1.5" />
      <path d="M10 8.75 15.5 12 10 15.25v-6.5Z" fill="#ffffff" />
    </svg>
  );
}

function isOpenable(urls: Array<string | null>) {
  return urls.some((value) => Boolean(value && value.trim()));
}

export default function ReportsMediaPreview({
  badgeText,
  isVideo,
  thumbnailUrl,
  previewUrl,
  sourceUrl,
  toneClass
}: ReportsMediaPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalMediaUrl = previewUrl || sourceUrl || thumbnailUrl;
  const modalImageUrl = sourceUrl || thumbnailUrl;
  const canOpenModal = isOpenable([previewUrl, sourceUrl, thumbnailUrl]);

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
      <div className={`${styles.reportMediaFrame} ${toneClass} ${canOpenModal ? styles.reportMediaFrameInteractive : ""}`}>
        {thumbnailUrl ? (
          canOpenModal ? (
            <button
              aria-label={`放大预览 ${badgeText}`}
              className={styles.reportMediaTrigger}
              onClick={() => setIsOpen(true)}
              type="button"
            >
              <img alt="" className={styles.reportMediaImage} decoding="async" loading="eager" src={thumbnailUrl} />
              {isVideo ? (
                <span className={styles.reportMediaPlay}>
                  <PreviewPlayIcon />
                </span>
              ) : null}
              <span className={styles.reportMediaOpenHint}>点击放大</span>
            </button>
          ) : (
            <img alt="" className={styles.reportMediaImage} decoding="async" loading="eager" src={thumbnailUrl} />
          )
        ) : canOpenModal ? (
          <button
            aria-label={`放大预览 ${badgeText}`}
            className={styles.reportMediaTrigger}
            onClick={() => setIsOpen(true)}
            type="button"
          >
            <span className={styles.reportMediaFallback}>点击查看</span>
            {isVideo ? (
              <span className={styles.reportMediaPlay}>
                <PreviewPlayIcon />
              </span>
            ) : null}
            <span className={styles.reportMediaOpenHint}>点击放大</span>
          </button>
        ) : (
          <div className={styles.reportMediaFallback}>暂无可预览资源</div>
        )}
        <span className={styles.reportMediaBadge}>{badgeText}</span>
      </div>

      {isOpen ? (
        <div aria-modal="true" className={styles.reportMediaModalBackdrop} onClick={() => setIsOpen(false)} role="dialog">
          <div className={styles.reportMediaModalPanel} onClick={(event) => event.stopPropagation()}>
            <header className={styles.reportMediaModalHeader}>
              <div className={styles.reportMediaModalHeaderText}>
                <strong>放大预览</strong>
                <span>{badgeText}</span>
              </div>
              <button aria-label="关闭预览" className={styles.reportMediaModalClose} onClick={() => setIsOpen(false)} type="button">
                ×
              </button>
            </header>

            <div className={styles.reportMediaModalBody}>
              {isVideo && modalMediaUrl ? (
                <video
                  className={styles.reportMediaModalMedia}
                  controls
                  autoPlay
                  playsInline
                  poster={thumbnailUrl ?? undefined}
                  preload="metadata"
                  src={modalMediaUrl}
                />
              ) : modalImageUrl ? (
                <img alt="" className={styles.reportMediaModalMedia} decoding="async" src={modalImageUrl} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
