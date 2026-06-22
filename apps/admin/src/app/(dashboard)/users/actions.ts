"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminUser, AdminBackendError, resetAdminUserPassword, updateAdminUserGovernance } from "@/lib/admin-service";
import type { CreateUserActionState, ResetPasswordActionState } from "./types";

function appendSearchParam(searchParams: URLSearchParams, key: string, value?: string | null) {
  const normalized = value?.trim();
  if (normalized) {
    searchParams.set(key, normalized);
  }
}

function appendNumericSearchParam(searchParams: URLSearchParams, key: string, value?: number | null) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    searchParams.set(key, String(Math.floor(value)));
  }
}

function resolvePageValue(rawValue: FormDataEntryValue | null) {
  const value = Number.parseInt(String(rawValue ?? "").trim(), 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function resolveReturnPath(selectedId?: string | null, q?: string | null, page?: number | null) {
  const searchParams = new URLSearchParams();
  appendSearchParam(searchParams, "selected", selectedId);
  appendSearchParam(searchParams, "q", q);
  appendNumericSearchParam(searchParams, "page", page);
  const query = searchParams.toString();
  return query ? `/users?${query}` : "/users";
}

function buildErrorRedirect(message: string, selectedId?: string | null, q?: string | null, page?: number | null) {
  const base = resolveReturnPath(selectedId, q, page);
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}error=${encodeURIComponent(message)}`;
}

function buildSuccessRedirect(message: string, selectedId?: string | null, q?: string | null, page?: number | null) {
  const base = resolveReturnPath(selectedId, q, page);
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}success=${encodeURIComponent(message)}`;
}

export async function updateUserGovernanceAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();
  const selectedId = String(formData.get("selectedId") ?? "").trim();
  const q = String(formData.get("q") ?? "").trim();
  const page = resolvePageValue(formData.get("page"));
  const roleCode = String(formData.get("roleCode") ?? "").trim();
  const statusCode = String(formData.get("statusCode") ?? "").trim();

  if (!userId || !roleCode || !statusCode) {
    redirect(buildErrorRedirect("账号治理参数不完整。", selectedId || userId, q, page));
  }

  try {
    await updateAdminUserGovernance({
      userId,
      roleCode,
      statusCode
    });
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
        : "保存账号治理失败，请稍后重试。";
    redirect(buildErrorRedirect(message, selectedId || userId, q, page));
  }

  revalidatePath("/users");
  redirect(buildSuccessRedirect("账号治理已保存。", selectedId || userId, q, page));
}

export async function resetUserPasswordAction(
  _previousState: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> {
  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    return {
      status: "error",
      message: "密码治理参数不完整。",
      temporaryPassword: null,
      passwordActionLabel: null,
      userId: null
    };
  }

  try {
    const response = await resetAdminUserPassword(userId);
    revalidatePath("/users");
    return {
      status: "success",
      message: response.data.sessionsRevoked ? "已生成新的临时密码，现有登录态已撤销。" : "已生成新的临时密码。",
      temporaryPassword: response.data.temporaryPassword,
      passwordActionLabel: response.data.passwordAction === "initialize" ? "初始化密码" : "重置密码",
      userId: response.data.userId
    };
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
        : "密码治理失败，请稍后重试。";
    return {
      status: "error",
      message,
      temporaryPassword: null,
      passwordActionLabel: null,
      userId
    };
  }
}

export async function createUserAction(
  _previousState: CreateUserActionState,
  formData: FormData
): Promise<CreateUserActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const roleCode = String(formData.get("roleCode") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!username || !displayName || !roleCode) {
    return {
      status: "error",
      message: "创建账号参数不完整。",
      requestId: null,
      createdUserId: null,
      temporaryPassword: null,
      passwordMode: null,
      createdUsername: null,
      createdDisplayName: null
    };
  }

  try {
    const password = String(formData.get("password") ?? "").trim();
    const response = await createAdminUser({
      username,
      displayName,
      roleCode,
      email: email || undefined,
      phone: phone || undefined,
      password: password || undefined
    });

    revalidatePath("/users");
    return {
      status: "success",
      message: password ? "账号已创建，已按填写内容设置初始密码。" : "账号已创建，已自动生成临时密码。",
      requestId: response.requestId,
      createdUserId: response.data.userId,
      temporaryPassword: response.data.temporaryPassword,
      passwordMode: password ? "custom" : "generated",
      createdUsername: response.data.username,
      createdDisplayName: response.data.displayName
    };
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
        : "创建账号失败，请稍后重试。";
    return {
      status: "error",
      message,
      requestId: error instanceof AdminBackendError ? error.requestId ?? null : null,
      createdUserId: null,
      temporaryPassword: null,
      passwordMode: null,
      createdUsername: null,
      createdDisplayName: null
    };
  }
}
