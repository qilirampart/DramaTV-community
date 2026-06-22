import { execFileSync, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPromptTaxonomy } from "./lib/prompt-taxonomy.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const codexRoot = path.join(projectRoot, ".codex");

const importNamespace = "2d3b91f4-c745-4f84-b8c5-5f5f8fdaf0dd";
const defaultLibraryRoot = path.join(
  projectRoot,
  "docs",
  "02_研究",
  "youmind-image-assets",
  "gpt-image-2-comic-storyboard-library-views-20260619-top500"
);
const defaultOutputFile = path.join(
  projectRoot,
  "artifacts",
  "youmind-import",
  "latest",
  "image-library-cloud-localfs-summary.json"
);
const defaultLocalBatchWorkRoot = path.join(
  projectRoot,
  "artifacts",
  "youmind-import",
  "tmp",
  "image-batch-work"
);
const defaultLocalArchiveRoot = path.join(
  projectRoot,
  "artifacts",
  "youmind-import",
  "tmp",
  "image-archives"
);
const defaultRemoteMediaRoot = "/opt/dramatv-community-server/shared/media";
const defaultRemoteTempRoot = "/tmp/dramatv-image-import";
const puttyHostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk";

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

function fileSize(filePath) {
  return fs.statSync(filePath).size;
}

