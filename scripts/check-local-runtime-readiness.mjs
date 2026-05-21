import { randomUUID } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
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
  return `runtime-${label}-${randomUUID()}`;
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

async function tcpProbe(host, port, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finalize = (fn, value) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      fn(value);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finalize(resolve, true));
    socket.once("timeout", () => finalize(reject, new Error(`tcp ${host}:${port} timed out after ${timeoutMs}ms`)));
    socket.once("error", (error) => finalize(reject, error));
    socket.connect(port, host);
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

async function login(backendBaseUrl, username, password) {
  const response = await request(`${backendBaseUrl}/api/auth/login`, {
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

const args = parseArgs(process.argv.slice(2));
const scope = args.scope ?? "all";
const checkBackend = scope === "all" || scope === "backend";
const checkFrontend = scope === "all" || scope === "frontend";
const skipAuth = args["skip-auth"] === "true";
const backendBaseUrl = (args["backend-base-url"] ?? "http://127.0.0.1:18080").replace(/\/$/, "");
const frontendBaseUrl = (args["frontend-base-url"] ?? "http://127.0.0.1:3106").replace(/\/$/, "");
const creatorUsername = args["creator-username"] ?? process.env.DRAMATV_SMOKE_CREATOR_USERNAME ?? "creator-a";
const creatorPassword = args["creator-password"] ?? process.env.DRAMATV_SMOKE_CREATOR_PASSWORD ?? "dramatv-local-dev";
const dbHost = args["db-host"] ?? "127.0.0.1";
const dbPort = Number(args["db-port"] ?? 5432);
const redisHost = args["redis-host"] ?? "127.0.0.1";
const redisPort = Number(args["redis-port"] ?? 6379);
const outputPath = args.output ?? "";

const results = [];
let accessToken = null;

if (!["all", "backend", "frontend"].includes(scope)) {
  throw new Error(`unsupported scope: ${scope}`);
}

if (checkBackend) {
  await runCase(results, "backend.health", async () => {
    const response = await request(`${backendBaseUrl}/actuator/health`, {
      requestId: requestId("backend-health"),
    });
    assert(response.status >= 200 && response.status < 300, `/actuator/health expected 2xx but got ${response.status}`);
    assert(response.json?.status === "UP", `/actuator/health expected UP but got ${response.text}`);
    return "backend health is UP";
  });

  await runCase(results, "dependency.postgres.tcp", async () => {
    await tcpProbe(dbHost, dbPort);
    return `${dbHost}:${dbPort}`;
  });

  await runCase(results, "dependency.redis.tcp", async () => {
    await tcpProbe(redisHost, redisPort);
    return `${redisHost}:${redisPort}`;
  });

  await runCase(results, "backend.feed-home", async () => {
    const response = await request(`${backendBaseUrl}/api/feed/home`, {
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

  await runCase(results, "backend.prompts", async () => {
    const response = await request(`${backendBaseUrl}/api/prompts?modality=all&limit=1`, {
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

  await runCase(results, "backend.discussions-home", async () => {
    const response = await request(`${backendBaseUrl}/api/discussions/home`, {
      requestId: requestId("discussions-home"),
    });
    assert(
      response.status >= 200 && response.status < 300,
      `/api/discussions/home expected 2xx but got ${response.status}`,
    );
    assert(response.json?.code === "OK", `/api/discussions/home expected code=OK but got ${response.text}`);
    assert(Array.isArray(response.json?.data?.featuredThreads), "discussion home missing featuredThreads");
    return `threads=${response.json.data.featuredThreads.length}`;
  });
}

if (!skipAuth && (checkBackend || checkFrontend)) {
  await runCase(results, "auth.login", async () => {
    accessToken = await login(backendBaseUrl, creatorUsername, creatorPassword);
    return `user=${creatorUsername}`;
  });

  await runCase(results, "auth.me", async () => {
    assert(accessToken, "accessToken unavailable");
    const response = await request(`${backendBaseUrl}/api/auth/me`, {
      authorization: `Bearer ${accessToken}`,
      requestId: requestId("auth-me"),
    });
    assert(response.status >= 200 && response.status < 300, `/api/auth/me expected 2xx but got ${response.status}`);
    assert(response.json?.code === "OK", `/api/auth/me expected code=OK but got ${response.text}`);
    assert(typeof response.json?.data?.id === "string", "/api/auth/me missing user id");
    return `userId=${response.json.data.id}`;
  });

  if (checkBackend) {
    await runCase(results, "auth.me-hub", async () => {
      assert(accessToken, "accessToken unavailable");
      const response = await request(`${backendBaseUrl}/api/me/hub`, {
        authorization: `Bearer ${accessToken}`,
        requestId: requestId("me-hub"),
      });
      assert(response.status >= 200 && response.status < 300, `/api/me/hub expected 2xx but got ${response.status}`);
      assert(response.json?.code === "OK", `/api/me/hub expected code=OK but got ${response.text}`);
      assert(typeof response.json?.data?.profile?.id === "string", "/api/me/hub missing profile id");
      return `profileId=${response.json.data.profile.id}`;
    });
  }
}

if (checkFrontend) {
  await runCase(results, "frontend.root", async () => {
    const response = await request(`${frontendBaseUrl}/`, {
      accept: "text/html,application/xhtml+xml",
      requestId: requestId("frontend-root"),
    });
    assert(response.status >= 200 && response.status < 300, `/ expected 2xx but got ${response.status}`);
    assert(response.text.includes("Drama TV"), "frontend root missing brand text");
    return `${frontendBaseUrl}/`;
  });

  await runCase(results, "frontend.redirect.home", async () => {
    const response = await request(`${frontendBaseUrl}/home`, {
      accept: "text/html,application/xhtml+xml",
      redirect: "manual",
      requestId: requestId("frontend-home"),
    });
    assert([302, 307, 308].includes(response.status), `/home expected redirect but got ${response.status}`);
    const location = response.headers.location ?? "";
    assert(
      location.includes("/login?redirectTo=%2Fhome"),
      `/home expected redirectTo=/home but got ${location || "no location header"}`,
    );
    return location;
  });

  if (!skipAuth) {
    await runCase(results, "frontend.auth.me-page", async () => {
      assert(accessToken, "accessToken unavailable");
      const response = await request(`${frontendBaseUrl}/me`, {
        accept: "text/html,application/xhtml+xml",
        cookie: `dramatv_access_token=${accessToken}`,
        requestId: requestId("frontend-me"),
        redirect: "manual",
      });
      assert(response.status >= 200 && response.status < 300, `/me expected 2xx but got ${response.status}`);
      return `${frontendBaseUrl}/me`;
    });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  scope,
  backendBaseUrl,
  frontendBaseUrl,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  results,
};

const outputText = JSON.stringify(summary, null, 2);
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, outputText, "utf8");
}

console.log(outputText);
if (summary.failed > 0) {
  process.exitCode = 1;
}
