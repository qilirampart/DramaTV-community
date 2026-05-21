const fs = require("fs");
const path = require("path");

const workspaceRoot = path.resolve(__dirname, "..", "..");
const appRoot = path.join(workspaceRoot, "apps", "web");
const featureRoot = path.join(appRoot, "src", "features", "nano-banana-replica");
const outputDataFile = path.join(featureRoot, "nano-banana-samples.ts");
const publicRoot = path.join(appRoot, "public", "nano-banana-images");
const publicDataFile = path.join(appRoot, "public", "nano-banana-data.json");

const libraryRoot = path.join(
  __dirname,
  "youmind-image-assets",
  "nano-banana-library-p001-p190"
);
const manifestFile = path.join(libraryRoot, "library-manifest.json");

function readMaxItems() {
  const raw = Number(process.env.YOUMIND_SYNC_MAX_ITEMS ?? "");
  return Number.isFinite(raw) && raw > 0 ? raw : Number.POSITIVE_INFINITY;
}

const MAX_ITEMS = readMaxItems();

function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true });
}

function cleanText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function repairText(value) {
  const text = cleanText(value);
  if (!text) {
    return text;
  }

  if (!/(Ã.|â.|ï¼|ï½|ðŸ)/.test(text)) {
    return text;
  }

  try {
    return Buffer.from(text, "latin1").toString("utf8");
  } catch {
    return text;
  }
}

function formatDate(isoString) {
  if (!isoString) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(isoString));
}

function readText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const utf8Text = repairText(buffer.toString("utf8"));
  if (!utf8Text.includes("\uFFFD")) {
    return utf8Text;
  }

  const latin1Text = cleanText(buffer.toString("latin1"));
  if (!latin1Text.includes("\uFFFD")) {
    return latin1Text;
  }

  const text = utf8Text;
  if (text.includes("\uFFFD")) {
    throw new Error(`Replacement character detected in ${filePath}`);
  }

  return text;
}

function sortImageFiles(imageDir) {
  return fs
    .readdirSync(imageDir)
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .sort((left, right) => left.localeCompare(right, "en"));
}

function writeDataFile(items, stats) {
  const lines = [];
  lines.push("export type NanoBananaReplicaItem = {");
  lines.push("  id: string;");
  lines.push("  rank: number;");
  lines.push("  youmindId: number;");
  lines.push("  title: string;");
  lines.push("  description: string;");
  lines.push("  summary: string;");
  lines.push("  authorName: string;");
  lines.push("  authorLink?: string;");
  lines.push("  sourceLink: string;");
  lines.push("  arenaLink: string;");
  lines.push("  publishedAt: string;");
  lines.push("  featured: boolean;");
  lines.push('  grade: "A" | "B" | "C";');
  lines.push("  needReferenceImages: boolean;");
  lines.push("  resultsCount: number;");
  lines.push("  imageCount: number;");
  lines.push("  images: string[];");
  lines.push("  promptLabel: string;");
  lines.push("  promptText: string;");
  lines.push("  rawPromptText: string;");
  lines.push("  translatedPromptText?: string;");
  lines.push("};");
  lines.push("");
  lines.push(`export const nanoBananaReplicaStats = ${JSON.stringify(stats, null, 2)} as const;`);
  lines.push("");
  lines.push(`export const nanoBananaReplicaItems: NanoBananaReplicaItem[] = ${JSON.stringify(items, null, 2)};`);
  lines.push("");

  fs.writeFileSync(outputDataFile, `${lines.join("\n")}\n`, "utf8");
}

function writeJsonFile(items, stats) {
  fs.writeFileSync(
    publicDataFile,
    `${JSON.stringify({ stats, items }, null, 2)}\n`,
    "utf8"
  );
}

function sync() {
  ensureDir(featureRoot);
  ensureDir(publicRoot);

  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const selected = manifest
    .filter((item) => item.grade === "A" && item.hasRawPrompt)
    .slice(0, MAX_ITEMS);

  const items = selected.map((entry) => {
    const itemRoot = path.join(libraryRoot, entry.folder);
    const imageDir = path.join(itemRoot, "images");
    const meta = JSON.parse(fs.readFileSync(path.join(itemRoot, "meta.json"), "utf8"));
    const summary = readText(path.join(itemRoot, "summary.txt"));
    const rawPromptText = readText(path.join(itemRoot, "prompt.raw.txt"));
    const translatedPromptPath = path.join(itemRoot, "prompt.zh.txt");
    const translatedPromptText = fs.existsSync(translatedPromptPath)
      ? readText(translatedPromptPath)
      : "";
    const promptText = translatedPromptText || rawPromptText;
    const imageFiles = sortImageFiles(imageDir);

    const publicItemDir = path.join(publicRoot, entry.folder);
    ensureDir(publicItemDir);

    const publicImages = imageFiles.map((fileName) => {
      const from = path.join(imageDir, fileName);
      const to = path.join(publicItemDir, fileName);
      fs.copyFileSync(from, to);
      return `/nano-banana-images/${entry.folder}/${fileName}`;
    });

    return {
      id: `nano-banana-${entry.folder}`,
      rank: entry.rank,
      youmindId: entry.id,
      title: repairText(meta.title || entry.title),
      description: repairText(meta.description || summary),
      summary,
      authorName: repairText(meta.authorName || "Unknown"),
      authorLink: meta.authorLink || undefined,
      sourceLink: meta.sourceLink || entry.sourceLink,
      arenaLink: `https://youmind.com/model-arena/image-models?id=${entry.id}`,
      publishedAt: formatDate(meta.sourcePublishedAt),
      featured: Boolean(meta.featured),
      grade: entry.grade,
      needReferenceImages: Boolean(meta.needReferenceImages),
      resultsCount: Number(meta.resultsCount || entry.imageCount || publicImages.length),
      imageCount: publicImages.length,
      images: publicImages,
      promptLabel: meta.language === "zh" ? "提示词" : "提示词（中文翻译）",
      promptText,
      rawPromptText,
      translatedPromptText: translatedPromptText || undefined
    };
  });

  const lastSyncedAt = new Date().toISOString();

  writeDataFile(items, {
    totalLibraryItems: manifest.length,
    renderedItems: items.length,
    sourceLibrary: "nano-banana-library-p001-p190",
    lastSyncedAt
  });

  writeJsonFile(items, {
    totalLibraryItems: manifest.length,
    renderedItems: items.length,
    sourceLibrary: "nano-banana-library-p001-p190",
    lastSyncedAt
  });

  console.log(`Synced ${items.length} nano-banana samples.`);
}

sync();
