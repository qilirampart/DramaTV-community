"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/features/auth/actions";
import { useCommunitySession } from "@/components/shared/CommunitySessionProvider";
import { COMMUNITY_ROUTES, creatorRoute } from "@/lib/routes/community-routes";

type PageShellVariant =
  | "default"
  | "home"
  | "video-detail"
  | "workflow-detail"
  | "publish"
  | "creator"
  | "discussion"
  | "canvas";

type PageShellProps = {
  children: ReactNode;
  variant?: PageShellVariant;
  contextLabel?: string;
  profileHref?: string;
  profileName?: string;
  profileAvatarUrl?: string;
  topNavActive?: "landing" | "home" | "featured" | "community";
  showHomeFloatingDock?: boolean;
  gateActionsToLogin?: boolean;
};

function getAvatarFallback(name: string) {
  return name.trim().charAt(0) || "D";
}

function DramaTvMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 12H34.5C45.8 12 52 20.2 52 31.6C52 43 45.8 52 34.5 52H18V12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4.5"
      />
      <path
        d="M28 22.5H34C39.3 22.5 42 26.4 42 31.5C42 36.6 39.3 40.5 34 40.5H28V22.5Z"
        opacity="0.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M10 51L33.5 31.5"
        opacity="0.85"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

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

function UserIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8.3" r="3.3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.2 18.4A6.4 6.4 0 0 1 12 14.7a6.4 6.4 0 0 1 5.8 3.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.5 8 3.5 4 3.5-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function LaunchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 17 17 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 7h8v8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M17 13.5V18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5v14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function CanvasSparkIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3.5 14.4 9l5.6 2.4-5.6 2.4L12 19.5l-2.4-5.7L4 11.4 9.6 9 12 3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function PageShell({
  children,
  variant = "default",
  contextLabel,
  profileHref,
  profileName,
  profileAvatarUrl,
  topNavActive = "landing",
  showHomeFloatingDock = false,
  gateActionsToLogin = false
}: PageShellProps) {
  const { currentUser } = useCommunitySession();
  const defaultProfileHref = currentUser ? creatorRoute(currentUser.id) : COMMUNITY_ROUTES.me;
  const resolvedProfileHref = profileHref ?? defaultProfileHref;
  const resolvedProfileName = profileName ?? currentUser?.displayName ?? "个人中心";
  const resolvedProfileAvatarUrl = profileAvatarUrl ?? currentUser?.avatarUrl;
  const showSessionActions = Boolean(currentUser) && !gateActionsToLogin;

  const homeHref = gateActionsToLogin ? `/login?redirectTo=${encodeURIComponent(COMMUNITY_ROUTES.home)}` : COMMUNITY_ROUTES.home;
  const featuredHref = gateActionsToLogin
    ? `/login?redirectTo=${encodeURIComponent(COMMUNITY_ROUTES.featured)}`
    : COMMUNITY_ROUTES.featured;
  const communityHref = gateActionsToLogin
    ? `/login?redirectTo=${encodeURIComponent(COMMUNITY_ROUTES.discussions)}`
    : COMMUNITY_ROUTES.discussions;
  const publishHref = gateActionsToLogin
    ? `/login?redirectTo=${encodeURIComponent(COMMUNITY_ROUTES.publish)}`
    : COMMUNITY_ROUTES.publish;
  const canvasHref = gateActionsToLogin
    ? `/login?redirectTo=${encodeURIComponent(COMMUNITY_ROUTES.canvasEntry)}`
    : COMMUNITY_ROUTES.canvasEntry;
  const gatedProfileHref = gateActionsToLogin
    ? `/login?redirectTo=${encodeURIComponent(resolvedProfileHref)}`
    : resolvedProfileHref;

  if (variant === "home") {
    return (
      <div className={`page-shell page-shell-${variant}`}>
        <header className="topbar topbar-home">
          <div className="topbar-home-left">
            <Link className="home-brand-link" href="/">
              <span className="home-brand-mark">
                <DramaTvMark className="home-brand-mark-svg" />
              </span>
              <span className="home-brand-wordmark">Drama TV</span>
            </Link>

            <nav aria-label="Community navigation" className="home-nav-links">
              <Link className={`home-nav-link${topNavActive === "home" ? " home-nav-link-active" : ""}`} href={homeHref}>
                首页
              </Link>
              <span aria-hidden="true" className="home-nav-separator" />
              <Link
                className={`home-nav-link${topNavActive === "featured" ? " home-nav-link-active" : ""}`}
                href={featuredHref}
              >
                精选
              </Link>
              <span aria-hidden="true" className="home-nav-separator" />
              <Link
                className={`home-nav-link${topNavActive === "community" ? " home-nav-link-active" : ""}`}
                href={communityHref}
              >
                超能社区
              </Link>
            </nav>
          </div>

          <div className="topbar-home-right">
            <Link aria-label="进入社区讨论" className="home-icon-link" href={communityHref}>
              <BellIcon />
            </Link>
            <span aria-label="当前语言" className="home-language-chip">
              <span>CN</span>
              <ChevronDownIcon />
            </span>
            <Link
              aria-label={`打开${resolvedProfileName}`}
              className="home-profile-link"
              href={gatedProfileHref}
              title={resolvedProfileName}
            >
              {resolvedProfileAvatarUrl ? (
                <span className="home-profile-avatar" style={{ backgroundImage: `url(${resolvedProfileAvatarUrl})` }} />
              ) : (
                <span className="home-profile-fallback">
                  <UserIcon />
                </span>
              )}
            </Link>
            {showSessionActions ? (
              <form action={logoutAction} className="home-session-form">
                <Link className="home-session-name-link" href={gatedProfileHref}>
                  <span className="home-session-name">{resolvedProfileName}</span>
                </Link>
                <button className="home-session-logout" type="submit">
                  退出
                </button>
              </form>
            ) : null}
            <Link aria-label="进入发布页" className="home-icon-link home-launch-link" href={publishHref}>
              <LaunchIcon />
            </Link>
          </div>
        </header>
        <div className="page-shell-home-content">{children}</div>
        {showHomeFloatingDock ? (
          <div className="home-floating-dock" aria-label="创作与画布入口">
            <Link aria-label="进入画布入口" className="home-floating-entry home-floating-entry-canvas" href={canvasHref}>
              <span className="home-floating-entry-icon">
                <CanvasSparkIcon />
              </span>
              <span className="home-floating-entry-copy">
                <strong>画布入口</strong>
                <span>进入联动画布</span>
              </span>
            </Link>

            <Link aria-label="发布新档案" className="home-floating-entry home-floating-entry-publish" href={publishHref}>
              <span className="home-floating-entry-copy">
                <strong>发布</strong>
                <span>提示词 / 工作流</span>
              </span>
              <span className="home-floating-entry-icon">
                <PlusIcon />
              </span>
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`page-shell page-shell-${variant}`}>
      <header className={`topbar topbar-${variant}`}>
        <div className="brand">
          <span className="brand-mark">DramaTV</span>
          <span className="brand-title">AI 视频生成社区</span>
          <span className="brand-subtitle">先看作品，再看方法、流程与创作过程。</span>
          {contextLabel ? <span className="topbar-context">{contextLabel}</span> : null}
        </div>

        <div className="topbar-right">
          <Link
            aria-label={`打开${resolvedProfileName}`}
            className="topbar-profile"
            href={resolvedProfileHref}
            title={resolvedProfileName}
          >
            {resolvedProfileAvatarUrl ? (
              <span className="topbar-profile-image" style={{ backgroundImage: `url(${resolvedProfileAvatarUrl})` }} />
            ) : (
              <span className="topbar-profile-fallback">{getAvatarFallback(resolvedProfileName)}</span>
            )}
            <span className="topbar-profile-status" />
          </Link>
          {showSessionActions ? (
            <form action={logoutAction} className="topbar-session-form">
              <Link className="topbar-session-name-link" href={resolvedProfileHref}>
                <span className="topbar-session-name">{resolvedProfileName}</span>
              </Link>
              <button className="topbar-session-logout" type="submit">
                退出
              </button>
            </form>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}
