import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPromptTaxonomy } from "./lib/prompt-taxonomy.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const researchRoot = path.join(projectRoot, "docs", "02_研究");
const codexRoot = path.join(projectRoot, ".codex");
const videoLibraryRoot = path.join(researchRoot, "youmind-video-assets");
const imageAssetsRoot = path.join(researchRoot, "youmind-image-assets");
const defaultStateFile = path.join(projectRoot, "artifacts", "youmind-import", "latest", "state.json");
const defaultOutputFile = path.join(projectRoot, "artifacts", "youmind-import", "latest", "source-backfill-summary.json");
const defaultPostgresContainer = process.env.DRAMATV_POSTGRES_CONTAINER || "dramatv-postgres";
const defaultLocalPort = Number(process.env.DRAMATV_CLOUD_DB_TUNNEL_PORT || 15432);
const puttyHostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk";
const seedanceLibraryPattern = /^youmind-seedance-library(?:-p\d{3}-p\d{3})?$/;

const imageLibraryConfigs = {
  nano: {
    keyPrefix: "nano",
    libraryRoot: path.join(imageAssetsRoot, "nano-banana-library-p001-p190"),
    sourceCampaign: "youmind-nano-banana",
    modelName: "Nano Banana",
    trustedUpperCategory: false
  },
  "gpt-comic": {
    keyPrefix: "gpt-comic",
    libraryRoot: path.join(imageAssetsRoot, "gpt-image-2-comic-storyboard-library-p001-p014"),
    sourceCampaign: "gpt-image-2-prompts",
    modelName: "gpt-image-2",
    trustedUpperCategory: true,
    upperCategoryCode: "comic-storyboard"
  },
  "nano-comic": {
    keyPrefix: "nano-comic",
    libraryRoot: path.join(imageAssetsRoot, "nano-banana-comic-storyboard-library-p001-p023"),
    sourceCampaign: "nano-banana-pro-prompts",
    modelName: "nano-banana-pro",
    trustedUpperCategory: true,
    upperCategoryCode: "comic-storyboard"
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function resolveResourcePath(explicitPath) {
  if (explicitPath) {
    const absolutePath = path.isAbsolute(explicitPath) ? explicitPath : path.join(projectRoot, explicitPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`resource file not found: ${absolutePath}`);
    }
    return absolutePath;
  }

  const candidates = fs
    .readdirSync(codexRoot)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(codexRoot, name));

  let bestCandidate = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    const content = fs.readFileSync(candidate, "utf8");
    let score = 0;
    if (/\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(content)) score += 1;
    if (/\.redis\.rds\.aliyuncs\.com/.test(content)) score += 1;
    if (/\.pg\.rds\.aliyuncs\.com/.test(content)) score += 1;
    if (/oss-cn-beijing-internal\.aliyuncs\.com/.test(content)) score += 1;
    if (/bucket[:：]\s*dz-ailab-community/i.test(content)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  if (!bestCandidate || bestScore < 4) {
    throw new Error("could not auto-discover the test environment resource file under .codex");
  }

  return bestCandidate;
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
  const match = line.match(/^(?:[^:]|[^：])*?(?:\:|：)\s*(.+?)\s*$/);
  return match ? match[1].trim() : line.trim();
}

function findFirstLineIndex(lines, pattern, startIndex = 0) {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (pattern.test(lines[index])) {
      return index;
    }
  }
  return -1;
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
  const input = fs.readFileSync(filePath, "utf8");
  const lines = getNormalizedLines(input);

  const serverHost = getRequiredMatch(
    input,
    /(?:^|\r?\n)\s*(\d{1,3}(?:\.\d{1,3}){3})\s*(?:\r?\n|$)/,
    "server host"
  );
  const rootLineIndex = findFirstLineIndex(lines, /(^|[:：])\s*root\s*$/i);
  const serverPassword = getNextValueAfterIndex(lines, rootLineIndex, "server password");
  const dbHost = getRequiredMatch(input, /([A-Za-z0-9.-]+\.pg\.rds\.aliyuncs\.com)/, "database host");
  const dbHostIndex = findLineIndexByValue(lines, dbHost);
  const dbPort = getNextValueAfterIndex(lines, dbHostIndex, "database port", /^\d{2,5}$/);
  const dbPortIndex = findLineIndexByValue(lines, dbPort, dbHostIndex + 1);
  const dbName = getNextValueAfterIndex(lines, dbPortIndex, "database name");
  const dbNameIndex = findLineIndexByValue(lines, dbName, dbPortIndex + 1);
  const dbUser = getNextValueAfterIndex(lines, dbNameIndex, "database user");
  const dbUserIndex = findLineIndexByValue(lines, dbUser, dbNameIndex + 1);
  const dbPassword = getNextValueAfterIndex(lines, dbUserIndex, "database password");

  return {
    serverHost,
    serverPassword,
    dbHost,
    dbPort: Number(dbPort),
    dbName,
    dbUser,
    dbPassword
  };
}

