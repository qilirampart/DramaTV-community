import { requireAdminAccess } from "@/lib/admin-auth";
import { AdminBackendError, getAdminFeedOpsHome, listAdminFeedOpsHomeCandidates } from "@/lib/admin-service";
import FeedOpsPageClient from "../shared/FeedOpsPageClient";
import {
  buildFallbackFeedOpsPageData,
  fallbackModeDetail,
  feedOpsModeDetail
} from "../shared/feed-ops-page";
import { saveFeedOpsHomeAction } from "./actions";

type SearchParams = {
  error?: string;
  success?: string;
};

async function loadPageData() {
  try {
    const response = await getAdminFeedOpsHome();
    return {
      data: response.data,
      isFallback: false,
      modeDetail: feedOpsModeDetail("home")
    };
  } catch (error) {
    if (error instanceof AdminBackendError && error.requestId) {
      return {
        data: buildFallbackFeedOpsPageData("home"),
        isFallback: true,
        modeDetail: `${error.message}（requestId: ${error.requestId}）`
      };
    }

    return {
      data: buildFallbackFeedOpsPageData("home"),
      isFallback: true,
      modeDetail: fallbackModeDetail("home")
    };
  }
}

export default async function FeedOpsHomePage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requireAdminAccess(["admin", "operator"], "/feed-ops/home");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageData = await loadPageData();

  return (
    <FeedOpsPageClient
      data={pageData.data}
      errorMessage={resolvedSearchParams?.error?.trim() || null}
      successMessage={resolvedSearchParams?.success?.trim() || null}
      isFallback={pageData.isFallback}
      modeDetail={pageData.modeDetail}
      page="home"
      saveAction={saveFeedOpsHomeAction}
      loadCandidates={async (query) => {
        "use server";
        const response = await listAdminFeedOpsHomeCandidates(query);
        return response.data;
      }}
    />
  );
}
