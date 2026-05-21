"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminBackendError,
  closeAdminReport,
  hideAdminReportedComment,
  markProcessingAdminReport,
  offlineAdminReportTarget
} from "@/lib/admin-service";

type ReportReturnState = {
  reportId?: string | null;
  q?: string | null;
  status?: string | null;
  targetType?: string | null;
  reason?: string | null;
};

function appendSearchParam(searchParams: URLSearchParams, key: string, value?: string | null) {
  const normalized = value?.trim();
  if (normalized) {
    searchParams.set(key, normalized);
  }
}

function resolveReturnPath(state?: ReportReturnState) {
  const searchParams = new URLSearchParams();
  appendSearchParam(searchParams, "selected", state?.reportId);
  appendSearchParam(searchParams, "q", state?.q);
  appendSearchParam(searchParams, "status", state?.status);
  appendSearchParam(searchParams, "targetType", state?.targetType);
  appendSearchParam(searchParams, "reason", state?.reason);

  const query = searchParams.toString();
  return query ? `/reports?${query}` : "/reports";
}

function buildErrorRedirect(message: string, state?: ReportReturnState) {
  const base = resolveReturnPath(state);
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}error=${encodeURIComponent(message)}`;
}

function buildSuccessRedirect(state?: ReportReturnState) {
  const target = resolveReturnPath(state);
  revalidatePath("/reports");
  redirect(target);
}

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminBackendError) {
    return `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`;
  }
  return fallbackMessage;
}

function readActionInput(formData: FormData) {
  return {
    reportId: String(formData.get("reportId") ?? "").trim(),
    note: String(formData.get("note") ?? "").trim(),
    q: String(formData.get("q") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    targetType: String(formData.get("targetType") ?? "").trim(),
    reason: String(formData.get("reason") ?? "").trim()
  };
}

export async function markProcessingReportAction(formData: FormData) {
  const input = readActionInput(formData);
  if (!input.reportId) {
    redirect(buildErrorRedirect("缺少举报工单信息。", input));
  }

  try {
    await markProcessingAdminReport(input);
  } catch (error) {
    redirect(buildErrorRedirect(resolveErrorMessage(error, "标记处理中失败，请稍后重试。"), input));
  }

  buildSuccessRedirect(input);
}

export async function closeReportAction(formData: FormData) {
  const input = readActionInput(formData);
  if (!input.reportId) {
    redirect(buildErrorRedirect("缺少举报工单信息。", input));
  }

  try {
    await closeAdminReport(input);
  } catch (error) {
    redirect(buildErrorRedirect(resolveErrorMessage(error, "关闭工单失败，请稍后重试。"), input));
  }

  buildSuccessRedirect(input);
}

export async function offlineReportTargetAction(formData: FormData) {
  const input = readActionInput(formData);
  if (!input.reportId) {
    redirect(buildErrorRedirect("缺少举报工单信息。", input));
  }

  try {
    await offlineAdminReportTarget(input);
  } catch (error) {
    redirect(buildErrorRedirect(resolveErrorMessage(error, "联动下线内容失败，请稍后重试。"), input));
  }

  buildSuccessRedirect(input);
}

export async function hideReportedCommentAction(formData: FormData) {
  const input = readActionInput(formData);
  if (!input.reportId) {
    redirect(buildErrorRedirect("缺少举报工单信息。", input));
  }

  try {
    await hideAdminReportedComment(input);
  } catch (error) {
    redirect(buildErrorRedirect(resolveErrorMessage(error, "联动隐藏评论失败，请稍后重试。"), input));
  }

  buildSuccessRedirect(input);
}