function listSeedanceRoots() {
  return fs
    .readdirSync(videoLibraryRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && seedanceLibraryPattern.test(entry.name))
    .map((entry) => path.join(videoLibraryRoot, entry.name))
    .sort((left, right) => left.localeCompare(right, "en"));
}

function resolveTrustedUpperCategory(config, meta, entry) {
  if (!config.trustedUpperCategory) {
    return "";
  }

  return safeText(config.upperCategoryCode || meta.categories || entry.categories);
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
      if (!fs.existsSync(metaPath)) {
        continue;
      }

      const meta = readJson(metaPath);
      const promptZh = readText(path.join(itemRoot, "prompt.zh.txt"));
      const promptEn = readText(path.join(itemRoot, "prompt.en.txt"));
      const promptText = promptZh || promptEn;
      const title = repairText(meta.title || entry.title || `Seedance ${entry.id ?? safeText(entry.streamId).toLowerCase()}`);
      const summary = promptText ? summarizePrompt(promptText) : title;
      const modelName = "Seedance 2.0";
      const sourceCampaign = "youmind-seedance";
      const key = `seedance:${meta.id ?? entry.id ?? safeText(entry.streamId).toLowerCase()}`;
      if (!key || lookup.has(key)) {
        continue;
      }

      const taxonomy = classifyPromptTaxonomy({
        modality: "video",
        title,
        summary,
        promptText,
        modelName,
        sourceCampaign
      });

      lookup.set(key, {
        sourcePlatform: "youmind",
        sourceCampaign,
        sourceItemId: String(meta.id ?? entry.id ?? safeText(entry.streamId).toLowerCase()),
        sourceUrl: safeText(meta.sourceLink || entry.sourceLink),
        modelName,
        modelCategory: taxonomy.modelCategory,
        contentCategory: taxonomy.contentCategory,
        compositionCategory: taxonomy.compositionCategory,
        tagNames: taxonomy.standardTags
      });
    }
  }

  return lookup;
}

function collectImageLookup(config) {
  const lookup = new Map();
  const manifestPath = path.join(config.libraryRoot, "library-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return lookup;
  }

  const manifest = readJson(manifestPath);
  for (const entry of manifest) {
    if (entry.grade !== "A" || !entry.hasRawPrompt) {
      continue;
    }

    const itemRoot = path.join(config.libraryRoot, entry.folder);
    const metaPath = path.join(itemRoot, "meta.json");
    if (!fs.existsSync(metaPath)) {
      continue;
    }

    const meta = readJson(metaPath);
    const promptRaw = readText(path.join(itemRoot, "prompt.raw.txt"));
    const promptZh = readText(path.join(itemRoot, "prompt.zh.txt"));
    const promptEn = readText(path.join(itemRoot, "prompt.en.txt"));
    const promptText = promptZh || promptEn || promptRaw;
    const title = repairText(meta.title || entry.title || entry.folder);
    const summary = readText(path.join(itemRoot, "summary.txt")) || meta.description || summarizePrompt(promptText);
    const sourceCampaign = repairText(meta.campaign) || config.sourceCampaign;
    const modelName = repairText(meta.model) || config.modelName;
    const trustedUpperCategory = resolveTrustedUpperCategory(config, meta, entry);
    const key = `${config.keyPrefix}:${entry.folder}`;
    const taxonomy = classifyPromptTaxonomy({
      modality: "image",
      title,
      summary,
      promptText,
      modelName,
      sourceCampaign,
      extraSignals: trustedUpperCategory ? [trustedUpperCategory] : []
    });

    lookup.set(key, {
      sourcePlatform: "youmind",
      sourceCampaign,
      sourceItemId: String(meta.id ?? entry.id ?? entry.folder),
      sourceUrl: safeText(meta.sourceLink || entry.sourceLink),
      modelName,
      modelCategory: taxonomy.modelCategory,
      contentCategory: taxonomy.contentCategory,
      compositionCategory: taxonomy.compositionCategory,
      tagNames: taxonomy.standardTags
    });
  }

  return lookup;
}