function fileChecksum(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function guessMimeType(filePath, fallback = "image/jpeg") {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return fallback;
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

function sortImageFiles(imageDir) {
  return fs
    .readdirSync(imageDir)
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .sort((left, right) => left.localeCompare(right, "en"));
}

function collectImageItems(libraryRoot, offset, limit) {
  const manifestPath = path.join(libraryRoot, "library-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`image manifest not found: ${manifestPath}`);
  }

  const manifest = loadJson(manifestPath);
  const items = [];
  const targetCount = limit === 0 ? Number.POSITIVE_INFINITY : limit;
  let eligibleIndex = 0;

  for (const entry of manifest) {
    if (entry.grade !== "A") {
      continue;
    }

    const itemRoot = path.join(libraryRoot, safeText(entry.folder));
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
    const promptZh = readText(path.join(itemRoot, "prompt.zh.txt"));
    const promptEn = readText(path.join(itemRoot, "prompt.en.txt"));
    const promptText = promptZh || promptEn || promptRaw;
    if (!promptText) {
      continue;
    }

    if (eligibleIndex < offset) {
      eligibleIndex += 1;
      continue;
    }

    const title = trimTo(repairText(meta.title || entry.title || entry.folder), 160);
    const summary = trimTo(
      repairText(readText(path.join(itemRoot, "summary.txt")) || meta.description || summarizePrompt(promptText)),
      512
    );
    const modelName = repairText(meta.model || "GPT-Image-2");
    const sourceCampaign = repairText(meta.campaign || "gpt-image-2-prompts");
    const sourcePlatform = repairText(meta.sourcePlatform || "youmind");
    const extraSignals = [
      safeText(meta.categories),
      safeText(entry.categories)
    ].filter(Boolean);
    const taxonomy = classifyPromptTaxonomy({
      modality: "image",
      title,
      summary,
      promptText,
      modelName,
      sourceCampaign,
      extraSignals
    });

    items.push({
      folder: entry.folder,
      title,
      summary,
      promptText,
      promptTextZh: promptZh || null,
      promptTextEn: promptEn || null,
      promptTextRaw: promptRaw || promptText,
      sourcePlatform,
      sourceCampaign,
      sourceItemId: String(meta.id ?? entry.id ?? entry.folder),
      sourceUrl: safeText(meta.sourceLink || entry.sourceLink),
      publishedAt: normalizePublishedAt(meta.sourcePublishedAt),
      modelName,
      modelCategory: taxonomy.modelCategory,
      contentCategory: taxonomy.contentCategory,
      compositionCategory: taxonomy.compositionCategory,
      tags: taxonomy.standardTags,
      imagePaths: imageFiles.map((fileName) => path.join(imageDir, fileName))
    });
    eligibleIndex += 1;

    if (items.length >= targetCount) {
      return items;
    }
  }

  return items;
}

function buildExistingQuery(campaigns) {
  const normalizedCampaigns = [...new Set(campaigns.map((campaign) => safeText(campaign)).filter(Boolean))];
  if (normalizedCampaigns.length === 0) {
    throw new Error("no source campaigns supplied for existing query");
  }

  return `
select source_campaign || '|' || source_item_id
from prompt_entries
where source_platform = 'youmind'
  and source_campaign = any(${sqlArray(normalizedCampaigns)})
  and publish_status = 'published'
  and deleted_at is null
order by source_campaign asc, source_item_id asc;
`;
}

function parseExistingSourcePairs(text) {
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

function buildObjectKey(item, sortOrder, filePath) {
  const campaignSlug = slugify(item.sourceCampaign).slice(0, 32);
  const titleSlug = slugify(item.title).slice(0, 48);
  const ext = path.extname(filePath).toLowerCase() || ".jpg";
  const order = String(sortOrder + 1).padStart(2, "0");
  return `community/test/imports/youmind-image-library/${campaignSlug}/${item.sourceItemId}-${titleSlug}-${order}${ext}`;
}

function prepareImportEntries(items, localBatchDir, authorId) {
  const prepared = [];

  for (const item of items) {
    const promptId = uuidV5(`prompt:youmind:image-library:${item.sourceCampaign}:${item.sourceItemId}`);
    const assets = item.imagePaths.map((imagePath, sortOrder) => {
      const objectKey = buildObjectKey(item, sortOrder, imagePath);
      const localTarget = path.join(localBatchDir, ...objectKey.split("/"));
      copyFile(imagePath, localTarget);
      return {
        id: uuidV5(`asset:youmind:image-library:${item.sourceCampaign}:${item.sourceItemId}:${sortOrder}`),
        promptId,
        createdBy: authorId,
        assetKind: "image",
        assetRole: "source",
        storageProvider: "local_fs",
        bucketName: "dramatv-local-media",
        objectKey,
        fileName: path.basename(localTarget),
        mimeType: guessMimeType(localTarget),
        sizeBytes: fileSize(localTarget),
        width: null,
        height: null,
        durationMs: null,
        checksum: fileChecksum(localTarget)
      };
    });

    prepared.push({
      ...item,
      promptId,
      assets,
      coverAssetId: assets[0].id,
      primaryExampleAssetId: assets[0].id
    });
  }

  return prepared;
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
    'image',
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
    ${prompt.exampleCount},
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

function buildLinkSql(promptId, mediaAssetId, sortOrder) {
  return `
insert into prompt_example_links (
    id, prompt_id, media_asset_id, role_code, sort_order, created_at
) values (
    ${sqlLiteral(uuidV5(`prompt-link:${promptId}:${mediaAssetId}`))}::uuid,
    ${sqlLiteral(promptId)}::uuid,
    ${sqlLiteral(mediaAssetId)}::uuid,
    'example',
    ${sortOrder},
    now()
)
on conflict (prompt_id, media_asset_id) do update set
    role_code = excluded.role_code,
    sort_order = excluded.sort_order;
`;
}

function buildBatchSql(authorId, entries) {
  const statements = ["begin;"];

  for (const entry of entries) {
    for (const asset of entry.assets) {
      statements.push(buildAssetSql(asset));
    }
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
        coverAssetId: entry.coverAssetId,
        primaryExampleAssetId: entry.primaryExampleAssetId,
        tags: entry.tags,
        exampleCount: entry.assets.length
      })
    );
    entry.assets.forEach((asset, sortOrder) => {
      statements.push(buildLinkSql(entry.promptId, asset.id, sortOrder));
    });
  }

  statements.push("commit;");
  return statements.join("\n\n");
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const libraryRoot = path.resolve(args["library-root"] ?? defaultLibraryRoot);
  const offset = toNonNegativeInt(args.offset, 0);
  const limit = toNonNegativeInt(args.limit, 100);
  const batchSize = toPositiveInt(args["batch-size"], 20);
  const dryRun = toBoolean(args["dry-run"], false);
  const authorUsername = args["author-username"] ?? "community";
  const remoteMediaRoot = args["remote-media-root"] ?? defaultRemoteMediaRoot;
  const remoteTempRoot = args["remote-temp-root"] ?? defaultRemoteTempRoot;
  const localBatchWorkRoot = path.resolve(args["local-batch-work-root"] ?? defaultLocalBatchWorkRoot);
  const localArchiveRoot = path.resolve(args["local-archive-root"] ?? defaultLocalArchiveRoot);
  const outputFile = path.resolve(args.output ?? defaultOutputFile);

  const collected = collectImageItems(libraryRoot, offset, limit);
  if (collected.length === 0) {
    throw new Error("no eligible image items found in the requested window");
  }

  if (dryRun) {
    const drySummary = {
      generatedAt: new Date().toISOString(),
      dryRun,
      libraryRoot,
      offset,
      limit,
      batchSize,
      collectedCount: collected.length,
      campaigns: [...new Set(collected.map((item) => item.sourceCampaign))],
      sample: collected.slice(0, 5).map((item) => ({
        folder: item.folder,
        sourceItemId: item.sourceItemId,
        title: item.title,
        imageCount: item.imagePaths.length,
        sourceCampaign: item.sourceCampaign,
        modelName: item.modelName,
        modelCategory: item.modelCategory,
        contentCategory: item.contentCategory,
        compositionCategory: item.compositionCategory
      }))
    };
    writeJson(outputFile, drySummary);
    process.stdout.write(`${JSON.stringify(drySummary, null, 2)}\n`);
    return;
  }

  const resourceFile = resolveResourcePath(projectRoot, args["resource-file"]);
  const resource = parseResourceFile(resourceFile);
  const authorId = await runRemotePsqlWithStdin(resource, buildLookupQuery(authorUsername));
  if (!authorId) {
    throw new Error(`author not found on cloud: ${authorUsername}`);
  }

  const existingSourcePairs = parseExistingSourcePairs(
    await runRemotePsqlWithStdin(resource, buildExistingQuery(collected.map((item) => item.sourceCampaign)))
  );
  const pendingItems = collected.filter(
    (item) => !existingSourcePairs.has(`${item.sourceCampaign}|${item.sourceItemId}`)
  );

  const summary = {
    generatedAt: new Date().toISOString(),
    dryRun,
    resourceFile,
    libraryRoot,
    offset,
    limit,
    batchSize,
    authorUsername,
    authorId,
    collectedCount: collected.length,
    skippedExistingCount: collected.length - pendingItems.length,
    importedBatches: []
  };

  for (let index = 0; index < pendingItems.length; index += batchSize) {
    const batchItems = pendingItems.slice(index, index + batchSize);
    const batchLabel = `youmind-image-library-${offset + index}-${offset + index + batchItems.length - 1}`;
    const localBatchDir = path.join(localBatchWorkRoot, batchLabel);
    cleanDir(localBatchDir);
    const entries = prepareImportEntries(batchItems, localBatchDir, authorId);
    let archivePath = null;

    try {
      archivePath = uploadBatchArchive(
        resource,
        localBatchDir,
        remoteTempRoot,
        remoteMediaRoot,
        batchLabel,
        localArchiveRoot
      );
      await runRemotePsqlWithStdin(resource, buildBatchSql(authorId, entries));
    } finally {
      if (archivePath) {
        removePath(archivePath);
      }
      removePath(localBatchDir);
    }

    summary.importedBatches.push({
      batchLabel,
      itemCount: entries.length,
      sourceItems: entries.map((entry) => ({
        sourceCampaign: entry.sourceCampaign,
        sourceItemId: entry.sourceItemId,
        promptId: entry.promptId,
        assetCount: entry.assets.length
      }))
    });
  }

  writeJson(outputFile, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
