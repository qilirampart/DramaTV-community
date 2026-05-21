"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { CommentPageView, CommentPolicyView, CommentView } from "@/lib/contracts/view-models";
import { creatorRoute } from "@/lib/routes/community-routes";
import { appendBackSource } from "@/lib/routes/redirect-utils";

type CommentComposerNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

type CommentSubmitInput = {
  content: string;
  parentId?: string;
};

type CommentComposerConfig = {
  placeholder?: string;
  submitLabel?: string;
  notice?: CommentComposerNotice | null;
  pending?: boolean;
  disabled?: boolean;
  onSubmit: (input: CommentSubmitInput) => Promise<boolean>;
};

type LoadMoreConfig = {
  pending?: boolean;
  onLoadMore: () => Promise<void> | void;
};

type CommentThreadProps = {
  comments: CommentPageView | CommentView[];
  title?: string;
  emptyText?: string;
  helperText?: string;
  hideHeader?: boolean;
  variant?: "default" | "video" | "workflow" | "discussion";
  disabled?: boolean;
  composer?: CommentComposerConfig;
  commentActionPendingId?: string | null;
  commentManagementPendingId?: string | null;
  onToggleLike?: (commentId: string, active: boolean) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  commentPolicy?: CommentPolicyView;
  policyPending?: boolean;
  onToggleCommenting?: (nextEnabled: boolean) => Promise<void> | void;
  loadMore?: LoadMoreConfig;
};

type ActiveReplyTarget = {
  rootId: string;
  parentId: string;
  commentId: string;
  authorName: string;
};

type RootComposerProps = {
  composer: CommentComposerConfig;
  disabled: boolean;
};

type InlineReplyComposerProps = {
  composer: CommentComposerConfig;
  disabled: boolean;
  target: ActiveReplyTarget;
  onCancel: () => void;
  onSubmitted: () => void;
};

type ReplyCommentItemProps = {
  comment: CommentView;
  activeReplyTarget: ActiveReplyTarget | null;
  canReply: boolean;
  commentActionPendingId?: string | null;
  commentManagementPendingId?: string | null;
  composer?: CommentComposerConfig;
  isTargeted?: boolean;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onStartReply: (target: ActiveReplyTarget) => void;
  onToggleLike?: (commentId: string, active: boolean) => Promise<void>;
  rootId: string;
  sourcePath: string;
};

type RootCommentItemProps = {
  comment: CommentView;
  activeReplyTarget: ActiveReplyTarget | null;
  canReply: boolean;
  commentActionPendingId?: string | null;
  commentManagementPendingId?: string | null;
  composer?: CommentComposerConfig;
  isTargeted: boolean;
  targetCommentId?: string | null;
  isExpanded: boolean;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onReplySubmitted: () => void;
  onStartReply: (target: ActiveReplyTarget) => void;
  onToggleLike?: (commentId: string, active: boolean) => Promise<void>;
  onToggleReplies: () => void;
  sourcePath: string;
};

function formatCommentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "时间待同步";
  }

  return date.toLocaleDateString("zh-CN");
}

function formatCount(value: number) {
  return value.toLocaleString("zh-CN");
}

function getAvatarFallback(name: string) {
  return name.trim().charAt(0) || "评";
}

function commentAnchorId(commentId: string) {
  return `comment-${commentId}`;
}

