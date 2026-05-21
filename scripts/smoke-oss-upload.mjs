import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ONE_BY_ONE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2pQ2cAAAAASUVORK5CYII=";
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
  return `oss-smoke-${label}-${randomUUID()}`;
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
  const url = buildUrl(baseUrl, "/api/auth/login");
  const { response, json } = await requestJson(url, {
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

async function createImagePolicy(baseUrl, token, fileName, sizeBytes) {
  const url = buildUrl(baseUrl, "/api/uploads/image-policy");
  const { response, json } = await requestJson(url, {
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
      mimeType: "image/png",
      sizeBytes,
      assetRole: "attachment"
    })
  });

  if (!response.ok || json?.code !== "OK" || typeof json?.data?.assetId !== "string") {
    throw new Error(`create image policy failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json.data;
}

async function uploadBinary(baseUrl, token, uploadUrl, bytes) {
  const url = buildUrl(baseUrl, uploadUrl);
  const { response, json } = await requestJson(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: `${COMMUNITY_ACCESS_TOKEN_COOKIE}=${token}`,
      "Content-Type": "image/png",
      "X-Request-Id": requestId("upload")
    },
    body: bytes
  });

  if (!response.ok || json?.code !== "OK" || typeof json?.data?.assetId !== "string") {
    throw new Error(`upload binary failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json.data;
}

async function probeUrl(url, method = "HEAD", timeoutMs = 5000) {
  if (!url) {
    return {
      attempted: false,
      ok: false,
      status: null,
      error: "empty url"
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      finalUrl: response.url
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const backendBaseUrl = args["backend-base-url"] ?? process.env.DRAMATV_BACKEND_BASE_URL ?? "http://8.141.20.130";
  const username = args.username ?? process.env.DRAMATV_SMOKE_CREATOR_USERNAME ?? "creator-a";
  const password = args.password ?? process.env.DRAMATV_SMOKE_CREATOR_PASSWORD ?? "dramatv-local-dev";
  const outputPath = args.output ?? "";
  const nowLabel = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const fileName = `oss-smoke-${nowLabel}.png`;
  const bytes = Buffer.from(ONE_BY_ONE_PNG_BASE64, "base64");

  const token = await login(backendBaseUrl, username, password);
  const policy = await createImagePolicy(backendBaseUrl, token, fileName, bytes.length);
  const uploaded = await uploadBinary(backendBaseUrl, token, policy.uploadUrl, bytes);

  const absoluteMediaPath =
    typeof uploaded.mediaPath === "string" && uploaded.mediaPath.length > 0
      ? buildUrl(backendBaseUrl, uploaded.mediaPath)
      : "";
  const publicUrl = typeof uploaded.publicUrl === "string" ? uploaded.publicUrl : "";
  const absolutePublicUrl = publicUrl ? buildUrl(backendBaseUrl, publicUrl) : "";

  const summary = {
    backendBaseUrl,
    username,
    assetId: uploaded.assetId,
    assetKind: uploaded.assetKind,
    assetRole: uploaded.assetRole,
    statusCode: uploaded.statusCode,
    mediaPath: uploaded.mediaPath ?? null,
    mediaPathAbsoluteUrl: absoluteMediaPath || null,
    publicUrl: publicUrl || null,
    publicUrlAbsoluteUrl: absolutePublicUrl || null,
    returnedSizeBytes: uploaded.sizeBytes ?? null,
    probes: {
      mediaPath: absoluteMediaPath ? await probeUrl(absoluteMediaPath) : null,
      publicUrl: absolutePublicUrl ? await probeUrl(absolutePublicUrl) : null
    }
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
