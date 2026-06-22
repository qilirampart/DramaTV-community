import { execFileSync, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPromptTaxonomy } from "./lib/prompt-taxonomy.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const codexRoot = path.join(projectRoot, ".codex");

const importNamespace = "2d3b91f4-c745-4f84-b8c5-5f5f8fdaf0dd";
const defaultResearchRoot = path.join(projectRoot, "artifacts", "cloud-import-src", "seedance-current-20260619");
const defaultOutputFile = path.join(
  projectRoot,
  "artifacts",
  "youmind-import",
  "latest",
  "seedance-current-cloud-localfs-summary.json"
);
const defaultLocalBatchWorkRoot = path.join(
  projectRoot,
  "artifacts",
  "youmind-import",
  "tmp",
  "batch-work"
);
const defaultLocalArchiveRoot = path.join(
  projectRoot,
  "artifacts",
  "youmind-import",
  "tmp",
  "archives"
);
const defaultRemoteMediaRoot = "/opt/dramatv-community-server/shared/media";
const defaultRemoteTempRoot = "/tmp/dramatv-seedance-import";
const puttyHostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk";
const seedanceLibraryPattern = /^youmind-seedance-library(?:-p\d{3}-p\d{3})?$/;
const defaultFfmpeg = "C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe";
const defaultFfprobe = "C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffprobe.exe";

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

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

function toNonNegativeInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
}

function toBoolean(value, fallback = false) {
  if (value == null || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return /^(1|true|yes|on)$/i.test(String(value).trim());
}

function safeText(value) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

function repairText(value) {
  const text = safeText(value);
  if (!text || !/(脙.|芒.|茂录|茂陆|冒鸥)/.test(text)) {
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

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

function normalizePublishedAt(value) {
  const text = safeText(value);
  if (!text) {
    return new Date().toISOString();
  }

  const directParsed = new Date(text);
  if (!Number.isNaN(directParsed.getTime())) {
    return directParsed.toISOString();
  }

  const zhDateMatch = text.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s+(\d{1,2})[:：](\d{1,2})(?:[:：](\d{1,2}))?)?$/);
  if (zhDateMatch) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] = zhDateMatch;
    const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}Z`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  const compactDateMatch = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (compactDateMatch) {
    const [, year, month, day] = compactDateMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`;
  }

  return new Date().toISOString();
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

