import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { FeaturedArchivePage } from "@/features/featured/FeaturedArchivePage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getOptionalFeaturedInventory,
  toFeaturedInventoryQueryFromRouteInput,
  type FeaturedInventoryRouteInput
} from "@/lib/api/featured-inventory";
import {
  getFeaturedArchiveLayout,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import type { ApiFeaturedInventoryResponse } from "@/lib/contracts/community-api";
import { hasCommunitySession } from "@/lib/auth/community-auth";
import { loadFeaturedArchivePublicData } from "@/lib/api/community-public-cache";

type FeaturedArchiveRouteProps = {
  searchParams?: Promise<FeaturedInventoryRouteInput>;
};

const TRIMMED_FEATURED_INITIAL_LIMIT = 12;

function shouldTrimInitialFeaturedInventory(input: ReturnType<typeof toFeaturedInventoryQueryFromRouteInput>) {
  return (
    input.filter === "all" &&
    input.sort === "hot" &&
    !input.q &&
    !input.modelCategory &&
    !input.contentCategory &&
    !input.workflowType &&
    !input.cursor
  );
}

function toTrimmedFeaturedInventory(inventory: ApiFeaturedInventoryResponse): ApiFeaturedInventoryResponse {
  return {
    summary: inventory.summary,
    page: {
      items: inventory.page.items.slice(0, TRIMMED_FEATURED_INITIAL_LIMIT),
      nextCursor: inventory.page.nextCursor,
      hasMore: inventory.page.hasMore
    }
  };
}

export default async function FeaturedArchiveRoute({ searchParams }: FeaturedArchiveRouteProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const featuredInventoryQuery = toFeaturedInventoryQueryFromRouteInput(resolvedSearchParams);
  const featuredSort = featuredInventoryQuery.sort === "latest" ? "latest" : "hot";
  const trimInitialInventory = shouldTrimInitialFeaturedInventory(featuredInventoryQuery);
  const initialFeaturedInventoryQuery = trimInitialInventory
    ? { ...featuredInventoryQuery, limit: TRIMMED_FEATURED_INITIAL_LIMIT }
    : featuredInventoryQuery;

  try {
    const isAuthenticated = await hasCommunitySession();

    if (isAuthenticated) {
      const [featuredLayout, featuredInventory] = await Promise.all([
        getFeaturedArchiveLayout(featuredSort),
        getOptionalFeaturedInventory(initialFeaturedInventoryQuery, {}, "featured-auth-inventory")
      ]);

      return (
        <FeaturedArchivePage
          featuredSlots={featuredLayout.data.slots}
          featuredInventory={trimInitialInventory ? toTrimmedFeaturedInventory(featuredInventory.data) : featuredInventory.data}
          lazyFeaturedInventoryUrl="/api/featured-inventory"
        />
      );
    }

    const publicData = await loadFeaturedArchivePublicData(initialFeaturedInventoryQuery);

    return (
      <FeaturedArchivePage
        featuredSlots={publicData.featuredLayout.data.slots}
        featuredInventory={
          trimInitialInventory
            ? toTrimmedFeaturedInventory(publicData.featuredInventory.data)
            : publicData.featuredInventory.data
        }
        lazyFeaturedInventoryUrl="/api/public/featured-inventory"
      />
    );
  } catch (error) {
    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Featured archive unavailable"
          description="The featured archive could not load featured inventory data from the backend."
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
