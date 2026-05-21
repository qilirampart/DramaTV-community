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
  return `web-smoke-${label}-${randomUUID()}`;
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
      ...options.headers,
    },
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

function expectLoginRedirect(response, routePath) {
  assert([302, 307, 308].includes(response.status), `${routePath} expected redirect but got ${response.status}`);
  const location = response.headers.location ?? "";
  const expected = `/login?redirectTo=${encodeURIComponent(routePath)}`;
  assert(location.includes(expected), `${routePath} expected redirect to ${expected} but got ${location || "<empty>"}`);
  return location;
}

const args = parseArgs(process.argv.slice(2));
const baseUrl = (args["base-url"] ?? process.env.DRAMATV_WEB_BASE_URL ?? "http://127.0.0.1:3106").replace(/\/$/, "");
const outputPath = args.output ?? "";
const results = [];

await runCase(results, "root.page", async () => {
  const response = await request(`${baseUrl}/`, {
    requestId: requestId("root"),
  });
  assert(response.status === 200, `/ expected 200 but got ${response.status}`);
  assert(/Drama\s*TV|DramaTV/i.test(response.text), `/ missing DramaTV brand text`);
  return `${baseUrl}/`;
});

await runCase(results, "login.page", async () => {
  const response = await request(`${baseUrl}/login`, {
    requestId: requestId("login"),
  });
  assert(response.status === 200, `/login expected 200 but got ${response.status}`);
  assert(/Drama\s*TV|DramaTV/i.test(response.text), `/login missing DramaTV brand text`);
  return `${baseUrl}/login`;
});

for (const routePath of ["/home", "/featured", "/discussions", "/me", "/publish"]) {
  await runCase(results, `guard${routePath.replaceAll("/", ".") || ".root"}`, async () => {
    const response = await request(`${baseUrl}${routePath}`, {
      redirect: "manual",
      requestId: requestId(`guard-${routePath.replaceAll("/", "-") || "root"}`),
    });
    return expectLoginRedirect(response, routePath);
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl,
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