function uuidV5(name, namespace = importNamespace) {
  const namespaceBytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const nameBytes = Buffer.from(name, "utf8");
  const hash = crypto.createHash("sha1").update(namespaceBytes).update(nameBytes).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function sqlLiteral(value) {
  if (value == null || value === "") {
    return "null";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlArray(values) {
  const normalized = [...new Set(values.map((value) => safeText(value)).filter(Boolean))];
  if (normalized.length === 0) {
    return "'{}'::text[]";
  }
  return `array[${normalized.map(sqlLiteral).join(", ")}]::text[]`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function removePath(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function copyFile(sourcePath, targetPath) {
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
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

function findFfprobe() {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH;
  }
  if (fs.existsSync(defaultFfprobe)) {
    return defaultFfprobe;
  }
  return "ffprobe";
}

function probeVideo(filePath) {
  const result = execFileSync(
    findFfprobe(),
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,duration",
      "-of",
      "json",
      filePath
    ],
    { encoding: "utf8", windowsHide: true }
  );
  const payload = JSON.parse(result);
  const stream = payload.streams?.[0];
  if (!stream?.width || !stream?.height) {
    throw new Error(`ffprobe missing video stream for ${filePath}`);
  }
  return {
    width: Number(stream.width),
    height: Number(stream.height),
    durationMs: Number.isFinite(Number(stream.duration)) ? Math.round(Number(stream.duration) * 1000) : null
  };
}

function extractCover(sourceVideoPath, outputPath) {
  ensureDir(path.dirname(outputPath));
  execFileSync(
    findFfmpeg(),
    ["-y", "-ss", "0.2", "-i", sourceVideoPath, "-frames:v", "1", "-q:v", "2", outputPath],
    { stdio: "ignore", windowsHide: true }
  );
  if (!fs.existsSync(outputPath)) {
    throw new Error(`cover extraction failed for ${sourceVideoPath}`);
  }
}

function fileSize(filePath) {
  return fs.statSync(filePath).size;
}

function resolveResourcePath(projectPath, explicitPath) {
  if (explicitPath) {
    const absolutePath = path.isAbsolute(explicitPath) ? explicitPath : path.join(projectPath, explicitPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`resource file not found: ${absolutePath}`);
    }
    return absolutePath;
  }

  const preferredCandidates = [
    path.join(codexRoot, "测试环境资源清单.md"),
    path.join(codexRoot, "测试环境资源清单.MD")
  ];
  for (const candidate of preferredCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const candidates = fs
    .readdirSync(codexRoot)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(codexRoot, name));

  for (const candidate of candidates) {
    const content = fs.readFileSync(candidate, "utf8");
    if (
      /\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(content)
      && /\.pg\.rds\.aliyuncs\.com/.test(content)
      && /\.redis\.rds\.aliyuncs\.com/.test(content)
      && /oss-cn-beijing-internal\.aliyuncs\.com/.test(content)
    ) {
      return candidate;
    }
  }

  throw new Error("could not auto-discover the test environment resource file under .codex");
}

function readMaybeLatin1(filePath) {
  const buffer = fs.readFileSync(filePath);
  const utf8 = buffer.toString("utf8");
  if (!utf8.includes("\uFFFD")) {
    return utf8;
  }
  return Buffer.from(buffer).toString("latin1");
}

function getRequiredMatch(input, pattern, label) {
  const match = input.match(pattern);
  if (!match) {
    throw new Error(`could not parse ${label} from resource file`);
  }
  return match[1].trim();
}

function getNormalizedLines(input) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getLineValue(line) {
  const colonIndex = Math.max(line.lastIndexOf(":"), line.lastIndexOf("："));
  if (colonIndex >= 0) {
    return line.slice(colonIndex + 1).trim();
  }
  return line.trim();
}

function findLineIndexByValue(lines, expectedValue, startIndex = 0) {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (getLineValue(lines[index]) === expectedValue) {
      return index;
    }
  }
  return -1;
}

function getNextValueAfterIndex(lines, startIndex, label, valuePattern = /.+/) {
  if (startIndex < 0) {
    throw new Error(`could not locate the anchor for ${label}`);
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const value = getLineValue(lines[index]);
    if (value && valuePattern.test(value)) {
      return value;
    }
  }

  throw new Error(`could not parse ${label} from resource file`);
}

function parseResourceFile(filePath) {
  const input = readMaybeLatin1(filePath);
  const lines = getNormalizedLines(input);
  const serverHost = getRequiredMatch(
    input,
    /(?:^|\r?\n)\s*(\d{1,3}(?:\.\d{1,3}){3})\s*(?:\r?\n|$)/,
    "server host"
  );
  const rootLineIndex = lines.findIndex((line) => /root$/i.test(line));
  const serverPassword = getNextValueAfterIndex(lines, rootLineIndex, "server password");
  const dbHost = getRequiredMatch(input, /([A-Za-z0-9.-]+\.pg\.rds\.aliyuncs\.com)/, "database host");
  const dbHostIndex = findLineIndexByValue(lines, dbHost);
  const dbPort = Number(getNextValueAfterIndex(lines, dbHostIndex, "database port", /^\d{2,5}$/));
  const dbPortIndex = findLineIndexByValue(lines, String(dbPort), dbHostIndex + 1);
  const dbName = getNextValueAfterIndex(lines, dbPortIndex, "database name");
  const dbNameIndex = findLineIndexByValue(lines, dbName, dbPortIndex + 1);
  const dbUser = getNextValueAfterIndex(lines, dbNameIndex, "database user");
  const dbUserIndex = findLineIndexByValue(lines, dbUser, dbNameIndex + 1);
  const dbPassword = getNextValueAfterIndex(lines, dbUserIndex, "database password");
  return { serverHost, serverPassword, dbHost, dbPort, dbName, dbUser, dbPassword };
}

function shQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function runFile(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd ?? projectRoot,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 128 * 1024 * 1024
    }).trim();
  } catch (error) {
    const stdout = typeof error?.stdout === "string" ? error.stdout : error?.stdout?.toString?.("utf8") ?? "";
    const stderr = typeof error?.stderr === "string" ? error.stderr : error?.stderr?.toString?.("utf8") ?? "";
    throw new Error(`command failed: ${command} ${args.join(" ")}\n${stdout}\n${stderr}`.trim());
  }
}

