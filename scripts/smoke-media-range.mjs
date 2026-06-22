import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const COMMUNITY_ACCESS_TOKEN_COOKIE = "dramatv_access_token";

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
  return `media-range-${label}-${randomUUID()}`;
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

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { rawText: text };
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const json = await readJson(response);
  return { response, json };
}

async function login(baseUrl, username, password) {
  const { response, json } = await requestJson(buildUrl(baseUrl, "/api/auth/login"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Request-Id": requestId("login")
    },
    body: JSON.stringify({
      loginType: "password",
      username,
      password
    })
  });

  if (!response.ok || json?.code !== "OK" || typeof json?.data?.accessToken !== "string") {
    throw new Error(`login failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json.data.accessToken;
}

async function createVideoPolicy(baseUrl, token, fileName, sizeBytes) {
  const { response, json } = await requestJson(buildUrl(baseUrl, "/api/uploads/video-policy"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: `${COMMUNITY_ACCESS_TOKEN_COOKIE}=${token}`,
      "X-Request-Id": requestId("policy")
    },
    body: JSON.stringify({
      fileName,
      mimeType: "video/mp4",
      sizeBytes,
      assetRole: "source"
    })
  });

  if (!response.ok || json?.code !== "OK" || typeof json?.data?.assetId !== "string") {
    throw new Error(`create video policy failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json.data;
}

async function uploadBinary(baseUrl, token, uploadUrl, bytes) {
  const { response, json } = await requestJson(buildUrl(baseUrl, uploadUrl), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: `${COMMUNITY_ACCESS_TOKEN_COOKIE}=${token}`,
      "Content-Type": "video/mp4",
      "X-Request-Id": requestId("upload")
    },
    body: bytes
  });

  if (!response.ok || json?.code !== "OK" || typeof json?.data?.assetId !== "string") {
    throw new Error(`upload binary failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json.data;
}

async function requestRange(url, rangeHeader) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Range: rangeHeader
    }
  });

  const body = Buffer.from(await response.arrayBuffer());
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    bodyLength: body.length
  };
}

async function requestHead(url) {
  const response = await fetch(url, { method: "HEAD" });
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries())
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const backendBaseUrl = args["backend-base-url"] ?? process.env.DRAMATV_BACKEND_BASE_URL ?? "http://community.8.141.20.130.nip.io";
  const username = args.username ?? process.env.DRAMATV_SMOKE_CREATOR_USERNAME ?? "creator-a";
  const password = args.password ?? process.env.DRAMATV_SMOKE_CREATOR_PASSWORD ?? "dramatv-local-dev";
  const outputPath = args.output ?? "";
  const nowLabel = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const fileName = `range-smoke-${nowLabel}.mp4`;
  const bytes = Buffer.alloc(1024, 7);

  const token = await login(backendBaseUrl, username, password);
  const policy = await createVideoPolicy(backendBaseUrl, token, fileName, bytes.length);
  const uploaded = await uploadBinary(backendBaseUrl, token, policy.uploadUrl, bytes);
  const mediaUrl = buildUrl(backendBaseUrl, uploaded.mediaPath);

  const head = await requestHead(mediaUrl);
  const range = await requestRange(mediaUrl, "bytes=0-63");

  const summary = {
    backendBaseUrl,
    username,
    assetId: uploaded.assetId,
    mediaPath: uploaded.mediaPath,
    mediaUrl,
    head,
    range
  };

  const text = JSON.stringify(summary, null, 2);
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, text, "utf8");
  }

  console.log(text);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
