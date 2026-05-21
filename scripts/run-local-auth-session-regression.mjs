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

function requestId(label) {
  return `auth-regression-${label}-${randomUUID()}`;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function pushResult(results, name, passed, detail) {
  results.push({
    name,
    passed,
    detail
  });
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
      Accept: options.accept ?? "application/json, text/html;q=0.9, */*;q=0.8",
      "X-Request-Id": options.requestId ?? requestId("http"),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.authorization ? { Authorization: options.authorization } : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...options.headers
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    redirect: options.redirect ?? "follow"
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
    json
  };
}

async function expectOkJson(url, options = {}) {
  const response = await request(url, options);
  assert(response.status >= 200 && response.status < 300, `${url} expected 2xx but got ${response.status}`);
  assert(response.json?.code === "OK", `${url} expected code=OK but got ${response.text}`);
  return response;
}

async function login(backendBaseUrl, username, password) {
  const response = await expectOkJson(`${backendBaseUrl}/api/auth/login`, {
    method: "POST",
    requestId: requestId("login"),
    body: {
      loginType: "password",
      username,
      password
    }
  });

  const accessToken = response.json?.data?.accessToken;
  assert(typeof accessToken === "string" && accessToken.length > 0, `login missing accessToken for ${username}`);
  return accessToken;
}

async function getSession(backendBaseUrl, accessToken) {
  const response = await expectOkJson(`${backendBaseUrl}/api/auth/me`, {
    authorization: `Bearer ${accessToken}`,
    requestId: requestId("auth-me")
  });

  return response.json.data;
}

function communityCookie(accessToken) {
  return `dramatv_access_token=${accessToken}`;
}

function buildFrontendUrl(baseUrl, routePath) {
  return `${baseUrl.replace(/\/$/, "")}${routePath}`;
}

function expectRedirectToLogin(response, routePath) {
  assert([307, 308].includes(response.status), `${routePath} expected redirect but got ${response.status}`);
  const location = response.headers.location ?? "";
  const expected = `/login?redirectTo=${encodeURIComponent(routePath)}`;
  assert(location.endsWith(expected), `${routePath} expected location to end with ${expected} but got ${location}`);
}

function expectCookieCleared(response) {
  const setCookie = response.headers["set-cookie"] ?? "";
  assert(
    setCookie.includes("dramatv_access_token=") && (setCookie.includes("Max-Age=0") || setCookie.toLowerCase().includes("expires=")),
    `expected stale cookie to be cleared but got set-cookie=${setCookie || "<empty>"}`
  );
}

function expectHtmlContains(response, expectedText, label) {
  assert(response.status === 200, `${label} expected 200 but got ${response.status}`);
  assert(response.text.includes(expectedText), `${label} expected html to contain "${expectedText}"`);
}

const args = parseArgs(process.argv.slice(2));
const frontendBaseUrl = (args["frontend-base-url"] ?? process.env.DRAMATV_FRONTEND_BASE_URL ?? "http://127.0.0.1:3106").replace(/\/$/, "");
const backendBaseUrl = (args["backend-base-url"] ?? process.env.DRAMATV_BACKEND_BASE_URL ?? "http://127.0.0.1:18080").replace(/\/$/, "");
const defaultPassword = args.password ?? process.env.DRAMATV_SMOKE_CREATOR_PASSWORD ?? "dramatv-local-dev";
const alphaUsername = args["alpha-username"] ?? process.env.DRAMATV_AUTH_ALPHA_USERNAME ?? "qa-auth-alpha";
const betaUsername = args["beta-username"] ?? process.env.DRAMATV_AUTH_BETA_USERNAME ?? "qa-auth-beta";
const outputPath = args.output ?? "";

const results = [];

