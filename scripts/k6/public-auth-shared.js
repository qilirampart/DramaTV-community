import http from "k6/http";
import { check, fail, sleep } from "k6";

export const PUBLIC_BASE_URL = (__ENV.PUBLIC_BASE_URL || "http://drama-community-dev.dzkjm.cn").replace(/\/$/, "");
export const LOGIN_USERNAME = __ENV.LOGIN_USERNAME || "";
export const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || "";

function normalizeRoute(route) {
  if (typeof route !== "string") {
    return null;
  }

  const trimmed = route.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function resolveRoutes() {
  if (typeof __ENV.ROUTES === "string" && __ENV.ROUTES.trim().length > 0) {
    const routes = __ENV.ROUTES.split(",")
      .map(normalizeRoute)
      .filter(Boolean);
    if (routes.length > 0) {
      return routes;
    }
  }

  return ["/featured", "/home", "/discussions"];
}

export const ROUTES = resolveRoutes();

export function login() {
  if (!LOGIN_USERNAME || !LOGIN_PASSWORD) {
    fail("LOGIN_USERNAME and LOGIN_PASSWORD environment variables are required");
  }

  const response = http.post(
    `${PUBLIC_BASE_URL}/api/auth/login`,
    JSON.stringify({
      loginType: "password",
      username: LOGIN_USERNAME,
      password: LOGIN_PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      redirects: 0,
      tags: { name: "auth.login" },
    }
  );

  const ok = check(response, {
    "login status 200": (r) => r.status === 200,
  });
  if (!ok) {
    fail(`login failed: status=${response.status} body=${response.body}`);
  }

  const payload = response.json();
  const accessToken = payload?.data?.accessToken;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    fail(`login response missing accessToken: ${response.body}`);
  }

  return { accessToken };
}

export function browseAuthenticatedPages(session) {
  const params = {
    headers: {
      Cookie: `dramatv_access_token=${session.accessToken}`,
      Accept: "text/html,application/xhtml+xml",
    },
    redirects: 0,
  };

  for (const route of ROUTES) {
    const response = http.get(`${PUBLIC_BASE_URL}${route}`, {
      ...params,
      tags: { name: route },
    });

    check(response, {
      [`${route} status 200`]: (r) => r.status === 200,
      [`${route} not redirected`]: (r) => !r.headers.Location,
    });

    sleep(0.5);
  }
}
