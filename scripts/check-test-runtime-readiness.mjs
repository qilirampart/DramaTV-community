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

function pushResult(results, name, passed, detail, extra = {}) {
  results.push({ name, passed, detail, ...extra });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requestId(label) {
  return `test-runtime-${label}-${randomUUID()}`;
}

function buildUrl(baseUrl, targetPath) {
  if (!targetPath) {
    return "";
  }

  if (targetPath.startsWith("http://") || targetPath.startsWith("https://")) {
    return targetPath;
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  return `${normalizedBase}${normalizedPath}`;
}

function normalizeMaybeUrl(value, suffix = "") {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (suffix && !trimmed.endsWith(suffix)) {
    return `${trimmed}${suffix}`;
  }

  return trimmed;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Accept: options.accept ?? "application/json, text/html;q=0.9, */*;q=0.8",
      "X-Request-Id": options.requestId ?? requestId("http"),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.authorization ? { Authorization: options.authorization } : {}),
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

async function runCase(results, name, fn) {
  try {
    const detail = await fn();
    pushResult(results, name, true, detail);
  } catch (error) {
    pushResult(results, name, false, error instanceof Error ? error.message : String(error));
  }
}

async function login(apiBaseUrl, username, password) {
  const response = await request(buildUrl(apiBaseUrl, "/api/auth/login"), {
    method: "POST",
    body: {
      loginType: "password",
      username,
      password,
    },
    requestId: requestId("login"),
  });

  assert(response.status >= 200 && response.status < 300, `login expected 2xx but got ${response.status}`);
  assert(response.json?.code === "OK", `login expected code=OK but got ${response.text}`);
  const accessToken = response.json?.data?.accessToken;
  assert(typeof accessToken === "string" && accessToken.length > 0, "login missing accessToken");
  return accessToken;
}

function expectProtectedRedirect(response, routePath) {
  assert([302, 307, 308].includes(response.status), `${routePath} expected redirect but got ${response.status}`);
  const location = response.headers.location ?? "";
  const expected = `/login?redirectTo=${encodeURIComponent(routePath)}`;
  assert(location.includes(expected), `${routePath} expected redirect to ${expected} but got ${location || "<empty>"}`);
  return location;
}

function expectBrandText(response, label) {
  assert(response.status >= 200 && response.status < 300, `${label} expected 2xx but got ${response.status}`);
  assert(/Drama\s*TV|DramaTV/i.test(response.text), `${label} missing DramaTV brand text`);
}

const args = parseArgs(process.argv.slice(2));
const publicBaseUrl = (args["public-base-url"] ?? process.env.DRAMATV_TEST_PUBLIC_BASE_URL ?? "http://8.141.20.130").replace(/\/$/, "");
const apiBaseUrl = (args["api-base-url"] ?? process.env.DRAMATV_TEST_API_BASE_URL ?? publicBaseUrl).replace(/\/$/, "");
const backendHealthUrl = normalizeMaybeUrl(args["backend-health-url"] ?? process.env.DRAMATV_TEST_BACKEND_HEALTH_URL ?? "", "/actuator/health");
const creatorUsername = args["creator-username"] ?? process.env.DRAMATV_TEST_CREATOR_USERNAME ?? "";
const creatorPassword = args["creator-password"] ?? process.env.DRAMATV_TEST_CREATOR_PASSWORD ?? "";
const outputPath = args.output ?? "";
const authChecksEnabled = creatorUsername.trim().length > 0 && creatorPassword.trim().length > 0;
const results = [];

let accessToken = null;

if (backendHealthUrl) {
  await runCase(results, "backend.health", async () => {
    const response = await request(backendHealthUrl, {
      requestId: requestId("backend-health"),
    });
    assert(response.status >= 200 && response.status < 300, `${backendHealthUrl} expected 2xx but got ${response.status}`);
    assert(response.json?.status === "UP", `${backendHealthUrl} expected UP but got ${response.text}`);
    return backendHealthUrl;
  });
}

await runCase(results, "public.frontend.root", async () => {
  const response = await request(buildUrl(publicBaseUrl, "/"), {
    accept: "text/html,application/xhtml+xml",
    requestId: requestId("frontend-root"),
  });
  expectBrandText(response, "/");
  return buildUrl(publicBaseUrl, "/");
});

await runCase(results, "public.frontend.login", async () => {
  const response = await request(buildUrl(publicBaseUrl, "/login"), {
    accept: "text/html,application/xhtml+xml",
    requestId: requestId("frontend-login"),
  });
  expectBrandText(response, "/login");
  return buildUrl(publicBaseUrl, "/login");
});

for (const routePath of ["/home", "/featured", "/discussions", "/me", "/publish"]) {
  await runCase(results, `public.frontend.redirect${routePath.replaceAll("/", ".") || ".root"}`, async () => {
    const response = await request(buildUrl(publicBaseUrl, routePath), {
      accept: "text/html,application/xhtml+xml",
      redirect: "manual",
      requestId: requestId(`redirect-${routePath.replaceAll("/", "-") || "root"}`),
    });
    return expectProtectedRedirect(response, routePath);
  });
}

await runCase(results, "public.api.feed-home", async () => {
  const response = await request(buildUrl(apiBaseUrl, "/api/feed/home"), {
    requestId: requestId("feed-home"),
  });
  assert(response.status >= 200 && response.status < 300, `/api/feed/home expected 2xx but got ${response.status}`);
  assert(response.json?.code === "OK", `/api/feed/home expected code=OK but got ${response.text}`);
  const items = Array.isArray(response.json?.data?.items)
    ? response.json.data.items
    : Array.isArray(response.json?.data?.feedItems)
      ? response.json.data.feedItems
      : [];
  assert(items.length > 0, "/api/feed/home returned no items");
  return `items=${items.length}`;
});

await runCase(results, "public.api.prompts", async () => {
  const response = await request(buildUrl(apiBaseUrl, "/api/prompts?modality=all&limit=1"), {
    requestId: requestId("prompts"),
  });
  assert(response.status >= 200 && response.status < 300, `/api/prompts expected 2xx but got ${response.status}`);
  assert(response.json?.code === "OK", `/api/prompts expected code=OK but got ${response.text}`);
  const items = Array.isArray(response.json?.data)
    ? response.json.data
    : Array.isArray(response.json?.data?.items)
      ? response.json.data.items
      : [];
  assert(items.length > 0, "/api/prompts returned no items");
  return `items=${items.length}`;
});

await runCase(results, "public.api.discussions-home", async () => {
  const response = await request(buildUrl(apiBaseUrl, "/api/discussions/home"), {
    requestId: requestId("discussions-home"),
  });
  assert(response.status >= 200 && response.status < 300, `/api/discussions/home expected 2xx but got ${response.status}`);
  assert(response.json?.code === "OK", `/api/discussions/home expected code=OK but got ${response.text}`);
  assert(Array.isArray(response.json?.data?.featuredThreads), "discussion home missing featuredThreads");
  return `threads=${response.json.data.featuredThreads.length}`;
});

await runCase(results, "public.api.notifications-anonymous", async () => {
  const response = await request(buildUrl(publicBaseUrl, "/api/me/notifications/recent"), {
    requestId: requestId("notifications-anon"),
  });
  assert(response.status >= 200 && response.status < 300, `/api/me/notifications/recent expected 2xx but got ${response.status}`);
  assert(response.json?.code === "OK", `/api/me/notifications/recent expected code=OK but got ${response.text}`);
  assert(Array.isArray(response.json?.data?.items), "anonymous notifications missing items");
  assert(response.json.data.items.length === 0, "anonymous notifications expected empty items");
  return "items=0";
});

if (authChecksEnabled) {
  await runCase(results, "auth.login", async () => {
    accessToken = await login(apiBaseUrl, creatorUsername, creatorPassword);
    return `user=${creatorUsername}`;
  });

  await runCase(results, "auth.me", async () => {
    assert(accessToken, "accessToken unavailable");
    const response = await request(buildUrl(apiBaseUrl, "/api/auth/me"), {
      authorization: `Bearer ${accessToken}`,
      requestId: requestId("auth-me"),
    });
    assert(response.status >= 200 && response.status < 300, `/api/auth/me expected 2xx but got ${response.status}`);
    assert(response.json?.code === "OK", `/api/auth/me expected code=OK but got ${response.text}`);
    assert(typeof response.json?.data?.id === "string" && response.json.data.id.length > 0, "/api/auth/me missing user id");
    return `userId=${response.json.data.id}`;
  });

  await runCase(results, "auth.frontend.home", async () => {
    assert(accessToken, "accessToken unavailable");
    const response = await request(buildUrl(publicBaseUrl, "/home"), {
      accept: "text/html,application/xhtml+xml",
      cookie: `dramatv_access_token=${accessToken}`,
      redirect: "manual",
      requestId: requestId("frontend-home-auth"),
    });
    assert(response.status >= 200 && response.status < 300, `/home expected 2xx for authenticated user but got ${response.status}`);
    return buildUrl(publicBaseUrl, "/home");
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  publicBaseUrl,
  apiBaseUrl,
  backendHealthUrl: backendHealthUrl || null,
  authChecksEnabled,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  results,
};

const outputText = JSON.stringify(summary, null, 2);
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${outputText}\n`, "utf8");
}

console.log(outputText);
if (summary.failed > 0) {
  process.exitCode = 1;
}