async function main() {
  let alphaToken = null;
  let alphaSession = null;
  let betaToken = null;
  let betaSession = null;

  await runCase(results, "env.backend-health", async () => {
    const response = await request(`${backendBaseUrl}/actuator/health`, {
      requestId: requestId("health")
    });
    assert(response.status >= 200 && response.status < 300, `/actuator/health expected 2xx but got ${response.status}`);
    assert(response.json?.status === "UP", `backend health expected UP but got ${response.text}`);
    return "backend health is UP";
  });

  await runCase(results, "anon.protected-route-redirects", async () => {
    const protectedPaths = ["/me", "/publish", "/discussions/new"];

    for (const routePath of protectedPaths) {
      const response = await request(buildFrontendUrl(frontendBaseUrl, routePath), {
        redirect: "manual",
        requestId: requestId("anon-page")
      });
      expectRedirectToLogin(response, routePath);
    }

    return protectedPaths.join(", ");
  });

  await runCase(results, "anon.notification-proxy-degrades-empty", async () => {
    const response = await expectOkJson(buildFrontendUrl(frontendBaseUrl, "/api/me/notifications/recent"), {
      requestId: requestId("anon-notifications")
    });
    assert(Array.isArray(response.json?.data?.items), "anonymous notifications missing items");
    assert(response.json.data.items.length === 0, "anonymous notifications expected empty items");
    return "items=0";
  });

  await runCase(results, "anon.upload-policy-blocked", async () => {
    const response = await request(buildFrontendUrl(frontendBaseUrl, "/api/uploads/image-policy"), {
      method: "POST",
      requestId: requestId("anon-upload"),
      body: {
        fileName: "anon-test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 128,
        assetRole: "attachment"
      }
    });

    assert([401, 403].includes(response.status), `anonymous upload expected 401/403 but got ${response.status}`);
    assert(
      response.json?.code === "AUTH_REQUIRED" || response.json?.code === "FORBIDDEN",
      `anonymous upload expected AUTH_REQUIRED/FORBIDDEN but got ${response.text}`
    );
    assert(typeof response.headers["x-request-id"] === "string" && response.headers["x-request-id"].trim(), "anonymous upload missing X-Request-Id header");
    return `status=${response.status}`;
  });

  await runCase(results, "auth.login-alpha", async () => {
    alphaToken = await login(backendBaseUrl, alphaUsername, defaultPassword);
    alphaSession = await getSession(backendBaseUrl, alphaToken);
    assert(alphaSession.username === alphaUsername, `alpha username mismatch: ${alphaSession.username}`);
    return `userId=${alphaSession.id}`;
  });

  await runCase(results, "auth.login-beta", async () => {
    betaToken = await login(backendBaseUrl, betaUsername, defaultPassword);
    betaSession = await getSession(backendBaseUrl, betaToken);
    assert(betaSession.username === betaUsername, `beta username mismatch: ${betaSession.username}`);
    return `userId=${betaSession.id}`;
  });

  await runCase(results, "auth.multi-account-backend-isolation", async () => {
    assert(alphaSession && betaSession, "alpha/beta sessions unavailable");
    assert(alphaSession.id !== betaSession.id, "alpha and beta user ids should differ");
    assert(alphaSession.username !== betaSession.username, "alpha and beta usernames should differ");
    return `${alphaSession.username} != ${betaSession.username}`;
  });

  await runCase(results, "auth.multi-account-frontend-isolation", async () => {
    assert(alphaToken && betaToken && alphaSession && betaSession, "alpha/beta state unavailable");

    const alphaPage = await request(buildFrontendUrl(frontendBaseUrl, "/me"), {
      cookie: communityCookie(alphaToken),
      requestId: requestId("alpha-me-page")
    });
    const betaPage = await request(buildFrontendUrl(frontendBaseUrl, "/me"), {
      cookie: communityCookie(betaToken),
      requestId: requestId("beta-me-page")
    });

    expectHtmlContains(alphaPage, alphaSession.displayName, "alpha /me");
    expectHtmlContains(betaPage, betaSession.displayName, "beta /me");
    assert(!alphaPage.text.includes(betaSession.displayName), "alpha /me unexpectedly contains beta display name");
    assert(!betaPage.text.includes(alphaSession.displayName), "beta /me unexpectedly contains alpha display name");
    return `${alphaSession.displayName} | ${betaSession.displayName}`;
  });

  await runCase(results, "auth.valid-cookie-allows-community-routes", async () => {
    assert(alphaToken && alphaSession, "alpha state unavailable");
    const cookie = communityCookie(alphaToken);
    const routes = ["/me", "/publish", "/discussions/new"];

    for (const routePath of routes) {
      const response = await request(buildFrontendUrl(frontendBaseUrl, routePath), {
        cookie,
        requestId: requestId("auth-page")
      });
      assert(response.status === 200, `${routePath} expected 200 but got ${response.status}`);
    }

    const mePage = await request(buildFrontendUrl(frontendBaseUrl, "/me"), {
      cookie,
      requestId: requestId("auth-me-html")
    });
    expectHtmlContains(mePage, alphaSession.displayName, "authenticated /me");
    return routes.join(", ");
  });

  await runCase(results, "auth.valid-cookie-allows-proxy-routes", async () => {
    assert(alphaToken, "alpha token unavailable");
    const cookie = communityCookie(alphaToken);

    const notifications = await expectOkJson(buildFrontendUrl(frontendBaseUrl, "/api/me/notifications/recent"), {
      cookie,
      requestId: requestId("auth-notifications")
    });
    assert(Array.isArray(notifications.json?.data?.items), "authenticated notifications missing items");

    const imagePolicy = await expectOkJson(buildFrontendUrl(frontendBaseUrl, "/api/uploads/image-policy"), {
      method: "POST",
      cookie,
      requestId: requestId("auth-upload"),
      body: {
        fileName: "auth-test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 128,
        assetRole: "attachment"
      }
    });

    assert(typeof imagePolicy.json?.data?.assetId === "string" && imagePolicy.json.data.assetId.length > 0, "image policy missing assetId");
    assert(typeof imagePolicy.headers["x-request-id"] === "string" && imagePolicy.headers["x-request-id"].trim(), "image policy missing X-Request-Id header");
    return `notifications=${notifications.json.data.items.length}, assetId=${imagePolicy.json.data.assetId}`;
  });

  await runCase(results, "auth.invalid-cookie-redirect-clears-session", async () => {
    const response = await request(buildFrontendUrl(frontendBaseUrl, "/me"), {
      cookie: communityCookie("invalid-token-value"),
      requestId: requestId("invalid-cookie"),
      redirect: "manual"
    });

    expectRedirectToLogin(response, "/me");
    expectCookieCleared(response);
    return "redirected and cookie cleared";
  });

  await runCase(results, "auth.logout-invalidates-stale-cookie", async () => {
    assert(alphaToken, "alpha token unavailable");
    const cookie = communityCookie(alphaToken);

    const before = await request(buildFrontendUrl(frontendBaseUrl, "/me"), {
      cookie,
      requestId: requestId("logout-before")
    });
    assert(before.status === 200, `pre-logout /me expected 200 but got ${before.status}`);

    const logoutResponse = await expectOkJson(`${backendBaseUrl}/api/auth/logout`, {
      method: "POST",
      authorization: `Bearer ${alphaToken}`,
      requestId: requestId("logout"),
      body: {}
    });
    assert(logoutResponse.json?.data?.status === "signed_out", `logout status mismatch: ${logoutResponse.text}`);

    const stalePage = await request(buildFrontendUrl(frontendBaseUrl, "/me"), {
      cookie,
      requestId: requestId("logout-after-page"),
      redirect: "manual"
    });
    expectRedirectToLogin(stalePage, "/me");
    expectCookieCleared(stalePage);

    const staleUpload = await request(buildFrontendUrl(frontendBaseUrl, "/api/uploads/image-policy"), {
      method: "POST",
      cookie,
      requestId: requestId("logout-after-upload"),
      body: {
        fileName: "stale-test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 128,
        assetRole: "attachment"
      }
    });
    assert([401, 403].includes(staleUpload.status), `stale upload expected 401/403 but got ${staleUpload.status}`);

    return `stalePage=${stalePage.status}, staleUpload=${staleUpload.status}`;
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    frontendBaseUrl,
    backendBaseUrl,
    passed: results.filter((item) => item.passed).length,
    failed: results.filter((item) => !item.passed).length,
    results
  };

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

await main();
