"use client";

import { useEffect } from "react";
import { getFeedOpsMediaSources } from "./feed-ops-media";
import type { FeedOpsPageData } from "./feed-ops-types";
import styles from "./page.module.css";

export type FeedOpsPreviewItem = Pick<
  FeedOpsPageData["candidatePool"][number],
  "title" | "itemTypeLabel" | "promptModality" | "coverUrl" | "posterUrl" | "previewUrl" | "sourceUrl"
>;

type FeedOpsMediaPreviewProps = {
  item: FeedOpsPreviewItem;
  onClose: () => void;
};

export default function FeedOpsMediaPreview({ item, onClose }: FeedOpsMediaPreviewProps) {
  const media = getFeedOpsMediaSources(item);
  const isVideo = media.canPreviewVideo;
  const modalVideoUrl = media.previewUrl ?? media.sourceUrl;
  const modalImageUrl = media.sourceUrl ?? media.coverUrl ?? media.posterUrl ?? media.previewUrl;
  const subtitle = `${item.itemTypeLabel}${isVideo ? " · 视频预览" : " · 图片预览"}`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div aria-modal="true" className={styles.mediaPreviewBackdrop} onClick={onClose} role="dialog">
      <div className={styles.mediaPreviewPanel} onClick={(event) => event.stopPropagation()}>
        <header className={styles.mediaPreviewHeader}>
          <div className={styles.mediaPreviewHeaderText}>
            <strong>{item.title}</strong>
            <span>{subtitle}</span>
          </div>
          <button aria-label="关闭资源预览" className={styles.mediaPreviewClose} onClick={onClose} type="button">
            ×
          </button>
        </header>

        <div className={styles.mediaPreviewBody}>
          {isVideo && modalVideoUrl ? (
            <video
              autoPlay
              className={styles.mediaPreviewAsset}
              controls
              playsInline
              poster={media.posterUrl ?? media.coverUrl ?? undefined}
              preload="metadata"
              src={modalVideoUrl}
            />
          ) : modalImageUrl ? (
            <img alt="" className={styles.mediaPreviewAsset} decoding="async" src={modalImageUrl} />
          ) : (
            <div className={styles.mediaPreviewEmpty}>暂无可预览资源</div>
          )}
        </div>
      </div>
    </div>
  );
}
