import { execFileSync, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projectRoot, resolveLocalPostgresConfig, runLocalPsqlQuery } from "./lib/local-postgres.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicRoot = path.join(projectRoot, "apps", "web", "public");
const seedanceCatalogPath = path.join(publicRoot, "seedance-data.json");
const researchRoot = path.join(projectRoot, "docs", "02_研究");
const videoLibraryRoot = path.join(researchRoot, "youmind-video-assets");
const defaultOutputFile = path.join(projectRoot, "artifacts", "youmind-import", "latest", "cover-backfill-summary.json");
const defaultFfmpeg = "C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe";
const defaultPostgresContainer = process.env.DRAMATV_POSTGRES_CONTAINER || "dramatv-postgres";
const defaultLocalPort = Number(process.env.DRAMATV_CLOUD_DB_TUNNEL_PORT || 15432);
const importNamespace = "2d3b91f4-c745-4f84-b8c5-5f5f8fdaf0dd";
const seedanceLibraryPattern = /^youmind-seedance-library(?:-p\d{3}-p\d{3})?$/;
const seedanceCoverObjectPrefix = "seedance-covers";
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

function safeText(value) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

function isDirectUrl(value) {
  return /^https?:\/\//i.test(safeText(value));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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
  return `'${String(value).replace(/'/g, "''")}'`;
}

function listSeedanceRoots() {
  return fs
    .readdirSync(videoLibraryRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && seedanceLibraryPattern.test(entry.name))
    .map((entry) => path.join(videoLibraryRoot, entry.name))
    .sort((left, right) => left.localeCompare(right, "en"));
}

function collectSeedanceLookup() {
  const lookup = new Map();

  for (const libraryRoot of listSeedanceRoots()) {
    const manifestPath = path.join(libraryRoot, "library-manifest.json");
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const manifest = readJson(manifestPath);
    for (const entry of manifest) {
      if (entry.grade !== "A") {
        continue;
      }

      const itemRoot = path.join(libraryRoot, entry.folder);
      const metaPath = path.join(itemRoot, "meta.json");
      const videoPath = path.join(itemRoot, "video.mp4");
      if (!fs.existsSync(metaPath) || !fs.existsSync(videoPath)) {
        continue;
      }

      const meta = readJson(metaPath);
      const sourceItemId = String(meta.id ?? entry.id ?? "").trim();
      if (!sourceItemId) {
        continue;
      }

      lookup.set(`seedance:${sourceItemId}`, {
        key: `seedance:${sourceItemId}`,
        sourceItemId,
        title: safeText(meta.title || entry.title),
        thumbnailUrl: safeText(meta.thumbnail),
        videoPath
      });
    }
  }

  return lookup;
}

