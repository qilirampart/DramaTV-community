const fs = require("fs");
const path = require("path");

const root = process.cwd();
const extractedPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.join(root, "github-image-assets", "awesome-gpt-image-2-prompts-extracted", "awesome-gpt-image-2-prompts.items.json");
const libraryRoot = process.argv[3]
  ? path.resolve(root, process.argv[3])
  : path.join(root, "github-image-assets", "awesome-gpt-image-2-prompts-library");
const manifestPath = path.join(libraryRoot, "library-manifest.json");
const ossManifestPath = path.join(libraryRoot, "oss-upload-manifest.json");
const ossPrefix = process.argv[4] || "community-assets/github-awesome-gpt-image-2-prompts";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function resolveExistingFiles(filePaths) {
  return (Array.isArray(filePaths) ? filePaths : []).filter((filePath) => typeof filePath === "string" && fs.existsSync(filePath));
}

function buildEntry(item) {
  const rawPrompt = safeText(item.content).trim();
  const localMediaFiles = resolveExistingFiles(item.localMediaFiles);
  const hasImages = localMediaFiles.length > 0;
  const hasPrompt = Boolean(rawPrompt);
  const grade = hasImages && hasPrompt ? "A" : hasImages ? "B" : "SKIP";
  const reasonSkipped = hasImages ? (hasPrompt ? "" : "missing prompt") : "missing image";

  return {
    rank: item.rank,
    id: safeText(item.id),
    sourceRepo: safeText(item.sourceRepo),
    repoUrl: safeText(item.repoUrl),
    readmeUrl: safeText(item.readmeUrl),
    model: safeText(item.model),
    campaign: safeText(item.campaign),
    filterMode: safeText(item.filterMode),
    locale: safeText(item.locale),
    categories: safeText(item.categories),
    sectionTitle: safeText(item.sectionTitle),
    caseNumber: typeof item.caseNumber === "number" ? item.caseNumber : null,
    title: safeText(item.title),
    description: safeText(item.description),
    language: safeText(item.language),
    authorName: safeText(item.authorName),
    authorLink: safeText(item.authorLink),
    sourceLink: safeText(item.sourceLink),
    sourcePublishedAt: safeText(item.sourcePublishedAt),
    sourcePlatform: safeText(item.sourcePlatform),
    followers: typeof item.followers === "number" ? item.followers : null,
    likes: typeof item.likes === "number" ? item.likes : null,
    retweetCount: typeof item.retweetCount === "number" ? item.retweetCount : null,
    viewCount: typeof item.viewCount === "number" ? item.viewCount : null,
    media: Array.isArray(item.media) ? item.media : [],
    mediaRelativePaths: Array.isArray(item.mediaRelativePaths) ? item.mediaRelativePaths : [],
    sourceMedia: Array.isArray(item.sourceMedia) ? item.sourceMedia : [],
    rawPrompt,
    localMediaFiles,
    eligible: hasImages && hasPrompt,
    grade,
    hasRawPrompt: hasPrompt,
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

function toPosixPath(value) {
  return safeText(value).replace(/\\/g, "/");
}

function buildObjectKey(folderName, fileName, category) {
  const safeCategory = safeText(category) || "uncategorized";
  return `${toPosixPath(ossPrefix)}/${safeCategory}/${folderName}/images/${fileName}`;
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
      authorName: entry.authorName,
      reasonSkipped: entry.reasonSkipped
    }));

  ensureDir(libraryRoot);
  const ossUploads = [];

  const manifest = selected.map((entry) => {
    const folderName = `${String(entry.rank).padStart(6, "0")}-${entry.id}`;
    const targetDir = path.join(libraryRoot, folderName);
    const imagesDir = path.join(targetDir, "images");

    ensureDir(targetDir);
    const imageFiles = copyFilesIntoDir(entry.localMediaFiles, imagesDir);

    writeFileIfContent(path.join(targetDir, "prompt.raw.txt"), entry.rawPrompt);
    writeFileIfContent(path.join(targetDir, "summary.txt"), entry.description);
    fs.writeFileSync(path.join(targetDir, "source.txt"), `${entry.sourceLink}\n`, "utf8");

    const meta = {
      rank: entry.rank,
      id: entry.id,
      sourceRepo: entry.sourceRepo,
      repoUrl: entry.repoUrl,
      readmeUrl: entry.readmeUrl,
      model: entry.model,
      campaign: entry.campaign,
      filterMode: entry.filterMode,
      locale: entry.locale,
      categories: entry.categories,
      sectionTitle: entry.sectionTitle,
      caseNumber: entry.caseNumber,
      title: entry.title,
      description: entry.description,
      language: entry.language,
      authorName: entry.authorName,
      authorLink: entry.authorLink,
      sourceLink: entry.sourceLink,
      sourcePublishedAt: entry.sourcePublishedAt,
      sourcePlatform: entry.sourcePlatform,
      followers: entry.followers,
      likes: entry.likes,
      retweetCount: entry.retweetCount,
      viewCount: entry.viewCount,
      media: entry.media,
      mediaRelativePaths: entry.mediaRelativePaths,
      sourceMedia: entry.sourceMedia,
      grade: entry.grade,
      hasRawPrompt: entry.hasRawPrompt,
      files: {
        promptRaw: fs.existsSync(path.join(targetDir, "prompt.raw.txt")) ? "prompt.raw.txt" : null,
        summary: fs.existsSync(path.join(targetDir, "summary.txt")) ? "summary.txt" : null,
        source: "source.txt",
        images: imageFiles
      }
    };

    fs.writeFileSync(path.join(targetDir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`, "utf8");

    for (const fileName of imageFiles) {
      ossUploads.push({
        rank: entry.rank,
        id: entry.id,
        title: entry.title,
        categories: entry.categories,
        sectionTitle: entry.sectionTitle,
        authorName: entry.authorName,
        authorLink: entry.authorLink,
        sourceLink: entry.sourceLink,
        localPath: path.join(imagesDir, fileName),
        objectKey: buildObjectKey(folderName, fileName, entry.categories)
      });
    }

    return {
      rank: entry.rank,
      id: entry.id,
      model: entry.model,
      campaign: entry.campaign,
      categories: entry.categories,
      sectionTitle: entry.sectionTitle,
      title: entry.title,
      folder: folderName,
      sourceLink: entry.sourceLink,
      authorName: entry.authorName,
      grade: entry.grade,
      imageCount: imageFiles.length,
      hasRawPrompt: entry.hasRawPrompt
    };
  });

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(libraryRoot, "library-skip-report.json"), `${JSON.stringify(skipped, null, 2)}\n`, "utf8");
  fs.writeFileSync(ossManifestPath, `${JSON.stringify(ossUploads, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        libraryRoot,
        manifestPath,
        ossManifestPath,
        ossPrefix,
        selectedCount: manifest.length,
        skippedCount: skipped.length,
        uploadCount: ossUploads.length
      },
      null,
      2
    )
  );
}

main();
