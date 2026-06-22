import type { ApiFeaturedInventoryItem, ApiFeaturedInventoryResponse } from "@/lib/contracts/community-api";

const FEATURED_INVENTORY_SESSION_CACHE_VERSION = 2;
const FEATURED_INVENTORY_SESSION_CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const FEATURED_INVENTORY_SESSION_CACHE_MAX_ENTRIES = 6;
const FEATURED_INVENTORY_SESSION_CACHE_MAX_ITEMS_PER_ENTRY = 72;

export const FEATURED_INVENTORY_SESSION_CACHE_STORAGE_KEY = "dramatv:featured-inventory-cache:v2";

export type FeaturedInventorySessionCacheEntry = {
  summary: ApiFeaturedInventoryResponse["summary"];
  items: ApiFeaturedInventoryItem[];
  nextCursor: string | null;
  hasMore: boolean;
  hasLoaded: boolean;
};

type StoredFeaturedInventorySessionCacheEntry = FeaturedInventorySessionCacheEntry & {
  storedAt: number;
};

type StoredFeaturedInventorySessionCachePayload = {
  version: number;
  entries: Record<string, StoredFeaturedInventorySessionCacheEntry>;
};

let featuredInventoryMemoryCache: Record<string, FeaturedInventorySessionCacheEntry> = {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isFeaturedInventorySessionCacheEntry(value: unknown): value is FeaturedInventorySessionCacheEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.items) &&
    typeof value.hasMore === "boolean" &&
    typeof value.hasLoaded === "boolean" &&
    (typeof value.nextCursor === "string" || value.nextCursor === null) &&
    "summary" in value
  );
}

export function parseFeaturedInventorySessionCache(
  raw: string | null,
  now = Date.now()
): Record<string, FeaturedInventorySessionCacheEntry> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as StoredFeaturedInventorySessionCachePayload;
    if (
      !isRecord(parsed) ||
      parsed.version !== FEATURED_INVENTORY_SESSION_CACHE_VERSION ||
      !isRecord(parsed.entries)
    ) {
      return {};
    }

    const nextEntries: Record<string, FeaturedInventorySessionCacheEntry> = {};

    for (const [cacheKey, entry] of Object.entries(parsed.entries)) {
      if (!isRecord(entry) || !isFeaturedInventorySessionCacheEntry(entry)) {
        continue;
      }

      if (!Number.isFinite(entry.storedAt) || now - entry.storedAt > FEATURED_INVENTORY_SESSION_CACHE_MAX_AGE_MS) {
        continue;
      }

      if (!entry.hasLoaded) {
        continue;
      }

      nextEntries[cacheKey] = {
        summary: entry.summary,
        items: entry.items,
        nextCursor: entry.nextCursor,
        hasMore: entry.hasMore,
        hasLoaded: true
      };
    }

    return nextEntries;
  } catch {
    return {};
  }
}

export function serializeFeaturedInventorySessionCache(
  entries: Record<string, FeaturedInventorySessionCacheEntry>,
  now = Date.now(),
  options?: {
    maxEntries?: number;
    maxItemsPerEntry?: number;
  }
) {
  const maxEntries = options?.maxEntries ?? FEATURED_INVENTORY_SESSION_CACHE_MAX_ENTRIES;
  const maxItemsPerEntry = options?.maxItemsPerEntry ?? FEATURED_INVENTORY_SESSION_CACHE_MAX_ITEMS_PER_ENTRY;
  const persistedEntries = Object.fromEntries(
    Object.entries(entries)
      .filter(([, entry]) => entry.hasLoaded)
      .slice(-maxEntries)
      .map(([cacheKey, entry]) => [
        cacheKey,
        {
          summary: entry.summary,
          items: entry.items.slice(0, maxItemsPerEntry),
          nextCursor: entry.nextCursor ?? null,
          hasMore: entry.hasMore,
          hasLoaded: true,
          storedAt: now
        }
      ])
  );

  if (Object.keys(persistedEntries).length === 0) {
    return null;
  }

  return JSON.stringify({
    version: FEATURED_INVENTORY_SESSION_CACHE_VERSION,
    entries: persistedEntries
  });
}

export function readFeaturedInventoryMemoryCache() {
  return featuredInventoryMemoryCache;
}

export function writeFeaturedInventoryMemoryCache(entries: Record<string, FeaturedInventorySessionCacheEntry>) {
  featuredInventoryMemoryCache = entries;
}
