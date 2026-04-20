import Link from "next/link";
import type { VideoMiniCardView } from "@/lib/contracts/view-models";
import { normalizeAssetUrl, normalizeText } from "@/lib/presentation";

type VideoCardProps = {
  video: VideoMiniCardView;
};

function formatDuration(durationMs?: number) {
  if (!durationMs) {
    return "预览";
  }

  return `${Math.round(durationMs / 1000)}s`;
}

function formatMetric(value?: number, fallback = "0") {
  if (typeof value !== "number") {
    return fallback;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(value);
}

function getAvatarFallback(name: string) {
  return name.trim().charAt(0) || "创";
}

export function VideoCard({ video }: VideoCardProps) {
  const detailHref = normalizeText(video.id) ? `/videos/${video.id}` : undefined;
  const creatorHref = normalizeText(video.author.id) ? `/creators/${video.author.id}` : undefined;
  const processHref =
    normalizeText(video.workflow?.processHref) ??
    (normalizeText(video.workflow?.id) ? `/workflows/${video.workflow?.id}#canvas-entry` : undefined);
  const coverUrl = normalizeAssetUrl(video.coverUrl);
  const avatarUrl = normalizeAssetUrl(video.author.avatarUrl);
  const authorName = normalizeText(video.author.displayName) ?? "匿名创作者";
  const summary =
    normalizeText(video.summary) ??
    (video.workflow ? `已关联工作流：${video.workflow.title}` : "公开发布的视频作品");

  return (
    <article className="card media-card video-card">
      <div className="card-media media-card-media">
        <div className="card-cover" style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined} />
        {detailHref ? (
          <Link className="media-card-cover-link" href={detailHref} aria-label={`查看作品 ${video.title}`} />
        ) : null}

        <div className="media-card-topline">
          <span className="card-kicker">作品</span>
          <span className="media-card-stat">♥ {formatMetric(video.likeCount)}</span>
        </div>

        <div className="media-card-bottomline">
          <span className="meta-pill">{formatDuration(video.durationMs)}</span>
        </div>
      </div>

      <div className="card-body media-card-body">
        <div className="media-card-author-row">
          {creatorHref ? (
            <Link className="media-card-author" href={creatorHref}>
              <span className="media-card-avatar">
                {avatarUrl ? (
                  <span
                    className="media-card-avatar-image"
                    style={{ backgroundImage: `url(${avatarUrl})` }}
                  />
                ) : (
                  <span className="media-card-avatar-fallback">{getAvatarFallback(authorName)}</span>
                )}
              </span>
              <span className="media-card-author-copy">
                <strong>{authorName}</strong>
                <span>{video.workflow ? "发布了带流程的视频" : "发布了视频作品"}</span>
              </span>
            </Link>
          ) : (
            <div className="media-card-author">
              <span className="media-card-avatar">
                {avatarUrl ? (
                  <span
                    className="media-card-avatar-image"
                    style={{ backgroundImage: `url(${avatarUrl})` }}
                  />
                ) : (
                  <span className="media-card-avatar-fallback">{getAvatarFallback(authorName)}</span>
                )}
              </span>
              <span className="media-card-author-copy">
                <strong>{authorName}</strong>
                <span>{video.workflow ? "发布了带流程的视频" : "发布了视频作品"}</span>
              </span>
            </div>
          )}

          <span className="meta-pill">{formatMetric(video.playCount, "0")}</span>
        </div>

        {detailHref ? (
          <Link className="media-card-title-link" href={detailHref}>
            <h3 className="card-title">{video.title}</h3>
          </Link>
        ) : (
          <h3 className="card-title">{video.title}</h3>
        )}

        <p className="card-copy">{summary}</p>

        <div className="media-card-footer">
          {video.workflow ? <span className="meta-pill">已关联工作流</span> : <span className="meta-pill">单独发布</span>}
          {processHref ? (
            <Link className="media-card-secondary-link" href={processHref}>
              查看创作过程
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
