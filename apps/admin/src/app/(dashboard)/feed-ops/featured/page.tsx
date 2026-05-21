import { requireAdminAccess } from "@/lib/admin-auth";
import { AdminBackendError, getAdminFeedOpsFeatured } from "@/lib/admin-service";
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
};

async function loadPageData() {
  try {
    const response = await getAdminFeedOpsFeatured();
    return {
      data: response.data,
      isFallback: false,
      modeDetail: feedOpsModeDetail("featured")
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
  const pageData = await loadPageData();

  return (
    <FeedOpsPageClient
      data={pageData.data}
      errorMessage={resolvedSearchParams?.error?.trim() || null}
      successMessage={resolvedSearchParams?.success?.trim() || null}
      isFallback={pageData.isFallback}
      modeDetail={pageData.modeDetail}
      page="featured"
      saveAction={saveFeedOpsFeaturedAction}
    />
  );
}
