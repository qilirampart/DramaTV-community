import { requireAdminAccess } from "@/lib/admin-auth";
import { AdminBackendError, getAdminFeedOpsDiscussions } from "@/lib/admin-service";
import FeedOpsPageClient from "../shared/FeedOpsPageClient";
import {
  buildFallbackFeedOpsPageData,
  fallbackModeDetail,
  feedOpsModeDetail
} from "../shared/feed-ops-page";
import { saveFeedOpsDiscussionsAction } from "./actions";

type SearchParams = {
  error?: string;
  success?: string;
};

async function loadPageData() {
  try {
    const response = await getAdminFeedOpsDiscussions();
    return {
      data: response.data,
      isFallback: false,
      modeDetail: feedOpsModeDetail("discussions")
    };
  } catch (error) {
    if (error instanceof AdminBackendError && error.requestId) {
      return {
        data: buildFallbackFeedOpsPageData("discussions"),
        isFallback: true,
        modeDetail: `${error.message}（requestId: ${error.requestId}）`
      };
    }

    return {
      data: buildFallbackFeedOpsPageData("discussions"),
      isFallback: true,
      modeDetail: fallbackModeDetail("discussions")
    };
  }
}

export default async function FeedOpsDiscussionsPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requireAdminAccess(["admin", "operator"], "/feed-ops/discussions");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageData = await loadPageData();

  return (
    <FeedOpsPageClient
      data={pageData.data}
      errorMessage={resolvedSearchParams?.error?.trim() || null}
      successMessage={resolvedSearchParams?.success?.trim() || null}
      isFallback={pageData.isFallback}
      modeDetail={pageData.modeDetail}
      page="discussions"
      saveAction={saveFeedOpsDiscussionsAction}
    />
  );
}
