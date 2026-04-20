"use client";

import Link from "next/link";
import { useState } from "react";
import { CommentThread } from "@/components/comments/CommentThread";
import { Tag } from "@/components/shared/Tag";
import { PageShell } from "@/components/shared/PageShell";
import {
  submitDiscussionCommentAction,
  toggleDiscussionFavoriteAction,
  toggleDiscussionLikeAction,
  toggleDiscussionCommentLikeAction
} from "@/features/discussions/actions";
import type { DiscussionDetailPageView } from "@/lib/contracts/view-models";
import { DiscussionMarkdown } from "./discussion-markdown";

type DiscussionDetailPageProps = {
  view: DiscussionDetailPageView;
};

type ActionNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

function noticeClassName(notice: ActionNotice) {
  if (notice.tone === "success") {
    return "interaction-notice interaction-notice-success";
  }

  if (notice.tone === "error") {
    return "interaction-notice interaction-notice-error";
  }

  return "interaction-notice";
}

function stripMarkdownForSummary(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*`_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function DiscussionDetailPage({ view }: DiscussionDetailPageProps) {
  const [currentView, setCurrentView] = useState(view);
  const [interactionPendingKey, setInteractionPendingKey] = useState<string | null>(null);
  const [interactionNotice, setInteractionNotice] = useState<ActionNotice | null>(null);
  const [commentPending, setCommentPending] = useState(false);
  const [commentLikePendingId, setCommentLikePendingId] = useState<string | null>(null);
  const [commentNotice, setCommentNotice] = useState<ActionNotice | null>(null);

  async function handleDiscussionLike() {
    setInteractionPendingKey("discussion-like");
    setInteractionNotice({
      tone: "neutral",
      text: currentView.viewerActions.liked ? "Removing post like..." : "Liking post..."
    });

    try {
      const result = await toggleDiscussionLikeAction({
        slug: currentView.slug,
        threadId: currentView.id,
        active: !currentView.viewerActions.liked
      });

      if (result.ok) {
        setCurrentView(result.view);
        setInteractionNotice({
          tone: "success",
          text: result.message
        });
        return;
      }

      setInteractionNotice({
        tone: "error",
        text: result.message
      });
    } finally {
      setInteractionPendingKey(null);
    }
  }

  async function handleDiscussionFavorite() {
    setInteractionPendingKey("discussion-favorite");
    setInteractionNotice({
      tone: "neutral",
      text: currentView.viewerActions.favorited ? "Removing post favorite..." : "Favoriting post..."
    });

    try {
      const result = await toggleDiscussionFavoriteAction({
        slug: currentView.slug,
        threadId: currentView.id,
        active: !currentView.viewerActions.favorited
      });

      if (result.ok) {
        setCurrentView(result.view);
        setInteractionNotice({
          tone: "success",
          text: result.message
        });
        return;
      }

      setInteractionNotice({
        tone: "error",
        text: result.message
      });
    } finally {
      setInteractionPendingKey(null);
    }
  }

  async function handleCommentSubmit(content: string) {
    setCommentPending(true);
    setCommentNotice({
      tone: "neutral",
      text: "Posting reply..."
    });

    try {
      const result = await submitDiscussionCommentAction({
        slug: currentView.slug,
        threadId: currentView.id,
        content
      });

      if (result.ok) {
        setCurrentView(result.view);
        setCommentNotice({
          tone: "success",
          text: result.message
        });
        return true;
      }

      setCommentNotice({
        tone: "error",
        text: result.message
      });
      return false;
    } finally {
      setCommentPending(false);
    }
  }

  async function handleCommentLike(commentId: string, active: boolean) {
    setCommentLikePendingId(commentId);
    setCommentNotice({
      tone: "neutral",
      text: "Updating comment like..."
    });

    try {
      const result = await toggleDiscussionCommentLikeAction({
        slug: currentView.slug,
        commentId,
        active
      });

      if (result.ok) {
        setCurrentView(result.view);
        setCommentNotice({
          tone: "success",
          text: result.message
        });
        return;
      }

      setCommentNotice({
        tone: "error",
        text: result.message
      });
    } finally {
      setCommentLikePendingId(null);
    }
  }

  return (
    <PageShell contextLabel="Discussion Detail" variant="discussion">
      <section className="hero-panel discussion-hero">
        <div className="discussion-hero-grid">
          <div>
            <div className="eyebrow">Discussion Thread</div>
            <h1 className="hero-title">{currentView.title}</h1>
            <p className="hero-copy">
              {currentView.excerpt ?? stripMarkdownForSummary(currentView.content)}
            </p>
            <div className="stats-row">
              <span className="meta-pill">{currentView.channel.title}</span>
              <span className="meta-pill">{currentView.publishedAtLabel}</span>
              <span className="meta-pill">{currentView.lastActivityLabel}</span>
              <span className="meta-pill">{currentView.likeCountLabel}</span>
              <span className="meta-pill">{currentView.favoriteCountLabel}</span>
              <span className="meta-pill">{currentView.replyCountLabel}</span>
            </div>
            {currentView.tagNames.length > 0 ? (
              <div className="tag-row">
                {currentView.tagNames.map((tag) => (
                  <Tag key={tag} label={tag} />
                ))}
              </div>
            ) : null}
          </div>

          <aside className="glass-panel discussion-side-panel">
            <div className="eyebrow">Author Snapshot</div>
            <div className="field-list">
              <div className="field">Author: {currentView.author.displayName}</div>
              <div className="field">Published: {currentView.publishedAtLabel}</div>
              <div className="field">Last activity: {currentView.lastActivityLabel}</div>
              <div className="field">Likes: {currentView.likeCountLabel}</div>
              <div className="field">Favorites: {currentView.favoriteCountLabel}</div>
              <div className="field">Replies: {currentView.replyCountLabel}</div>
              <div className="field">This thread is an independent discussion post.</div>
            </div>
            <div className="hero-actions">
              <button
                type="button"
                className={currentView.viewerActions.liked ? "button" : "button-secondary"}
                disabled={interactionPendingKey !== null}
                onClick={handleDiscussionLike}
              >
                {interactionPendingKey === "discussion-like"
                  ? "Updating Like..."
                  : currentView.viewerActions.liked
                    ? `Unlike Post (${currentView.stats.likeCount})`
                    : `Like Post (${currentView.stats.likeCount})`}
              </button>
              <button
                type="button"
                className={currentView.viewerActions.favorited ? "button" : "button-secondary"}
                disabled={interactionPendingKey !== null}
                onClick={handleDiscussionFavorite}
              >
                {interactionPendingKey === "discussion-favorite"
                  ? "Updating Favorite..."
                  : currentView.viewerActions.favorited
                    ? `Remove Favorite (${currentView.stats.favoriteCount})`
                    : `Favorite Post (${currentView.stats.favoriteCount})`}
              </button>
              <Link className="button-secondary" href={currentView.author.href}>
                Creator Page
              </Link>
              <Link className="button-secondary" href="/discussions">
                Back To Discussions
              </Link>
            </div>
            {interactionNotice ? (
              <p className={noticeClassName(interactionNotice)}>{interactionNotice.text}</p>
            ) : null}
          </aside>
        </div>
      </section>

      <div className="detail-layout">
        <section className="glass-panel stack-panel">
          <div className="eyebrow">Body</div>
          <h2>Thread Content</h2>
          <div className="field">
            <DiscussionMarkdown content={currentView.content} />
          </div>
        </section>

        <section className="glass-panel stack-panel">
          <div className="eyebrow">Discussion Context</div>
          <h2>How this thread works inside the community loop</h2>
          <div className="field-list">
            <div className="field">
              <p className="card-copy">
                This thread holds method notes, questions, and postmortems as a standalone
                discussion space. Replies stay on the thread, while videos and workflows keep their
                own detail pages and comment areas.
              </p>
            </div>
            <div className="field">
              <p className="card-copy">Channel: {currentView.channel.title}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="section">
        <CommentThread
          comments={currentView.comments}
          title="Replies"
          emptyText="No replies yet. Add method notes, questions, or a postmortem."
          composer={{
            placeholder: "Write a reply. It will be stored in the real post comment thread.",
            submitLabel: "Post Reply",
            pending: commentPending,
            notice: commentNotice,
            onSubmit: handleCommentSubmit
          }}
          commentActionPendingId={commentLikePendingId}
          onToggleLike={handleCommentLike}
        />
      </section>
    </PageShell>
  );
}
