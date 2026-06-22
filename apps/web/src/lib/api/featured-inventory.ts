import {
  getFeaturedInventoryPage,
  isCommunityBackendUnavailableError,
  type PublicReadOptions
} from "@/lib/api/community-service";
import type { ApiEnvelope, ApiFeaturedInventoryResponse } from "@/lib/contracts/community-api";
import {
  normalizeFeaturedInventoryQuery,
  serializeFeaturedInventoryQuery,
  toFeaturedInventoryQueryFromRouteInput as parseFeaturedInventoryRouteInput,
  type FeaturedInventoryQuery,
  type FeaturedInventoryRouteInput
} from "@/lib/featured/featured-inventory-query";

export { serializeFeaturedInventoryQuery };
export type { FeaturedInventoryQuery, FeaturedInventoryRouteInput } from "@/lib/featured/featured-inventory-query";

const FEATURED_INVENTORY_TIMEOUT_MS = 8000;

function emptyFeaturedInventoryEnvelope(requestId: string): ApiEnvelope<ApiFeaturedInventoryResponse> {
  return {
    code: "OK",
    message: "ok",
    data: {
      summary: {
        counts: {
          all: 0,
          workflow: 0,
          videoPrompt: 0,
          imagePrompt: 0,
          activity: 0
        },
        workflowFacets: {
          copyable: 0,
          placeholder: 0
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

async function loadFeaturedInventory(
  query: FeaturedInventoryQuery = {},
  options: PublicReadOptions = {}
): Promise<ApiEnvelope<ApiFeaturedInventoryResponse>> {
  return getFeaturedInventoryPage(normalizeFeaturedInventoryQuery(query), {
    timeoutMs: FEATURED_INVENTORY_TIMEOUT_MS,
    ...options
  });
}

export async function getFeaturedInventory(
  query: FeaturedInventoryQuery = {},
  options: PublicReadOptions = {}
): Promise<ApiEnvelope<ApiFeaturedInventoryResponse>> {
  return loadFeaturedInventory(query, options);
}

export async function getOptionalFeaturedInventory(
  query: FeaturedInventoryQuery = {},
  options: PublicReadOptions = {},
  slot = "featured-inventory"
): Promise<ApiEnvelope<ApiFeaturedInventoryResponse>> {
  try {
    return await getFeaturedInventory(query, options);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      console.warn(`[featured-inventory] degraded: ${slot}`, {
        code: error.code,
        path: error.path,
        requestId: error.requestId
      });
      return emptyFeaturedInventoryEnvelope(error.requestId ?? slot);
    }

    throw error;
  }
}

export async function getPublicFeaturedInventory(query: FeaturedInventoryQuery = {}) {
  return loadFeaturedInventory(query, {
    includeAuth: false,
    timeoutMs: FEATURED_INVENTORY_TIMEOUT_MS
  });
}

export async function getOptionalPublicFeaturedInventory(
  query: FeaturedInventoryQuery = {},
  slot = "featured-public-inventory"
) {
  try {
    return await getPublicFeaturedInventory(query);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      console.warn(`[featured-inventory] degraded: ${slot}`, {
        code: error.code,
        path: error.path,
        requestId: error.requestId
      });
      return emptyFeaturedInventoryEnvelope(error.requestId ?? slot);
    }

    throw error;
  }
}

export function toFeaturedInventoryQueryFromRouteInput(input: FeaturedInventoryRouteInput = {}) {
  return parseFeaturedInventoryRouteInput(input);
}
