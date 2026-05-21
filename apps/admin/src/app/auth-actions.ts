"use server";

import { redirect } from "next/navigation";
import { AdminBackendError, loginAdmin, logoutAdmin } from "@/lib/admin-service";
import { resolveAdminHomeRoute, type AdminRole } from "@/lib/admin-auth";

type LoginActionState = {
  message: string | null;
};

function resolveRedirectTarget(value: FormDataEntryValue | null, fallbackPath: string) {
  if (typeof value !== "string") {
    return fallbackPath;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) {
    return fallbackPath;
  }

  return trimmed;
}

export async function signInAction(_: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (username.length === 0) {
    return { message: "请输入账号。" };
  }

  if (password.length === 0) {
    return { message: "请输入密码。" };
  }

  let roleCode: AdminRole;

  try {
    const result = await loginAdmin({ username, password });
    roleCode = result.data.user.roleCode as AdminRole;
  } catch (error) {
    if (error instanceof AdminBackendError) {
      return {
        message: `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
      };
    }

    return { message: "后台登录失败，请稍后重试。" };
  }

  redirect(resolveRedirectTarget(formData.get("redirectTo"), resolveAdminHomeRoute(roleCode)));
}

export async function signOutAction() {
  await logoutAdmin();
  redirect("/login");
}
