import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPromptTaxonomy } from "./lib/prompt-taxonomy.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const defaultResearchRoot = path.join(projectRoot, "docs", "02_研究");
let researchRoot = defaultResearchRoot;
let videoLibraryRoot = path.join(researchRoot, "youmind-video-assets");
let imageAssetsRoot = path.join(researchRoot, "youmind-image-assets");
const defaultStateFile = path.join(projectRoot, "artifacts", "youmind-import", "latest", "state.json");
const defaultPassword = process.env.DRAMATV_IMPORT_PASSWORD ?? "dramatv-local-dev";
const defaultBackendBaseUrl = process.env.DRAMATV_BACKEND_BASE_URL ?? "http://8.141.20.130";
const defaultAuthorMode = process.env.DRAMATV_IMPORT_AUTHOR_MODE ?? "fixed";
const defaultAuthorUsername = process.env.DRAMATV_IMPORT_AUTHOR_USERNAME ?? "community";
const defaultAuthorDisplayName = process.env.DRAMATV_IMPORT_AUTHOR_DISPLAY_NAME ?? "community";
const defaultAuthorBio = process.env.DRAMATV_IMPORT_AUTHOR_BIO ?? "社区初始数据";
const defaultAuthorHeadline = process.env.DRAMATV_IMPORT_AUTHOR_HEADLINE ?? "社区初始数据";
const defaultSkipSourcePairsFile = process.env.DRAMATV_IMPORT_SKIP_SOURCE_PAIRS_FILE ?? "";
const defaultFfmpeg = "C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe";
const defaultFfprobe = "C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffprobe.exe";
const seedanceLibraryPattern = /^youmind-seedance-library(?:-p\d{3}-p\d{3})?$/;
const imageLibraryConfigs = {
  nano: {
    kind: "nano",
    libraryRoot: path.join(imageAssetsRoot, "nano-banana-library-p001-p190"),
    keyPrefix: "nano",
    modelName: "Nano Banana",
    sourceCampaign: "youmind-nano-banana",
    sourcePlatform: "youmind",
    trustedUpperCategory: false
  },
  comic: {
    aliases: ["storyboard", "comic-storyboard"],
    kinds: ["gpt-comic", "nano-comic"]
  },
  "gpt-comic": {
    kind: "gpt-comic",
    libraryRoot: path.join(imageAssetsRoot, "gpt-image-2-comic-storyboard-library-p001-p014"),
    keyPrefix: "gpt-comic",
    modelName: "GPT-Image-2",
    sourceCampaign: "gpt-image-2-prompts",
    sourcePlatform: "youmind",
    trustedUpperCategory: true,
    upperCategoryCode: "comic-storyboard"
  },
  "nano-comic": {
    kind: "nano-comic",
    libraryRoot: path.join(imageAssetsRoot, "nano-banana-comic-storyboard-library-p001-p023"),
    keyPrefix: "nano-comic",
    modelName: "Nano Banana Pro",
    sourceCampaign: "nano-banana-pro-prompts",
    sourcePlatform: "youmind",
    trustedUpperCategory: true,
    upperCategoryCode: "comic-storyboard"
  },
  "awesome-gpt-image-2": {
    kind: "awesome-gpt-image-2",
    libraryRoot: path.join(researchRoot, "github-image-assets", "awesome-gpt-image-2-prompts-library"),
    keyPrefix: "awesome-gpt-image-2",
    modelName: "GPT-Image-2",
    sourceCampaign: "awesome-gpt-image-2-prompts",
    sourcePlatform: "github",
    trustedUpperCategory: false
  }
};

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

function resolveResearchRoot(args) {
  const configuredRoot = args["research-root"] ?? process.env.YOUMIND_RESEARCH_ROOT ?? defaultResearchRoot;
  return path.resolve(configuredRoot);
}

function requestId(label) {
  return `youmind-import-${label}-${crypto.randomUUID()}`;
}

