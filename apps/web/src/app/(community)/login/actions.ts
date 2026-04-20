"use server";

import { RedirectType, redirect } from "next/navigation";
import { loginCommunity } from "@/lib/api/community-service";

export type LoginActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

function resolveRedirectTarget(redirectTo?: string) {
  const normalized = redirectTo?.trim();

  if (!normalized || !normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/home";
  }

  return normalized;
}

export async function loginAction(input: {
  username: string;
  password: string;
  redirectTo?: string;
}): Promise<LoginActionResult> {
  try {
    await loginCommunity({
      username: input.username,
      password: input.password
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Login failed."
    };
  }

  redirect(resolveRedirectTarget(input.redirectTo), RedirectType.replace);
}
