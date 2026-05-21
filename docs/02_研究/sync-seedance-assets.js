const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const workspaceRoot = path.resolve(__dirname, "..", "..");
const appRoot = path.join(workspaceRoot, "apps", "web");
const publicRoot = path.join(appRoot, "public");
const publicVideosDir = path.join(publicRoot, "seedance-videos");
const publicDataFile = path.join(publicRoot, "seedance-data.json");
const videoLibraryRoot = path.join(__dirname, "youmind-video-assets");
const extractedVideosDir = path.join(videoLibraryRoot, "youmind-seedance-extracted", "videos");

const LIBRARY_DIR_PATTERN = /^youmind-seedance-library(?:-p\d{3}-p\d{3})?$/;
const DEFAULT_WINDOWS_FFPROBE = "C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffprobe.exe";

function readMaxItems() {
  const raw = Number(process.env.YOUMIND_SYNC_MAX_ITEMS ?? "");
  return Number.isFinite(raw) && raw > 0 ? raw : Number.POSITIVE_INFINITY;
}

const MAX_ITEMS = readMaxItems();

function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true });
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").trim();
}

function summarizePrompt(text, maxLength = 180) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function formatDate(isoString) {
  if (!isoString) {
    return "Unknown";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function toTimestamp(isoString) {
  const timestamp = Date.parse(isoString || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function listLibraryRoots() {
  return fs
    .readdirSync(videoLibraryRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && LIBRARY_DIR_PATTERN.test(entry.name))
    .map((entry) => path.join(videoLibraryRoot, entry.name))
    .sort((left, right) => left.localeCompare(right, "en"));
}

function findFfprobe() {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH;
  }

  if (fs.existsSync(DEFAULT_WINDOWS_FFPROBE)) {
    return DEFAULT_WINDOWS_FFPROBE;
  }

  return "ffprobe";
}

function isPlayableVideo(filePath, ffprobePath) {
  try {
    execFileSync(
      ffprobePath,
      ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", filePath],
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}

function buildLocalVideoIndex() {
  if (!fs.existsSync(extractedVideosDir)) {
    return new Map();
  }

  const index = new Map();
  const files = fs.readdirSync(extractedVideosDir).filter((fileName) => /\.mp4$/i.test(fileName));

  for (const fileName of files) {
    const streamIdMatch = fileName.match(/([0-9a-f]{32})/i);
    if (!streamIdMatch) {
      continue;
    }

    const sourcePath = path.join(extractedVideosDir, fileName);
    const stats = fs.statSync(sourcePath);
    if (stats.size <= 0) {
      continue;
    }

    const streamId = streamIdMatch[1].toLowerCase();
    if (!index.has(streamId)) {
      index.set(streamId, {
        fileName,
        sourcePath,
        publicPath: `/seedance-videos/${fileName}`,
        size: stats.size
      });
    }
  }

  return index;
}

function collectLibraryItems(localVideoIndex, ffprobePath) {
  const items = [];
  const seenStreamIds = new Set();
  let eligibleLibraryItems = 0;

  for (const libraryRoot of listLibraryRoots()) {
    const manifestPath = path.join(libraryRoot, "library-manifest.json");
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    for (const entry of manifest) {
      if (entry.grade !== "A") {
        continue;
      }

      const streamId = safeText(entry.streamId);
      if (!streamId || seenStreamIds.has(streamId)) {
        continue;
      }

      eligibleLibraryItems += 1;

      const localVideo = localVideoIndex.get(streamId.toLowerCase());
      if (!localVideo || !isPlayableVideo(localVideo.sourcePath, ffprobePath)) {
        continue;
      }

      const itemRoot = path.join(libraryRoot, entry.folder);
      const metaPath = path.join(itemRoot, "meta.json");
      if (!fs.existsSync(metaPath)) {
        continue;
      }

      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      const zhPrompt = readText(path.join(itemRoot, "prompt.zh.txt"));
      const enPrompt = readText(path.join(itemRoot, "prompt.en.txt"));
      const promptText = zhPrompt || enPrompt;
      const importedVideoUrl = safeText(meta.importedVideoUrl);
      const videoSrc = localVideo.publicPath;

      if (!promptText || !videoSrc) {
        continue;
      }

      const publishedAtIso = safeText(meta.sourcePublishedAt);

      items.push({
        id: `seedance-${meta.id || entry.id}`,
        title: safeText(meta.title) || safeText(entry.title) || `Seedance ${entry.id}`,
        summary: summarizePrompt(promptText),
        promptText,
        promptLanguage: zhPrompt ? "zh" : "en",
        authorName: safeText(meta.authorName) || "Unknown",
        publishedAt: formatDate(publishedAtIso),
        featured: Boolean(meta.featured),
        streamId,
        sourceLink: safeText(meta.sourceLink) || safeText(entry.sourceLink),
        authorLink: safeText(meta.authorLink) || undefined,
        videoSrc,
        importedVideoUrl,
        localVideoFile: localVideo.fileName,
        thumbnailSrc: safeText(meta.thumbnail),
        _publishedAtIso: publishedAtIso
      });

      seenStreamIds.add(streamId);
      if (items.length >= MAX_ITEMS) {
        return { items, eligibleLibraryItems };
      }
    }
  }

  const sortedItems = items.sort((left, right) => {
    if (left.featured !== right.featured) {
      return Number(right.featured) - Number(left.featured);
    }

    return toTimestamp(right._publishedAtIso) - toTimestamp(left._publishedAtIso);
  });

  return {
    items: sortedItems,
    eligibleLibraryItems
  };
}

function copySelectedVideos(items, verifiedVideoIndex) {
  ensureDir(publicVideosDir);

  for (const item of items) {
    const video = verifiedVideoIndex.get(item.streamId.toLowerCase());
    if (!video) {
      continue;
    }

    const targetPath = path.join(publicVideosDir, video.fileName);
    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size !== video.size) {
      fs.copyFileSync(video.sourcePath, targetPath);
    }
  }
}

function sync() {
  ensureDir(publicRoot);

  const localVideoIndex = buildLocalVideoIndex();
  const ffprobePath = findFfprobe();
  const { items: libraryItems, eligibleLibraryItems } = collectLibraryItems(localVideoIndex, ffprobePath);
  const selectedItems = libraryItems.slice(0, MAX_ITEMS).map(({ _publishedAtIso, ...item }) => item);
  const localVideoCount = selectedItems.filter((item) => item.videoSrc.startsWith("/seedance-videos/")).length;
  copySelectedVideos(selectedItems, localVideoIndex);

  const stats = {
    scannedLibraryItems: eligibleLibraryItems,
    availableLocalVideos: localVideoIndex.size,
    verifiedSelectedVideos: selectedItems.length,
    renderedItems: selectedItems.length,
    sourceLibrary: "youmind-video-assets/youmind-seedance-library*",
    videoPolicy: "local-ffprobe-verified-only",
    lastSyncedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    publicDataFile,
    `${JSON.stringify({ stats, items: selectedItems }, null, 2)}\n`,
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        publicDataFile,
        scannedLibraryItems: stats.scannedLibraryItems,
        availableLocalVideos: stats.availableLocalVideos,
        verifiedSelectedVideos: stats.verifiedSelectedVideos,
        renderedItems: stats.renderedItems,
        localVideoCount,
        externalVideoCount: selectedItems.length - localVideoCount
      },
      null,
      2
    )
  );
}

sync();
