"use client";

import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { normalizeBackTarget } from "./redirect-utils";

type SearchParamsLike = ReadonlyURLSearchParams | URLSearchParams | string;
type StoredBackScroll = {
  scrollY: number;
  storedAt: number;
};
type StoredRouteScrollRestoreState = {
  routeKey: string | null;
  restoring: boolean;
};

const BACK_SCROLL_STORAGE_PREFIX = "dramatv:back-scroll:";
const MAX_BACK_SCROLL_AGE_MS = 30 * 60 * 1000;
const BACK_SCROLL_RESTORE_TIMEOUT_MS = 2200;
const BACK_SCROLL_RESTORE_RETRY_DELAY_MS = 48;
const BACK_SCROLL_RESTORE_TOLERANCE_PX = 6;
const BACK_SCROLL_TARGET_VIEWPORT_MARGIN_PX = 180;
const BACK_SCROLL_STORED_SCROLL_MAX_DELTA_PX = 560;
const BACK_SCROLL_STORED_SCROLL_RETRY_LIMIT = 2;

export function buildCurrentRoute(pathname: string, searchParams: SearchParamsLike, hash?: string) {
  const queryString = typeof searchParams === "string" ? searchParams : searchParams.toString();
  const normalizedHash = hash ? hash.replace(/^#/, "") : "";

  return `${pathname}${queryString ? `?${queryString}` : ""}${normalizedHash ? `#${normalizedHash}` : ""}`;
}

export function buildBackAnchorSource(currentRoute: string, anchorId: string) {
  const normalizedAnchorId = anchorId.replace(/^#/, "");
  return `${currentRoute}#${normalizedAnchorId}`;
}

export function createBackAnchorId(prefix: string, uniqueKey: string) {
  return `${prefix}-${uniqueKey}`;
}

export function rememberBackAnchorSource(source: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedSource = normalizeBackTarget(source, window.location.pathname);
  const routeOnlySource = stripHashFromRoute(normalizedSource);

  try {
    const payload: StoredBackScroll = {
      scrollY: window.scrollY,
      storedAt: Date.now()
    };

    window.sessionStorage.setItem(buildBackScrollStorageKey(normalizedSource), JSON.stringify(payload));
    if (routeOnlySource !== normalizedSource) {
      window.sessionStorage.setItem(buildBackScrollStorageKey(routeOnlySource), JSON.stringify(payload));
    }
  } catch {}
}

export function useBackAnchorRestore(dependencies: readonly unknown[] = []) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hashAnchorId, setHashAnchorId] = useState<string | null>(null);
  const restoredAnchorRef = useRef<string | null>(null);
  const restoreSessionKeyRef = useRef<string | null>(null);
  const restoreStartedAtRef = useRef<number>(0);
  const restoreTimerRef = useRef<number | null>(null);
  const restoreModeRef = useRef<"stored" | "anchor">("stored");
  const storedScrollAttemptCountRef = useRef(0);
  const searchParamsKey = searchParams.toString();

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextHash = window.location.hash.replace(/^#/, "");
    const nextAnchorId = nextHash.length > 0 ? nextHash : null;
    setHashAnchorId((current) => (current === nextAnchorId ? current : nextAnchorId));
  }, [pathname, searchParamsKey]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncAnchor = () => {
      const nextHash = window.location.hash.replace(/^#/, "");
      const nextAnchorId = nextHash.length > 0 ? nextHash : null;
      setHashAnchorId((current) => (current === nextAnchorId ? current : nextAnchorId));
    };

    window.addEventListener("hashchange", syncAnchor);

    return () => window.removeEventListener("hashchange", syncAnchor);
  }, []);

  useLayoutEffect(() => {
    if (!hashAnchorId) {
      restoredAnchorRef.current = null;
      restoreSessionKeyRef.current = null;
      restoreStartedAtRef.current = 0;
      restoreModeRef.current = "stored";
      storedScrollAttemptCountRef.current = 0;
      if (restoreTimerRef.current !== null) {
        window.clearInterval(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }
      return;
    }

    const currentRoute = buildCurrentRoute(window.location.pathname, window.location.search.slice(1), hashAnchorId);

    if (restoredAnchorRef.current === currentRoute) {
      return;
    }

    const clearScheduledAttempt = () => {
      if (restoreTimerRef.current !== null) {
        window.clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }
    };

    const scheduleNextAttempt = () => {
      if (restoreTimerRef.current !== null) {
        return;
      }

      restoreTimerRef.current = window.setTimeout(() => {
        restoreTimerRef.current = null;
        attemptRestore();
      }, BACK_SCROLL_RESTORE_RETRY_DELAY_MS);
    };

    const finishRestore = () => {
      restoredAnchorRef.current = currentRoute;
      clearStoredBackScroll(currentRoute);
      restoreModeRef.current = "stored";
      storedScrollAttemptCountRef.current = 0;
      clearScheduledAttempt();
    };

    const attemptRestore = () => {
      if (restoredAnchorRef.current === currentRoute) {
        return;
      }

      const target = document.getElementById(hashAnchorId);
      if (!target) {
        if (Date.now() - restoreStartedAtRef.current > BACK_SCROLL_RESTORE_TIMEOUT_MS) {
          finishRestore();
          return;
        }

        scheduleNextAttempt();
        return;
      }

      const storedScroll = readStoredBackScroll(currentRoute);
      if (storedScroll && restoreModeRef.current === "stored") {
        storedScrollAttemptCountRef.current += 1;
        window.scrollTo({ top: storedScroll.scrollY, behavior: "auto" });

        const currentScrollY = window.scrollY;
        const maxScrollableY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const targetRect = target.getBoundingClientRect();
        const reachedStoredScroll = Math.abs(currentScrollY - storedScroll.scrollY) <= BACK_SCROLL_RESTORE_TOLERANCE_PX;
        const targetOffsetFromViewport = Math.min(Math.abs(targetRect.top), Math.abs(targetRect.bottom - window.innerHeight));
        const targetIsNearViewport =
          targetRect.bottom >= -BACK_SCROLL_TARGET_VIEWPORT_MARGIN_PX &&
          targetRect.top <= window.innerHeight + BACK_SCROLL_TARGET_VIEWPORT_MARGIN_PX;

        if (
          (reachedStoredScroll && targetIsNearViewport) ||
          (maxScrollableY + BACK_SCROLL_RESTORE_TOLERANCE_PX >= storedScroll.scrollY && targetIsNearViewport)
        ) {
          finishRestore();
          return;
        }

        if (
          storedScrollAttemptCountRef.current >= BACK_SCROLL_STORED_SCROLL_RETRY_LIMIT ||
          targetOffsetFromViewport > BACK_SCROLL_STORED_SCROLL_MAX_DELTA_PX
        ) {
          restoreModeRef.current = "anchor";
        }
      } else {
        if (storedScroll) {
          restoreModeRef.current = "anchor";
        }

        target.scrollIntoView({ block: "center" });
        const targetRect = target.getBoundingClientRect();
        const targetIsNearViewport =
          targetRect.bottom >= -BACK_SCROLL_TARGET_VIEWPORT_MARGIN_PX &&
          targetRect.top <= window.innerHeight + BACK_SCROLL_TARGET_VIEWPORT_MARGIN_PX;

        if (targetIsNearViewport) {
          finishRestore();
          return;
        }
      }

      if (Date.now() - restoreStartedAtRef.current > BACK_SCROLL_RESTORE_TIMEOUT_MS * 2) {
        finishRestore();
        return;
      }

      scheduleNextAttempt();
    };

    if (restoreSessionKeyRef.current !== currentRoute) {
      restoreSessionKeyRef.current = currentRoute;
      restoreStartedAtRef.current = Date.now();
      restoreModeRef.current = "stored";
      storedScrollAttemptCountRef.current = 0;
      clearScheduledAttempt();
    }

    attemptRestore();

    return () => {
      clearScheduledAttempt();
    };
  }, [hashAnchorId, pathname, searchParamsKey, ...dependencies]);

  return hashAnchorId;
}

