import { unstable_cache } from "next/cache";
import {
  getFeaturedPromptInventoryPage,
  isCommunityBackendUnavailableError,
  type PublicReadOptions
} from "@/lib/api/community-service";
import type { ApiEnvelope, ApiFeaturedPromptInventoryResponse } from "@/lib/contracts/community-api";
import {
  DEFAULT_FEATURED_PROMPT_PAGE_LIMIT,
  deserializeFeaturedPromptInventoryQuery,
  normalizeFeaturedPromptInventoryQuery,
  serializeFeaturedPromptInventoryQuery,
  toFeaturedPromptInventoryQueryFromRouteInput as parseFeaturedPromptInventoryRouteInput,
  type FeaturedPromptInventoryQuery,
  type FeaturedPromptInventoryRouteInput
} from "@/lib/featured/featured-prompt-inventory-query";
export { serializeFeaturedPromptInventoryQuery };
export type { FeaturedPromptInventoryQuery, FeaturedPromptInventoryRouteInput } from "@/lib/featured/featured-prompt-inventory-query";

const FEATURED_PROMPT_TIMEOUT_MS = 8000;

function emptyFeaturedPromptInventoryEnvelope(requestId: string): ApiEnvelope<ApiFeaturedPromptInventoryResponse> {
  return {
    code: "OK",
    message: "ok",
    data: {
      summary: {
        counts: {
          all: 0,
          videoPrompt: 0,
          imagePrompt: 0
        },
        videoPromptFacets: {
          modelCounts: {},
          contentCounts: {}
        },
        imagePromptFacets: {
          modelCounts: {},
          contentCounts: {}
        }
      },
      page: {
        items: [],
        nextCursor: null,
        hasMore: false
      }
    },
    requestId
  };
}

async function loadFeaturedPromptInventory(
  query: FeaturedPromptInventoryQuery = {},
  options: PublicReadOptions = {}
): Promise<ApiEnvelope<ApiFeaturedPromptInventoryResponse>> {
  return getFeaturedPromptInventoryPage(normalizeFeaturedPromptInventoryQuery(query), {
    timeoutMs: FEATURED_PROMPT_TIMEOUT_MS,
    ...options
  });
}

const getCachedPublicFeaturedPromptInventory = unstable_cache(
  async (queryKey: string) =>
    loadFeaturedPromptInventory(deserializeFeaturedPromptInventoryQuery(queryKey), {
      includeAuth: false,
      timeoutMs: FEATURED_PROMPT_TIMEOUT_MS
    }),
  ["featured-public-prompt-inventory"],
  { revalidate: 15 }
);

export async function getFeaturedPromptInventory(
  query: FeaturedPromptInventoryQuery = {},
  options: PublicReadOptions = {}
): Promise<ApiEnvelope<ApiFeaturedPromptInventoryResponse>> {
  return loadFeaturedPromptInventory(query, options);
}

export async function getOptionalFeaturedPromptInventory(
  query: FeaturedPromptInventoryQuery = {},
  options: PublicReadOptions = {},
  slot = "featured-prompt-inventory"
): Promise<ApiEnvelope<ApiFeaturedPromptInventoryResponse>> {
  try {
    return await getFeaturedPromptInventory(query, options);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      console.warn(`[featured-prompt-inventory] degraded: ${slot}`, {
        code: error.code,
        path: error.path,
        requestId: error.requestId
      });
      return emptyFeaturedPromptInventoryEnvelope(error.requestId ?? slot);
    }

    throw error;
  }
}

export async function getPublicFeaturedPromptInventory(query: FeaturedPromptInventoryQuery = {}) {
  return getCachedPublicFeaturedPromptInventory(serializeFeaturedPromptInventoryQuery(query));
}

export async function getOptionalPublicFeaturedPromptInventory(
  query: FeaturedPromptInventoryQuery = {},
  slot = "featured-public-prompt-inventory"
) {
  try {
    return await getPublicFeaturedPromptInventory(query);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      console.warn(`[featured-prompt-inventory] degraded: ${slot}`, {
        code: error.code,
        path: error.path,
        requestId: error.requestId
      });
      return emptyFeaturedPromptInventoryEnvelope(error.requestId ?? slot);
    }

    throw error;
  }
}

export function toFeaturedPromptInventoryQueryFromRouteInput(
  input: FeaturedPromptInventoryRouteInput = {}
) {
  return parseFeaturedPromptInventoryRouteInput(input);
}
