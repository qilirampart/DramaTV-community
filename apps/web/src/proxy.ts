import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const COMMUNITY_ACCESS_TOKEN_COOKIE = "dramatv_access_token";

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

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COMMUNITY_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"]
};
