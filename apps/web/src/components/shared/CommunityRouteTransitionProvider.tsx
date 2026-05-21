"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RouteVideoLoading } from "@/components/shared/RouteVideoLoading";
import styles from "./CommunityRouteTransitionProvider.module.css";

type TransitionNav = "home" | "featured" | "community";

type BeginTransitionOptions = {
  href: string;
  nav?: TransitionNav;
  label?: string;
};

type CommunityRouteTransitionContextValue = {
  beginTransition: (options: BeginTransitionOptions) => void;
};

const MIN_TRANSITION_MS = 500;
const MAX_TRANSITION_MS = 4000;

const CommunityRouteTransitionContext = createContext<CommunityRouteTransitionContextValue | null>(null);

function normalizeHref(href: string) {
  if (typeof window === "undefined") {
    return href;
  }

  try {
    const url = new URL(href, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

function resolveTransitionMeta(href: string, nav?: TransitionNav, label?: string) {
  if (nav && label) {
    return { nav, label };
  }

  if (href === "/" || href.startsWith("/home")) {
    return { nav: nav ?? "home", label: label ?? "Loading home" };
  }

  if (href.startsWith("/featured")) {
    return { nav: nav ?? "featured", label: label ?? "Loading featured" };
  }

  if (href.startsWith("/discussions")) {
    return { nav: nav ?? "community", label: label ?? "Loading community" };
  }

  return { nav: nav ?? "home", label: label ?? "Loading next page" };
}

function pauseAmbientVideos() {
  if (typeof document === "undefined") {
    return;
  }

  const videos = document.querySelectorAll("video");
  videos.forEach((video) => {
    if (video instanceof HTMLVideoElement && !video.dataset.routeTransitionVideo) {
      video.pause();
    }
  });
}

export function CommunityRouteTransitionProvider({
  children
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const forceCloseTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const originHrefRef = useRef("");
  const pendingHrefRef = useRef("");
  const [overlayState, setOverlayState] = useState<{
    visible: boolean;
    nav: TransitionNav;
    label: string;
  }>({
    visible: false,
    nav: "home",
    label: "Loading next page"
  });

  useEffect(() => {
    return () => {
      if (forceCloseTimerRef.current !== null) {
        window.clearTimeout(forceCloseTimerRef.current);
      }
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const settleTransitionOverlay = useCallback(() => {
    setOverlayState((current) => ({ ...current, visible: false }));
    originHrefRef.current = "";
    pendingHrefRef.current = "";
    if (forceCloseTimerRef.current !== null) {
      window.clearTimeout(forceCloseTimerRef.current);
    }
    forceCloseTimerRef.current = null;
    hideTimerRef.current = null;
  }, []);

  const scheduleOverlayDismiss = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_TRANSITION_MS - elapsed);

    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = window.setTimeout(() => {
      settleTransitionOverlay();
    }, remaining);
  }, [settleTransitionOverlay]);

  useEffect(() => {
    if (!overlayState.visible) {
      return;
    }

    pauseAmbientVideos();
  }, [overlayState.visible, routeKey]);

  useEffect(() => {
    if (!overlayState.visible) {
      return;
    }

    if (!pendingHrefRef.current) {
      return;
    }

    const normalizedRouteKey = normalizeHref(routeKey);
    if (normalizedRouteKey === originHrefRef.current) {
      return;
    }

    scheduleOverlayDismiss();
  }, [overlayState.visible, routeKey, scheduleOverlayDismiss]);

  const beginTransition = useCallback(
    ({ href, nav, label }: BeginTransitionOptions) => {
      const normalizedHref = normalizeHref(href);
      const currentHref = normalizeHref(routeKey);

      if (!normalizedHref || normalizedHref === currentHref || pendingHrefRef.current) {
        return;
      }

      const meta = resolveTransitionMeta(normalizedHref, nav, label);

      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (forceCloseTimerRef.current !== null) {
        window.clearTimeout(forceCloseTimerRef.current);
      }

      startTimeRef.current = Date.now();
      originHrefRef.current = currentHref;
      pendingHrefRef.current = normalizedHref;
      pauseAmbientVideos();
      setOverlayState({
        visible: true,
        nav: meta.nav,
        label: meta.label
      });

      forceCloseTimerRef.current = window.setTimeout(() => {
        settleTransitionOverlay();
      }, MAX_TRANSITION_MS);

      router.prefetch(normalizedHref);
      router.push(normalizedHref);
    },
    [routeKey, router]
  );

  const contextValue = useMemo(
    () => ({
      beginTransition
    }),
    [beginTransition]
  );

  return (
    <CommunityRouteTransitionContext.Provider value={contextValue}>
      <div className={overlayState.visible ? styles.contentHidden : styles.contentVisible}>{children}</div>
      {overlayState.visible ? (
        <div aria-hidden="false" className={`${styles.overlay} ${styles.overlayVisible}`}>
          <RouteVideoLoading
            activeNav={overlayState.nav}
            label={overlayState.label}
            videoActive
          />
        </div>
      ) : null}
    </CommunityRouteTransitionContext.Provider>
  );
}

export function useCommunityRouteTransition() {
  const context = useContext(CommunityRouteTransitionContext);

  if (!context) {
    throw new Error("useCommunityRouteTransition must be used within CommunityRouteTransitionProvider");
  }

  return context;
}
