"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { normalizeBackTarget } from "./redirect-utils";

type SearchParamsLike = ReadonlyURLSearchParams | URLSearchParams | string;
type StoredBackScroll = {
  scrollY: number;
  storedAt: number;
};

const BACK_SCROLL_STORAGE_PREFIX = "dramatv:back-scroll:";
const MAX_BACK_SCROLL_AGE_MS = 30 * 60 * 1000;

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

  try {
    const payload: StoredBackScroll = {
      scrollY: window.scrollY,
      storedAt: Date.now()
    };

    window.sessionStorage.setItem(buildBackScrollStorageKey(normalizedSource), JSON.stringify(payload));
  } catch {}
}

export function useBackAnchorRestore(dependencies: readonly unknown[] = []) {
  const [hashAnchorId, setHashAnchorId] = useState<string | null>(null);
  const restoredAnchorRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncAnchor = () => {
      const nextHash = window.location.hash.replace(/^#/, "");
      setHashAnchorId(nextHash.length > 0 ? nextHash : null);
    };

    syncAnchor();
    window.addEventListener("hashchange", syncAnchor);

    return () => window.removeEventListener("hashchange", syncAnchor);
  }, []);

  useEffect(() => {
    if (!hashAnchorId) {
      restoredAnchorRef.current = null;
      return;
    }

    const currentRoute = buildCurrentRoute(window.location.pathname, window.location.search.slice(1), hashAnchorId);

    if (restoredAnchorRef.current === currentRoute) {
      return;
    }

    const target = document.getElementById(hashAnchorId);
    if (!target) {
      return;
    }

    restoredAnchorRef.current = currentRoute;
    const storedScroll = takeStoredBackScroll(currentRoute);

    window.requestAnimationFrame(() => {
      if (storedScroll) {
        window.scrollTo({ top: storedScroll.scrollY, behavior: "auto" });
        window.requestAnimationFrame(() => window.scrollTo({ top: storedScroll.scrollY, behavior: "auto" }));
        return;
      }

      target.scrollIntoView({ block: "center" });
    });
  }, [hashAnchorId, ...dependencies]);

  return hashAnchorId;
}

function buildBackScrollStorageKey(source: string) {
  return `${BACK_SCROLL_STORAGE_PREFIX}${source}`;
}

function takeStoredBackScroll(source: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const key = buildBackScrollStorageKey(source);
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    window.sessionStorage.removeItem(key);
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