function publicFilePath(publicUrl) {
  if (!publicUrl?.startsWith("/")) {
    return null;
  }

  return path.join(publicRoot, publicUrl.slice(1).replace(/\//g, path.sep));
}

function collectRecords() {
  const catalog = readJson(seedanceCatalogPath);
  const lookup = collectSeedanceLookup();
  const catalogOverrides = new Map(
    (catalog.items ?? [])
      .map((item) => {
        const sourceItemId = String(item.id ?? "").replace(/^seedance-/, "").trim();
        return sourceItemId
          ? [
              sourceItemId,
              {
                title: safeText(item.title),
                thumbnailUrl: safeText(item.thumbnailSrc),
              },
            ]
          : null;
      })
      .filter(Boolean)
  );

  return [...lookup.values()]
    .map((metadata) => {
      const override = catalogOverrides.get(metadata.sourceItemId);
      return {
        key: metadata.key,
        sourceItemId: metadata.sourceItemId,
        title: override?.title || metadata.title,
        thumbnailUrl: override?.thumbnailUrl || metadata.thumbnailUrl,
        videoPath: metadata.videoPath,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.key.localeCompare(right.key, "en"));
}

function resolveResourcePath(explicitPath) {
  if (!explicitPath) {
    throw new Error("cloud backfill requires --resource-file");
  }
  return path.isAbsolute(explicitPath) ? explicitPath : path.join(projectRoot, explicitPath);
}

function getRequiredMatch(input, pattern, label) {
  const match = input.match(pattern);
  if (!match) {
    throw new Error(`could not parse ${label}`);
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
  const match = line.match(/^(?:[^:]|[^：])*?(?:\:|：)\s*(.+?)\s*$/);
  return match ? match[1].trim() : line.trim();
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
    throw new Error(`could not locate ${label}`);
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const value = getLineValue(lines[index]);
    if (value && valuePattern.test(value)) {
      return value;
    }
  }

  throw new Error(`could not parse ${label}`);
}

function parseResourceFile(filePath) {
  const input = fs.readFileSync(filePath, "utf8");
  const lines = getNormalizedLines(input);
  const serverHost = getRequiredMatch(input, /(?:^|\r?\n)\s*(\d{1,3}(?:\.\d{1,3}){3})\s*(?:\r?\n|$)/, "server host");
  const rootLineIndex = lines.findIndex((line) => /(^|[:：])\s*root\s*$/i.test(line));
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

function buildStatusSql(sourceItemIds) {
  return `
select
  prompt.source_item_id,
  prompt.id::text,
  prompt.author_id::text,
  coalesce(prompt.cover_asset_id::text, ''),
  coalesce(cover.asset_kind, ''),
  coalesce(cover.object_key, '')
from prompt_entries prompt
left join media_assets cover on cover.id = prompt.cover_asset_id
where source_platform = 'youmind'
  and source_campaign = 'youmind-seedance'
  and publish_status = 'published'
  and deleted_at is null
  and source_item_id in (${sourceItemIds.map(sqlLiteral).join(", ")})
order by prompt.source_item_id asc, prompt.id asc;
`;
}

function safeSize(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  return fs.statSync(filePath).size;
}

function resolveFileNameFromUrl(value, fallback) {
  try {
    const parsedUrl = new URL(value);
    return path.basename(parsedUrl.pathname) || fallback;
  } catch {
    return fallback;
  }
}

function ensureExtractedVideoCover(sourceItemId, videoPath) {
  const coverObjectKey = `${seedanceCoverObjectPrefix}/${sourceItemId}.jpg`;
  const coverPath = path.join(publicRoot, coverObjectKey.replace(/\//g, path.sep));

  if (!fs.existsSync(coverPath)) {
    fs.mkdirSync(path.dirname(coverPath), { recursive: true });
    execFileSync(
      findFfmpeg(),
      ["-y", "-ss", "0.2", "-i", videoPath, "-frames:v", "1", "-q:v", "2", coverPath],
      { stdio: "ignore" }
    );
  }

  return fs.existsSync(coverPath)
    ? { objectKey: coverObjectKey, filePath: coverPath }
    : null;
}

function buildCoverAsset(record, target, promptRow) {
  const assetId = uuidV5(`asset:youmind:seedance:${record.sourceItemId}:cover`);
  const directThumbnailUrl = safeText(record.thumbnailUrl);
  if (isDirectUrl(directThumbnailUrl)) {
    return {
      id: assetId,
      promptId: promptRow.promptId,
      authorId: promptRow.authorId,
      assetKind: "image",
      storageProvider: "external-url",
      bucketName: "remote-thumbnail",
      objectKey: directThumbnailUrl,
      fileName: resolveFileNameFromUrl(directThumbnailUrl, `${record.sourceItemId}.jpg`),
      mimeType: "image/jpeg",
      sizeBytes: null,
      width: null,
      height: null,
      durationMs: null,
      source: "thumbnail-url",
    };
  }

  if (target === "cloud") {
    return null;
  }

  const extractedCover = ensureExtractedVideoCover(record.sourceItemId, record.videoPath);
  if (!extractedCover) {
    return null;
  }

  return {
    id: assetId,
    promptId: promptRow.promptId,
    authorId: promptRow.authorId,
    assetKind: "image",
    storageProvider: "local-public",
    bucketName: "apps-web-public",
    objectKey: extractedCover.objectKey,
    fileName: path.basename(extractedCover.filePath),
    mimeType: "image/jpeg",
    sizeBytes: safeSize(extractedCover.filePath),
    width: null,
    height: null,
    durationMs: null,
    source: "ffmpeg-frame",
  };
}

function buildCoverAssetUpsertSql(asset) {
  return `
insert into media_assets (
    id, asset_kind, biz_type, biz_id, storage_provider, bucket_name, object_key,
    file_name, mime_type, size_bytes, width, height, duration_ms, checksum,
    status_code, is_public, created_by, created_at, updated_at
) values (
    ${sqlLiteral(asset.id)}::uuid,
    ${sqlLiteral(asset.assetKind)},
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
    ${sqlLiteral(crypto.createHash("sha1").update(asset.objectKey).digest("hex"))},
    'ready',
    true,
    ${sqlLiteral(asset.authorId)}::uuid,
    now(),
    now()
)
on conflict (id) do update set
    asset_kind = excluded.asset_kind,
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

function buildPromptCoverUpdateSql(promptIds, coverAssetId) {
  return `
update prompt_entries
set cover_asset_id = ${sqlLiteral(coverAssetId)}::uuid,
    updated_at = now()
where id in (${promptIds.map((promptId) => `${sqlLiteral(promptId)}::uuid`).join(", ")});
`;
}

function parseStatusRows(text) {
  const rows = new Map();
  for (const line of safeText(text).split(/\r?\n/)) {
    if (!line) {
      continue;
    }
    const [sourceItemId, promptId, authorId, coverAssetId, coverAssetKind, coverObjectKey] = line.split("|");
    if (!sourceItemId || !promptId || !authorId) {
      continue;
    }
    const bucket = rows.get(sourceItemId) ?? [];
    bucket.push({
      promptId,
      authorId,
      coverAssetId: safeText(coverAssetId) || null,
      coverAssetKind: safeText(coverAssetKind) || null,
      coverObjectKey: safeText(coverObjectKey) || null,
    });
    rows.set(sourceItemId, bucket);
  }
  return rows;
}

async function startDbTunnel(resource, localPort) {
  const plinkPath = path.join(projectRoot, ".tools", "putty", "plink.exe");
  if (!fs.existsSync(plinkPath)) {
    throw new Error(`plink not found: ${plinkPath}`);
  }

  const child = spawn(
    plinkPath,
    [
      "-ssh",
      "-N",
      "-batch",
      "-hostkey",
      puttyHostKey,
      "-L",
      `${localPort}:${resource.dbHost}:${resource.dbPort}`,
      `root@${resource.serverHost}`,
      "-pw",
      resource.serverPassword
    ],
    {
      cwd: projectRoot,
      stdio: "ignore",
      windowsHide: true
    }
  );

  await new Promise((resolve) => setTimeout(resolve, 2000));
  if (child.exitCode != null) {
    throw new Error(`failed to start SSH tunnel, plink exit code=${child.exitCode}`);
  }

  return child;
}

async function runCloudPsqlQuery(config, sql) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "exec",
        "-e",
        `PGPASSWORD=${config.dbPassword}`,
        "-i",
        config.containerName,
        "psql",
        "-h",
        "host.docker.internal",
        "-p",
        String(config.localPort),
        "-U",
        config.dbUser,
        "-d",
        config.dbName,
        "-X",
        "-q",
        "-t",
        "-A",
        "-v",
        "ON_ERROR_STOP=1"
      ],
      {
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true
      }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(`cloud psql exited with code ${code}\n${stderr || stdout}`));
    });
    child.stdin.end(sql);
  });
}

function closeTunnel(child) {
  if (!child || child.exitCode != null) {
    return;
  }
  try {
    child.kill();
  } catch {
    // Best effort cleanup.
  }
}

async function createEnvironmentRunner(target, args) {
  if (target === "local") {
    const localConfig = resolveLocalPostgresConfig();
    return {
      target,
      query: (sql) => runLocalPsqlQuery(localConfig, sql),
      close: () => {}
    };
  }

  const resource = parseResourceFile(resolveResourcePath(args["resource-file"]));
  const localPort = Number(args["local-port"] ?? defaultLocalPort);
  const skipTunnel = ["1", "true", "yes"].includes(String(args["skip-tunnel"] ?? "").toLowerCase());
  const tunnel = skipTunnel ? null : await startDbTunnel(resource, localPort);
  return {
    target,
    query: (sql) =>
      runCloudPsqlQuery(
        {
          containerName: args.container ?? defaultPostgresContainer,
          localPort,
          dbUser: resource.dbUser,
          dbPassword: resource.dbPassword,
          dbName: resource.dbName
        },
        sql
      ),
    close: () => closeTunnel(tunnel)
  };
}

async function runBackfillForTarget(target, records, args) {
  const runner = await createEnvironmentRunner(target, args);
  const summary = {
    target,
    totalRecords: records.length,
    matchedPromptRows: 0,
    alreadyCovered: 0,
    updated: [],
    skipped: []
  };

  try {
    const statusRows = parseStatusRows(await runner.query(buildStatusSql(records.map((record) => record.sourceItemId))));
    summary.matchedPromptRows = [...statusRows.values()].reduce((count, rows) => count + rows.length, 0);

    for (const record of records) {
      const promptRows = statusRows.get(record.sourceItemId) ?? [];
      if (promptRows.length === 0) {
        summary.skipped.push({ key: record.key, reason: "prompt-not-found" });
        continue;
      }
      if (promptRows.every((row) => row.coverAssetKind === "image" && row.coverObjectKey)) {
        summary.alreadyCovered += promptRows.length;
        summary.skipped.push({ key: record.key, reason: "cover-already-exists" });
        continue;
      }

      const coverAsset = buildCoverAsset(record, target, promptRows[0]);
      if (!coverAsset) {
        summary.skipped.push({
          key: record.key,
          reason: target === "cloud" ? "missing-thumbnail-and-cloud-frame-upload-not-configured" : "cover-build-failed"
        });
        continue;
      }

      await runner.query(`
begin;
${buildCoverAssetUpsertSql(coverAsset)}
${buildPromptCoverUpdateSql(promptRows.map((row) => row.promptId), coverAsset.id)}
commit;
`);
      summary.updated.push({
        key: record.key,
        sourceItemId: record.sourceItemId,
        coverAssetId: coverAsset.id,
        promptIds: promptRows.map((row) => row.promptId),
        coverSource: coverAsset.source
      });
    }
  } finally {
    runner.close();
  }

  return summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targetArg = (args.target ?? "local").toLowerCase();
  const targets = targetArg === "both" ? ["local", "cloud"] : [targetArg];
  const records = collectRecords();
  if (records.length === 0) {
    throw new Error("no seedance catalog records found for cover backfill");
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    targets,
    results: []
  };

  for (const target of targets) {
    summary.results.push(await runBackfillForTarget(target, records, args));
  }

  const outputFile = path.isAbsolute(args.output ?? "") ? args.output : args.output ? path.join(projectRoot, args.output) : defaultOutputFile;
  writeJson(outputFile, summary);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
