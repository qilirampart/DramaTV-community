import { CommunityBackendUnavailableState } from "@/components/shared/CommunityBackendUnavailableState";
import { CommunityFeaturePendingState } from "@/components/shared/CommunityFeaturePendingState";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import {
  copyWorkflowToCanvas,
  getHomeFeed,
  isCommunityAuthRequiredError
} from "@/lib/api/community-service";
import { requireCommunitySession } from "@/lib/auth/community-auth";
import { redirect } from "next/navigation";

function resolveCanvasEntryWorkflowId(items: Awaited<ReturnType<typeof getHomeFeed>>["data"]["items"]) {
  for (const item of items) {
    if (item.contentKind === "workflow_work" && item.workflow?.id) {
      return item.workflow.id;
    }

    if (item.itemType === "workflow") {
      return item.targetId;
    }

    if (item.workflow?.id) {
      return item.workflow.id;
    }
  }

  return undefined;
}

export default async function CanvasEntryRoute() {
  let openUrl: string | undefined;

  await requireCommunitySession("/canvas");

  try {
    const homeFeed = await getHomeFeed();
    const workflowId = resolveCanvasEntryWorkflowId(homeFeed.data.items);

    if (!workflowId) {
      return (
        <CommunityFeaturePendingState
          eyebrow="画布入口"
          title="画布入口已预留"
          description="当前入口已经挂到首页、精选页和社区页，后续会在这里接入真实画布。"
          detail="当前首页数据里还没有可用于创建演示画布的工作流。"
        />
      );
    }

    const result = await copyWorkflowToCanvas(workflowId);
    openUrl = result.data.openUrl;
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      redirect("/login?redirectTo=%2Fcanvas");
    }

    return (
      <CommunityBackendUnavailableState
        title="Canvas entry unavailable"
        description="The shared canvas entry could not load live data from the backend."
        detail={formatCommunityActionError(error, "服务暂时不可用，请稍后重试。")}
      />
    );
  }

  if (openUrl) {
    redirect(openUrl);
  }

  return (
    <CommunityFeaturePendingState
      eyebrow="画布入口"
      title="画布入口已预留"
      description="当前入口已经挂到首页、精选页和社区页，后续会在这里接入真实画布。"
      detail="当前未返回可跳转的运行态地址。"
    />
  );
}
