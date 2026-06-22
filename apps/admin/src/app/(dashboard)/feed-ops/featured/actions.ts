"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminBackendError, updateAdminFeedOpsFeatured } from "@/lib/admin-service";

function normalizeFeaturedSort(value: string | null | undefined) {
  return value === "hot" ? "hot" : "latest";
}

function buildRedirect(sort: "latest" | "hot", message?: string | null, success = false) {
  const params = new URLSearchParams();
  if (sort === "hot") {
    params.set("sort", "hot");
  }

  if (message) {
    params.set(success ? "success" : "error", message);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  if (!message) {
    revalidatePath("/feed-ops/featured");
    redirect(`/feed-ops/featured${suffix}`);
  }

  redirect(`/feed-ops/featured${suffix}`);
}

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminBackendError) {
    return `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`;
  }
  return fallbackMessage;
}

export async function saveFeedOpsFeaturedAction(formData: FormData) {
  const sort = normalizeFeaturedSort(String(formData.get("sort") ?? "").trim());
  const payloadRaw = String(formData.get("payload") ?? "").trim();
  if (!payloadRaw) {
    buildRedirect(sort, "精选运营配置参数不完整。");
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
    buildRedirect(sort, "精选运营配置参数无效。");
    return;
  }

  if (!payload.statusCode || !Array.isArray(payload.slots)) {
    buildRedirect(sort, "精选运营配置参数不完整。");
  }

  try {
    await updateAdminFeedOpsFeatured(payload, sort);
  } catch (error) {
    buildRedirect(sort, resolveErrorMessage(error, "精选运营配置保存失败，请稍后重试。"));
  }

  buildRedirect(sort, "精选运营配置已保存。", true);
}
