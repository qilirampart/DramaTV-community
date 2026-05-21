"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminBackendError,
  approveAdminModerationItem,
  offlineAdminModerationItem,
  rejectAdminModerationItem,
  restoreAdminModerationItem
} from "@/lib/admin-service";

type ModerationReturnState = {
  targetType?: string | null;
  targetId?: string | null;
  q?: string | null;
  filterTargetType?: string | null;
  status?: string | null;
};

function appendSearchParam(searchParams: URLSearchParams, key: string, value?: string | null) {
  const normalized = value?.trim();
  if (normalized) {
    searchParams.set(key, normalized);
  }
}

function resolveReturnPath(state?: ModerationReturnState) {
  const searchParams = new URLSearchParams();
  appendSearchParam(searchParams, "selectedType", state?.targetType);
  appendSearchParam(searchParams, "selectedId", state?.targetId);
  appendSearchParam(searchParams, "q", state?.q);
  appendSearchParam(searchParams, "targetType", state?.filterTargetType);
  appendSearchParam(searchParams, "status", state?.status);

  const query = searchParams.toString();
  return query ? `/moderation?${query}` : "/moderation";
}

function buildErrorRedirect(message: string, state?: ModerationReturnState) {
  const base = resolveReturnPath(state);
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}error=${encodeURIComponent(message)}`;
}

function buildSuccessRedirect(state?: ModerationReturnState) {
  const target = resolveReturnPath(state);
  revalidatePath("/moderation");
  redirect(target);
}

function readActionInput(formData: FormData) {
  return {
    targetType: String(formData.get("targetType") ?? "").trim(),
    targetId: String(formData.get("targetId") ?? "").trim(),
    note: String(formData.get("note") ?? "").trim(),
    q: String(formData.get("q") ?? "").trim(),
    filterTargetType: String(formData.get("filterTargetType") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim()
  };
}

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminBackendError) {
    return `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`;
  }
  return fallbackMessage;
}

export async function approveModerationAction(formData: FormData) {
  const input = readActionInput(formData);
  if (!input.targetType || !input.targetId) {
    redirect(buildErrorRedirect("缺少审核目标信息。", input));
  }

  try {
    await approveAdminModerationItem(input);
  } catch (error) {
    redirect(buildErrorRedirect(resolveErrorMessage(error, "审核通过失败，请稍后重试。"), input));
  }

  buildSuccessRedirect(input);
}

export async function rejectModerationAction(formData: FormData) {
  const input = readActionInput(formData);
  if (!input.targetType || !input.targetId) {
    redirect(buildErrorRedirect("缺少审核目标信息。", input));
  }

  try {
    await rejectAdminModerationItem(input);
  } catch (error) {
    redirect(buildErrorRedirect(resolveErrorMessage(error, "驳回失败，请稍后重试。"), input));
  }

  buildSuccessRedirect(input);
}

export async function offlineModerationAction(formData: FormData) {
  const input = readActionInput(formData);
  if (!input.targetType || !input.targetId) {
    redirect(buildErrorRedirect("缺少审核目标信息。", input));
  }

  try {
    await offlineAdminModerationItem(input);
  } catch (error) {
    redirect(buildErrorRedirect(resolveErrorMessage(error, "下线失败，请稍后重试。"), input));
  }

  buildSuccessRedirect(input);
}

export async function restoreModerationAction(formData: FormData) {
  const input = readActionInput(formData);
  if (!input.targetType || !input.targetId) {
    redirect(buildErrorRedirect("缺少审核目标信息。", input));
  }

  try {
    await restoreAdminModerationItem(input);
  } catch (error) {
    redirect(buildErrorRedirect(resolveErrorMessage(error, "恢复失败，请稍后重试。"), input));
  }

  buildSuccessRedirect(input);
}
