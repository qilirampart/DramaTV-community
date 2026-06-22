const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = process.cwd();
const inputPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.resolve(root, "youmind-video-assets", "youmind-seedance-extracted", "seedance-items.all.json");
const outputDir = process.argv[3]
  ? path.resolve(root, process.argv[3])
  : path.join(path.dirname(inputPath), "videos");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";
const YOUMIND_PARENT_ORIGIN = "https://youmind.com";

function isDownloadableUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

function safeText(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Buffer.isBuffer(value)) {
    return value.toString("utf8").trim();
  }

  return "";
}

function buildHeaders(url) {
  const headers = {
    "user-agent": USER_AGENT,
    accept: "*/*",
    referer: "https://x.com/",
    origin: "https://x.com"
  };

  if (url.includes("video.twimg.com")) {
    headers["sec-fetch-site"] = "cross-site";
    headers["sec-fetch-mode"] = "cors";
    headers["sec-fetch-dest"] = "video";
  }

  return headers;
}

function downloadHttpFile(url, targetPath) {
  const headers = buildHeaders(url);
  const args = ["-L", "--fail", "--max-time", "180", "-A", USER_AGENT];

  for (const [key, value] of Object.entries(headers)) {
    args.push("-H", `${key}: ${value}`);
  }

  args.push("-o", targetPath, url);

  try {
    execFileSync("curl.exe", args, {
      stdio: "pipe",
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (error) {
    const stderr = safeText(error.stderr);
    const stdout = safeText(error.stdout);
    throw new Error(stderr || stdout || `curl.exe failed for ${url}`);
  }

  return fs.statSync(targetPath).size;
}

function deriveCloudflareManifestUrl(item) {
  if (typeof item.streamId !== "string" || !item.streamId || item.streamId === "$undefined") {
    return "";
  }

  const thumbnail = typeof item.thumbnail === "string" ? item.thumbnail : "";
  const match = thumbnail.match(/^https:\/\/([^/]+\.cloudflarestream\.com)\//i);

  if (!match) {
    return "";
  }

  return `https://${match[1]}/${item.streamId}/manifest/video.mpd?parentOrigin=${encodeURIComponent(
    YOUMIND_PARENT_ORIGIN
  )}`;
}

function downloadCloudflareManifest(manifestUrl, targetPath) {
  const args = [
    "-y",
    "-user_agent",
    USER_AGENT,
    "-headers",
    `Referer: ${YOUMIND_PARENT_ORIGIN}\r\nOrigin: ${YOUMIND_PARENT_ORIGIN}\r\n`,
    "-i",
    manifestUrl,
    "-c",
    "copy",
    targetPath
  ];

  try {
    execFileSync("ffmpeg", args, {
      stdio: "pipe",
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (error) {
    const stderr = safeText(error.stderr);
    const stdout = safeText(error.stdout);
    throw new Error(stderr || stdout || `ffmpeg failed for ${manifestUrl}`);
  }

  return fs.statSync(targetPath).size;
}

function removeFileIfExists(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
}

function buildDownloadAttempts(item) {
  const attempts = [];
  const pushAttempt = (mode, url) => {
    if (!isDownloadableUrl(url)) {
      return;
    }

    if (attempts.some((attempt) => attempt.url === url)) {
      return;
    }

    attempts.push({ mode, url });
  };

  pushAttempt("importedVideoUrl", item.importedVideoUrl);
  pushAttempt("sourceUrl", item.sourceUrl);

  const manifestUrl = deriveCloudflareManifestUrl(item);
  if (manifestUrl) {
    attempts.push({ mode: "cloudflareManifest", url: manifestUrl });
  }

  return attempts;
}

function buildStableFileStem(item) {
  const rank = String(item.rank).padStart(2, "0");
  const streamId = safeText(item.streamId);

  if (streamId) {
    return `${rank}-${streamId}`;
  }

  const promptId = Number.isInteger(item.id) ? String(item.id) : "unknown";
  const slug = safeText(item.slug) ? safeText(item.slug).replace(/[^a-zA-Z0-9._-]+/g, "-") : "no-slug";
  return `${rank}-id${promptId}-${slug}`;
}

function downloadBestAvailableFile(item, targetPath) {
  const attempts = buildDownloadAttempts(item);
  const errors = [];

  if (attempts.length === 0) {
    throw new Error("no downloadable source available");
  }

  const primaryUrl = isDownloadableUrl(item.importedVideoUrl)
    ? item.importedVideoUrl
    : isDownloadableUrl(item.sourceUrl)
      ? item.sourceUrl
      : "";

  if (primaryUrl) {
    removeFileIfExists(targetPath);

    try {
      return {
        size: downloadHttpFile(primaryUrl, targetPath),
        mode: primaryUrl === item.importedVideoUrl ? "importedVideoUrl" : "sourceUrl",
        url: primaryUrl
      };
    } catch (error) {
      const mode = primaryUrl === item.importedVideoUrl ? "importedVideoUrl" : "sourceUrl";
      errors.push(`${mode}: ${error.message}`);
    }
  }

  const manifestUrl = deriveCloudflareManifestUrl(item);
  if (manifestUrl) {
    removeFileIfExists(targetPath);

    try {
      return {
        size: downloadCloudflareManifest(manifestUrl, targetPath),
        mode: "cloudflareManifest",
        url: manifestUrl
      };
    } catch (error) {
      errors.push(`cloudflareManifest: ${error.message}`);
    }
  }

  for (const attempt of attempts) {
    if (attempt.url === primaryUrl || attempt.mode === "cloudflareManifest") {
      continue;
    }

    removeFileIfExists(targetPath);

    try {
      return {
        size: downloadHttpFile(attempt.url, targetPath),
        mode: attempt.mode,
        url: attempt.url
      };
    } catch (error) {
      errors.push(`${attempt.mode}: ${error.message}`);
    }
  }

  throw new Error(errors.join(" | "));
}

async function main() {
  const items = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  fs.mkdirSync(outputDir, { recursive: true });

  const selectedItems = items.filter((item) => buildDownloadAttempts(item).length > 0);
  const results = [];
  const skippedInvalid = items
    .filter((item) => buildDownloadAttempts(item).length === 0)
    .map((item) => ({
      rank: item.rank,
      id: item.id,
      streamId: item.streamId,
      importedVideoUrl: item.importedVideoUrl,
      skipped: true,
      reason: "missing importedVideoUrl, sourceUrl, and cloudflare manifest"
    }));

  for (const item of selectedItems) {
    const fileName = `${buildStableFileStem(item)}.mp4`;
    const targetPath = path.join(outputDir, fileName);

    if (fs.existsSync(targetPath)) {
      results.push({
        rank: item.rank,
        streamId: item.streamId,
        fileName,
        skipped: true,
        size: fs.statSync(targetPath).size
      });
      item.localVideoPath = targetPath;
      item.localVideoFileName = fileName;
      continue;
    }

    try {
      const downloadResult = downloadBestAvailableFile(item, targetPath);
      item.localVideoPath = targetPath;
      item.localVideoFileName = fileName;
      item.downloadedVideoUrl = downloadResult.url;
      item.downloadMode = downloadResult.mode;
      results.push({
        rank: item.rank,
        streamId: item.streamId,
        fileName,
        skipped: false,
        size: downloadResult.size,
        downloadMode: downloadResult.mode,
        downloadedVideoUrl: downloadResult.url
      });
    } catch (error) {
      removeFileIfExists(targetPath);
      results.push({
        rank: item.rank,
        streamId: item.streamId,
        fileName,
        failed: true,
        error: error.message
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        inputPath,
        selectedCount: selectedItems.length,
        downloadedCount: results.filter((item) => !item.skipped && !item.failed).length,
        skippedCount: results.filter((item) => item.skipped).length,
        failedCount: results.filter((item) => item.failed).length,
        invalidCount: skippedInvalid.length,
        skippedInvalid,
        results
      },
      null,
      2
    )
  );

  try {
    fs.writeFileSync(inputPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  } catch (error) {
    console.error(
      `Skip writing back input JSON: ${error && error.message ? error.message : String(error)}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