function runRemotePsqlWithStdin(resource, sql) {
  const plinkPath = path.join(projectRoot, ".tools", "putty", "plink.exe");
  if (!fs.existsSync(plinkPath)) {
    throw new Error(`plink not found: ${plinkPath}`);
  }

  const remoteCommand = [
    "PGPASSWORD=" + shQuote(resource.dbPassword),
    "psql",
    "-h",
    shQuote(resource.dbHost),
    "-p",
    shQuote(String(resource.dbPort)),
    "-U",
    shQuote(resource.dbUser),
    "-d",
    shQuote(resource.dbName),
    "-X",
    "-q",
    "-t",
    "-A",
    "-v",
    shQuote("ON_ERROR_STOP=1")
  ].join(" ");

  return new Promise((resolve, reject) => {
    const child = spawn(
      plinkPath,
      [
        "-ssh",
        "-batch",
        "-hostkey",
        puttyHostKey,
        `root@${resource.serverHost}`,
        "-pw",
        resource.serverPassword,
        `bash -lc ${shQuote(remoteCommand)}`
      ],
      {
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(`remote psql exited with code ${code}\n${stderr || stdout}`));
    });

    child.stdin.end(sql);
  });
}

function listSeedanceRoots(videoLibraryRoot) {
  return fs
    .readdirSync(videoLibraryRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && seedanceLibraryPattern.test(entry.name))
    .map((entry) => path.join(videoLibraryRoot, entry.name))
    .sort((left, right) => left.localeCompare(right, "en"));
}

function collectSeedanceItems(researchRoot, offset, limit) {
  const videoLibraryRoot = path.join(researchRoot, "youmind-video-assets");
  const items = [];
  const seen = new Set();
  const targetCount = limit === 0 ? Number.POSITIVE_INFINITY : limit;
  let eligibleIndex = 0;

  for (const libraryRoot of listSeedanceRoots(videoLibraryRoot)) {
    const manifestPath = path.join(libraryRoot, "library-manifest.json");
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const manifest = loadJson(manifestPath);
    for (const entry of manifest) {
      if (entry.grade !== "A") {
        continue;
      }

      const folder = safeText(entry.folder);
      if (!folder) {
        continue;
      }

      const itemRoot = path.join(libraryRoot, folder);
      const metaPath = path.join(itemRoot, "meta.json");
      const videoPath = path.join(itemRoot, "video.mp4");
      if (!fs.existsSync(metaPath) || !fs.existsSync(videoPath)) {
        continue;
      }

      const meta = loadJson(metaPath);
      const sourceItemId = String(meta.id ?? entry.id ?? "").trim();
      if (!sourceItemId || seen.has(sourceItemId)) {
        continue;
      }
      seen.add(sourceItemId);

      const promptZh = readText(path.join(itemRoot, "prompt.zh.txt"));
      const promptEn = readText(path.join(itemRoot, "prompt.en.txt"));
      const promptText = promptZh || promptEn;
      if (!promptText) {
        continue;
      }

      if (eligibleIndex < offset) {
        eligibleIndex += 1;
        continue;
      }

      const title = trimTo(meta.title || entry.title || `Seedance ${sourceItemId}`, 160);
      const summary = summarizePrompt(promptText);
      const taxonomy = classifyPromptTaxonomy({
        modality: "video",
        title,
        summary,
        promptText,
        modelName: "Seedance 2.0",
        sourceCampaign: "youmind-seedance"
      });
      const probe = probeVideo(videoPath);
      items.push({
        sourceItemId,
        title,
        summary,
        promptText,
        promptTextZh: promptZh || null,
        promptTextEn: promptEn || null,
        promptTextRaw: promptEn || promptZh || promptText,
        modelName: "Seedance 2.0",
        sourcePlatform: "youmind",
        sourceCampaign: "youmind-seedance",
        sourceUrl: safeText(meta.sourceLink || entry.sourceLink),
        publishedAt: normalizePublishedAt(meta.sourcePublishedAt),
        thumbnailUrl: safeText(meta.thumbnail),
        tags: taxonomy.standardTags,
        modelCategory: taxonomy.modelCategory,
        contentCategory: taxonomy.contentCategory,
        compositionCategory: taxonomy.compositionCategory,
        videoPath,
        fileName: path.basename(videoPath),
        sizeBytes: fileSize(videoPath),
        width: probe.width,
        height: probe.height,
        durationMs: probe.durationMs
      });
      eligibleIndex += 1;

      if (items.length >= targetCount) {
        return items;
      }
    }
  }

  return items;
}