function collectSourceLookup(requestedKinds) {
  const lookup = new Map();

  if (requestedKinds.includes("seedance")) {
    for (const [key, value] of collectSeedanceLookup()) {
      lookup.set(key, value);
    }
  }

  for (const kind of ["nano", "gpt-comic", "nano-comic"]) {
    if (!requestedKinds.includes(kind)) {
      continue;
    }

    for (const [key, value] of collectImageLookup(imageLibraryConfigs[kind])) {
      lookup.set(key, value);
    }
  }

  return lookup;
}

function normalizeRequestedKind(kind) {
  if (kind === "storyboard" || kind === "comic-storyboard" || kind === "comic") {
    return "comic";
  }

  return kind;
}

function resolveRequestedKinds(kind) {
  const normalizedKind = normalizeRequestedKind(kind);
  if (normalizedKind === "all") {
    return ["seedance", "nano", "gpt-comic", "nano-comic"];
  }
  if (normalizedKind === "comic") {
    return ["gpt-comic", "nano-comic"];
  }
  return [normalizedKind];
}

function resolveOptionalPath(inputPath, fallbackPath) {
  if (!inputPath) {
    return fallbackPath;
  }
  return path.isAbsolute(inputPath) ? inputPath : path.join(projectRoot, inputPath);
}

function collectBackfillRecords(state, lookup, requestedKinds) {
  const prefixes = new Set(requestedKinds.map((kind) => `${kind}:`));
  const records = [];

  for (const [key, stateEntry] of Object.entries(state.items ?? {})) {
    if (!stateEntry || stateEntry.status !== "published" || !stateEntry.targetId) {
      continue;
    }
    if (![...prefixes].some((prefix) => key.startsWith(prefix))) {
      continue;
    }

    const metadata = lookup.get(key);
    if (!metadata) {
      continue;
    }

    records.push({
      key,
      promptId: stateEntry.targetId,
      ...metadata
    });
  }

  return records.sort((left, right) => left.key.localeCompare(right.key, "en"));
}

function sqlLiteral(value) {
  if (value == null || value === "") {
    return "null";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlTextArrayLiteral(values) {
  const normalized = Array.isArray(values) ? values.map((value) => safeText(value)).filter(Boolean) : [];
  if (normalized.length === 0) {
    return "array[]::text[]";
  }
  return `array[${normalized.map((value) => sqlLiteral(value)).join(", ")}]::text[]`;
}

function buildValuesSql(records) {
  return records
    .map((record) => `(${[
      sqlLiteral(record.promptId),
      sqlLiteral(record.sourcePlatform),
      sqlLiteral(record.sourceCampaign),
      sqlLiteral(record.sourceItemId),
      sqlLiteral(record.sourceUrl),
      sqlLiteral(record.modelName),
      sqlLiteral(record.modelCategory),
      sqlLiteral(record.contentCategory),
      sqlLiteral(record.compositionCategory),
      sqlTextArrayLiteral(record.tagNames)
    ].join(", ")})`)
    .join(",\n");
}

function buildMissingSummarySql(valuesSql) {
  return `
with data(
  id,
  source_platform,
  source_campaign,
  source_item_id,
  source_url,
  model_name,
  model_category,
  content_category,
  composition_category,
  tag_names
) as (
  values
  ${valuesSql}
)
select
  count(*) filter (where prompt.id is not null) as matched_count,
  count(*) filter (
    where prompt.id is not null and (
      prompt.source_platform is distinct from data.source_platform or
      prompt.source_campaign is distinct from data.source_campaign or
      prompt.source_item_id is distinct from data.source_item_id or
      prompt.source_url is distinct from data.source_url or
      prompt.model_name is distinct from data.model_name or
      prompt.model_category is distinct from data.model_category or
      prompt.content_category is distinct from data.content_category or
      prompt.composition_category is distinct from data.composition_category or
      prompt.tag_names is distinct from data.tag_names
    )
  ) as out_of_sync_count
from data
left join prompt_entries prompt on prompt.id = data.id::uuid;
`;
}

function buildBackfillSql(valuesSql) {
  return `
begin;
with data(
  id,
  source_platform,
  source_campaign,
  source_item_id,
  source_url,
  model_name,
  model_category,
  content_category,
  composition_category,
  tag_names
) as (
  values
  ${valuesSql}
),
updated as (
  update prompt_entries prompt
  set source_platform = data.source_platform,
      source_campaign = data.source_campaign,
      source_item_id = data.source_item_id,
      source_url = data.source_url,
      model_name = data.model_name,
      model_category = data.model_category,
      content_category = data.content_category,
      composition_category = data.composition_category,
      tag_names = data.tag_names,
      updated_at = now()
  from data
  where prompt.id = data.id::uuid
    and prompt.publish_status = 'published'
    and prompt.deleted_at is null
  returning prompt.id
)
select count(*) as updated_count from updated;
commit;
`;
}

function parseScalarOutput(text) {
  const lines = safeText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.at(-1) ?? "";
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
    }
    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, child });
        return;
      }
      reject(new Error(`${command} exited with code ${code}\n${stderr || stdout}`));
    });
  });
}