function buildUrl(baseUrl, targetPath) {
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

function safeText(value) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

function repairText(value) {
  const text = safeText(value);
  if (!text || !/(Ã.|â.|ï¼|ï½|ðŸ)/.test(text)) {
    return text;
  }

  try {
    return Buffer.from(text, "latin1").toString("utf8").trim();
  } catch {
    return text;
  }
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  const buffer = fs.readFileSync(filePath);
  const utf8 = repairText(buffer.toString("utf8"));
  if (!utf8.includes("\uFFFD")) {
    return utf8;
  }

  const latin1 = safeText(buffer.toString("latin1"));
  if (!latin1.includes("\uFFFD")) {
    return latin1;
  }

  throw new Error(`replacement character detected in ${filePath}`);
}

function summarizePrompt(text, maxLength = 180) {
  const normalized = safeText(text).replace(/\s+/g, " ");
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function trimTo(value, maxLength) {
  return safeText(value).slice(0, maxLength);
}

function slugify(value) {
  const ascii = String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || "youmind";
}

function hash8(value) {
  return crypto.createHash("sha1").update(String(value ?? "")).digest("hex").slice(0, 8);
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
}

function normalizeLimit(value, fallback) {
  const parsed = toPositiveInt(value, fallback);
  return parsed === 0 ? Number.POSITIVE_INFINITY : parsed;
}

function normalizeAuthorMode(value) {
  const normalized = safeText(value).toLowerCase() || "fixed";
  if (normalized === "fixed" || normalized === "source") {
    return normalized;
  }
  throw new Error(`unsupported author mode: ${value}`);
}

function findFfprobe() {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH;
  }
  if (fs.existsSync(defaultFfprobe)) {
    return defaultFfprobe;
  }
  return "ffprobe";
}

function findFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  if (fs.existsSync(defaultFfmpeg)) {
    return defaultFfmpeg;
  }
  return "ffmpeg";
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

function guessMimeType(filePath, fallback) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".mp4") return "video/mp4";
  return fallback;
}

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function listSeedanceRoots() {
  return fs
    .readdirSync(videoLibraryRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && seedanceLibraryPattern.test(entry.name))
    .map((entry) => path.join(videoLibraryRoot, entry.name))
    .sort((left, right) => left.localeCompare(right, "en"));
}

function collectSeedanceItems({ offset, limit }) {
  const items = [];
  const seenStreamIds = new Set();
  const ffprobePath = findFfprobe();
  const targetCount = Number.isFinite(limit) ? offset + limit : Number.POSITIVE_INFINITY;

  for (const libraryRoot of listSeedanceRoots()) {
    const manifestPath = path.join(libraryRoot, "library-manifest.json");
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const manifest = loadJson(manifestPath);
    for (const entry of manifest) {
      if (entry.grade !== "A") {
        continue;
      }

      const streamId = safeText(entry.streamId).toLowerCase();
      if (!streamId || seenStreamIds.has(streamId)) {
        continue;
      }
      seenStreamIds.add(streamId);

      const itemRoot = path.join(libraryRoot, entry.folder);
      const videoPath = path.join(itemRoot, "video.mp4");
      const metaPath = path.join(itemRoot, "meta.json");
      if (!fs.existsSync(videoPath) || !fs.existsSync(metaPath)) {
        continue;
      }
      if (fs.statSync(videoPath).size <= 0 || !isPlayableVideo(videoPath, ffprobePath)) {
        continue;
      }

      const meta = loadJson(metaPath);
      const promptZh = readText(path.join(itemRoot, "prompt.zh.txt"));
      const promptEn = readText(path.join(itemRoot, "prompt.en.txt"));
      const promptText = promptZh || promptEn;
      if (!promptText) {
        continue;
      }

      const title = trimTo(meta.title || entry.title || `Seedance ${entry.id ?? streamId}`, 160);
      const summary = summarizePrompt(promptText);
      const modelName = "Seedance 2.0";
      const sourceCampaign = "youmind-seedance";
      const taxonomy = classifyPromptTaxonomy({
        modality: "video",
        title,
        summary,
        promptText,
        modelName,
        sourceCampaign
      });

      items.push({
        key: `seedance:${meta.id ?? entry.id ?? streamId}`,
        kind: "seedance",
        title,
        summary,
        promptText,
        promptTextZh: promptZh || null,
        promptTextEn: promptEn || null,
        promptTextRaw: promptEn || promptZh || promptText,
        authorName: trimTo(meta.authorName || "YouMind Creator", 64),
        authorLink: safeText(meta.authorLink),
        sourceUrl: safeText(meta.sourceLink || entry.sourceLink),
        publishedAt: safeText(meta.sourcePublishedAt),
        modelName,
        sourcePlatform: "youmind",
        sourceCampaign,
        sourceItemId: String(meta.id ?? entry.id ?? streamId),
        categoryCode: "video_prompt",
        tags: taxonomy.standardTags,
        modelCategory: taxonomy.modelCategory,
        contentCategory: taxonomy.contentCategory,
        compositionCategory: taxonomy.compositionCategory,
        thumbnailUrl: safeText(meta.thumbnail),
        filePath: videoPath,
        fileName: path.basename(videoPath),
        mimeType: "video/mp4"
      });

      if (items.length >= targetCount) {
        return items.slice(offset, targetCount);
      }
    }
  }

  return items.slice(offset, targetCount);
}

