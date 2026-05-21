"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminBackendError, retryAdminMediaTask } from "@/lib/admin-service";

type MediaTaskReturnState = {
  taskId?: string | null;
  q?: string | null;
  status?: string | null;
  targetType?: string | null;
};

function appendSearchParam(searchParams: URLSearchParams, key: string, value?: string | null) {
  const normalized = value?.trim();
  if (normalized) {
    searchParams.set(key, normalized);
  }
}

function resolveReturnPathWithFilters(
  state?: MediaTaskReturnState,
  message?: {
    key: "error" | "success";
    value: string | null | undefined;
  }
) {
  const searchParams = new URLSearchParams();
  appendSearchParam(searchParams, "selected", state?.taskId);
  appendSearchParam(searchParams, "q", state?.q);
  appendSearchParam(searchParams, "status", state?.status);
  appendSearchParam(searchParams, "targetType", state?.targetType);
  if (message?.value?.trim()) {
    searchParams.set(message.key, message.value.trim());
  }
  const query = searchParams.toString();
  return query ? `/media-tasks?${query}` : "/media-tasks";
}

function buildErrorRedirect(message: string, state?: MediaTaskReturnState) {
  const base = resolveReturnPathWithFilters(state);
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}error=${encodeURIComponent(message)}`;
}

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminBackendError) {
    return `${error.message}${error.requestId ? ` (requestId: ${error.requestId})` : ""}`;
  }
  return fallbackMessage;
}

export async function retryMediaTaskAction(formData: FormData) {
  const state = {
    taskId: String(formData.get("taskId") ?? "").trim(),
    q: String(formData.get("q") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    targetType: String(formData.get("targetType") ?? "").trim()
  };
  const taskId = state.taskId;

  if (!taskId) {
    redirect(buildErrorRedirect("Missing media task id.", state));
  }

  try {
    await retryAdminMediaTask(taskId);
  } catch (error) {
    redirect(buildErrorRedirect(resolveErrorMessage(error, "Retrying the media task failed."), state));
  }

  revalidatePath("/media-tasks");
  redirect(
    resolveReturnPathWithFilters(state, {
      key: "success",
      value: "Retry submitted. Check the current status and retry count on the right."
    })
  );
}
