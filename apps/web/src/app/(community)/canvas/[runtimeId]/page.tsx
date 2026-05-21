import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { CanvasRuntimePage } from "@/features/canvas-runtime/CanvasRuntimePage";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  getCanvasRuntime,
  isCommunityAuthRequiredError,
  isCommunityBackendUnavailableError
} from "@/lib/api/community-service";
import { requireCommunitySession } from "@/lib/auth/community-auth";
import { mapCanvasRuntimePageView } from "@/lib/mappers/community";
import { redirect } from "next/navigation";

type CanvasRouteProps = {
  params: Promise<{
    runtimeId: string;
  }>;
};

export default async function CanvasRuntimeRoute({ params }: CanvasRouteProps) {
  const { runtimeId } = await params;

  await requireCommunitySession(`/canvas/${runtimeId}`);

  try {
    const runtime = await getCanvasRuntime(runtimeId);
    const view = mapCanvasRuntimePageView(runtime);

    return <CanvasRuntimePage view={view} />;
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      redirect(`/login?redirectTo=${encodeURIComponent(`/canvas/${runtimeId}`)}`);
    }

    if (isCommunityBackendUnavailableError(error)) {
      return (
        <CommunityBackendUnavailableState
          title="Canvas runtime unavailable"
          description="The linked canvas runtime could not load live data from the backend."
          detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
          requestId={error.requestId}
        />
      );
    }

    throw error;
  }
}
