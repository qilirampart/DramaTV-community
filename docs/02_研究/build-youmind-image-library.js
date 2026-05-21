const fs = require("fs");
const path = require("path");

const root = process.cwd();
const extractedPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.join(root, "youmind-image-assets", "nano-banana-extracted", "nano-banana-items.all.json");
const libraryRoot = process.argv[3]
  ? path.resolve(root, process.argv[3])
  : path.join(root, "youmind-image-assets", "nano-banana-library");
const manifestPath = path.join(libraryRoot, "library-manifest.json");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function pickRawPrompt(item) {
  if (!item.contentIsReference && safeText(item.content).trim()) {
    return item.content;
  }

  return "";
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

function resolveExistingFiles(filePaths) {
  return (Array.isArray(filePaths) ? filePaths : []).filter((filePath) => typeof filePath === "string" && fs.existsSync(filePath));
}

function buildEntry(item) {
  const rawPrompt = pickRawPrompt(item);
  const zhPrompt = pickZhPrompt(item);
  const localMediaFiles = resolveExistingFiles(item.localMediaFiles);
  const localThumbnailFiles = resolveExistingFiles(item.localThumbnailFiles);
  const hasImages = localMediaFiles.length > 0;
  const hasPrompt = Boolean(rawPrompt.trim() || zhPrompt.trim());
  const grade = hasImages && rawPrompt.trim() ? "A" : hasImages && hasPrompt ? "B" : "SKIP";
  const reasonSkipped = hasImages ? (hasPrompt ? "" : "missing prompt") : "missing image";

  return {
    rank: item.rank,
    id: item.id,
    model: safeText(item.model),
    campaign: safeText(item.campaign),
    filterMode: safeText(item.filterMode),
    locale: safeText(item.locale),
    categories: safeText(item.categories),
    title: safeText(item.title),
    description: safeText(item.description),
    language: safeText(item.language),
    authorName: safeText(item.authorName),
    authorLink: safeText(item.authorLink),
    featured: Boolean(item.featured),
    sourceLink: safeText(item.sourceLink),
    sourcePublishedAt: safeText(item.sourcePublishedAt),
    sourcePlatform: safeText(item.sourcePlatform),
    resultsCount: typeof item.resultsCount === "number" ? item.resultsCount : localMediaFiles.length,
    needReferenceImages: Boolean(item.needReferenceImages),
    promptCategories: Array.isArray(item.promptCategories) ? item.promptCategories : [],
    rawPrompt,
    zhPrompt,
    localMediaFiles,
    localThumbnailFiles,
    eligible: hasImages && hasPrompt,
    grade,
    hasRawPrompt: Boolean(rawPrompt.trim()),
    hasZhPrompt: Boolean(zhPrompt.trim()),
    reasonSkipped
  };
}

function writeFileIfContent(filePath, content) {
  if (content.trim()) {
    fs.writeFileSync(filePath, `${content}\n`, "utf8");
  }
}

function copyFilesIntoDir(filePaths, targetDir) {
  ensureDir(targetDir);
  const copied = [];

  for (const filePath of filePaths) {
    const fileName = path.basename(filePath);
    const targetPath = path.join(targetDir, fileName);
    fs.copyFileSync(filePath, targetPath);
    copied.push(fileName);
  }

  return copied;
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
      title: entry.title,
      sourceLink: entry.sourceLink,
      reasonSkipped: entry.reasonSkipped
    }));

  ensureDir(libraryRoot);

  const manifest = selected.map((entry) => {
    const folderName = `${String(entry.rank).padStart(6, "0")}-${entry.id}`;
    const targetDir = path.join(libraryRoot, folderName);
    const imagesDir = path.join(targetDir, "images");
    const thumbsDir = path.join(targetDir, "thumbs");

    ensureDir(targetDir);
    const imageFiles = copyFilesIntoDir(entry.localMediaFiles, imagesDir);
    const thumbnailFiles = entry.localThumbnailFiles.length > 0 ? copyFilesIntoDir(entry.localThumbnailFiles, thumbsDir) : [];

    writeFileIfContent(path.join(targetDir, "prompt.raw.txt"), entry.rawPrompt);
    writeFileIfContent(path.join(targetDir, "prompt.zh.txt"), entry.zhPrompt);
    writeFileIfContent(path.join(targetDir, "summary.txt"), entry.description);

    fs.writeFileSync(path.join(targetDir, "source.txt"), `${entry.sourceLink}\n`, "utf8");

    fs.writeFileSync(
      path.join(targetDir, "meta.json"),
      `${JSON.stringify(
        {
          rank: entry.rank,
          id: entry.id,
          model: entry.model,
          campaign: entry.campaign,
          filterMode: entry.filterMode,
          locale: entry.locale,
          categories: entry.categories,
          title: entry.title,
          description: entry.description,
          language: entry.language,
          authorName: entry.authorName,
          authorLink: entry.authorLink,
          featured: entry.featured,
          sourceLink: entry.sourceLink,
          sourcePublishedAt: entry.sourcePublishedAt,
          sourcePlatform: entry.sourcePlatform,
          resultsCount: entry.resultsCount,
          needReferenceImages: entry.needReferenceImages,
          promptCategories: entry.promptCategories,
          grade: entry.grade,
          hasRawPrompt: entry.hasRawPrompt,
          hasZhPrompt: entry.hasZhPrompt,
          files: {
            promptRaw: fs.existsSync(path.join(targetDir, "prompt.raw.txt")) ? "prompt.raw.txt" : null,
            promptZh: fs.existsSync(path.join(targetDir, "prompt.zh.txt")) ? "prompt.zh.txt" : null,
            summary: fs.existsSync(path.join(targetDir, "summary.txt")) ? "summary.txt" : null,
            source: "source.txt",
            images: imageFiles,
            thumbs: thumbnailFiles
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
      model: entry.model,
      campaign: entry.campaign,
      categories: entry.categories,
      title: entry.title,
      folder: folderName,
      sourceLink: entry.sourceLink,
      grade: entry.grade,
      imageCount: imageFiles.length,
      hasRawPrompt: entry.hasRawPrompt,
      hasZhPrompt: entry.hasZhPrompt
    };
  });

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(libraryRoot, "library-skip-report.json"), `${JSON.stringify(skipped, null, 2)}\n`, "utf8");

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