function sortImageFiles(imageDir) {
  return fs
    .readdirSync(imageDir)
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .sort((left, right) => left.localeCompare(right, "en"));
}

function resolveTrustedUpperCategory(config, meta, entry) {
  if (!config.trustedUpperCategory) {
    return "";
  }

  return safeText(config.upperCategoryCode || meta.categories || entry.categories);
}

function buildImageExtraSignals(config, meta, entry) {
  const signals = [];
  const trustedUpperCategory = resolveTrustedUpperCategory(config, meta, entry);
  if (trustedUpperCategory) {
    signals.push(trustedUpperCategory);
  }

  signals.push(
    safeText(meta.categories),
    safeText(entry.categories),
    safeText(meta.sectionTitle),
    safeText(entry.sectionTitle),
    safeText(meta.sourceRepo)
  );

  return [...new Set(signals.filter(Boolean))];
}

function collectImageLibraryItems(config, { offset, limit }) {
  const manifestPath = path.join(config.libraryRoot, "library-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`image manifest not found: ${manifestPath}`);
  }

  const manifest = loadJson(manifestPath);
  const items = [];
  const targetCount = Number.isFinite(limit) ? offset + limit : Number.POSITIVE_INFINITY;

  for (const entry of manifest) {
    if (entry.grade !== "A" || !entry.hasRawPrompt) {
      continue;
    }

    const itemRoot = path.join(config.libraryRoot, entry.folder);
    const metaPath = path.join(itemRoot, "meta.json");
    const imageDir = path.join(itemRoot, "images");
    if (!fs.existsSync(metaPath) || !fs.existsSync(imageDir)) {
      continue;
    }

    const imageFiles = sortImageFiles(imageDir);
    if (imageFiles.length === 0) {
      continue;
    }

    const meta = loadJson(metaPath);
    const promptRaw = readText(path.join(itemRoot, "prompt.raw.txt"));
    const promptZhPath = path.join(itemRoot, "prompt.zh.txt");
    const promptZh = fs.existsSync(promptZhPath) ? readText(promptZhPath) : "";
    const promptEnPath = path.join(itemRoot, "prompt.en.txt");
    const promptEn = fs.existsSync(promptEnPath) ? readText(promptEnPath) : "";
    const promptText = promptZh || promptEn || promptRaw;
    if (!promptText) {
      continue;
    }

    const summary = readText(path.join(itemRoot, "summary.txt")) || meta.description || summarizePrompt(promptText);
    const filePath = path.join(imageDir, imageFiles[0]);
    const title = trimTo(repairText(meta.title || entry.title || entry.folder), 160);
    const modelName = repairText(meta.model) || config.modelName;
    const sourceCampaign = repairText(meta.campaign) || config.sourceCampaign;
    const taxonomy = classifyPromptTaxonomy({
      modality: "image",
      title,
      summary,
      promptText,
      modelName,
      sourceCampaign,
      extraSignals: buildImageExtraSignals(config, meta, entry)
    });

    items.push({
      key: `${config.keyPrefix}:${entry.folder}`,
      kind: config.kind,
      title,
      summary: trimTo(repairText(summary), 512),
      promptText,
      promptTextZh: promptZh || null,
      promptTextEn: promptEn || null,
      promptTextRaw: promptRaw || promptText,
      authorName: trimTo(repairText(meta.authorName || "YouMind Creator"), 64),
      authorLink: safeText(meta.authorLink),
      sourceUrl: safeText(meta.sourceLink || entry.sourceLink),
      publishedAt: safeText(meta.sourcePublishedAt),
      modelName,
      sourcePlatform: config.sourcePlatform ?? "youmind",
      sourceCampaign,
      sourceItemId: String(meta.id ?? entry.id ?? entry.folder),
      categoryCode: "image_prompt",
      tags: taxonomy.standardTags,
      modelCategory: taxonomy.modelCategory,
      contentCategory: taxonomy.contentCategory,
      compositionCategory: taxonomy.compositionCategory,
      filePath,
      fileName: path.basename(filePath),
      mimeType: guessMimeType(filePath, "image/jpeg")
    });

    if (items.length >= targetCount) {
      return items.slice(offset, targetCount);
    }
  }

  return items.slice(offset, targetCount);
}

