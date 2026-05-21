import { unstable_cache } from "next/cache";
import type { ApiEnvelope, ApiPromptSummary } from "@/lib/contracts/community-api";
import { getFeaturedArchiveLayout, getHomeFeed, getPrompts, isCommunityBackendUnavailableError } from "@/lib/api/community-service";
import type { PublicReadOptions } from "@/lib/api/community-service";

const PUBLIC_READ_OPTIONS = {
  includeAuth: false
} as const;

const PUBLIC_OPTIONAL_READ_OPTIONS = {
  includeAuth: false,
  timeoutMs: 1200
} as const;

const PUBLIC_PAGE_REVALIDATE_SECONDS = 15;
const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";

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
    prompts: await loadOptionalPrompts({ modality: "all", sort: "latest", limit: 60 }, "landing-prompts")
  };
}

async function loadCommunityHomePublicDataUncached() {
  const [homeFeed, prompts, heroPrompts] = await Promise.all([
    getHomeFeed(PUBLIC_READ_OPTIONS),
    loadOptionalPrompts({ modality: "all", sort: "latest", limit: 60 }, "community-home-prompts"),
    loadOptionalPrompts({ modality: "video", sort: "latest", limit: 12 }, "community-home-hero-video-prompts")
  ]);

  return {
    homeFeed,
    prompts,
    heroPrompts
  };
}

async function loadFeaturedArchivePublicDataUncached() {
  return {
    homeFeed: await getHomeFeed(PUBLIC_READ_OPTIONS),
    featuredLayout: await getFeaturedArchiveLayout(PUBLIC_READ_OPTIONS)
  };
}

export const loadLandingPagePublicData = IS_DEVELOPMENT
  ? loadLandingPagePublicDataUncached
  : unstable_cache(loadLandingPagePublicDataUncached, ["community-landing-primary-data"], {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS
    });

export const loadCommunityHomePublicData = IS_DEVELOPMENT
  ? loadCommunityHomePublicDataUncached
  : unstable_cache(loadCommunityHomePublicDataUncached, ["community-home-primary-data"], {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS
    });

export const loadFeaturedArchivePublicData = IS_DEVELOPMENT
  ? loadFeaturedArchivePublicDataUncached
  : unstable_cache(loadFeaturedArchivePublicDataUncached, ["community-featured-public-data"], {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS
    });
