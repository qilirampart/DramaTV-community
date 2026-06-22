"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CommunityTransitionLink } from "@/components/shared/CommunityTransitionLink";
import { logoutAction } from "@/features/auth/actions";
import { useCommunitySession } from "@/components/shared/CommunitySessionProvider";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { normalizeAssetUrl } from "@/lib/presentation";
import { rememberBackAnchorSource } from "@/lib/routes/back-anchor";
import { COMMUNITY_CANVAS_ENTRY_URL, COMMUNITY_ROUTES } from "@/lib/routes/community-routes";
import { appendBackSource, shouldReplaceHistoryEntryForBackSource } from "@/lib/routes/redirect-utils";

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

type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "dramatv-theme-mode";
const Link = CommunityTransitionLink;

function getAvatarFallback(name: string) {
  return name.trim().charAt(0) || "D";
}

function DramaTvMark({ className }: { className?: string }) {
  return (
    <img alt="" aria-hidden="true" className={className} draggable="false" height="64" src="/favicon.png" width="64" />
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

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.5 8 3.5 4 3.5-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
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

function SunIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.5v2.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M12 18.4v2.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="m18 6-1.5 1.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="m7.5 16.5-1.5 1.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M20.5 12h-2.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M5.6 12H3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="m18 18-1.5-1.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M7.5 7.5 6 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 14.1a6.6 6.6 0 1 1-8.1-8.2 7.2 7.2 0 0 0 8.1 8.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function applyThemeMode(nextTheme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = nextTheme;
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
  const router = useRouter();
  const { currentUser } = useCommunitySession();
  const [hydrated, setHydrated] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setCurrentPath(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme: ThemeMode = savedTheme === "light" ? "light" : "dark";
    applyThemeMode(nextTheme);
    setThemeMode(nextTheme);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const syncedTheme: ThemeMode = event.newValue === "light" ? "light" : "dark";
      applyThemeMode(syncedTheme);
      setThemeMode(syncedTheme);
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const handleTrackedNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      const from = url.searchParams.get("from");
      if (!from) {
        return;
      }

      if (
        shouldReplaceHistoryEntryForBackSource(
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
          from
        )
      ) {
        try {
          window.history.replaceState(window.history.state, "", from);
        } catch {}
      }

      rememberBackAnchorSource(from);
    };

    document.addEventListener("click", handleTrackedNavigation, true);
    return () => document.removeEventListener("click", handleTrackedNavigation, true);
  }, []);

  const sessionUser = hydrated ? currentUser : null;
  const defaultProfileHref = COMMUNITY_ROUTES.me;
  const resolvedProfileHref = profileHref ?? defaultProfileHref;
  const resolvedProfileName = profileName ?? sessionUser?.displayName ?? "个人中心";
  const resolvedProfileAvatarUrl = normalizeAssetUrl(profileAvatarUrl ?? sessionUser?.avatarUrl);
  const showSessionActions = Boolean(sessionUser) && !gateActionsToLogin;

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
  const canvasHref = COMMUNITY_CANVAS_ENTRY_URL;
  const gatedProfileHref = gateActionsToLogin
    ? `/login?redirectTo=${encodeURIComponent(resolvedProfileHref)}`
    : resolvedProfileHref;
  const profileNavigationHref =
    !gateActionsToLogin && currentPath
      ? appendBackSource(resolvedProfileHref, currentPath)
      : gatedProfileHref;
  const landingHref = "/";
  const themeLabel = themeMode === "light" ? "日间" : "夜间";
  const themeAriaLabel = themeMode === "light" ? "切换到夜间模式" : "切换到日间模式";

  useEffect(() => {
    if (variant !== "home") {
      return;
    }

    const routes = new Set([landingHref, homeHref, featuredHref, communityHref]);
    routes.forEach((href) => {
      if (!href.startsWith("/") || href.startsWith("/login")) {
        return;
      }

      router.prefetch(href);
    });
  }, [communityHref, featuredHref, homeHref, landingHref, router, variant]);

  function handleThemeToggle() {
    setThemeMode((currentTheme) => {
      const nextTheme: ThemeMode = currentTheme === "light" ? "dark" : "light";
      applyThemeMode(nextTheme);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }

      return nextTheme;
    });
  }

  if (variant === "home") {
    return (
      <div className={`page-shell page-shell-${variant}${showHomeFloatingDock ? " page-shell-home-has-dock" : ""}`}>
        <header className="topbar topbar-home">
          <div className="topbar-home-left">
            <CommunityTransitionLink className="home-brand-link" href="/" transitionNav="home" transitionLabel="首页加载中">
              <span className="home-brand-mark">
                <DramaTvMark className="home-brand-mark-svg" />
              </span>
              <span className="home-brand-wordmark">Drama TV</span>
            </CommunityTransitionLink>

            <nav aria-label="Community navigation" className="home-nav-links">
              <CommunityTransitionLink className={`home-nav-link${topNavActive === "home" ? " home-nav-link-active" : ""}`} href={homeHref} transitionNav="home" transitionLabel="首页加载中">
                首页
              </CommunityTransitionLink>
              <span aria-hidden="true" className="home-nav-separator" />
              <Link
                className={`home-nav-link${topNavActive === "featured" ? " home-nav-link-active" : ""}`}
                href={featuredHref}
                transitionNav="featured"
                transitionLabel="精选加载中"
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
            <button
              aria-label={themeAriaLabel}
              className="home-theme-toggle"
              onClick={handleThemeToggle}
              type="button"
            >
              <span className="theme-toggle-icon">{themeMode === "light" ? <SunIcon /> : <MoonIcon />}</span>
              <span className="theme-toggle-label">{themeLabel}</span>
            </button>
            {showSessionActions ? (
              <NotificationBell />
            ) : (
              <Link aria-label="进入社区讨论" className="home-icon-link" href={communityHref}>
                <BellIcon />
              </Link>
            )}
            <Link
              aria-label={`打开${resolvedProfileName}`}
              className="home-profile-link"
              href={profileNavigationHref}
              title={resolvedProfileName}
            >
              <span className="home-profile-fallback" aria-hidden="true">
                {getAvatarFallback(resolvedProfileName)}
              </span>
              {resolvedProfileAvatarUrl ? (
                <span className="home-profile-avatar" aria-hidden="true" style={{ backgroundImage: `url(${resolvedProfileAvatarUrl})` }} />
              ) : null}
            </Link>
            {showSessionActions ? (
              <form action={logoutAction} className="home-session-form">
                <Link className="home-session-name-link" href={profileNavigationHref}>
                  <span className="home-session-name">{resolvedProfileName}</span>
                </Link>
                <button className="home-session-logout" type="submit">
                  退出
                </button>
              </form>
            ) : null}
          </div>
        </header>
        <div className="page-shell-home-content">{children}</div>
        {showHomeFloatingDock ? (
          <div className="home-floating-dock" aria-label="创作与画布入口">
            <Link
              aria-label="进入画布入口"
              className="home-floating-entry home-floating-entry-canvas"
              data-compact-label="画布入口"
              href={canvasHref}
            >
              <span className="home-floating-entry-icon">
                <CanvasSparkIcon />
              </span>
              <span className="home-floating-entry-copy">
                <strong>画布入口</strong>
                <span>进入联动画布</span>
              </span>
            </Link>

            <Link
              aria-label="发布新档案"
              className="home-floating-entry home-floating-entry-publish"
              data-compact-label="发布入口"
              href={publishHref}
            >
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
          <span className="brand-mark">
            <DramaTvMark className="brand-mark-image" />
          </span>
          <span className="brand-title">AI 视频生成社区</span>
          <span className="brand-subtitle">先看作品，再看方法、流程与创作过程。</span>
          {contextLabel ? <span className="topbar-context">{contextLabel}</span> : null}
        </div>

        <div className="topbar-right">
          <button aria-label={themeAriaLabel} className="theme-toggle-button" onClick={handleThemeToggle} type="button">
            <span className="theme-toggle-icon">{themeMode === "light" ? <SunIcon /> : <MoonIcon />}</span>
            <span className="theme-toggle-label">{themeLabel}</span>
          </button>
          <Link
            aria-label={`打开${resolvedProfileName}`}
            className="topbar-profile"
            href={profileNavigationHref}
            title={resolvedProfileName}
          >
            <span className="topbar-profile-fallback" aria-hidden="true">
              {getAvatarFallback(resolvedProfileName)}
            </span>
            {resolvedProfileAvatarUrl ? (
              <span className="topbar-profile-image" aria-hidden="true" style={{ backgroundImage: `url(${resolvedProfileAvatarUrl})` }} />
            ) : null}
            <span className="topbar-profile-status" />
          </Link>
          {showSessionActions ? (
            <form action={logoutAction} className="topbar-session-form">
              <Link className="topbar-session-name-link" href={profileNavigationHref}>
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