function readHashCommentId(hash: string) {
  const normalized = hash.replace(/^#/, "").trim();
  if (!normalized.startsWith("comment-")) {
    return null;
  }
  const commentId = normalized.slice("comment-".length).trim();
  return commentId.length > 0 ? commentId : null;
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

function resolveCommentPage(comments: CommentPageView | CommentView[]): CommentPageView {
  if (Array.isArray(comments)) {
    return {
      items: comments,
      hasMore: false
    };
  }

  return comments;
}

const CommentAvatar = memo(function CommentAvatar({
  authorAvatarUrl,
  authorId,
  authorName,
  sourcePath
}: {
  authorAvatarUrl?: string;
  authorId: string;
  authorName: string;
  sourcePath: string;
}) {
  const href = appendBackSource(creatorRoute(authorId), sourcePath);

  return (
    <Link aria-label={`查看 ${authorName} 的主页`} className="thread-avatar thread-avatar-link" href={href}>
      {authorAvatarUrl ? (
        <span className="thread-avatar-image" style={{ backgroundImage: `url(${authorAvatarUrl})` }} />
      ) : (
        <span className="thread-avatar-fallback">{getAvatarFallback(authorName)}</span>
      )}
    </Link>
  );
});

const RootComposer = memo(function RootComposer({ composer, disabled }: RootComposerProps) {
  const [draft, setDraft] = useState("");

  const handleSubmit = useCallback(async () => {
    const normalized = draft.trim();
    if (!normalized || disabled || composer.pending) {
      return;
    }

    const success = await composer.onSubmit({ content: normalized });
    if (success) {
      setDraft("");
    }
  }, [composer, disabled, draft]);

  return (
    <div className="thread-composer">
      <textarea
        className="publish-textarea thread-textarea"
        disabled={disabled || composer.pending}
        placeholder={composer.placeholder ?? "写下你的评论"}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="thread-composer-footer">
        <span className="muted">欢迎留下你的看法。</span>
        <button
          className="button"
          disabled={disabled || composer.pending || draft.trim().length === 0}
          type="button"
          onClick={handleSubmit}
        >
          {composer.pending ? "提交中..." : composer.submitLabel ?? "发布评论"}
        </button>
      </div>
      {composer.notice ? <p className={composerNoticeClassName(composer.notice)}>{composer.notice.text}</p> : null}
    </div>
  );
});

const InlineReplyComposer = memo(function InlineReplyComposer({
  composer,
  disabled,
  target,
  onCancel,
  onSubmitted
}: InlineReplyComposerProps) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setDraft("");
  }, [target.commentId, target.parentId, target.rootId]);

  const handleSubmit = useCallback(async () => {
    const normalized = draft.trim();
    if (!normalized || disabled || composer.pending) {
      return;
    }

    const success = await composer.onSubmit({
      content: normalized,
      parentId: target.parentId
    });

    if (success) {
      setDraft("");
      onSubmitted();
    }
  }, [composer, disabled, draft, onSubmitted, target.parentId]);

  return (
    <div className="thread-inline-composer">
      <div className="thread-reply-context">回复 {target.authorName}</div>
      <textarea
        className="publish-textarea thread-textarea thread-textarea-inline"
        disabled={disabled || composer.pending}
        placeholder={composer.placeholder ?? "写下你的回复"}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="thread-reply-actions">
        <button className="button-secondary" disabled={disabled || composer.pending} type="button" onClick={onCancel}>
          取消
        </button>
        <button
          className="button"
          disabled={disabled || composer.pending || draft.trim().length === 0}
          type="button"
          onClick={handleSubmit}
        >
          {composer.pending ? "提交中..." : composer.submitLabel ?? "发布回复"}
        </button>
      </div>
      {composer.notice ? <p className={composerNoticeClassName(composer.notice)}>{composer.notice.text}</p> : null}
    </div>
  );
});

