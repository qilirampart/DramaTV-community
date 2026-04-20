import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { PublishPage } from "@/features/publish/PublishPage";
import {
  getPublishBootstrap,
  isCommunityAuthRequiredError,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { requireCommunitySession } from "@/lib/auth/community-auth";
import { mapPublishPageView } from "@/lib/mappers/community";
import { redirect } from "next/navigation";

export default async function PublishRoute() {
  await requireCommunitySession("/publish");

  try {
    const bootstrap = await getPublishBootstrap();
    const view = mapPublishPageView(bootstrap);

    return <PublishPage view={view} />;
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      redirect("/login?redirectTo=%2Fpublish");
    }

    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Publish page unavailable"
          description="The publish page could not load draft bootstrap data from the backend."
          detail={error.message}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
