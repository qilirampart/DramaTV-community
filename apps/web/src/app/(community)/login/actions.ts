"use server";

import { RedirectType, redirect } from "next/navigation";
import { loginCommunity } from "@/lib/api/community-service";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import { normalizeRedirectTarget } from "@/lib/routes/redirect-utils";

export type LoginActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

function resolveRedirectTarget(redirectTo?: string) {
  return normalizeRedirectTarget(redirectTo);
}

export async function loginAction(input: {
  loginType?: string;
  username: string;
  password: string;
  redirectTo?: string;
}): Promise<LoginActionResult> {
  try {
    await loginCommunity({
      loginType: input.loginType,
      username: input.username,
      password: input.password
    });
  } catch (error) {
    return {
      ok: false,
      message: formatCommunityActionError(error, "登录失败，请稍后重试。")
    };
  }

  redirect(resolveRedirectTarget(input.redirectTo), RedirectType.replace);
}
