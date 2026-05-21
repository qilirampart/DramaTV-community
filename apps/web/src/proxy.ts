import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.DRAMATV_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_DRAMATV_API_BASE_URL?.trim() ||
  "";
const COMMUNITY_ACCESS_TOKEN_COOKIE = "dramatv_access_token";
const AUTHORIZATION_HEADER_NAME = "Authorization";
const REQUEST_ID_HEADER_NAME = "X-Request-Id";

const PUBLIC_PATHS = new Set(["/", "/login", "/icon.svg"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  if (pathname.startsWith("/internal/") || pathname === "/internal") {
    return true;
  }

  return pathname.startsWith("/_next/") || pathname.startsWith("/api/") || pathname.startsWith("/favicon");
}

function absoluteBackendUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

function createRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `web-proxy-${globalThis.crypto.randomUUID()}`;
  }

  return `web-proxy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function verifyCommunitySession(token: string) {
  if (API_BASE_URL.length === 0) {
    return "skip" as const;
  }

  const controller = new AbortController();
  const timeoutHandle = globalThis.setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(absoluteBackendUrl("/api/auth/me"), {
      method: "GET",
      headers: {
        [AUTHORIZATION_HEADER_NAME]: `Bearer ${token}`,
        [REQUEST_ID_HEADER_NAME]: createRequestId()
      },
      cache: "no-store",
      signal: controller.signal
    });

    if (response.ok) {
      return "valid" as const;
    }

    if (response.status === 401 || response.status === 403) {
      return "invalid" as const;
    }

    return "skip" as const;
  } catch {
    return "skip" as const;
  } finally {
    globalThis.clearTimeout(timeoutHandle);
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COMMUNITY_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (token) {
    const verification = await verifyCommunitySession(token);
    if (verification !== "invalid") {
      return NextResponse.next();
    }
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
  const response = NextResponse.redirect(loginUrl);
  if (request.cookies.get(COMMUNITY_ACCESS_TOKEN_COOKIE)) {
    response.cookies.delete(COMMUNITY_ACCESS_TOKEN_COOKIE);
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|.*\\..*|_next).*)"]
};