function buildObjectKey(sourceItemId, title, kind) {
  const slug = slugify(title).slice(0, 48);
  if (kind === "video") {
    return `community/test/imports/youmind-seedance/video/source/${sourceItemId}-${slug}.mp4`;
  }
  return `community/test/imports/youmind-seedance/image/cover/${sourceItemId}-${slug}.jpg`;
}

function buildExistingQuery() {
  return `
select source_item_id
from prompt_entries
where source_platform = 'youmind'
  and source_campaign = 'youmind-seedance'
  and publish_status = 'published'
  and deleted_at is null
order by source_item_id asc;
`;
}

function parseExistingSourceIds(text) {
  return new Set(
    safeText(text)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  );
}

function buildLookupQuery(username) {
  return `
select id::text
from users
where username = ${sqlLiteral(username)}
  and deleted_at is null
limit 1;
`;
}

function buildAssetSql(asset) {
  return `
insert into media_assets (
    id, asset_kind, asset_role, biz_type, biz_id, storage_provider, bucket_name, object_key,
    file_name, mime_type, size_bytes, width, height, duration_ms, checksum,
    status_code, is_public, created_by, created_at, updated_at
) values (
    ${sqlLiteral(asset.id)}::uuid,
    ${sqlLiteral(asset.assetKind)},
    ${sqlLiteral(asset.assetRole)},
    'prompt',
    ${sqlLiteral(asset.promptId)}::uuid,
    ${sqlLiteral(asset.storageProvider)},
    ${sqlLiteral(asset.bucketName)},
    ${sqlLiteral(asset.objectKey)},
    ${sqlLiteral(asset.fileName)},
    ${sqlLiteral(asset.mimeType)},
    ${asset.sizeBytes ?? "null"},
    ${asset.width ?? "null"},
    ${asset.height ?? "null"},
    ${asset.durationMs ?? "null"},
    ${sqlLiteral(asset.checksum)},
    'ready',
    true,
    ${sqlLiteral(asset.createdBy)}::uuid,
    now(),
    now()
)
on conflict (id) do update set
    asset_kind = excluded.asset_kind,
    asset_role = excluded.asset_role,
    biz_type = excluded.biz_type,
    biz_id = excluded.biz_id,
    storage_provider = excluded.storage_provider,
    bucket_name = excluded.bucket_name,
    object_key = excluded.object_key,
    file_name = excluded.file_name,
    mime_type = excluded.mime_type,
    size_bytes = excluded.size_bytes,
    width = excluded.width,
    height = excluded.height,
    duration_ms = excluded.duration_ms,
    checksum = excluded.checksum,
    status_code = excluded.status_code,
    is_public = excluded.is_public,
    created_by = excluded.created_by,
    updated_at = now();
`;
}

