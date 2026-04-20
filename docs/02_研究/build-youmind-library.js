const fs = require("fs");
const path = require("path");

const root = process.cwd();
const extractedPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.join(root, "youmind-seedance-extracted", "seedance-items.all.json");
const libraryRoot = process.argv[3]
  ? path.resolve(root, process.argv[3])
  : path.join(root, "youmind-seedance-library");
const manifestPath = path.join(libraryRoot, "library-manifest.json");
const extractedVideosDir = path.join(root, "youmind-seedance-extracted", "videos");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function resolveLocalVideoPath(item) {
  if (item.localVideoPath && fs.existsSync(item.localVideoPath)) {
    return item.localVideoPath;
  }

  if (!item.streamId || !fs.existsSync(extractedVideosDir)) {
    return "";
  }

  const matchedFileName = fs
    .readdirSync(extractedVideosDir)
    .find((fileName) => fileName.endsWith(`-${item.streamId}.mp4`));

  return matchedFileName ? path.join(extractedVideosDir, matchedFileName) : "";
}

function pickZhPrompt(item) {
  if (!item.translatedContentIsReference && safeText(item.translatedContent).trim()) {
    return item.translatedContent;
  }

  if (!item.contentIsReference && item.language === "zh" && safeText(item.content).trim()) {
    return item.content;
  }

  return "";
}

function pickEnPrompt(item) {
  if (!item.contentIsReference && item.language === "en" && safeText(item.content).trim()) {
    return item.content;
  }

  return "";
}

function buildEntry(item) {
  const zhPrompt = pickZhPrompt(item);
  const enPrompt = pickEnPrompt(item);
  const localVideoPath = resolveLocalVideoPath(item);
  const hasVideo = Boolean(localVideoPath);
  const hasPrompt = Boolean(zhPrompt.trim() || enPrompt.trim());
  const hasOriginalPrompt =
    (item.language === "en" && enPrompt.trim()) || (item.language === "zh" && zhPrompt.trim());
  const grade = hasVideo && hasPrompt ? (hasOriginalPrompt ? "A" : "B") : "SKIP";
  const reasonSkipped = hasVideo ? (hasPrompt ? "" : "missing prompt") : "missing video";

  return {
    rank: item.rank,
    id: item.id,
    streamId: item.streamId,
    title: item.title,
    authorName: item.authorName,
    authorLink: item.authorLink,
    featured: item.featured,
    sourceLink: item.sourceLink,
    sourcePublishedAt: item.sourcePublishedAt,
    importedVideoUrl: item.importedVideoUrl,
    thumbnail: item.thumbnail,
    promptSources: {
      contentSource: item.contentSource,
      translatedContentSource: item.translatedContentSource
    },
    zhPrompt,
    enPrompt,
    localVideoPath,
    eligible: hasVideo && hasPrompt,
    grade,
    hasOriginalPrompt: Boolean(hasOriginalPrompt),
    reasonSkipped
  };
}

function writeFileIfContent(filePath, content) {
  if (content.trim()) {
    fs.writeFileSync(filePath, `${content}\n`, "utf8");
  }
}

function main() {
  const items = JSON.parse(fs.readFileSync(extractedPath, "utf8"));
  const entries = items.map(buildEntry);
  const selected = entries.filter((entry) => entry.eligible);
  const skipped = entries
    .filter((entry) => !entry.eligible)
    .map((entry) => ({
      rank: entry.rank,
      id: entry.id,
      streamId: entry.streamId,
      title: entry.title,
      sourceLink: entry.sourceLink,
      reasonSkipped: entry.reasonSkipped
    }));

  ensureDir(libraryRoot);

  const manifest = selected.map((entry) => {
    const folderName = `${String(entry.rank).padStart(2, "0")}-${entry.id}-${entry.streamId}`;
    const targetDir = path.join(libraryRoot, folderName);
    ensureDir(targetDir);

    const videoTargetPath = path.join(targetDir, "video.mp4");
    fs.copyFileSync(entry.localVideoPath, videoTargetPath);

    writeFileIfContent(path.join(targetDir, "prompt.en.txt"), entry.enPrompt);
    writeFileIfContent(path.join(targetDir, "prompt.zh.txt"), entry.zhPrompt);

    fs.writeFileSync(
      path.join(targetDir, "source.txt"),
      `${entry.sourceLink}\n`,
      "utf8"
    );

    fs.writeFileSync(
      path.join(targetDir, "meta.json"),
      `${JSON.stringify(
        {
          rank: entry.rank,
          id: entry.id,
          streamId: entry.streamId,
          title: entry.title,
          authorName: entry.authorName,
          authorLink: entry.authorLink,
          featured: entry.featured,
          sourceLink: entry.sourceLink,
          sourcePublishedAt: entry.sourcePublishedAt,
          importedVideoUrl: entry.importedVideoUrl,
          thumbnail: entry.thumbnail,
          promptSources: entry.promptSources,
          grade: entry.grade,
          hasOriginalPrompt: entry.hasOriginalPrompt,
          files: {
            video: "video.mp4",
            promptEn: fs.existsSync(path.join(targetDir, "prompt.en.txt")) ? "prompt.en.txt" : null,
            promptZh: fs.existsSync(path.join(targetDir, "prompt.zh.txt")) ? "prompt.zh.txt" : null,
            source: "source.txt"
          }
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    return {
      rank: entry.rank,
      id: entry.id,
      streamId: entry.streamId,
      title: entry.title,
      folder: folderName,
      sourceLink: entry.sourceLink,
      grade: entry.grade,
      hasOriginalPrompt: entry.hasOriginalPrompt,
      hasEnPrompt: Boolean(entry.enPrompt.trim()),
      hasZhPrompt: Boolean(entry.zhPrompt.trim())
    };
  });

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    path.join(libraryRoot, "library-skip-report.json"),
    `${JSON.stringify(skipped, null, 2)}\n`,
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        libraryRoot,
        manifestPath,
        selectedCount: manifest.length,
        skippedCount: skipped.length,
        selected: manifest,
        skipped
      },
      null,
      2
    )
  );
}

main();
