import { requireAdminAccess } from "@/lib/admin-auth";
import { AdminBackendError, getAdminFeedOpsLanding, listAdminFeedOpsLandingCandidates } from "@/lib/admin-service";
import FeedOpsPageClient from "../shared/FeedOpsPageClient";
import {
  buildFallbackFeedOpsPageData,
  fallbackModeDetail,
  feedOpsModeDetail
} from "../shared/feed-ops-page";
import { saveFeedOpsLandingAction } from "./actions";

type SearchParams = {
  error?: string;
  success?: string;
};

async function loadPageData() {
  try {
    const response = await getAdminFeedOpsLanding();
    return {
      data: response.data,
      isFallback: false,
      modeDetail: feedOpsModeDetail("landing")
    };
  } catch (error) {
    if (error instanceof AdminBackendError && error.requestId) {
      return {
        data: buildFallbackFeedOpsPageData("landing"),
        isFallback: true,
        modeDetail: `${error.message}（requestId: ${error.requestId}）`
      };
    }

    return {
      data: buildFallbackFeedOpsPageData("landing"),
      isFallback: true,
      modeDetail: fallbackModeDetail("landing")
    };
  }
}

export default async function FeedOpsLandingPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requireAdminAccess(["admin", "operator"], "/feed-ops/landing");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageData = await loadPageData();

  return (
    <FeedOpsPageClient
      data={pageData.data}
      errorMessage={resolvedSearchParams?.error?.trim() || null}
      successMessage={resolvedSearchParams?.success?.trim() || null}
      isFallback={pageData.isFallback}
      loadCandidates={async (query) => {
        "use server";
        const response = await listAdminFeedOpsLandingCandidates(query);
        return response.data;
      }}
      modeDetail={pageData.modeDetail}
      page="landing"
      saveAction={saveFeedOpsLandingAction}
    />
  );
}
