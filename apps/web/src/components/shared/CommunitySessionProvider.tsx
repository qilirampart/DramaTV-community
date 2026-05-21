"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ApiAuthSession, ApiRecentNotificationItem } from "@/lib/contracts/community-api";

const VIEWED_NOTIFICATIONS_STORAGE_KEY_PREFIX = "dramatv.community.viewed-notifications:";
const PASSIVE_NOTIFICATION_REFRESH_COOLDOWN_MS = 10_000;

function buildViewedNotificationsStorageKey(userId: string) {
  return `${VIEWED_NOTIFICATIONS_STORAGE_KEY_PREFIX}${userId}`;
}

function readViewedNotificationIds(userId: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(buildViewedNotificationsStorageKey(userId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  } catch {
    return [];
  }
}

function persistViewedNotificationIds(userId: string, ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(buildViewedNotificationsStorageKey(userId), JSON.stringify(ids));
  } catch {
    // ignore client storage failures and keep in-memory state
  }
}

function buildNotificationSnapshotKey(items: ApiRecentNotificationItem[]) {
  return items
    .map((item) =>
      [
        item.id,
        item.actionType,
        item.actedAt,
        item.commentId ?? "",
        item.excerpt ?? "",
        item.actor.id,
        item.actor.avatarUrl ?? "",
        item.target.id,
        item.target.href
      ].join("::")
    )
    .join("|");
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

type CommunitySessionContextValue = {
  currentUser: ApiAuthSession | null;
  recentNotifications: ApiRecentNotificationItem[];
  hasUnreadNotifications: boolean;
  refreshRecentNotifications: (options?: { force?: boolean }) => Promise<void>;
  markNotificationsViewed: () => void;
};

const CommunitySessionContext = createContext<CommunitySessionContextValue>({
  currentUser: null,
  recentNotifications: [],
  hasUnreadNotifications: false,
  refreshRecentNotifications: async () => {},
  markNotificationsViewed: () => {}
});

export function CommunitySessionProvider({
  children,
  currentUser,
  recentNotifications
}: {
  children: ReactNode;
  currentUser: ApiAuthSession | null;
  recentNotifications: ApiRecentNotificationItem[];
}) {
  const [notificationsState, setNotificationsState] = useState<ApiRecentNotificationItem[]>(recentNotifications);
  const [viewedNotificationIds, setViewedNotificationIds] = useState<string[]>(() =>
    currentUser ? readViewedNotificationIds(currentUser.id) : []
  );
  const notificationsStateRef = useRef<ApiRecentNotificationItem[]>(recentNotifications);
  const notificationsSnapshotRef = useRef(buildNotificationSnapshotKey(recentNotifications));
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const lastRefreshAtRef = useRef(currentUser ? Date.now() : 0);

  useEffect(() => {
    const nextSnapshot = buildNotificationSnapshotKey(recentNotifications);
    if (notificationsSnapshotRef.current !== nextSnapshot) {
      notificationsSnapshotRef.current = nextSnapshot;
      notificationsStateRef.current = recentNotifications;
      setNotificationsState(recentNotifications);
    }

    if (!currentUser) {
      lastRefreshAtRef.current = 0;
      setViewedNotificationIds([]);
      return;
    }

    lastRefreshAtRef.current = Date.now();
    setViewedNotificationIds(readViewedNotificationIds(currentUser.id));
  }, [currentUser, recentNotifications]);

  const refreshRecentNotifications = useCallback(async (options?: { force?: boolean }) => {
    if (!currentUser) {
      lastRefreshAtRef.current = 0;
      notificationsStateRef.current = [];
      setNotificationsState([]);
      return;
    }

    const force = options?.force ?? false;
    const now = Date.now();
    if (
      !force &&
      lastRefreshAtRef.current > 0 &&
      now - lastRefreshAtRef.current < PASSIVE_NOTIFICATION_REFRESH_COOLDOWN_MS
    ) {
      return;
    }

    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const task = (async () => {
      try {
        const response = await fetch("/api/me/notifications/recent", {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          data?: {
            items?: ApiRecentNotificationItem[];
          };
        };
        const nextItems = payload.data?.items ?? [];
        const nextSnapshot = buildNotificationSnapshotKey(nextItems);

        if (notificationsSnapshotRef.current !== nextSnapshot) {
          notificationsSnapshotRef.current = nextSnapshot;
          notificationsStateRef.current = nextItems;
          setNotificationsState(nextItems);
        }
        lastRefreshAtRef.current = Date.now();
      } catch {
        // keep the last successful notification snapshot
      } finally {
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = task;
    return task;
  }, [currentUser]);

  const markNotificationsViewed = useCallback(() => {
    if (!currentUser) {
      return;
    }

    const nextViewedIds = Array.from(new Set(notificationsStateRef.current.map((item) => item.id)));
    setViewedNotificationIds((current) => {
      if (areStringArraysEqual(current, nextViewedIds)) {
        return current;
      }

      persistViewedNotificationIds(currentUser.id, nextViewedIds);
      return nextViewedIds;
    });
  }, [currentUser]);

  const viewedNotificationIdSet = useMemo(() => new Set(viewedNotificationIds), [viewedNotificationIds]);
  const hasUnreadNotifications = useMemo(
    () => notificationsState.some((item) => !viewedNotificationIdSet.has(item.id)),
    [notificationsState, viewedNotificationIdSet]
  );

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    function handleWindowFocus() {
      void refreshRecentNotifications();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshRecentNotifications();
      }
    }

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser, refreshRecentNotifications]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshRecentNotifications();
      }
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentUser, refreshRecentNotifications]);

  const value = useMemo(
    () => ({
      currentUser,
      recentNotifications: notificationsState,
      hasUnreadNotifications,
      refreshRecentNotifications,
      markNotificationsViewed
    }),
    [currentUser, notificationsState, hasUnreadNotifications, refreshRecentNotifications, markNotificationsViewed]
  );

  return (
    <CommunitySessionContext.Provider value={value}>
      {children}
    </CommunitySessionContext.Provider>
  );
}

export function useCommunitySession() {
  return useContext(CommunitySessionContext);
}
