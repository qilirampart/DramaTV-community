import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      index += 1;
      continue;
    }

    parsed[key] = "true";
  }

  return parsed;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requestId(label) {
  return `admin-smoke-${label}-${randomUUID()}`;
}

function normalizeBasePath(basePath) {
  const trimmed = String(basePath ?? "").trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  const prefixed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return prefixed.replace(/\/+$/, "");
}

function normalizeRoutePath(routePath) {
  const trimmed = String(routePath ?? "").trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function buildRouteUrl(baseUrl, basePath, routePath) {
  const url = new URL(baseUrl);
  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedRoutePath = normalizeRoutePath(routePath);
  const currentPath = url.pathname.replace(/\/+$/, "") || "/";

  if (
    normalizedBasePath &&
    (currentPath === normalizedBasePath || currentPath.startsWith(`${normalizedBasePath}/`))
  ) {
    url.pathname = `${currentPath}${normalizedRoutePath === "/" ? "" : normalizedRoutePath}`.replace(/\/{2,}/g, "/");
  } else {
    const prefix = currentPath === "/" ? "" : currentPath;
    url.pathname = `${prefix}${normalizedBasePath}${normalizedRoutePath}`.replace(/\/{2,}/g, "/");
  }
  return url.toString();
}

function pushResult(results, name, passed, detail) {
  results.push({ name, passed, detail });
}

async function runCase(results, name, fn) {
  try {
    const detail = await fn();
    pushResult(results, name, true, detail);
  } catch (error) {
    pushResult(results, name, false, error instanceof Error ? error.message : String(error));
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Accept: options.accept ?? "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "X-Request-Id": options.requestId ?? requestId("http"),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    redirect: options.redirect ?? "follow",
  });

  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    text,
    json,
  };
}

function expectRedirectToLogin(response, routePath) {
  const expectedRedirectTo = encodeURIComponent(routePath);

  if ([302, 307, 308].includes(response.status)) {
    const location = response.headers.location ?? "";
    assert(location.includes("/login"), `${routePath} expected redirect to /login but got ${location || "<empty>"}`);
    assert(
      location.includes(`redirectTo=${expectedRedirectTo}`),
      `${routePath} expected redirectTo=${expectedRedirectTo} but got ${location || "<empty>"}`
    );
    return location;
  }

  if (response.status === 200) {
    const redirectHints = [
      `/login?redirectTo=${expectedRedirectTo}`,
      `NEXT_REDIRECT;replace;/login?redirectTo=${expectedRedirectTo};307`,
      `content="1;url=/login?redirectTo=${expectedRedirectTo}"`
    ];

    const matchedHint = redirectHints.find((hint) => response.text.includes(hint));
    assert(
      matchedHint,
      `${routePath} expected redirect hint to /login but got ${response.status}`
    );
    return matchedHint;
  }

  assert(false, `${routePath} expected redirect but got ${response.status}`);
}

async function expectRootRedirectToLogin(response, baseUrl, basePath) {
  const normalizedBasePath = normalizeBasePath(basePath);
  const directLoginRedirect = tryMatchLoginRedirect(response, "/");
  if (directLoginRedirect) {
    return directLoginRedirect;
  }

  if (normalizedBasePath && [302, 307, 308].includes(response.status)) {
    const location = response.headers.location ?? "";
    const expectedRootLocations = new Set([normalizedBasePath, `${normalizedBasePath}/`]);

    if (expectedRootLocations.has(location)) {
      const followUpResponse = await request(new URL(location, baseUrl).toString(), {
        redirect: "manual",
        requestId: requestId("root-basepath"),
      });
      const followUpRedirect = tryMatchLoginRedirect(followUpResponse, "/");
      assert(
        followUpRedirect,
        `/ expected redirect to /login after basePath handoff but got ${followUpResponse.status}`
      );
      return `${location} -> ${followUpRedirect}`;
    }
  }

  const actualLocation = response.headers.location ?? `<status ${response.status}>`;
  throw new Error(`/ expected redirect to /login but got ${actualLocation}`);
}

function tryMatchLoginRedirect(response, routePath) {
  const expectedRedirectTo = encodeURIComponent(routePath);

  if ([302, 307, 308].includes(response.status)) {
    const location = response.headers.location ?? "";
    if (location.includes("/login") && location.includes(`redirectTo=${expectedRedirectTo}`)) {
      return location;
    }
    return null;
  }

  if (response.status === 200) {
    const redirectHints = [
      `/login?redirectTo=${expectedRedirectTo}`,
      `NEXT_REDIRECT;replace;/login?redirectTo=${expectedRedirectTo};307`,
      `content="1;url=/login?redirectTo=${expectedRedirectTo}"`
    ];

    return redirectHints.find((hint) => response.text.includes(hint)) ?? null;
  }

  return null;
}

function expectHtmlContains(response, routePath, expectedText) {
  assert(response.status === 200, `${routePath} expected 200 but got ${response.status}`);
  assert(
    response.text.includes(expectedText),
    `${routePath} expected html to contain "${expectedText}" but it did not`
  );
  return expectedText;
}

function expectHtmlIncludes(response, routePath, expectedText) {
  assert(response.status === 200, `${routePath} expected 200 but got ${response.status}`);
  assert(
    response.text.includes(expectedText),
    `${routePath} expected html to include "${expectedText}" but it did not`
  );
  return expectedText;
}

