"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCommunitySession } from "@/components/shared/CommunitySessionProvider";
import { creatorRoute } from "@/lib/routes/community-routes";
import { appendBackSource } from "@/lib/routes/redirect-utils";

function BellIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 4.5A4.5 4.5 0 0 0 7.5 9v2.1c0 .9-.2 1.7-.7 2.5L5 16h14l-1.8-2.4a4.6 4.6 0 0 1-.7-2.5V9A4.5 4.5 0 0 0 12 4.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function getAvatarFallback(name: string) {
  return name.trim().charAt(0).toUpperCase() || "D";
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "刚刚";
  }

  const diff = Date.now() - date.getTime();
  if (diff < 60_000) {
    return "刚刚";
  }

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小时前`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} 天前`;
  }

  return date.toLocaleDateString("zh-CN");
}

function formatActionLabel(
  actionType: "like" | "favorite" | "comment" | "reply",
  targetType: "video" | "workflow" | "prompt" | "post",
  replyToActorName?: string
) {
  const targetLabel = (() => {
    switch (targetType) {
      case "video":
        return "视频";
      case "workflow":
        return "工作流";
      case "prompt":
        return "提示词";
      case "post":
        return "帖子";
      default:
        return "内容";
    }
  })();

  switch (actionType) {
    case "like":
      return `赞了你的${targetLabel}`;
    case "favorite":
      return `收藏了你的${targetLabel}`;
    case "comment":
      return `评论了你的${targetLabel}`;
    case "reply":
      return "回复了你的评论";
    default:
      return `互动了你的${targetLabel}`;
  }
}

function buildNotificationTargetHref(item: {
  id: string;
  commentId?: string;
  actionType: "like" | "favorite" | "comment" | "reply";
  target: { href: string };
}) {
  if (item.actionType === "comment" || item.actionType === "reply") {
    return `${item.target.href}#comment-${item.commentId ?? item.id}`;
  }
  return item.target.href;
}

function buildViewedNotificationSignature(items: Array<{ id: string }>) {
  return items.map((item) => item.id).join("|");
}

export function NotificationBell() {
  const { recentNotifications, hasUnreadNotifications, refreshRecentNotifications, markNotificationsViewed } =
    useCommunitySession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastViewedSignatureRef = useRef("");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewedNotificationSignature = useMemo(
    () => buildViewedNotificationSignature(recentNotifications),
    [recentNotifications]
  );

  const currentPath = useMemo(() => {
    const query = searchParams?.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!open) {
      lastViewedSignatureRef.current = "";
      return;
    }

    void refreshRecentNotifications({ force: true });

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, refreshRecentNotifications]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (lastViewedSignatureRef.current === viewedNotificationSignature) {
      return;
    }

    markNotificationsViewed();
    lastViewedSignatureRef.current = viewedNotificationSignature;
  }, [open, viewedNotificationSignature, markNotificationsViewed]);

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="查看最近互动"
        className={`home-icon-link notification-bell-trigger${open ? " notification-bell-trigger-active" : ""}`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <BellIcon />
        {hasUnreadNotifications && !open ? <span className="notification-bell-dot" aria-hidden="true" /> : null}
      </button>

      {open ? (
        <div aria-label="最近互动" className="notification-bell-panel" role="dialog">
          <div className="notification-bell-header">
            <div className="notification-bell-heading">
              <strong>最近互动</strong>
              <span>点赞、收藏和评论会先显示在这里</span>
            </div>
            <span className="notification-bell-count">{recentNotifications.length}</span>
          </div>

          {recentNotifications.length === 0 ? (
            <div className="notification-bell-empty">
              <strong>还没有新的互动</strong>
              <span>有人点赞、收藏或评论你的内容后，这里会自动更新。</span>
            </div>
          ) : (
            <div className="notification-bell-list">
              {recentNotifications.map((item) => {
                const href = appendBackSource(buildNotificationTargetHref(item), currentPath);
                const actorHref = appendBackSource(creatorRoute(item.actor.id), currentPath);

                return (
                  <div className="notification-bell-item" key={item.id}>
                    <Link
                      aria-label={`查看 ${item.actor.displayName} 的主页`}
                      className="notification-bell-avatar-link"
                      href={actorHref}
                      onClick={() => setOpen(false)}
                    >
                      {item.actor.avatarUrl ? (
                        <span
                          className="notification-bell-avatar-image"
                          style={{ backgroundImage: `url(${item.actor.avatarUrl})` }}
                        />
                      ) : (
                        <span className="notification-bell-avatar-fallback">
                          {getAvatarFallback(item.actor.displayName)}
                        </span>
                      )}
                    </Link>

                    <Link className="notification-bell-copy" href={href} onClick={() => setOpen(false)}>
                      <span className="notification-bell-meta">
                        <strong>{item.actor.displayName}</strong>
                        <span>{formatActionLabel(item.actionType, item.target.type, item.replyToActorName)}</span>
                      </span>
                      <span className="notification-bell-target">{item.target.title}</span>
                      {item.excerpt ? <span className="notification-bell-excerpt">{item.excerpt}</span> : null}
                      <span className="notification-bell-time">{formatRelativeTime(item.actedAt)}</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