function buildPromptSql(prompt) {
  return `
insert into prompt_entries (
    id, author_id, title, summary, modality, prompt_text, prompt_text_zh,
    prompt_text_en, prompt_text_raw, model_name, model_category, content_category, composition_category,
    source_platform, source_campaign, source_item_id, source_url,
    visibility, publish_status, cover_asset_id, primary_example_asset_id, tag_names,
    example_count, like_count, favorite_count, published_at, created_at, updated_at
) values (
    ${sqlLiteral(prompt.id)}::uuid,
    ${sqlLiteral(prompt.authorId)}::uuid,
    ${sqlLiteral(prompt.title)},
    ${sqlLiteral(prompt.summary)},
    'video',
    ${sqlLiteral(prompt.promptText)},
    ${sqlLiteral(prompt.promptTextZh)},
    ${sqlLiteral(prompt.promptTextEn)},
    ${sqlLiteral(prompt.promptTextRaw)},
    ${sqlLiteral(prompt.modelName)},
    ${sqlLiteral(prompt.modelCategory)},
    ${sqlLiteral(prompt.contentCategory)},
    ${sqlLiteral(prompt.compositionCategory)},
    ${sqlLiteral(prompt.sourcePlatform)},
    ${sqlLiteral(prompt.sourceCampaign)},
    ${sqlLiteral(prompt.sourceItemId)},
    ${sqlLiteral(prompt.sourceUrl)},
    'public',
    'published',
    ${sqlLiteral(prompt.coverAssetId)}::uuid,
    ${sqlLiteral(prompt.primaryExampleAssetId)}::uuid,
    ${sqlArray(prompt.tags)},
    1,
    0,
    0,
    ${sqlLiteral(prompt.publishedAt)}::timestamptz,
    now(),
    now()
)
on conflict (id) do update set
    author_id = excluded.author_id,
    title = excluded.title,
    summary = excluded.summary,
    modality = excluded.modality,
    prompt_text = excluded.prompt_text,
    prompt_text_zh = excluded.prompt_text_zh,
    prompt_text_en = excluded.prompt_text_en,
    prompt_text_raw = excluded.prompt_text_raw,
    model_name = excluded.model_name,
    model_category = excluded.model_category,
    content_category = excluded.content_category,
    composition_category = excluded.composition_category,
    source_platform = excluded.source_platform,
    source_campaign = excluded.source_campaign,
    source_item_id = excluded.source_item_id,
    source_url = excluded.source_url,
    cover_asset_id = excluded.cover_asset_id,
    primary_example_asset_id = excluded.primary_example_asset_id,
    tag_names = excluded.tag_names,
    example_count = excluded.example_count,
    published_at = excluded.published_at,
    updated_at = now();
`;
}

function buildLinkSql(promptId, mediaAssetId) {
  return `
insert into prompt_example_links (
    id, prompt_id, media_asset_id, role_code, sort_order, created_at
) values (
    ${sqlLiteral(uuidV5(`prompt-link:${promptId}:${mediaAssetId}`))}::uuid,
    ${sqlLiteral(promptId)}::uuid,
    ${sqlLiteral(mediaAssetId)}::uuid,
    'example',
    0,
    now()
)
on conflict (prompt_id, media_asset_id) do update set
    role_code = excluded.role_code,
    sort_order = excluded.sort_order;
`;
}

function buildDerivativeTaskSql(promptId, sourceAssetId) {
  const payload = {
    sourceAssetId,
    targetType: "prompt",
    targetId: promptId,
    submitMode: "backfill",
    reason: "youmind-seedance-current-cloud-import",
    desiredOutputs: ["cover", "duration", "preview"]
  };

  return `
insert into async_task_records (
    id, task_type, target_type, target_id, queue_name, priority_level,
    status_code, payload_json, retry_count, max_retry_count, scheduled_at, created_at, updated_at
)
select
    ${sqlLiteral(crypto.randomUUID())}::uuid,
    'video_media_process',
    'prompt',
    ${sqlLiteral(promptId)}::uuid,
    'media-processing',
    4,
    'queued',
    cast(${sqlLiteral(JSON.stringify(payload))} as jsonb),
    0,
    3,
    now(),
    now(),
    now()
where not exists (
    select 1
    from async_task_records task
    where task.task_type = 'video_media_process'
      and task.target_type = 'prompt'
      and task.target_id = ${sqlLiteral(promptId)}::uuid
      and task.queue_name = 'media-processing'
      and task.status_code in ('queued', 'processing')
);
`;
}

