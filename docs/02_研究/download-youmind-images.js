const fs = require("fs");
const path = require("path");

const root = process.cwd();
const inputPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.resolve(root, "youmind-image-assets", "nano-banana-extracted", "nano-banana-items.all.json");
const argOutputDirOrMode = process.argv[3] || "";
const argMode = process.argv[4] || "";
const outputDir =
  argOutputDirOrMode && argOutputDirOrMode.toLowerCase() !== "thumbs"
    ? path.resolve(root, argOutputDirOrMode)
    : path.join(path.dirname(inputPath), "images");
const downloadThumbnails =
  argOutputDirOrMode.toLowerCase() === "thumbs" || argMode.toLowerCase() === "thumbs";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildPageReferer(item) {
  const locale = typeof item?.locale === "string" && item.locale.trim() ? item.locale.trim() : "zh-CN";
  const campaign = typeof item?.campaign === "string" && item.campaign.trim() ? item.campaign.trim() : "";
  const categories = typeof item?.categories === "string" && item.categories.trim() ? item.categories.trim() : "";
  const localePrefix = locale && locale !== "en-US" ? `/${locale}` : "";
  const url = new URL(`https://youmind.com${localePrefix}/${campaign || ""}`.replace(/\/$/, ""));

  if (categories) {
    url.searchParams.set("categories", categories);
  }

  return url.toString();
}

function buildHeaders(url, refererUrl) {
  return {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    accept: "*/*",
    referer: refererUrl || "https://youmind.com/"
  };
}

function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    return ext && ext.length <= 5 ? ext : ".jpg";
  } catch {
    return ".jpg";
  }
}

async function downloadFile(url, targetPath, refererUrl) {
  const response = await fetch(url, {
    headers: buildHeaders(url, refererUrl)
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText} for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(targetPath, buffer);
  return buffer.length;
}

async function downloadAssetGroup(urls, targetDir, prefix, refererUrl) {
  ensureDir(targetDir);
  const results = [];

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    const ext = getExtensionFromUrl(url);
    const fileName = `${String(index + 1).padStart(2, "0")}${prefix}${ext}`;
    const targetPath = path.join(targetDir, fileName);

    if (fs.existsSync(targetPath)) {
      results.push({
        url,
        fileName,
        targetPath,
        skipped: true,
        size: fs.statSync(targetPath).size
      });
      continue;
    }

    try {
      const size = await downloadFile(url, targetPath, refererUrl);
      results.push({
        url,
        fileName,
        targetPath,
        skipped: false,
        size
      });
    } catch (error) {
      results.push({
        url,
        fileName,
        targetPath,
        failed: true,
        error: error.message
      });
    }
  }

  return results;
}

async function main() {
  const items = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  ensureDir(outputDir);

  const results = [];

  for (const item of items) {
    const media = Array.isArray(item.media) ? item.media : [];
    const thumbs = Array.isArray(item.mediaThumbnails) ? item.mediaThumbnails : [];
    const refererUrl = buildPageReferer(item);

    if (media.length === 0) {
      results.push({
        rank: item.rank,
        id: item.id,
        title: item.title,
        skipped: true,
        reason: "missing media"
      });
      continue;
    }

    const itemDir = path.join(outputDir, `${String(item.rank).padStart(6, "0")}-${item.id}`);
    const imagesDir = path.join(itemDir, "images");
    const thumbsDir = path.join(itemDir, "thumbs");

    const imageResults = await downloadAssetGroup(media, imagesDir, "", refererUrl);
    const thumbnailResults =
      downloadThumbnails && thumbs.length > 0 ? await downloadAssetGroup(thumbs, thumbsDir, "", refererUrl) : [];

    item.localMediaFiles = imageResults.filter((entry) => !entry.failed).map((entry) => entry.targetPath);
    item.localThumbnailFiles = thumbnailResults.filter((entry) => !entry.failed).map((entry) => entry.targetPath);

    results.push({
      rank: item.rank,
      id: item.id,
      title: item.title,
      mediaCount: media.length,
      thumbnailCount: thumbs.length,
      downloadedImages: imageResults.filter((entry) => !entry.skipped && !entry.failed).length,
      skippedImages: imageResults.filter((entry) => entry.skipped).length,
      failedImages: imageResults.filter((entry) => entry.failed).length,
      downloadedThumbnails: thumbnailResults.filter((entry) => !entry.skipped && !entry.failed).length,
      skippedThumbnails: thumbnailResults.filter((entry) => entry.skipped).length,
      failedThumbnails: thumbnailResults.filter((entry) => entry.failed).length
    });
  }

  fs.writeFileSync(inputPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        inputPath,
        outputDir,
        itemCount: items.length,
        withMediaCount: items.filter((item) => Array.isArray(item.media) && item.media.length > 0).length,
        imageSuccessCount: results.filter((item) => !item.skipped && item.failedImages === 0).length,
        results
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
