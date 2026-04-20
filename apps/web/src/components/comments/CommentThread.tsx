"use client";

import { useState } from "react";
import type { CommentView } from "@/lib/contracts/view-models";

type CommentComposerNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

type CommentThreadProps = {
  comments: CommentView[];
  title?: string;
  emptyText?: string;
  variant?: "default" | "video" | "workflow";
  composer?: {
    placeholder?: string;
    submitLabel?: string;
    notice?: CommentComposerNotice | null;
    pending?: boolean;
    onSubmit: (content: string) => Promise<boolean>;
  };
  commentActionPendingId?: string | null;
  onToggleLike?: (commentId: string, active: boolean) => Promise<void>;
};

function formatCommentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "时间待补充";
  }

  return date.toLocaleDateString("zh-CN");
}

function composerNoticeClassName(notice: CommentComposerNotice) {
  if (notice.tone === "success") {
    return "comment-notice comment-notice-success";
  }

  if (notice.tone === "error") {
    return "comment-notice comment-notice-error";
  }

  return "comment-notice";
}

function getAvatarFallback(name: string) {
  return name.trim().charAt(0) || "评";
}

export function CommentThread({
  comments,
  title = "评论区",
  emptyText = "暂时还没有评论，后续会在这里承接提示词与制作经验讨论。",
  variant = "default",
  composer,
  commentActionPendingId,
  onToggleLike
}: CommentThreadProps) {
  const [draft, setDraft] = useState("");

  async function handleSubmit() {
    if (!composer) {
      return;
    }

    const normalized = draft.trim();
    if (!normalized) {
      return;
    }

    const success = await composer.onSubmit(normalized);
    if (success) {
      setDraft("");
    }
  }

  return (
    <div className={`comment-thread comment-thread-${variant}`}>
      <div className="thread-header">
        <div className="eyebrow">{variant === "workflow" ? "流程讨论" : "现场讨论"}</div>
        <h2>{title}</h2>
      </div>

      {composer ? (
        <div className="thread-composer">
          <textarea
            className="publish-textarea thread-textarea"
            value={draft}
            disabled={composer.pending}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={composer.placeholder ?? "写下你的提示词经验、踩坑记录或补充建议"}
          />
          <div className="thread-composer-footer">
            <span className="muted">发布后会立即写入当前详情页的真实评论列表。</span>
            <button
              type="button"
              className="button"
              disabled={composer.pending || draft.trim().length === 0}
              onClick={handleSubmit}
            >
              {composer.pending ? "提交中..." : composer.submitLabel ?? "发布评论"}
            </button>
          </div>
          {composer.notice ? (
            <p className={composerNoticeClassName(composer.notice)}>{composer.notice.text}</p>
          ) : null}
        </div>
      ) : null}

      {comments.length === 0 ? (
        <p className="thread-empty">{emptyText}</p>
      ) : (
        <div className="thread-list">
          {comments.map((comment) => {
            const canToggleLike = Boolean(onToggleLike);
            const likePending = commentActionPendingId === comment.id;

            return (
              <article className="thread-entry" key={comment.id}>
                <div className="thread-avatar">
                  {comment.authorAvatarUrl ? (
                    <span
                      className="thread-avatar-image"
                      style={{ backgroundImage: `url(${comment.authorAvatarUrl})` }}
                    />
                  ) : (
                    <span className="thread-avatar-fallback">{getAvatarFallback(comment.authorName)}</span>
                  )}
                </div>
                <div className="thread-body">
                  <div className="thread-meta">
                    <strong>{comment.authorName}</strong>
                    <span>{formatCommentDate(comment.createdAt)}</span>
                  </div>
                  <p className="thread-copy">{comment.content}</p>
                  <div className="thread-actions">
                    <span className="meta-pill">{comment.replyCount} 条回复</span>
                    <button
                      type="button"
                      className={comment.viewerLiked ? "button" : "button-secondary"}
                      disabled={!canToggleLike || likePending}
                      onClick={() => onToggleLike?.(comment.id, !comment.viewerLiked)}
                    >
                      {likePending
                        ? "处理中..."
                        : comment.viewerLiked
                          ? `已赞 ${comment.likeCount}`
                          : `点赞 ${comment.likeCount}`}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
