const fs = require("fs");
const path = require("path");

const root = process.cwd();
const inputPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.resolve(root, "youmind-seedance-extracted", "seedance-items.all.json");
const outputDir = path.resolve(root, "youmind-seedance-extracted", "videos");

function buildHeaders(url) {
  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
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

async function downloadFile(url, targetPath) {
  const response = await fetch(url, {
    headers: buildHeaders(url)
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText} for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(targetPath, buffer);

  return buffer.length;
}

async function main() {
  const items = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  fs.mkdirSync(outputDir, { recursive: true });

  const selectedItems = items.filter((item) => item.importedVideoUrl);
  const results = [];

  for (const item of selectedItems) {
    const fileName = `${String(item.rank).padStart(2, "0")}-${item.streamId}.mp4`;
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
      const size = await downloadFile(item.importedVideoUrl, targetPath);
      item.localVideoPath = targetPath;
      item.localVideoFileName = fileName;
      results.push({
        rank: item.rank,
        streamId: item.streamId,
        fileName,
        skipped: false,
        size
      });
    } catch (error) {
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
        results
      },
      null,
      2
    )
  );

  fs.writeFileSync(inputPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
