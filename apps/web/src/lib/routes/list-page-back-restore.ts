"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildBackAnchorSource,
  useBackAnchorRestore,
  useStoredRouteScrollRestore
} from "./back-anchor";

type ListPageBackRestoreState = {
  restoredBackAnchorId: string | null;
  isHashBackAnchorRestoring: boolean;
  isStoredRouteRestoring: boolean;
  isBackAnchorRestoring: boolean;
};

type UseListPageBackRestoreOptions = {
  currentRoute: string;
  dependencies?: readonly unknown[];
  restoreTimeoutMs?: number;
};

const DEFAULT_LIST_PAGE_BACK_RESTORE_TIMEOUT_MS = 2200;

export function useListPageBackRestore(
  options: UseListPageBackRestoreOptions
): ListPageBackRestoreState {
  const {
    currentRoute,
    dependencies = [],
    restoreTimeoutMs = DEFAULT_LIST_PAGE_BACK_RESTORE_TIMEOUT_MS
  } = options;
  const restoredBackAnchorId = useBackAnchorRestore(dependencies);
  const storedRouteRestoreState = useStoredRouteScrollRestore();
  const backAnchorRouteKey = restoredBackAnchorId
    ? buildBackAnchorSource(currentRoute, restoredBackAnchorId)
    : null;
  const [backAnchorRestoreState, setBackAnchorRestoreState] = useState<{
    routeKey: string | null;
    completed: boolean;
  }>({
    routeKey: null,
    completed: true
  });
  const backAnchorRestoreStartedAtRef = useRef(0);

  useEffect(() => {
    if (!backAnchorRouteKey) {
      setBackAnchorRestoreState((current) =>
        current.routeKey === null && current.completed ? current : { routeKey: null, completed: true }
      );
      return;
    }

    setBackAnchorRestoreState((current) =>
      current.routeKey === backAnchorRouteKey ? current : { routeKey: backAnchorRouteKey, completed: false }
    );
    backAnchorRestoreStartedAtRef.current = Date.now();
  }, [backAnchorRouteKey]);

  useEffect(() => {
    if (typeof document === "undefined" || !backAnchorRouteKey || !restoredBackAnchorId) {
      return;
    }

    if (backAnchorRestoreState.routeKey !== backAnchorRouteKey || backAnchorRestoreState.completed) {
      return;
    }

    const target = document.getElementById(restoredBackAnchorId);
    if (!target) {
      if (Date.now() - backAnchorRestoreStartedAtRef.current > restoreTimeoutMs) {
        setBackAnchorRestoreState({
          routeKey: backAnchorRouteKey,
          completed: true
        });
      }
      return;
    }

    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (!cancelled) {
          setBackAnchorRestoreState({
            routeKey: backAnchorRouteKey,
            completed: true
          });
        }
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [
    backAnchorRestoreState.completed,
    backAnchorRestoreState.routeKey,
    backAnchorRouteKey,
    restoreTimeoutMs,
    restoredBackAnchorId,
    ...dependencies
  ]);

  const isHashBackAnchorRestoring =
    Boolean(backAnchorRouteKey) &&
    (backAnchorRestoreState.routeKey !== backAnchorRouteKey || !backAnchorRestoreState.completed);
  const isStoredRouteRestoring = Boolean(storedRouteRestoreState.restoring);

  return {
    restoredBackAnchorId,
    isHashBackAnchorRestoring,
    isStoredRouteRestoring,
    isBackAnchorRestoring: isHashBackAnchorRestoring || isStoredRouteRestoring
  };
}