function loadState(filePath) {
  if (!fs.existsSync(filePath)) {
    return { version: 1, items: {} };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function saveState(filePath, state) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function buildSourcePairKey(sourceCampaign, sourceItemId) {
  return `${safeText(sourceCampaign)}|${safeText(sourceItemId)}`;
}

function loadSkipSourcePairs(filePath) {
  if (!filePath) {
    return new Set();
  }

  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`skip source pairs file not found: ${absolutePath}`);
  }

  const raw = loadJson(absolutePath);
  const pairs = Array.isArray(raw?.pairs) ? raw.pairs : [];
  return new Set(
    pairs
      .map((value) => safeText(value))
      .filter(Boolean)
  );
}

async function login(baseUrl, username, password) {
  const { response, json } = await requestJson(buildUrl(baseUrl, "/api/auth/login"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Request-Id": requestId("login")
    },
    body: JSON.stringify({ loginType: "password", username, password })
  });
  if (!response.ok || json?.code !== "OK" || typeof json?.data?.accessToken !== "string") {
    throw new Error(`login failed: ${response.status} ${JSON.stringify(json)}`);
  }
  return json.data.accessToken;
}

async function updateProfile(baseUrl, token, profile) {
  const { response, json } = await requestJson(buildUrl(baseUrl, "/api/me/profile"), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Request-Id": requestId("profile")
    },
    body: JSON.stringify(profile)
  });
  if (!response.ok || json?.code !== "OK") {
    throw new Error(`update profile failed: ${response.status} ${JSON.stringify(json)}`);
  }
}

async function uploadAsset(baseUrl, token, item) {
  return uploadAssetBinary(baseUrl, token, {
    filePath: item.filePath,
    fileName: item.fileName,
    mimeType: item.mimeType,
    categoryCode: item.categoryCode,
    assetRole: "source"
  });
}

async function uploadAssetBinary(
  baseUrl,
  token,
  {
    filePath,
    fileName,
    mimeType,
    categoryCode,
    assetRole
  }
) {
  const bytes = fs.readFileSync(filePath);
  const policyPath = categoryCode === "image_prompt" ? "/api/uploads/image-policy" : "/api/uploads/video-policy";
  const { response: policyResponse, json: policyJson } = await requestJson(buildUrl(baseUrl, policyPath), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Request-Id": requestId("policy")
    },
    body: JSON.stringify({
      fileName,
      mimeType,
      sizeBytes: bytes.length,
      assetRole
    })
  });
  if (!policyResponse.ok || policyJson?.code !== "OK" || typeof policyJson?.data?.uploadUrl !== "string") {
    throw new Error(`create upload policy failed: ${policyResponse.status} ${JSON.stringify(policyJson)}`);
  }

  const { response: uploadResponse, json: uploadJson } = await requestJson(buildUrl(baseUrl, policyJson.data.uploadUrl), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": mimeType,
      "X-Request-Id": requestId("upload")
    },
    body: bytes
  });
  if (!uploadResponse.ok || uploadJson?.code !== "OK" || typeof uploadJson?.data?.assetId !== "string") {
    throw new Error(`upload asset failed: ${uploadResponse.status} ${JSON.stringify(uploadJson)}`);
  }

  return uploadJson.data.assetId;
}

