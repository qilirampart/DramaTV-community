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
  return `public-upload-${label}-${randomUUID()}`;
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

async function createVideoPolicy(baseUrl, accessToken, fileName, sizeBytes) {
  const { response, json } = await requestJson(buildUrl(baseUrl, "/api/uploads/video-policy"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Cookie: `dramatv_access_token=${accessToken}`,
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

async function uploadBinary(baseUrl, accessToken, uploadUrl, filePath) {
  const stat = fs.statSync(filePath);
  const { response, json } = await requestJson(buildUrl(baseUrl, uploadUrl), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Cookie: `dramatv_access_token=${accessToken}`,
      "Content-Type": "video/mp4",
      "Content-Length": String(stat.size),
      "X-Request-Id": requestId("upload")
    },
    body: fs.createReadStream(filePath),
    duplex: "half"
  });

  if (!response.ok || json?.code !== "OK" || typeof json?.data?.assetId !== "string") {
    throw new Error(`upload binary failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json.data;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = (args["base-url"] ?? process.env.DRAMATV_PUBLIC_BASE_URL ?? "http://8.141.20.130").replace(/\/$/, "");
  const username = args.username ?? process.env.DRAMATV_SMOKE_CREATOR_USERNAME ?? "creator-a";
  const password = args.password ?? process.env.DRAMATV_SMOKE_CREATOR_PASSWORD ?? "dramatv-local-dev";
  const filePath = args.file ?? "";
  const fixedAssetId = args["asset-id"]?.trim() ?? "";
  const outputPath = args.output ?? "";

  if (!filePath) {
    throw new Error("--file is required");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`file not found: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  const accessToken = await login(baseUrl, username, password);
  const policy = fixedAssetId
    ? {
        assetId: fixedAssetId,
        uploadUrl: `/api/uploads/assets/${encodeURIComponent(fixedAssetId)}/binary`
      }
    : await createVideoPolicy(baseUrl, accessToken, path.basename(filePath), stat.size);
  const uploaded = await uploadBinary(baseUrl, accessToken, policy.uploadUrl, filePath);

  const summary = {
    baseUrl,
    username,
    filePath,
    localSizeBytes: stat.size,
    assetId: policy.assetId,
    reusedAssetId: fixedAssetId || null,
    uploadUrl: policy.uploadUrl,
    uploaded
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
