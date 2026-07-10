import type { ApiFeaturedInventoryItem } from "../contracts/community-api";
import {
  FEATURED_HASH_ROUTE_SNAPSHOT_STORAGE_KEY,
  parseFeaturedHashRouteSnapshot,
  serializeFeaturedHashRouteSnapshot,
  type FeaturedHashRouteSnapshot
} from "./featured-hash-route-snapshot";
import {
  serializeFeaturedInventoryQuery,
  toFeaturedInventoryQueryFromRouteInput,
  type FeaturedInventoryQuery
} from "./featured-inventory-query";

export type FeaturedDetailNavigationTarget = {
  href: string;
  title: string;
};

export type FeaturedDetailNavigation = {
  previous: FeaturedDetailNavigationTarget | null;
  next: FeaturedDetailNavigationTarget | null;
};

export type FeaturedDetailNavigationState = {
  navigation: FeaturedDetailNavigation;
  snapshot: FeaturedHashRouteSnapshot;
  currentIndex: number;
};

function buildFeaturedItemHref(item: ApiFeaturedInventoryItem) {
  if (item.itemType === "workflow") {
    return `/workflows/${item.targetId}`;
  }

  if (item.itemType === "post") {
    if (item.targetSlug?.trim()) {
      return `/discussions/${item.targetSlug.trim()}`;
    }

    if (item.channelSlug?.trim()) {
      return `/discussions?channel=${encodeURIComponent(item.channelSlug.trim())}`;
    }

    return "/discussions";
  }

  return `/prompts/${item.targetId}`;
}

function buildRouteKey(route: string) {
  try {
    const url = new URL(route, "http://dramatv.local");
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function isFeaturedRouteKey(routeKey: string | null) {
  return routeKey === "/featured" || routeKey?.startsWith("/featured?");
}

function mapTarget(item: ApiFeaturedInventoryItem): FeaturedDetailNavigationTarget {
  return {
    href: buildFeaturedItemHref(item),
    title: item.title
  };
}

function dedupeFeaturedInventoryItems(items: ApiFeaturedInventoryItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.itemType}:${item.targetId}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function parseFeaturedInventoryQueryFromBackHref(backHref: string): FeaturedInventoryQuery | null {
  try {
    const url = new URL(backHref, "http://dramatv.local");
    return toFeaturedInventoryQueryFromRouteInput({
      filter: url.searchParams.get("filter") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      model: url.searchParams.get("model") ?? undefined,
      content: url.searchParams.get("content") ?? undefined,
      secondary: url.searchParams.get("secondary") ?? undefined
    });
  } catch {
    return null;
  }
}

async function requestFeaturedInventoryPage(
  endpoint: string,
  query: FeaturedInventoryQuery & { cursor?: string | null },
  signal?: AbortSignal
) {
  const queryString = serializeFeaturedInventoryQuery({
    ...query,
    cursor: query.cursor ?? undefined
  });
  const requestUrl = queryString.length > 0 ? `${endpoint}?${queryString}` : endpoint;
  const response = await fetch(requestUrl, {
    method: "GET",
    cache: "force-cache",
    signal,
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`featured detail inventory fetch failed: ${response.status}`);
  }

  return (await response.json()) as {
    summary?: FeaturedHashRouteSnapshot["summary"];
    page?: {
      items?: ApiFeaturedInventoryItem[];
      nextCursor?: string | null;
      hasMore?: boolean;
    };
  };
}

export function isFeaturedDetailBackHref(backHref: string) {
  return isFeaturedRouteKey(buildRouteKey(backHref));
}

export function resolveFeaturedDetailNavigation(input: {
  pathname: string;
  backHref: string;
  snapshotRaw: string | null;
}): FeaturedDetailNavigation | null {
  return resolveFeaturedDetailNavigationState(input)?.navigation ?? null;
}

export function resolveFeaturedDetailNavigationState(input: {
  pathname: string;
  backHref: string;
  snapshotRaw: string | null;
}): FeaturedDetailNavigationState | null {
  const backRouteKey = buildRouteKey(input.backHref);
  if (!isFeaturedRouteKey(backRouteKey)) {
    return null;
  }

  const snapshot = parseFeaturedHashRouteSnapshot(input.snapshotRaw);
  if (!snapshot || snapshot.routeKey !== backRouteKey || snapshot.items.length === 0) {
    return null;
  }

  const currentIndex = snapshot.items.findIndex((item) => buildFeaturedItemHref(item) === input.pathname);
  if (currentIndex < 0) {
    return null;
  }

  return {
    navigation: {
      previous: currentIndex > 0 ? mapTarget(snapshot.items[currentIndex - 1]) : null,
      next: currentIndex < snapshot.items.length - 1 ? mapTarget(snapshot.items[currentIndex + 1]) : null
    },
    snapshot,
    currentIndex
  };
}

export function readFeaturedDetailNavigationFromSession(input: {
  pathname: string;
  backHref: string;
}): FeaturedDetailNavigation | null {
  return readFeaturedDetailNavigationStateFromSession(input)?.navigation ?? null;
}

export function readFeaturedDetailNavigationStateFromSession(input: {
  pathname: string;
  backHref: string;
}): FeaturedDetailNavigationState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return resolveFeaturedDetailNavigationState({
      pathname: input.pathname,
      backHref: input.backHref,
      snapshotRaw: window.sessionStorage.getItem(FEATURED_HASH_ROUTE_SNAPSHOT_STORAGE_KEY)
    });
  } catch {
    return null;
  }
}

export async function extendFeaturedDetailNavigationSnapshotFromSession(input: {
  pathname: string;
  backHref: string;
  endpoint?: string;
  signal?: AbortSignal;
}): Promise<FeaturedDetailNavigationState | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const currentState = readFeaturedDetailNavigationStateFromSession({
    pathname: input.pathname,
    backHref: input.backHref
  });

  if (!currentState || !currentState.snapshot.hasMore || !currentState.snapshot.nextCursor) {
    return currentState;
  }

  const baseQuery = parseFeaturedInventoryQueryFromBackHref(input.backHref);
  if (!baseQuery) {
    return currentState;
  }

  const payload = await requestFeaturedInventoryPage(
    input.endpoint ?? "/api/public/featured-inventory",
    {
      ...baseQuery,
      cursor: currentState.snapshot.nextCursor
    },
    input.signal
  );

  const nextSnapshot: FeaturedHashRouteSnapshot = {
    ...currentState.snapshot,
    summary: payload.summary ?? currentState.snapshot.summary,
    items: dedupeFeaturedInventoryItems([
      ...currentState.snapshot.items,
      ...(payload.page?.items ?? [])
    ]),
    nextCursor: payload.page?.nextCursor ?? null,
    hasMore: payload.page?.hasMore ?? false,
    hasLoaded: true
  };

  const serializedSnapshot = serializeFeaturedHashRouteSnapshot(nextSnapshot, Date.now(), {
    retainItemHref: input.pathname
  });

  if (!serializedSnapshot) {
    return currentState;
  }

  window.sessionStorage.setItem(FEATURED_HASH_ROUTE_SNAPSHOT_STORAGE_KEY, serializedSnapshot);

  return resolveFeaturedDetailNavigationState({
    pathname: input.pathname,
    backHref: input.backHref,
    snapshotRaw: serializedSnapshot
  });
}