async function downloadThumbnail(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "DramaTV-Community-Importer/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`thumbnail download failed: ${response.status} ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function extractVideoCoverToTemp(videoPath, sourceItemId) {
  const ffmpegPath = findFfmpeg();
  const outputDir = path.join(projectRoot, "artifacts", "youmind-import", "latest", "generated-covers");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${sourceItemId || hash8(videoPath)}-cover.jpg`);
  execFileSync(ffmpegPath, ["-y", "-ss", "0.2", "-i", videoPath, "-frames:v", "1", "-q:v", "2", outputPath], {
    stdio: "ignore"
  });
  return outputPath;
}

async function uploadPromptCoverAsset(baseUrl, token, item) {
  let coverPath = null;

  try {
    if (item.thumbnailUrl) {
      const bytes = await downloadThumbnail(item.thumbnailUrl);
      const tempDir = path.join(projectRoot, "artifacts", "youmind-import", "latest", "downloaded-thumbnails");
      fs.mkdirSync(tempDir, { recursive: true });
      coverPath = path.join(tempDir, `${item.sourceItemId || hash8(item.key)}-cover.jpg`);
      fs.writeFileSync(coverPath, bytes);
    } else {
      coverPath = extractVideoCoverToTemp(item.filePath, item.sourceItemId);
    }
  } catch {
    coverPath = extractVideoCoverToTemp(item.filePath, item.sourceItemId);
  }

  return uploadAssetBinary(baseUrl, token, {
    filePath: coverPath,
    fileName: path.basename(coverPath),
    mimeType: "image/jpeg",
    categoryCode: "image_prompt",
    assetRole: "cover"
  });
}

async function createDraft(baseUrl, token) {
  const { response, json } = await requestJson(buildUrl(baseUrl, "/api/video-drafts"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-Request-Id": requestId("draft-create")
    }
  });
  if (!response.ok || json?.code !== "OK" || typeof json?.data?.draftId !== "string") {
    throw new Error(`create draft failed: ${response.status} ${JSON.stringify(json)}`);
  }
  return json.data.draftId;
}

async function updateDraft(baseUrl, token, draftId, payload) {
  const { response, json } = await requestJson(buildUrl(baseUrl, `/api/video-drafts/${encodeURIComponent(draftId)}`), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Request-Id": requestId("draft-update")
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok || json?.code !== "OK") {
    throw new Error(`update draft failed: ${response.status} ${JSON.stringify(json)}`);
  }
}

async function submitDraft(baseUrl, token, draftId) {
  const { response, json } = await requestJson(buildUrl(baseUrl, `/api/video-drafts/${encodeURIComponent(draftId)}/submit`), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Request-Id": requestId("draft-submit")
    },
    body: JSON.stringify({ submitMode: "import_sync" })
  });
  if (!response.ok || json?.code !== "OK" || typeof json?.data?.videoId !== "string") {
    throw new Error(`submit draft failed: ${response.status} ${JSON.stringify(json)}`);
  }
  return json.data;
}

async function verifyPrompt(baseUrl, promptId) {
  const { response, json } = await requestJson(buildUrl(baseUrl, `/api/prompts/${encodeURIComponent(promptId)}`), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Request-Id": requestId("verify")
    }
  });
  if (!response.ok || json?.code !== "OK") {
    throw new Error(`verify prompt failed: ${response.status} ${JSON.stringify(json)}`);
  }
}

function buildSourceAuthorAccount(item) {
  const authorKey = item.authorLink || item.authorName || item.sourceUrl || item.key;
  const suffix = hash8(authorKey);
  const username = `ymimport-${slugify(item.authorName).slice(0, 23)}-${suffix}`.slice(0, 64);
  const candidateDisplayName = trimTo(item.authorName || "YouMind Creator", 64);
  const displayName = candidateDisplayName.length >= 2 ? candidateDisplayName : `YouMind ${suffix}`;
  return {
    username,
    displayName,
    bio: trimTo(item.authorLink || item.sourceUrl || "Imported from YouMind.", 512),
    headline: trimTo("YouMind creator", 128)
  };
}

function buildFixedAuthorAccount(config) {
  return {
    username: trimTo(config.username || "community", 64),
    displayName: trimTo(config.displayName || config.username || "community", 64),
    bio: trimTo(config.bio || "社区初始数据", 512),
    headline: trimTo(config.headline || "社区初始数据", 128)
  };
}

function buildAuthorAccount(item, authorConfig) {
  if (authorConfig.mode === "source") {
    return buildSourceAuthorAccount(item);
  }

  return buildFixedAuthorAccount(authorConfig.fixedAuthor);
}

function normalizeRequestedKind(kind) {
  if (kind === "storyboard" || kind === "comic-storyboard") {
    return "comic";
  }

  return kind;
}

function resolveRequestedKinds(kind) {
  const normalizedKind = normalizeRequestedKind(kind);

  if (normalizedKind === "all") {
    return ["seedance", "nano", "gpt-comic", "nano-comic"];
  }

  const config = imageLibraryConfigs[normalizedKind];
  if (config?.kinds) {
    return config.kinds;
  }

  return [normalizedKind];
}

function collectItemsForKinds(kinds, limits, offsets) {
  const items = [];

  for (const kind of kinds) {
    if (kind === "seedance") {
      items.push(
        ...collectSeedanceItems({
          offset: offsets.seedance,
          limit: limits.seedance
        })
      );
      continue;
    }

    const config = imageLibraryConfigs[kind];
    if (!config?.libraryRoot) {
      throw new Error(`unsupported kind: ${kind}`);
    }

    items.push(
      ...collectImageLibraryItems(config, {
        offset: offsets[kind] ?? offsets.defaultImage,
        limit: limits[kind] ?? limits.defaultImage
      })
    );
  }

  return items;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  researchRoot = resolveResearchRoot(args);
  videoLibraryRoot = path.join(researchRoot, "youmind-video-assets");
  imageAssetsRoot = path.join(researchRoot, "youmind-image-assets");
  const backendBaseUrl = args["backend-base-url"] ?? defaultBackendBaseUrl;
  const stateFile = args["state-file"] ?? defaultStateFile;
  const kind = (args.kind ?? "all").toLowerCase();
  const dryRun = args["dry-run"] === "true";
  const requestedKinds = resolveRequestedKinds(kind);
  const seedanceLimit = normalizeLimit(args["seedance-limit"] ?? args.limit, 10);
  const defaultImageLimit = normalizeLimit(args["image-limit"] ?? args.limit, 10);
  const nanoLimit = normalizeLimit(args["nano-limit"] ?? defaultImageLimit, defaultImageLimit);
  const gptComicLimit = normalizeLimit(args["gpt-comic-limit"] ?? args["comic-limit"] ?? defaultImageLimit, defaultImageLimit);
  const nanoComicLimit = normalizeLimit(args["nano-comic-limit"] ?? args["comic-limit"] ?? defaultImageLimit, defaultImageLimit);
  const awesomeLimit = normalizeLimit(args["awesome-limit"] ?? args["github-limit"] ?? defaultImageLimit, defaultImageLimit);
  const seedanceOffset = toPositiveInt(args["seedance-offset"] ?? args.offset, 0);
  const defaultImageOffset = toPositiveInt(args["image-offset"] ?? args.offset, 0);
  const nanoOffset = toPositiveInt(args["nano-offset"] ?? defaultImageOffset, defaultImageOffset);
  const gptComicOffset = toPositiveInt(args["gpt-comic-offset"] ?? args["comic-offset"] ?? defaultImageOffset, defaultImageOffset);
  const nanoComicOffset = toPositiveInt(args["nano-comic-offset"] ?? args["comic-offset"] ?? defaultImageOffset, defaultImageOffset);
  const awesomeOffset = toPositiveInt(args["awesome-offset"] ?? args["github-offset"] ?? defaultImageOffset, defaultImageOffset);
  const password = args.password ?? defaultPassword;
  const authorMode = normalizeAuthorMode(args["author-mode"] ?? defaultAuthorMode);
  const fixedAuthor = buildFixedAuthorAccount({
    username: args["author-username"] ?? defaultAuthorUsername,
    displayName: args["author-display-name"] ?? defaultAuthorDisplayName,
    bio: args["author-bio"] ?? defaultAuthorBio,
    headline: args["author-headline"] ?? defaultAuthorHeadline
  });
  const skipSourcePairsFile = args["skip-source-pairs-file"] ?? defaultSkipSourcePairsFile;
  const skipSourcePairs = loadSkipSourcePairs(skipSourcePairsFile);
  const state = loadState(stateFile);
  const sessionCache = new Map();
  const summary = {
    backendBaseUrl,
    dryRun,
    stateFile,
    authorMode,
    authorUsername: authorMode === "fixed" ? fixedAuthor.username : null,
    skipSourcePairsFile: skipSourcePairsFile || null,
    skipSourcePairsCount: skipSourcePairs.size,
    requestedKinds,
    imported: [],
    skipped: []
  };

  const items = collectItemsForKinds(
    requestedKinds,
    {
      seedance: seedanceLimit,
      defaultImage: defaultImageLimit,
      nano: nanoLimit,
      "gpt-comic": gptComicLimit,
      "nano-comic": nanoComicLimit,
      "awesome-gpt-image-2": awesomeLimit
    },
    {
      seedance: seedanceOffset,
      defaultImage: defaultImageOffset,
      nano: nanoOffset,
      "gpt-comic": gptComicOffset,
      "nano-comic": nanoComicOffset,
      "awesome-gpt-image-2": awesomeOffset
    }
  );

  for (const item of items) {
    if (state.items[item.key]?.status === "published") {
      summary.skipped.push({ key: item.key, reason: "already-imported" });
      continue;
    }

    const sourcePairKey = buildSourcePairKey(item.sourceCampaign, item.sourceItemId);
    if (skipSourcePairs.has(sourcePairKey)) {
      summary.skipped.push({ key: item.key, reason: "existing-source-item" });
      continue;
    }

    const author = buildAuthorAccount(item, {
      mode: authorMode,
      fixedAuthor
    });
    if (dryRun) {
      summary.imported.push({ key: item.key, username: author.username, dryRun: true });
      continue;
    }

    let session = sessionCache.get(author.username);
    if (!session) {
      const token = await login(backendBaseUrl, author.username, password);
      await updateProfile(backendBaseUrl, token, {
        displayName: author.displayName,
        bio: author.bio,
        headline: author.headline,
        avatarAssetId: null,
        avatarUrl: null
      });
      session = { token };
      sessionCache.set(author.username, session);
    }

    const sourceAssetId = await uploadAsset(backendBaseUrl, session.token, item);
    const coverAssetId =
      item.categoryCode === "video_prompt" ? await uploadPromptCoverAsset(backendBaseUrl, session.token, item) : null;
    const draftId = await createDraft(backendBaseUrl, session.token);
    await updateDraft(backendBaseUrl, session.token, draftId, {
      title: item.title,
      summary: item.summary,
      categoryCode: item.categoryCode,
      promptText: item.promptText,
      promptTextZh: item.promptTextZh,
      promptTextEn: item.promptTextEn,
      promptTextRaw: item.promptTextRaw,
      modelName: item.modelName,
      modelCategory: item.modelCategory,
      contentCategory: item.contentCategory,
      compositionCategory: item.compositionCategory,
      sourcePlatform: item.sourcePlatform,
      sourceCampaign: item.sourceCampaign,
      sourceItemId: item.sourceItemId,
      sourceUrl: item.sourceUrl,
      publishedAt: item.publishedAt || null,
      tagNames: item.tags,
      workflowId: null,
      visibility: "public",
      coverAssetId,
      sourceAssetId
    });

    const submitResult = await submitDraft(backendBaseUrl, session.token, draftId);
    await verifyPrompt(backendBaseUrl, submitResult.videoId);

    state.items[item.key] = {
      status: "published",
      username: author.username,
      sourceAssetId,
      coverAssetId,
      targetId: submitResult.videoId,
      publishedAt: item.publishedAt || null,
      importedAt: new Date().toISOString()
    };
    saveState(stateFile, state);

    summary.imported.push({
      key: item.key,
      username: author.username,
      targetId: submitResult.videoId,
      assetId: sourceAssetId,
      coverAssetId
    });
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
