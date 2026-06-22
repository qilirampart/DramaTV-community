"use server";

import { RedirectType, redirect } from "next/navigation";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import { loginCommunity } from "@/lib/api/community-service";
import { normalizeRedirectTarget } from "@/lib/routes/redirect-utils";

export type LoginFormState = {
  message: string | null;
};

const EMPTY_CREDENTIAL_NOTICE = "\u8bf7\u8f93\u5165\u7528\u6237\u540d\u548c\u5bc6\u7801\u3002";
const LOGIN_FAILED_NOTICE = "\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002";

function resolveRedirectTarget(redirectTo?: string) {
  return normalizeRedirectTarget(redirectTo);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function submitLoginAction(
  _previousState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const loginType = readText(formData, "loginType").trim() || undefined;
  const redirectTo = readText(formData, "redirectTo");
  const username = readText(formData, "username").trim();
  const password = readText(formData, "password");

  if (username.length === 0 || password.trim().length === 0) {
    return {
      message: EMPTY_CREDENTIAL_NOTICE
    };
  }

  try {
    await loginCommunity({
      loginType,
      username,
      password
    });
  } catch (error) {
    return {
      message: formatCommunityActionError(error, LOGIN_FAILED_NOTICE)
    };
  }

  redirect(resolveRedirectTarget(redirectTo), RedirectType.replace);
}
