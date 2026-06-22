"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminBackendError, updateAdminFeedOpsLanding } from "@/lib/admin-service";

function buildRedirect(message?: string | null, success = false) {
  if (!message) {
    revalidatePath("/feed-ops/landing");
    revalidatePath("/", "layout");
    redirect("/feed-ops/landing");
  }

  const key = success ? "success" : "error";
  redirect(`/feed-ops/landing?${key}=${encodeURIComponent(message)}`);
}

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminBackendError) {
    return `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`;
  }
  return fallbackMessage;
}

export async function saveFeedOpsLandingAction(formData: FormData) {
  const payloadRaw = String(formData.get("payload") ?? "").trim();
  if (!payloadRaw) {
    buildRedirect("落地页运营配置参数不完整。");
  }

  let payload: {
    statusCode: string;
    slots: Array<{
      slotKey: string;
      items: Array<{
        targetType: string;
        targetId: string;
      }>;
    }>;
  };

  try {
    payload = JSON.parse(payloadRaw) as typeof payload;
  } catch {
    buildRedirect("落地页运营配置参数无效。");
    return;
  }

  if (!payload.statusCode || !Array.isArray(payload.slots)) {
    buildRedirect("落地页运营配置参数不完整。");
  }

  try {
    await updateAdminFeedOpsLanding(payload);
  } catch (error) {
    buildRedirect(resolveErrorMessage(error, "落地页运营配置保存失败，请稍后重试。"));
  }

  buildRedirect("落地页运营配置已保存。", true);
}