async function startDbTunnel(resource, localPort) {
  const plinkPath = path.join(projectRoot, ".tools", "putty", "plink.exe");
  if (!fs.existsSync(plinkPath)) {
    throw new Error(`plink not found: ${plinkPath}`);
  }

  const args = [
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
  ];

  const child = spawn(plinkPath, args, {
    cwd: projectRoot,
    stdio: "ignore",
    windowsHide: true
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));
  if (child.exitCode != null) {
    throw new Error(`failed to start SSH tunnel, plink exit code=${child.exitCode}`);
  }

  return child;
}

async function runCloudPsqlWithStdin(config, sql) {
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

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
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
    // Ignore best-effort cleanup failures.
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.apply === "true";
  const kind = (args.kind ?? "all").toLowerCase();
  const requestedKinds = resolveRequestedKinds(kind);
  const stateFile = resolveOptionalPath(args["state-file"], defaultStateFile);
  const outputFile = resolveOptionalPath(args.output, defaultOutputFile);
  const resourceFile = resolveResourcePath(args["resource-file"]);
  const resource = parseResourceFile(resourceFile);
  const containerName = args.container ?? defaultPostgresContainer;
  const localPort = Number(args["local-port"] ?? defaultLocalPort);
  const state = readJson(stateFile);
  const lookup = collectSourceLookup(requestedKinds);
  const records = collectBackfillRecords(state, lookup, requestedKinds);

  if (records.length === 0) {
    throw new Error("no prompt records matched the requested backfill scope");
  }

  const valuesSql = buildValuesSql(records);
  const tunnel = await startDbTunnel(resource, localPort);

  try {
    const missingBeforeText = await runCloudPsqlWithStdin(
      {
        containerName,
        localPort,
        dbUser: resource.dbUser,
        dbName: resource.dbName,
        dbPassword: resource.dbPassword
      },
      buildMissingSummarySql(valuesSql)
    );
    const [matchedCountText, outOfSyncCountText] = safeText(missingBeforeText)
      .split("|")
      .map((part) => part.trim());
    const matchedCount = Number(matchedCountText || 0);
    const outOfSyncCountBefore = Number(outOfSyncCountText || 0);

    let updatedCount = 0;
    if (apply) {
      const updateOutput = await runCloudPsqlWithStdin(
        {
          containerName,
          localPort,
          dbUser: resource.dbUser,
          dbName: resource.dbName,
          dbPassword: resource.dbPassword
        },
        buildBackfillSql(valuesSql)
      );
      updatedCount = Number(parseScalarOutput(updateOutput) || 0);
    }

    const missingAfterText = await runCloudPsqlWithStdin(
      {
        containerName,
        localPort,
        dbUser: resource.dbUser,
        dbName: resource.dbName,
        dbPassword: resource.dbPassword
      },
      buildMissingSummarySql(valuesSql)
    );
    const [, missingAfterCountText] = safeText(missingAfterText)
      .split("|")
      .map((part) => part.trim());
    const outOfSyncCountAfter = Number(missingAfterCountText || 0);

    const summary = {
      apply,
      resourceFile,
      stateFile,
      containerName,
      localPort,
      requestedKinds,
      matchedCount,
      outOfSyncCountBefore,
      updatedCount,
      outOfSyncCountAfter,
      samplePromptIds: records.slice(0, 10).map((record) => ({
        key: record.key,
        promptId: record.promptId,
        sourceCampaign: record.sourceCampaign,
        modelName: record.modelName,
        modelCategory: record.modelCategory,
        contentCategory: record.contentCategory,
        compositionCategory: record.compositionCategory,
        tagNames: record.tagNames
      }))
    };

    writeJson(outputFile, summary);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    closeTunnel(tunnel);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
