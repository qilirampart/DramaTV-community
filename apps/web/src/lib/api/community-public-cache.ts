import type { ApiEnvelope, ApiPromptSummary } from "@/lib/contracts/community-api";
import { getFeaturedArchiveLayout, getHomeFeed, getLandingArchiveLayout, getPrompts, isCommunityBackendUnavailableError } from "@/lib/api/community-service";
import {
  getOptionalPublicFeaturedInventory,
  type FeaturedInventoryQuery
} from "@/lib/api/featured-inventory";
import type { PublicReadOptions } from "@/lib/api/community-service";

const HOME_PROMPT_FETCH_LIMIT = 30;

const PUBLIC_READ_OPTIONS = {
  includeAuth: false
} as const;

const PUBLIC_OPTIONAL_READ_OPTIONS = {
  includeAuth: false,
  timeoutMs: 1200
} as const;

type PublicPromptQuery = {
  modality?: "all" | "image" | "video";
  sort?: "latest" | "hot";
  limit?: number;
};

function emptyPromptEnvelope(requestId: string): ApiEnvelope<ApiPromptSummary[]> {
  return {
    code: "OK",
    message: "ok",
    data: [],
    requestId
  };
}

async function loadOptionalPrompts(
  query: PublicPromptQuery,
  slot: string,
  options: PublicReadOptions = PUBLIC_OPTIONAL_READ_OPTIONS
) {
  try {
    return await getPrompts(query, options);
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      console.warn(`[community-public-cache] optional prompt block degraded: ${slot}`, {
        code: error.code,
        path: error.path,
        requestId: error.requestId
      });
      return emptyPromptEnvelope(error.requestId ?? `community-public-cache-${slot}`);
    }

    throw error;
  }
}

async function loadLandingPagePublicDataUncached() {
  return {
    homeFeed: await getHomeFeed(PUBLIC_READ_OPTIONS),
    landingLayout: await getLandingArchiveLayout(PUBLIC_READ_OPTIONS),
    prompts: await loadOptionalPrompts(
      { modality: "all", sort: "latest", limit: HOME_PROMPT_FETCH_LIMIT },
      "landing-prompts"
    )
  };
}

async function loadCommunityHomePublicDataUncached() {
  const [homeFeed, prompts] = await Promise.all([
    getHomeFeed(PUBLIC_READ_OPTIONS),
    loadOptionalPrompts(
      { modality: "all", sort: "latest", limit: HOME_PROMPT_FETCH_LIMIT },
      "community-home-prompts"
    )
  ]);

  return {
    homeFeed,
    prompts
  };
}

async function loadFeaturedArchivePublicDataUncached(featuredInventoryQuery: FeaturedInventoryQuery = {}) {
  const featuredSort = featuredInventoryQuery.sort === "latest" ? "latest" : "hot";
  return {
    featuredLayout: await getFeaturedArchiveLayout(featuredSort, PUBLIC_READ_OPTIONS),
    featuredInventory: await getOptionalPublicFeaturedInventory(featuredInventoryQuery, "featured-public-inventory")
  };
}

// Public pages need to reflect admin publishes immediately, so we keep this layer uncached.
export const loadLandingPagePublicData = loadLandingPagePublicDataUncached;
export const loadCommunityHomePublicData = loadCommunityHomePublicDataUncached;
export const loadFeaturedArchivePublicData = loadFeaturedArchivePublicDataUncached;