async function loginAdmin(backendBaseUrl, username, password) {
  const response = await request(`${backendBaseUrl}/api/admin/auth/login`, {
    method: "POST",
    accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    requestId: requestId("admin-login"),
    body: {
      loginType: "password",
      username,
      password,
    },
  });

  assert(response.status >= 200 && response.status < 300, `admin login expected 2xx but got ${response.status}`);
  assert(response.json?.code === "OK", `admin login expected code=OK but got ${response.text}`);

  const accessToken = response.json?.data?.accessToken;
  assert(typeof accessToken === "string" && accessToken.trim(), "admin login missing accessToken");
  return accessToken.trim();
}

const args = parseArgs(process.argv.slice(2));
const baseUrl = (args["base-url"] ?? process.env.DRAMATV_ADMIN_BASE_URL ?? "http://127.0.0.1:3206").replace(/\/$/, "");
const basePath = normalizeBasePath(args["base-path"] ?? process.env.DRAMATV_ADMIN_BASE_PATH ?? "/admin");
const backendBaseUrl = (
  args["backend-base-url"] ?? process.env.DRAMATV_BACKEND_BASE_URL ?? "http://127.0.0.1:18080"
).replace(/\/$/, "");
const mode = (args.mode ?? process.env.DRAMATV_ADMIN_SMOKE_MODE ?? "full").trim().toLowerCase();
const adminUsername = args.username ?? process.env.DRAMATV_ADMIN_SMOKE_USERNAME ?? "admin-chief";
const adminPassword = args.password ?? process.env.DRAMATV_ADMIN_SMOKE_PASSWORD ?? "dramatv-admin-demo";
const outputPath = args.output ?? "";
const results = [];

assert(["full", "public"].includes(mode), `Unsupported smoke mode: ${mode}`);

await runCase(results, "root.redirect", async () => {
  const response = await request(buildRouteUrl(baseUrl, basePath, "/"), {
    redirect: "manual",
    requestId: requestId("root"),
  });
  return expectRootRedirectToLogin(response, baseUrl, basePath);
});

await runCase(results, "login.page", async () => {
  const response = await request(buildRouteUrl(baseUrl, basePath, "/login"), {
    requestId: requestId("login"),
  });
  assert(response.status === 200, `/login expected 200 but got ${response.status}`);
  assert(/Drama\s*TV|DramaTV/i.test(response.text), `/login missing DramaTV brand text`);
  return buildRouteUrl(baseUrl, basePath, "/login");
});

for (const routePath of [
  "/dashboard",
  "/users",
  "/comments",
  "/moderation",
  "/reports",
  "/resources",
  "/taxonomy",
  "/feed-ops/home",
  "/feed-ops/featured",
  "/feed-ops/discussions",
  "/media-tasks",
  "/audit-logs",
]) {
  await runCase(results, `guard${routePath.replaceAll("/", ".") || ".root"}`, async () => {
    const response = await request(buildRouteUrl(baseUrl, basePath, routePath), {
      redirect: "manual",
      requestId: requestId(`guard-${routePath.replaceAll("/", "-") || "root"}`),
    });
    return expectRedirectToLogin(response, routePath);
  });
}

let adminAccessToken = null;

if (mode === "full") {
  await runCase(results, "auth.login", async () => {
    adminAccessToken = await loginAdmin(backendBaseUrl, adminUsername, adminPassword);
    return `username=${adminUsername}`;
  });

  for (const page of [
    { path: "/dashboard", text: "后台总览" },
    { path: "/users", text: "用户管理" },
    { path: "/comments", text: "评论治理" },
    { path: "/media-tasks", text: "媒体任务" },
    { path: "/moderation", text: "内容审核" },
    { path: "/reports", text: "举报中心" },
    { path: "/resources", text: "资源治理" },
    { path: "/taxonomy", text: "分类管理" },
    { path: "/feed-ops/home", text: "首页运营" },
    { path: "/feed-ops/featured", text: "精选运营" },
    { path: "/feed-ops/discussions", text: "讨论运营" },
    { path: "/audit-logs", text: "操作日志" },
  ]) {
    await runCase(results, `auth.page${page.path.replaceAll("/", ".") || ".root"}`, async () => {
      assert(adminAccessToken, `missing admin access token for ${page.path}`);
      const response = await request(buildRouteUrl(baseUrl, basePath, page.path), {
        cookie: `dramatv_admin_access_token=${adminAccessToken}`,
        requestId: requestId(`auth-page-${page.path.replaceAll("/", "-") || "root"}`),
      });
      return expectHtmlContains(response, page.path, page.text);
    });
  }

  for (const filterPage of [
    { path: "/users", expectedAction: 'action="/admin/users"' },
    { path: "/comments", expectedAction: 'action="/admin/comments"' },
    { path: "/moderation", expectedAction: 'action="/admin/moderation"' },
    { path: "/reports", expectedAction: 'action="/admin/reports"' },
    { path: "/resources", expectedAction: 'action="/admin/resources"' },
    { path: "/media-tasks", expectedAction: 'action="/admin/media-tasks"' },
    { path: "/audit-logs", expectedAction: 'action="/admin/audit-logs"' },
  ]) {
    await runCase(results, `auth.page${filterPage.path.replaceAll("/", ".")}.filter-form-basepath`, async () => {
      assert(adminAccessToken, `missing admin access token for ${filterPage.path} form assertion`);
      const response = await request(buildRouteUrl(baseUrl, basePath, filterPage.path), {
        cookie: `dramatv_admin_access_token=${adminAccessToken}`,
        requestId: requestId(`auth-page-${filterPage.path.replaceAll("/", "-")}-form`),
      });
      return expectHtmlIncludes(response, filterPage.path, filterPage.expectedAction);
    });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  mode,
  baseUrl,
  basePath,
  backendBaseUrl,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  results,
};

const text = JSON.stringify(summary, null, 2);
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${text}\n`, "utf8");
}

console.log(text);
if (summary.failed > 0) {
  process.exitCode = 1;
}
