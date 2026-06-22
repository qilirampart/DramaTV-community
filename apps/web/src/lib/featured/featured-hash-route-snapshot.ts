import type { ApiFeaturedInventoryItem, ApiFeaturedInventoryResponse } from "@/lib/contracts/community-api";

const FEATURED_HASH_ROUTE_SNAPSHOT_VERSION = 1;
const FEATURED_HASH_ROUTE_SNAPSHOT_MAX_AGE_MS = 30 * 60 * 1000;
const FEATURED_HASH_ROUTE_SNAPSHOT_MAX_ITEMS = 240;

export const FEATURED_HASH_ROUTE_SNAPSHOT_STORAGE_KEY = "dramatv:featured-hash-route-snapshot:v1";

export type FeaturedHashRouteSnapshotMasonryState = {
  columnCount: number;
  orderedKeys: string[];
  assignments: Record<string, number>;
};

export type FeaturedHashRouteSnapshot = {
  routeKey: string;
  cacheKey: string;
  summary: ApiFeaturedInventoryResponse["summary"];
  items: ApiFeaturedInventoryItem[];
  nextCursor: string | null;
  hasMore: boolean;
  hasLoaded: boolean;
  aspectRatioEntries?: Record<string, number>;
  masonryAssignments?: FeaturedHashRouteSnapshotMasonryState;
};

type StoredFeaturedHashRouteSnapshot = FeaturedHashRouteSnapshot & {
  storedAt: number;
  version: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isFeaturedHashRouteSnapshot(value: unknown): value is FeaturedHashRouteSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.routeKey === "string" &&
    typeof value.cacheKey === "string" &&
    Array.isArray(value.items) &&
    typeof value.hasMore === "boolean" &&
    typeof value.hasLoaded === "boolean" &&
    (typeof value.nextCursor === "string" || value.nextCursor === null) &&
    (value.aspectRatioEntries === undefined || isRecord(value.aspectRatioEntries)) &&
    (value.masonryAssignments === undefined || isFeaturedHashRouteSnapshotMasonryState(value.masonryAssignments)) &&
    "summary" in value
  );
}

function isFeaturedHashRouteSnapshotMasonryState(value: unknown): value is FeaturedHashRouteSnapshotMasonryState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Number.isFinite(value.columnCount) &&
    Array.isArray(value.orderedKeys) &&
    isRecord(value.assignments)
  );
}

export function parseFeaturedHashRouteSnapshot(
  raw: string | null,
  now = Date.now()
): FeaturedHashRouteSnapshot | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredFeaturedHashRouteSnapshot;
    if (
      !isRecord(parsed) ||
      parsed.version !== FEATURED_HASH_ROUTE_SNAPSHOT_VERSION ||
      !Number.isFinite(parsed.storedAt) ||
      now - Number(parsed.storedAt) > FEATURED_HASH_ROUTE_SNAPSHOT_MAX_AGE_MS ||
      !isFeaturedHashRouteSnapshot(parsed) ||
      !parsed.hasLoaded
    ) {
      return null;
    }

    return {
      routeKey: parsed.routeKey,
      cacheKey: parsed.cacheKey,
      summary: parsed.summary,
      items: parsed.items,
      nextCursor: parsed.nextCursor,
      hasMore: parsed.hasMore,
      hasLoaded: true,
      aspectRatioEntries: parsed.aspectRatioEntries,
      masonryAssignments: parsed.masonryAssignments
    };
  } catch {
    return null;
  }
}

export function serializeFeaturedHashRouteSnapshot(
  snapshot: FeaturedHashRouteSnapshot,
  now = Date.now(),
  options?: {
    maxItems?: number;
  }
) {
  if (!snapshot.hasLoaded || snapshot.items.length === 0) {
    return null;
  }

  const maxItems = options?.maxItems ?? FEATURED_HASH_ROUTE_SNAPSHOT_MAX_ITEMS;

  return JSON.stringify({
    version: FEATURED_HASH_ROUTE_SNAPSHOT_VERSION,
    storedAt: now,
    routeKey: snapshot.routeKey,
    cacheKey: snapshot.cacheKey,
    summary: snapshot.summary,
    items: snapshot.items.slice(0, maxItems),
    nextCursor: snapshot.nextCursor ?? null,
    hasMore: snapshot.hasMore,
    hasLoaded: true,
    aspectRatioEntries: snapshot.aspectRatioEntries,
    masonryAssignments: snapshot.masonryAssignments
  });
}