function buildBackScrollStorageKey(source: string) {
  return `${BACK_SCROLL_STORAGE_PREFIX}${source}`;
}

function stripHashFromRoute(route: string) {
  const hashIndex = route.indexOf("#");
  return hashIndex >= 0 ? route.slice(0, hashIndex) : route;
}

function readStoredBackScroll(source: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const key = buildBackScrollStorageKey(source);
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredBackScroll;

    if (!Number.isFinite(parsed.scrollY)) {
      return null;
    }

    if (Date.now() - parsed.storedAt > MAX_BACK_SCROLL_AGE_MS) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function useStoredRouteScrollRestore() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [restoreState, setRestoreState] = useState<StoredRouteScrollRestoreState>({
    routeKey: null,
    restoring: false
  });
  const restoredRouteRef = useRef<string | null>(null);
  const restoreRouteRef = useRef<string | null>(null);
  const restoreTimerRef = useRef<number | null>(null);
  const restoreStartedAtRef = useRef<number>(0);
  const restoreSettledFrameCountRef = useRef(0);
  const searchParamsKey = searchParams.toString();

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.hash) {
      if (restoreTimerRef.current !== null) {
        window.clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }
      restoreRouteRef.current = null;
      restoreStartedAtRef.current = 0;
      restoreSettledFrameCountRef.current = 0;
      setRestoreState((current) =>
        current.routeKey === null && !current.restoring ? current : { routeKey: null, restoring: false }
      );
      return;
    }

    const currentRoute = buildCurrentRoute(window.location.pathname, window.location.search.slice(1));
    if (restoredRouteRef.current === currentRoute) {
      setRestoreState((current) =>
        current.routeKey === null && !current.restoring ? current : { routeKey: null, restoring: false }
      );
      return;
    }

    const storedScroll = readStoredBackScroll(currentRoute);
    if (!storedScroll) {
      restoreRouteRef.current = null;
      restoreStartedAtRef.current = 0;
      restoreSettledFrameCountRef.current = 0;
      if (restoreTimerRef.current !== null) {
        window.clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }
      setRestoreState((current) =>
        current.routeKey === null && !current.restoring ? current : { routeKey: null, restoring: false }
      );
      return;
    }

    const clearScheduledAttempt = () => {
      if (restoreTimerRef.current !== null) {
        window.clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }
    };

    const scheduleNextAttempt = () => {
      if (restoreTimerRef.current !== null) {
        return;
      }

      restoreTimerRef.current = window.setTimeout(() => {
        restoreTimerRef.current = null;
        attemptRestore();
      }, BACK_SCROLL_RESTORE_RETRY_DELAY_MS);
    };

    const finishRestore = () => {
      restoredRouteRef.current = currentRoute;
      clearStoredBackScroll(currentRoute);
      restoreRouteRef.current = null;
      restoreStartedAtRef.current = 0;
      restoreSettledFrameCountRef.current = 0;
      clearScheduledAttempt();
      setRestoreState({ routeKey: null, restoring: false });
    };

    const attemptRestore = () => {
      window.scrollTo({ top: storedScroll.scrollY, behavior: "auto" });

      const currentScrollY = window.scrollY;
      const maxScrollableY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const targetScrollY = Math.min(storedScroll.scrollY, maxScrollableY);
      const reachedTargetScroll = Math.abs(currentScrollY - targetScrollY) <= BACK_SCROLL_RESTORE_TOLERANCE_PX;
      const expectsScrollablePage = storedScroll.scrollY > BACK_SCROLL_RESTORE_TOLERANCE_PX;
      const pageCanActuallyScroll =
        maxScrollableY > BACK_SCROLL_RESTORE_TOLERANCE_PX ||
        !expectsScrollablePage;

      if (pageCanActuallyScroll && reachedTargetScroll) {
        restoreSettledFrameCountRef.current += 1;
      } else {
        restoreSettledFrameCountRef.current = 0;
      }

      if (restoreSettledFrameCountRef.current >= 2) {
        finishRestore();
        return;
      }

      if (Date.now() - restoreStartedAtRef.current > BACK_SCROLL_RESTORE_TIMEOUT_MS * 2) {
        finishRestore();
        return;
      }

      scheduleNextAttempt();
    };

    if (restoreRouteRef.current !== currentRoute) {
      restoreRouteRef.current = currentRoute;
      restoreStartedAtRef.current = Date.now();
      restoreSettledFrameCountRef.current = 0;
      clearScheduledAttempt();
      setRestoreState({ routeKey: currentRoute, restoring: true });
    }

    attemptRestore();

    return () => {
      clearScheduledAttempt();
    };
  }, [pathname, searchParamsKey]);

  return restoreState;
}

function clearStoredBackScroll(source: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(buildBackScrollStorageKey(source));
  } catch {}
}