const ReplyCommentItem = memo(function ReplyCommentItem({
  comment,
  activeReplyTarget,
  canReply,
  commentActionPendingId,
  commentManagementPendingId,
  composer,
  isTargeted = false,
  onDeleteComment,
  onStartReply,
  onToggleLike,
  rootId,
  sourcePath
}: ReplyCommentItemProps) {
  const likePending = commentActionPendingId === comment.id;
  const deletePending = commentManagementPendingId === comment.id;
  const replyingToThisComment = activeReplyTarget?.commentId === comment.id;

  return (
    <article className={`thread-entry${isTargeted ? " thread-entry-highlighted" : ""}`} id={commentAnchorId(comment.id)}>
      <div className="thread-main">
        <CommentAvatar
          authorAvatarUrl={comment.authorAvatarUrl}
          authorId={comment.authorId}
          authorName={comment.authorName}
          sourcePath={sourcePath}
        />
        <div className="thread-body">
          <div className="thread-meta">
            <strong>{comment.authorName}</strong>
            <span>{formatCommentDate(comment.createdAt)}</span>
          </div>
          {comment.replyTarget ? (
            <div className="thread-reply-context">回复 {comment.replyTarget.authorName}</div>
          ) : null}
          <p className="thread-copy">{comment.content}</p>
          <div className="thread-actions">
            <button
              className={comment.viewerLiked ? "thread-text-button-active" : "thread-text-button"}
              disabled={!onToggleLike || likePending}
              type="button"
              onClick={() => onToggleLike?.(comment.id, !comment.viewerLiked)}
            >
              {likePending
                ? "处理中..."
                : `${comment.viewerLiked ? "已赞" : "点赞"} ${formatCount(comment.likeCount)}`}
            </button>
            {canReply && composer ? (
              <button
                className={replyingToThisComment ? "thread-text-button-active" : "thread-text-button"}
                type="button"
                onClick={() =>
                  onStartReply({
                    rootId,
                    parentId: comment.id,
                    commentId: comment.id,
                    authorName: comment.authorName
                  })
                }
              >
                回复
              </button>
            ) : null}
            {comment.viewerCanDelete ? (
              <button
                className="thread-text-button"
                disabled={!onDeleteComment || deletePending}
                type="button"
                onClick={() => onDeleteComment?.(comment.id)}
              >
                {deletePending ? "删除中..." : "删除"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
});

const RootCommentItem = memo(function RootCommentItem({
  comment,
  activeReplyTarget,
  canReply,
  commentActionPendingId,
  commentManagementPendingId,
  composer,
  isTargeted,
  targetCommentId,
  isExpanded,
  onDeleteComment,
  onReplySubmitted,
  onStartReply,
  onToggleLike,
  onToggleReplies,
  sourcePath
}: RootCommentItemProps) {
  const likePending = commentActionPendingId === comment.id;
  const deletePending = commentManagementPendingId === comment.id;
  const replyCount = Math.max(comment.replyCount, comment.replies.length);
  const hasReplies = replyCount > 0;
  const replyingToThisRoot = activeReplyTarget?.commentId === comment.id;

  return (
    <article className={`thread-entry${isTargeted ? " thread-entry-highlighted" : ""}`} id={commentAnchorId(comment.id)}>
      <div className="thread-main">
        <CommentAvatar
          authorAvatarUrl={comment.authorAvatarUrl}
          authorId={comment.authorId}
          authorName={comment.authorName}
          sourcePath={sourcePath}
        />
        <div className="thread-body">
          <div className="thread-meta">
            <strong>{comment.authorName}</strong>
            <span>{formatCommentDate(comment.createdAt)}</span>
          </div>
          <p className="thread-copy">{comment.content}</p>
          <div className="thread-actions">
            {hasReplies ? <span className="meta-pill">{formatCount(replyCount)} 条回复</span> : null}
            <button
              className={comment.viewerLiked ? "thread-text-button-active" : "thread-text-button"}
              disabled={!onToggleLike || likePending}
              type="button"
              onClick={() => onToggleLike?.(comment.id, !comment.viewerLiked)}
            >
              {likePending
                ? "处理中..."
                : `${comment.viewerLiked ? "已赞" : "点赞"} ${formatCount(comment.likeCount)}`}
            </button>
            {canReply && composer ? (
              <button
                className={replyingToThisRoot ? "thread-text-button-active" : "thread-text-button"}
                type="button"
                onClick={() =>
                  onStartReply({
                    rootId: comment.id,
                    parentId: comment.id,
                    commentId: comment.id,
                    authorName: comment.authorName
                  })
                }
              >
                回复
              </button>
            ) : null}
            {hasReplies ? (
              <button
                className={`thread-text-button thread-reply-toggle ${isExpanded ? "thread-reply-toggle-active thread-text-button-active" : ""}`}
                type="button"
                onClick={onToggleReplies}
              >
                {isExpanded ? "收起回复" : `展开 ${formatCount(replyCount)} 条回复`}
              </button>
            ) : null}
            {comment.viewerCanDelete ? (
              <button
                className="thread-text-button"
                disabled={!onDeleteComment || deletePending}
                type="button"
                onClick={() => onDeleteComment?.(comment.id)}
              >
                {deletePending ? "删除中..." : "删除"}
              </button>
            ) : null}
          </div>

          {activeReplyTarget && composer ? (
            <InlineReplyComposer
              composer={composer}
              disabled={!canReply}
              target={activeReplyTarget}
              onCancel={onReplySubmitted}
              onSubmitted={onReplySubmitted}
            />
          ) : null}

          {isExpanded && comment.replies.length > 0 ? (
            <div className="thread-children">
              {comment.replies.map((reply) => (
                <ReplyCommentItem
                  activeReplyTarget={activeReplyTarget}
                  canReply={canReply}
                  comment={reply}
                  commentActionPendingId={commentActionPendingId}
                  commentManagementPendingId={commentManagementPendingId}
                  composer={composer}
                  isTargeted={targetCommentId === reply.id}
                  key={reply.id}
                  onDeleteComment={onDeleteComment}
                  onStartReply={onStartReply}
                  onToggleLike={onToggleLike}
                  rootId={comment.id}
                  sourcePath={sourcePath}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
});

export function CommentThread({
  comments,
  title = "评论区",
  emptyText = "暂时还没有评论。",
  helperText,
  hideHeader = false,
  variant = "default",
  disabled = false,
  composer,
  commentActionPendingId,
  commentManagementPendingId,
  onToggleLike,
  onDeleteComment,
  commentPolicy,
  policyPending = false,
  onToggleCommenting,
  loadMore
}: CommentThreadProps) {
  const commentPage = resolveCommentPage(comments);
  const [expandedRootIds, setExpandedRootIds] = useState<Record<string, true>>({});
  const [activeReplyTarget, setActiveReplyTarget] = useState<ActiveReplyTarget | null>(null);
  const [targetCommentId, setTargetCommentId] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState("/featured");
  const scrolledHashRef = useRef<string | null>(null);

  const commentingEnabled = commentPolicy?.commentingEnabled ?? true;
  const canManageComments = commentPolicy?.canManageComments ?? false;
  const canReply = Boolean(composer) && !disabled && commentingEnabled;
  const shouldRenderComposer = Boolean(composer) && (commentingEnabled || disabled);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    setSourcePath(path || "/featured");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncTargetComment = () => {
      setTargetCommentId(readHashCommentId(window.location.hash));
    };

    syncTargetComment();
    window.addEventListener("hashchange", syncTargetComment);

    return () => {
      window.removeEventListener("hashchange", syncTargetComment);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hashCommentId = targetCommentId;
    if (!hashCommentId) {
      scrolledHashRef.current = null;
      return;
    }

    const matchedRoot = commentPage.items.find((item) => item.id === hashCommentId || item.replies.some((reply) => reply.id === hashCommentId));
    if (!matchedRoot) {
      return;
    }

    if (matchedRoot.replies.some((reply) => reply.id === hashCommentId)) {
      setExpandedRootIds((current) => (current[matchedRoot.id] ? current : { ...current, [matchedRoot.id]: true }));
    }

    const anchorId = commentAnchorId(hashCommentId);
    if (scrolledHashRef.current === anchorId) {
      return;
    }

    const scrollTimer = window.setTimeout(() => {
      const target = window.document.getElementById(anchorId);
      if (!target) {
        return;
      }

      scrolledHashRef.current = anchorId;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [commentPage.items, targetCommentId]);

  useEffect(() => {
    const validRootIds = new Set(commentPage.items.map((item) => item.id));

    setExpandedRootIds((current) => {
      const nextEntries = Object.keys(current).filter((id) => validRootIds.has(id));
      if (nextEntries.length === Object.keys(current).length) {
        return current;
      }

      return Object.fromEntries(nextEntries.map((id) => [id, true]));
    });

    setActiveReplyTarget((current) => {
      if (!current) {
        return current;
      }

      const root = commentPage.items.find((item) => item.id === current.rootId);
      if (!root) {
        return null;
      }

      if (current.parentId === root.id) {
        return current;
      }

      return root.replies.some((reply) => reply.id === current.parentId) ? current : null;
    });
  }, [commentPage.items]);

  const handleStartReply = useCallback((target: ActiveReplyTarget) => {
    setExpandedRootIds((current) => (current[target.rootId] ? current : { ...current, [target.rootId]: true }));
    setActiveReplyTarget(target);
  }, []);

  const handleReplySubmitted = useCallback((rootId: string) => {
    setExpandedRootIds((current) => (current[rootId] ? current : { ...current, [rootId]: true }));
    setActiveReplyTarget((current) => (current?.rootId === rootId ? null : current));
  }, []);

  const handleToggleReplies = useCallback(
    (rootId: string) => {
      const isCurrentlyExpanded = Boolean(expandedRootIds[rootId]) || activeReplyTarget?.rootId === rootId;

      if (isCurrentlyExpanded && activeReplyTarget?.rootId === rootId) {
        setActiveReplyTarget(null);
      }

      setExpandedRootIds((current) => {
        if (isCurrentlyExpanded) {
          const next = { ...current };
          delete next[rootId];
          return next;
        }

        return { ...current, [rootId]: true };
      });
    },
    [activeReplyTarget, expandedRootIds]
  );

  const toggleCommentingLabel = commentingEnabled ? "关闭评论区" : "开启评论区";
  const closedHint = variant === "discussion" ? "当前楼主已关闭回复区。" : "当前作者已关闭评论区。";

  return (
    <div className={`comment-thread comment-thread-${variant}`}>
      {!hideHeader ? (
        <div className="thread-header">
          <div className="eyebrow">{variant === "workflow" ? "流程讨论" : "现场讨论"}</div>
          <h2>{title}</h2>
          {helperText ? <p className="thread-helper">{helperText}</p> : null}
        </div>
      ) : helperText ? (
        <p className="thread-helper">{helperText}</p>
      ) : null}

      {canManageComments ? (
        <div className="thread-policy-row">
          <span className="thread-helper">
            {commentingEnabled ? "当前允许新的评论与回复。" : "当前已关闭新的评论与回复。"}
          </span>
          <button
            className="button-secondary"
            disabled={!onToggleCommenting || policyPending}
            type="button"
            onClick={() => void onToggleCommenting?.(!commentingEnabled)}
          >
            {policyPending ? "处理中..." : toggleCommentingLabel}
          </button>
        </div>
      ) : !commentingEnabled ? (
        <p className="thread-helper">{closedHint}</p>
      ) : null}

      {shouldRenderComposer && composer ? <RootComposer composer={composer} disabled={!canReply} /> : null}

      {commentPage.items.length === 0 ? (
        <p className="thread-empty">{emptyText}</p>
      ) : (
        <div className="thread-list">
          {commentPage.items.map((comment) => (
            <RootCommentItem
              activeReplyTarget={comment.id === activeReplyTarget?.rootId ? activeReplyTarget : null}
              canReply={canReply}
              comment={comment}
              commentActionPendingId={commentActionPendingId}
              commentManagementPendingId={commentManagementPendingId}
              composer={composer}
              isExpanded={Boolean(expandedRootIds[comment.id]) || activeReplyTarget?.rootId === comment.id}
              isTargeted={
                targetCommentId === comment.id || comment.replies.some((reply) => reply.id === targetCommentId)
              }
              key={comment.id}
              onDeleteComment={onDeleteComment}
              onReplySubmitted={() => handleReplySubmitted(comment.id)}
              onStartReply={handleStartReply}
              onToggleLike={onToggleLike}
              onToggleReplies={() => handleToggleReplies(comment.id)}
              sourcePath={sourcePath}
              targetCommentId={targetCommentId}
            />
          ))}
        </div>
      )}

      {commentPage.hasMore && loadMore ? (
        <div className="thread-composer-footer">
          <span className="muted">还有更多评论未展开。</span>
          <button
            className="button-secondary"
            disabled={loadMore.pending}
            type="button"
            onClick={() => void loadMore.onLoadMore()}
          >
            {loadMore.pending ? "加载中..." : "加载更多"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
