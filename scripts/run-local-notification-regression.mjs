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
  return `notification-regression-${label}-${randomUUID()}`;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      "X-Request-Id": options.requestId ?? requestId("http"),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.authorization ? { Authorization: options.authorization } : {})
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
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
    text,
    json
  };
}

async function expectOkJson(url, options = {}) {
  const response = await requestJson(url, options);
  assert(response.status >= 200 && response.status < 300, `${url} expected 2xx but got ${response.status}: ${response.text}`);
  assert(response.json?.code === "OK", `${url} expected code=OK but got ${response.text}`);
  return response.json;
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

  const accessToken = response.data?.accessToken;
  assert(typeof accessToken === "string" && accessToken.length > 0, `login missing accessToken for ${username}`);
  return accessToken;
}

const args = parseArgs(process.argv.slice(2));
const frontendBaseUrl = (args["frontend-base-url"] ?? process.env.DRAMATV_FRONTEND_BASE_URL ?? "http://127.0.0.1:3106").replace(/\/$/, "");
const backendBaseUrl = (args["backend-base-url"] ?? process.env.DRAMATV_BACKEND_BASE_URL ?? "http://127.0.0.1:18080").replace(/\/$/, "");
const creatorUsername = args["creator-username"] ?? process.env.DRAMATV_SMOKE_CREATOR_USERNAME ?? "creator-a";
const creatorPassword = args["creator-password"] ?? process.env.DRAMATV_SMOKE_CREATOR_PASSWORD ?? "dramatv-local-dev";
const outputPath = args.output ?? "";

const results = [];

async function main() {
  let creatorToken = null;
  let creatorNotifications = [];

  await runCase(results, "anon.notifications-empty", async () => {
    const response = await expectOkJson(`${frontendBaseUrl}/api/me/notifications/recent`, {
      requestId: requestId("anon-notifications")
    });
    assert(Array.isArray(response.data?.items), "anonymous notifications missing items array");
    assert(response.data.items.length === 0, `anonymous notifications expected empty items but got ${response.data.items.length}`);
    return "items=0";
  });

  await runCase(results, "auth.creator-login", async () => {
    creatorToken = await login(backendBaseUrl, creatorUsername, creatorPassword);
    return `token=${creatorToken.slice(0, 12)}...`;
  });

  await runCase(results, "auth.notifications-shape", async () => {
    assert(creatorToken, "creator token unavailable");
    const response = await expectOkJson(`${backendBaseUrl}/api/me/notifications/recent`, {
      authorization: `Bearer ${creatorToken}`,
      requestId: requestId("auth-notifications")
    });

    const items = response.data?.items;
    assert(Array.isArray(items), "authenticated notifications missing items array");
    creatorNotifications = items;

    for (const item of items) {
      assert(typeof item.id === "string" && item.id.length > 0, "notification item missing id");
      assert(typeof item.actionType === "string" && item.actionType.length > 0, "notification item missing actionType");
      assert(typeof item.actedAt === "string" && item.actedAt.length > 0, "notification item missing actedAt");
      assert(typeof item.target?.href === "string" && item.target.href.length > 0, "notification item missing target href");

      if (item.actionType === "comment" || item.actionType === "reply") {
        assert(typeof item.commentId === "string" && item.commentId.length > 0, `${item.actionType} notification missing commentId`);
        assert(
          item.target.href.includes(`#comment-${item.commentId}`) === false,
          "backend target href should stay anchor-free; anchor is a frontend concern"
        );
      } else {
        assert(item.commentId == null, `${item.actionType} notification should not include commentId`);
      }
    }

    return `items=${items.length}`;
  });

  await runCase(results, "auth.comment-anchor-contract", async () => {
    assert(Array.isArray(creatorNotifications), "creator notifications unavailable");
    const commentLikeNotification = creatorNotifications.find(
      (item) => item.actionType === "comment" || item.actionType === "reply"
    );
    assert(commentLikeNotification, "no comment/reply notification found in current creator notification set");

    const expectedAnchor = `#comment-${commentLikeNotification.commentId}`;
    assert(
      typeof commentLikeNotification.target?.href === "string" && commentLikeNotification.target.href.startsWith("/"),
      "comment/reply notification target href should be a site-local path"
    );
    return `href=${commentLikeNotification.target.href}, expectedAnchor=${expectedAnchor}`;
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    frontendBaseUrl,
    backendBaseUrl,
    creatorUsername,
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
