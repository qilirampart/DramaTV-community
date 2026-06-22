import { requireAdminAccess } from "@/lib/admin-auth";
import { AdminBackendError, getAdminFeedOpsFeatured, listAdminFeedOpsFeaturedCandidates } from "@/lib/admin-service";
import FeedOpsPageClient from "../shared/FeedOpsPageClient";
import {
  buildFallbackFeedOpsPageData,
  fallbackModeDetail,
  feedOpsModeDetail
} from "../shared/feed-ops-page";
import { saveFeedOpsFeaturedAction } from "./actions";

type SearchParams = {
  error?: string;
  success?: string;
  sort?: string;
};

type FeaturedSort = "latest" | "hot";

function parseFeaturedSort(value?: string | null): FeaturedSort {
  return value === "hot" ? "hot" : "latest";
}

async function loadPageData(sort: FeaturedSort) {
  try {
    const response = await getAdminFeedOpsFeatured(sort);
    return {
      data: response.data,
      isFallback: false,
      modeDetail: `${feedOpsModeDetail("featured")} 当前编辑：${sort === "hot" ? "最热" : "最新"}`
    };
  } catch (error) {
    if (error instanceof AdminBackendError && error.requestId) {
      return {
        data: buildFallbackFeedOpsPageData("featured"),
        isFallback: true,
        modeDetail: `${error.message}（requestId: ${error.requestId}）`
      };
    }

    return {
      data: buildFallbackFeedOpsPageData("featured"),
      isFallback: true,
      modeDetail: fallbackModeDetail("featured")
    };
  }
}

export default async function FeedOpsFeaturedPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requireAdminAccess(["admin", "operator"], "/feed-ops/featured");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const featuredSort = parseFeaturedSort(resolvedSearchParams?.sort);
  const pageData = await loadPageData(featuredSort);

  return (
    <FeedOpsPageClient
      data={pageData.data}
      errorMessage={resolvedSearchParams?.error?.trim() || null}
      successMessage={resolvedSearchParams?.success?.trim() || null}
      isFallback={pageData.isFallback}
      modeDetail={pageData.modeDetail}
      page="featured"
      featuredSort={featuredSort}
      saveAction={saveFeedOpsFeaturedAction}
      loadCandidates={async (query) => {
        "use server";
        const response = await listAdminFeedOpsFeaturedCandidates(query);
        return response.data;
      }}
    />
  );
}
