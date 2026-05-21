"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Tag } from "@/components/shared/Tag";
import type { DiscussionThreadCardView } from "@/lib/contracts/view-models";
import { formatDiscussionDisplayExcerpt, formatDiscussionDisplayTitle } from "@/lib/presentation";
import {
  toggleDiscussionThreadFavoriteQuickAction,
  toggleDiscussionThreadLikeQuickAction
} from "./actions";

type DiscussionThreadQuickFavoriteCardProps = {
  thread: DiscussionThreadCardView;
  variant: "row" | "compact";
};

type CardNotice = {
  tone: "error";
  text: string;
};

function noticeClassName(notice: CardNotice) {
  return notice.tone === "error" ? "interaction-notice interaction-notice-error" : "interaction-notice";
}

function safeCount(value?: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function DiscussionThreadQuickFavoriteCard({
  thread,
  variant
}: DiscussionThreadQuickFavoriteCardProps) {
  const displayTitle = formatDiscussionDisplayTitle(thread.title) ?? thread.title;
  const displayExcerpt = formatDiscussionDisplayExcerpt(thread.excerpt);
  const router = useRouter();
  const [liked, setLiked] = useState(thread.viewerLiked ?? false);
  const [likeCount, setLikeCount] = useState(safeCount(thread.likeCount));
  const [favorited, setFavorited] = useState(thread.viewerFavorited ?? false);
  const [favoriteCount, setFavoriteCount] = useState(safeCount(thread.favoriteCount));
  const [notice, setNotice] = useState<CardNotice | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setLiked(thread.viewerLiked ?? false);
    setLikeCount(safeCount(thread.likeCount));
    setFavorited(thread.viewerFavorited ?? false);
    setFavoriteCount(safeCount(thread.favoriteCount));
  }, [thread.favoriteCount, thread.likeCount, thread.viewerFavorited, thread.viewerLiked]);

  function handleLikeToggle() {
    const nextActive = !liked;

    startTransition(async () => {
      const result = await toggleDiscussionThreadLikeQuickAction({
        threadId: thread.id,
        active: nextActive
      });

      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.message
        });
        return;
      }

      setLiked(nextActive);
      setLikeCount((current) => Math.max(0, current + (nextActive ? 1 : -1)));
      setNotice(null);
      router.refresh();
    });
  }

  function handleFavoriteToggle() {
    const nextActive = !favorited;

    startTransition(async () => {
      const result = await toggleDiscussionThreadFavoriteQuickAction({
        threadId: thread.id,
        active: nextActive
      });

      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.message
        });
        return;
      }

      setFavorited(nextActive);
      setFavoriteCount((current) => Math.max(0, current + (nextActive ? 1 : -1)));
      setNotice(null);
      router.refresh();
    });
  }

  if (variant === "compact") {
    return (
      <article className="discussion-mini-card discussion-mini-card-shell">
        <Link className="discussion-mini-card-link" href={thread.href}>
          <div className="discussion-card-meta">
            <strong>{displayTitle}</strong>
            <span className="meta-pill">{thread.channelTitle}</span>
          </div>
          <p>{displayExcerpt ?? thread.lastActivityLabel}</p>
          <div className="hero-chip-row">
            <span className="meta-pill">{likeCount.toLocaleString("zh-CN")} likes</span>
            <span className="meta-pill">{favoriteCount.toLocaleString("zh-CN")} favorites</span>
            <span className="meta-pill">{thread.replyCountLabel}</span>
            {liked ? <span className="meta-pill">Liked</span> : null}
            {favorited ? <span className="meta-pill">Favorited</span> : null}
          </div>
        </Link>
        <div className="discussion-card-quick-actions">
          <button
            type="button"
            className={`discussion-card-quick-action${liked ? " discussion-card-quick-action-active" : ""}`}
            disabled={pending}
            onClick={handleLikeToggle}
          >
            {pending ? "Updating..." : liked ? "Unlike" : "Like"}
          </button>
          <button
            type="button"
            className={`discussion-card-quick-action${favorited ? " discussion-card-quick-action-active" : ""}`}
            disabled={pending}
            onClick={handleFavoriteToggle}
          >
            {pending ? "Updating..." : favorited ? "Remove Favorite" : "Favorite"}
          </button>
        </div>
        {notice ? <p className={noticeClassName(notice)}>{notice.text}</p> : null}
      </article>
    );
  }

  return (
    <article className="discussion-thread-row discussion-thread-row-shell">
      <div className="discussion-thread-copy">
        <Link className="discussion-thread-primary-link" href={thread.href}>
          <strong>{displayTitle}</strong>
          {displayExcerpt ? <p className="card-copy">{displayExcerpt}</p> : null}
        </Link>
        <div className="discussion-thread-meta-row">
          <span>{thread.channelTitle}</span>
          <span>{thread.lastActivityLabel}</span>
          <span>{likeCount.toLocaleString("zh-CN")} likes</span>
          <span>{favoriteCount.toLocaleString("zh-CN")} favorites</span>
          <span>{thread.replyCountLabel}</span>
        </div>
        {liked || favorited ? (
          <div className="hero-chip-row">
            {liked ? <span className="meta-pill">Liked</span> : null}
            {favorited ? <span className="meta-pill">Favorited</span> : null}
          </div>
        ) : null}
        {thread.tags.length > 0 ? (
          <div className="tag-row">
            {thread.tags.map((tag) => (
              <Tag key={`${thread.id}-${tag}`} label={tag} />
            ))}
          </div>
        ) : null}
        {notice ? <p className={noticeClassName(notice)}>{notice.text}</p> : null}
      </div>

      <div className="discussion-thread-actions">
        <div className="discussion-card-quick-actions">
          <button
            type="button"
            className={`discussion-card-quick-action${liked ? " discussion-card-quick-action-active" : ""}`}
            disabled={pending}
            onClick={handleLikeToggle}
          >
            {pending ? "Updating..." : liked ? "Unlike" : "Like"}
          </button>
          <button
            type="button"
            className={`discussion-card-quick-action${favorited ? " discussion-card-quick-action-active" : ""}`}
            disabled={pending}
            onClick={handleFavoriteToggle}
          >
            {pending ? "Updating..." : favorited ? "Remove Favorite" : "Favorite"}
          </button>
        </div>
        <Link className="section-link" href={thread.href}>
          Open
        </Link>
      </div>
    </article>
  );
}