function buildBatchSql(authorId, entries) {
  const statements = ["begin;"];

  for (const entry of entries) {
    statements.push(buildAssetSql(entry.videoAsset));
    statements.push(buildAssetSql(entry.coverAsset));
    statements.push(
      buildPromptSql({
        id: entry.promptId,
        authorId,
        title: entry.title,
        summary: entry.summary,
        promptText: entry.promptText,
        promptTextZh: entry.promptTextZh,
        promptTextEn: entry.promptTextEn,
        promptTextRaw: entry.promptTextRaw,
        modelName: entry.modelName,
        modelCategory: entry.modelCategory,
        contentCategory: entry.contentCategory,
        compositionCategory: entry.compositionCategory,
        sourcePlatform: entry.sourcePlatform,
        sourceCampaign: entry.sourceCampaign,
        sourceItemId: entry.sourceItemId,
        sourceUrl: entry.sourceUrl,
        publishedAt: entry.publishedAt,
        coverAssetId: entry.coverAsset.id,
        primaryExampleAssetId: entry.videoAsset.id,
        tags: entry.tags
      })
    );
    statements.push(buildLinkSql(entry.promptId, entry.videoAsset.id));
    statements.push(buildDerivativeTaskSql(entry.promptId, entry.videoAsset.id));
  }

  statements.push("commit;");
  return statements.join("\n\n");
}

