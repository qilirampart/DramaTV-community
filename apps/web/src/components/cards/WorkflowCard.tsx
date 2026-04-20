import Link from "next/link";
import type { WorkflowMiniCardView } from "@/lib/contracts/view-models";
import { normalizeAssetUrl, normalizeText } from "@/lib/presentation";

type WorkflowCardProps = {
  workflow: WorkflowMiniCardView;
};

function formatMetric(value?: number, fallback = "新流程") {
  if (typeof value !== "number") {
    return fallback;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(value);
}

function getAvatarFallback(name: string) {
  return name.trim().charAt(0) || "流";
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const detailHref = normalizeText(workflow.id) ? `/workflows/${workflow.id}` : undefined;
  const creatorHref = normalizeText(workflow.author.id) ? `/creators/${workflow.author.id}` : undefined;
  const processHref = normalizeText(workflow.processHref) ?? detailHref;
  const coverUrl = normalizeAssetUrl(workflow.coverUrl);
  const avatarUrl = normalizeAssetUrl(workflow.author.avatarUrl);
  const authorName = normalizeText(workflow.author.displayName) ?? "匿名作者";
  const summary =
    normalizeText(workflow.summary) ??
    "工作流是一级内容对象，应该能独立承接查看方法、复制和在画布中打开。";

  return (
    <article className="card media-card workflow-card">
      <div className="card-media media-card-media">
        <div className="card-cover" style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined} />
        {detailHref ? (
          <Link className="media-card-cover-link" href={detailHref} aria-label={`查看工作流 ${workflow.title}`} />
        ) : null}
        <div className="media-card-topline">
          <span className="card-kicker">流程</span>
          <span className="media-card-stat">❤ {formatMetric(workflow.likeCount)}</span>
        </div>
        <div className="media-card-bottomline">
          <span className="meta-pill">{workflow.allowCopy ? "允许复制" : "仅查看"}</span>
          {processHref ? (
            <Link className="media-card-action" href={processHref}>
              查看流程
            </Link>
          ) : null}
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
                <span>{workflow.allowCopy ? "公开了可复制流程" : "公开了流程说明"}</span>
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
                <span>{workflow.allowCopy ? "公开了可复制流程" : "公开了流程说明"}</span>
              </span>
            </div>
          )}
          <span className="meta-pill">{workflow.allowCopy ? "可复制" : "只读"}</span>
        </div>

        {detailHref ? (
          <Link className="media-card-title-link" href={detailHref}>
            <h3 className="card-title">{workflow.title}</h3>
          </Link>
        ) : (
          <h3 className="card-title">{workflow.title}</h3>
        )}

        <p className="card-copy">{summary}</p>

        <div className="media-card-footer">
          <span className="meta-pill">方法对象</span>
          {processHref ? (
            <Link className="media-card-secondary-link" href={processHref}>
              打开创作过程
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
