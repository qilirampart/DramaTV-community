"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminBackendError,
  deleteAdminComment,
  hideAdminComment,
  restoreAdminComment,
  updateAdminCommentTargetSettings
} from "@/lib/admin-service";

type CommentReturnState = {
  selectedId?: string | null;
  q?: string | null;
  status?: string | null;
  filterTargetType?: string | null;
  reportedOnly?: string | null;
};

function appendSearchParam(searchParams: URLSearchParams, key: string, value?: string | null) {
  const normalized = value?.trim();
  if (normalized) {
    searchParams.set(key, normalized);
  }
}

function resolveReturnPath(state?: CommentReturnState) {
  const searchParams = new URLSearchParams();
  appendSearchParam(searchParams, "selected", state?.selectedId);
  appendSearchParam(searchParams, "q", state?.q);
  appendSearchParam(searchParams, "status", state?.status);
  appendSearchParam(searchParams, "targetType", state?.filterTargetType);
  appendSearchParam(searchParams, "reportedOnly", state?.reportedOnly);

  const query = searchParams.toString();
  return query ? `/comments?${query}` : "/comments";
}

function buildErrorRedirect(message: string, state?: CommentReturnState) {
  const base = resolveReturnPath(state);
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}error=${encodeURIComponent(message)}`;
}

function buildSuccessRedirect(state?: CommentReturnState) {
  const target = resolveReturnPath(state);
  revalidatePath("/comments");
  redirect(target);
}

function readReturnState(formData: FormData): CommentReturnState {
  return {
    selectedId: String(formData.get("selectedId") ?? "").trim(),
    q: String(formData.get("q") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    filterTargetType: String(formData.get("filterTargetType") ?? "").trim(),
    reportedOnly: String(formData.get("reportedOnly") ?? "").trim()
  };
}

export async function hideCommentAction(formData: FormData) {
  const commentId = String(formData.get("commentId") ?? "").trim();
  const state = readReturnState(formData);

  if (!commentId) {
    redirect(buildErrorRedirect("缺少评论 ID。", state));
  }

  try {
    await hideAdminComment(commentId);
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
        : "隐藏评论失败，请稍后重试。";
    redirect(
      buildErrorRedirect(message, {
        ...state,
        selectedId: state.selectedId || commentId
      })
    );
  }

  buildSuccessRedirect({
    ...state,
    selectedId: state.selectedId || commentId
  });
}

export async function restoreCommentAction(formData: FormData) {
  const commentId = String(formData.get("commentId") ?? "").trim();
  const state = readReturnState(formData);

  if (!commentId) {
    redirect(buildErrorRedirect("缺少评论 ID。", state));
  }

  try {
    await restoreAdminComment(commentId);
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
        : "恢复评论失败，请稍后重试。";
    redirect(
      buildErrorRedirect(message, {
        ...state,
        selectedId: state.selectedId || commentId
      })
    );
  }

  buildSuccessRedirect({
    ...state,
    selectedId: state.selectedId || commentId
  });
}

export async function deleteCommentAction(formData: FormData) {
  const commentId = String(formData.get("commentId") ?? "").trim();
  const state = readReturnState(formData);

  if (!commentId) {
    redirect(buildErrorRedirect("缺少评论 ID。", state));
  }

  try {
    await deleteAdminComment(commentId);
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
        : "删除评论失败，请稍后重试。";
    redirect(
      buildErrorRedirect(message, {
        ...state,
        selectedId: state.selectedId || commentId
      })
    );
  }

  buildSuccessRedirect({
    ...state,
    selectedId: undefined
  });
}

export async function toggleCommentTargetSettingsAction(formData: FormData) {
  const targetType = String(formData.get("targetType") ?? "").trim();
  const targetId = String(formData.get("targetId") ?? "").trim();
  const state = readReturnState(formData);
  const nextState = String(formData.get("nextState") ?? "").trim();

  if (!targetType || !targetId || (nextState !== "enable" && nextState !== "disable")) {
    redirect(buildErrorRedirect("评论区开关参数不完整。", state));
  }

  try {
    await updateAdminCommentTargetSettings({
      targetType,
      targetId,
      commentsEnabled: nextState === "enable"
    });
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
        : "评论区开关更新失败，请稍后重试。";
    redirect(buildErrorRedirect(message, state));
  }

  buildSuccessRedirect(state);
}