function prepareImportEntries(items, localBatchDir, authorId) {
  const prepared = [];

  for (const item of items) {
    const promptId = uuidV5(`prompt:youmind:seedance-current:${item.sourceItemId}`);
    const videoAssetId = uuidV5(`asset:youmind:seedance-current:${item.sourceItemId}:source`);
    const coverAssetId = uuidV5(`asset:youmind:seedance-current:${item.sourceItemId}:cover`);
    const videoObjectKey = buildObjectKey(item.sourceItemId, item.title, "video");
    const localVideoTarget = path.join(localBatchDir, ...videoObjectKey.split("/"));
    copyFile(item.videoPath, localVideoTarget);

    let coverAsset;
    if (item.thumbnailUrl.startsWith("http://") || item.thumbnailUrl.startsWith("https://")) {
      coverAsset = {
        id: coverAssetId,
        promptId,
        createdBy: authorId,
        assetKind: "image",
        assetRole: "cover",
        storageProvider: "external-url",
        bucketName: "remote-thumbnail",
        objectKey: item.thumbnailUrl,
        fileName: `${item.sourceItemId}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: null,
        width: null,
        height: null,
        durationMs: null,
        checksum: crypto.createHash("sha1").update(item.thumbnailUrl).digest("hex")
      };
    } else {
      const coverObjectKey = buildObjectKey(item.sourceItemId, item.title, "cover");
      const localCoverTarget = path.join(localBatchDir, ...coverObjectKey.split("/"));
      extractCover(item.videoPath, localCoverTarget);
      coverAsset = {
        id: coverAssetId,
        promptId,
        createdBy: authorId,
        assetKind: "image",
        assetRole: "cover",
        storageProvider: "local_fs",
        bucketName: "dramatv-local-media",
        objectKey: coverObjectKey,
        fileName: path.basename(localCoverTarget),
        mimeType: "image/jpeg",
        sizeBytes: fileSize(localCoverTarget),
        width: null,
        height: null,
        durationMs: null,
        checksum: crypto.createHash("sha256").update(fs.readFileSync(localCoverTarget)).digest("hex")
      };
    }

    prepared.push({
      ...item,
      promptId,
      videoAsset: {
        id: videoAssetId,
        promptId,
        createdBy: authorId,
        assetKind: "video",
        assetRole: "source",
        storageProvider: "local_fs",
        bucketName: "dramatv-local-media",
        objectKey: videoObjectKey,
        fileName: path.basename(localVideoTarget),
        mimeType: "video/mp4",
        sizeBytes: item.sizeBytes,
        width: item.width,
        height: item.height,
        durationMs: item.durationMs,
        checksum: crypto.createHash("sha256").update(fs.readFileSync(item.videoPath)).digest("hex")
      },
      coverAsset
    });
  }

  return prepared;
}

function uploadBatchArchive(resource, localBatchDir, remoteTempRoot, remoteMediaRoot, batchLabel, localArchiveRoot) {
  const pscpPath = path.join(projectRoot, ".tools", "putty", "pscp.exe");
  const plinkPath = path.join(projectRoot, ".tools", "putty", "plink.exe");
  const tarPath = process.env.SystemRoot ? path.join(process.env.SystemRoot, "System32", "tar.exe") : "tar.exe";
  ensureDir(localArchiveRoot);
  const archivePath = path.join(localArchiveRoot, `${batchLabel}.tar.gz`);
  removePath(archivePath);
  runFile(tarPath, ["-czf", archivePath, "-C", localBatchDir, "."], { cwd: projectRoot });

  const remoteArchivePath = `${remoteTempRoot.replace(/\/+$/, "")}/${batchLabel}.tar.gz`;
  runFile(plinkPath, [
    "-ssh",
    "-batch",
    "-hostkey",
    puttyHostKey,
    `root@${resource.serverHost}`,
    "-pw",
    resource.serverPassword,
    `mkdir -p ${shQuote(remoteTempRoot)} ${shQuote(remoteMediaRoot)}`
  ]);

  runFile(pscpPath, [
    "-batch",
    "-hostkey",
    puttyHostKey,
    "-pw",
    resource.serverPassword,
    archivePath,
    `root@${resource.serverHost}:${remoteArchivePath}`
  ]);

  runFile(plinkPath, [
    "-ssh",
    "-batch",
    "-hostkey",
    puttyHostKey,
    `root@${resource.serverHost}`,
    "-pw",
    resource.serverPassword,
    `mkdir -p ${shQuote(remoteTempRoot)} ${shQuote(remoteMediaRoot)} && tar -xzf ${shQuote(remoteArchivePath)} -C ${shQuote(remoteMediaRoot)} && rm -f ${shQuote(remoteArchivePath)}`
  ]);

  return archivePath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const researchRoot = path.resolve(args["research-root"] ?? defaultResearchRoot);
  const resourceFile = resolveResourcePath(projectRoot, args["resource-file"]);
  const resource = parseResourceFile(resourceFile);
  const offset = toNonNegativeInt(args.offset, 0);
  const limit = toNonNegativeInt(args.limit, 10);
  const batchSize = toPositiveInt(args["batch-size"], 10);
  const dryRun = toBoolean(args["dry-run"], false);
  const remoteMediaRoot = args["remote-media-root"] ?? defaultRemoteMediaRoot;
  const remoteTempRoot = args["remote-temp-root"] ?? defaultRemoteTempRoot;
  const localBatchWorkRoot = path.resolve(args["local-batch-work-root"] ?? defaultLocalBatchWorkRoot);
  const localArchiveRoot = path.resolve(args["local-archive-root"] ?? defaultLocalArchiveRoot);
  const authorUsername = args["author-username"] ?? "community";
  const outputFile = path.resolve(args.output ?? defaultOutputFile);

  const authorId = await runRemotePsqlWithStdin(resource, buildLookupQuery(authorUsername));
  if (!authorId) {
    throw new Error(`author not found on cloud: ${authorUsername}`);
  }

  const existingSourceIds = parseExistingSourceIds(
    await runRemotePsqlWithStdin(resource, buildExistingQuery())
  );

  const collected = collectSeedanceItems(researchRoot, offset, limit);
  const pendingItems = collected.filter((item) => !existingSourceIds.has(item.sourceItemId));
  const summary = {
    generatedAt: new Date().toISOString(),
    researchRoot,
    offset,
    limit,
    batchSize,
    authorUsername,
    authorId,
    collectedCount: collected.length,
    skippedExistingCount: collected.length - pendingItems.length,
    importedBatches: [],
    dryRun
  };

  for (let index = 0; index < pendingItems.length; index += batchSize) {
    const batchItems = pendingItems.slice(index, index + batchSize);
    const batchLabel = `seedance-current-${offset + index}-${offset + index + batchItems.length - 1}`;
    const localBatchDir = path.join(localBatchWorkRoot, batchLabel);
    cleanDir(localBatchDir);
    const entries = prepareImportEntries(batchItems, localBatchDir, authorId);
    let archivePath = null;

    if (!dryRun) {
      archivePath = uploadBatchArchive(
        resource,
        localBatchDir,
        remoteTempRoot,
        remoteMediaRoot,
        batchLabel,
        localArchiveRoot
      );
      try {
        await runRemotePsqlWithStdin(resource, buildBatchSql(authorId, entries));
      } finally {
        if (archivePath) {
          removePath(archivePath);
        }
        removePath(localBatchDir);
      }
    }

    summary.importedBatches.push({
      batchLabel,
      itemCount: entries.length,
      sourceItemIds: entries.map((entry) => entry.sourceItemId),
      promptIds: entries.map((entry) => entry.promptId)
    });
  }

  writeJson(outputFile, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
