import crypto from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { projectRoot, resolveLocalPostgresConfig, runLocalPsqlQuery } from "./lib/local-postgres.mjs";

const MB = 1024 * 1024;
const codexRoot = path.join(projectRoot, ".codex");
const allowedTargets = new Set(["local", "remote", "cloud"]);
const defaultVideoThresholdBytes = Number(process.env.DRAMATV_MEDIA_PROCESSING_COMPRESSION_THRESHOLD_BYTES || 6 * MB);
const defaultImageThresholdBytes = Number(process.env.DRAMATV_MEDIA_PROCESSING_IMAGE_COVER_THRESHOLD_BYTES || 1 * MB);
const defaultPriority = Number(process.env.DRAMATV_MEDIA_DERIVATIVE_BACKFILL_PRIORITY || 4);
const defaultLimit = Number(process.env.DRAMATV_MEDIA_DERIVATIVE_BACKFILL_LIMIT || 0);
const defaultLocalPort = Number(process.env.DRAMATV_CLOUD_DB_TUNNEL_PORT || 15432);
const defaultPostgresContainer = process.env.DRAMATV_POSTGRES_CONTAINER || "dramatv-postgres";
const defaultSkipFailedHours = Number(process.env.DRAMATV_MEDIA_DERIVATIVE_SKIP_FAILED_HOURS || 0);
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
  return typeof value === "string" ? value.trim() : "";
}

function parseIdSet(value) {
  if (!value) {
    return new Set();
  }

  return new Set(
    String(value)
      .split(/[\s,;]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
}

function toPositiveBytes(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

function toThresholdBytes(args, thresholdBytesKey, thresholdMbKey, fallback, legacyThresholdMb = null) {
  const thresholdMb = args[thresholdMbKey] ? Number(args[thresholdMbKey]) : legacyThresholdMb;
  if (Number.isFinite(thresholdMb) && thresholdMb > 0) {
    return Math.round(thresholdMb * MB);
  }
  return toPositiveBytes(args[thresholdBytesKey], fallback);
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseJsonLines(input) {
  const trimmed = safeText(input);
  if (!trimmed) {
    return [];
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function normalizeTarget(target) {
  if (!target) {
    return "local";
  }
  const normalized = String(target).trim().toLowerCase();
  if (normalized === "cloud") {
    return "remote";
  }
  return normalized;
}

function resolveDefaultOutputFile(target) {
  const targetFolder = target === "local" ? "latest" : path.join("cloud", "latest");
  return path.join(projectRoot, "artifacts", "media-derivative-backfill", targetFolder, "summary.json");
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

function getRequiredMatch(input, pattern, label) {
  const match = input.match(pattern);
  if (!match) {
    throw new Error(`could not parse ${label} from resource file`);
  }
  return match[1].trim();
}

function resolveResourcePath(explicitPath) {
  if (explicitPath) {
    const absolutePath = path.isAbsolute(explicitPath) ? explicitPath : path.join(projectRoot, explicitPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`resource file not found: ${absolutePath}`);
    }
    return absolutePath;
  }

  const preferredCandidates = [
    path.join(codexRoot, "测试环境资源清单.md"),
    path.join(codexRoot, "测试环境资源清单(1).md"),
    path.join(codexRoot, "test-env-resource-list.md"),
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

  let bestCandidate = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    const content = fs.readFileSync(candidate, "utf8");
    const fileName = path.basename(candidate);
    let score = 0;
    if (/测试环境资源清单/.test(fileName)) score += 10;
    if (/资源清单|resource/i.test(fileName)) score += 3;
    if (/\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(content)) score += 1;
    if (/\.redis\.rds\.aliyuncs\.com/.test(content)) score += 1;
    if (/\.pg\.rds\.aliyuncs\.com/.test(content)) score += 1;
    if (/oss-cn-beijing-internal\.aliyuncs\.com/.test(content)) score += 1;
    if (/dz-ailab-community/i.test(content)) score += 1;
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

function parseResourceFile(filePath) {
  const input = fs.readFileSync(filePath, "utf8");
  const lines = getNormalizedLines(input);
  const serverHost = getRequiredMatch(
    input,
    /(?:^|\r?\n)\s*(\d{1,3}(?:\.\d{1,3}){3})\s*(?:\r?\n|$)/,
    "server host",
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

  return {
    serverHost,
    serverPassword,
    dbHost,
    dbPort,
    dbName,
    dbUser,
    dbPassword,
  };
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
      resource.serverPassword,
    ],
    {
      cwd: projectRoot,
      stdio: "ignore",
      windowsHide: true,
    },
  );

  await new Promise((resolve) => setTimeout(resolve, 2000));
  if (child.exitCode != null) {
    throw new Error(`failed to start SSH tunnel, plink exit code=${child.exitCode}`);
  }

  return child;
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

function runRemotePsqlQuery(config, sql) {
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
        "ON_ERROR_STOP=1",
      ],
      {
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      },
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

async function createRunner(args) {
  const target = normalizeTarget(args.target);
  if (!allowedTargets.has(target)) {
    throw new Error(`unsupported --target: ${args.target}`);
  }

  if (target === "local") {
    const config = resolveLocalPostgresConfig();
    return {
      target,
      close: () => {},
      meta: {
        target,
        resourceFile: null,
        localPort: null,
        containerName: config.containerName ?? null,
        skipTunnel: false,
      },
      query: (sql) => runLocalPsqlQuery(config, sql),
    };
  }

  const resourceFile = resolveResourcePath(args["resource-file"]);
  const resource = parseResourceFile(resourceFile);
  const localPort = Number(args["local-port"] ?? defaultLocalPort);
  const containerName = args.container ?? defaultPostgresContainer;
  const skipTunnel = ["1", "true", "yes"].includes(String(args["skip-tunnel"] ?? "").toLowerCase());
  const tunnel = skipTunnel ? null : await startDbTunnel(resource, localPort);

  return {
    target,
    close: () => closeTunnel(tunnel),
    meta: {
      target,
      resourceFile,
      localPort,
      containerName,
      skipTunnel,
      serverHost: resource.serverHost,
      dbHost: resource.dbHost,
      dbPort: resource.dbPort,
      dbName: resource.dbName,
    },
    query: (sql) =>
      runRemotePsqlQuery(
        {
          containerName,
          localPort,
          dbUser: resource.dbUser,
          dbPassword: resource.dbPassword,
          dbName: resource.dbName,
        },
        sql,
      ),
  };
}

function buildCandidateSql(videoThresholdBytes, imageThresholdBytes, skipFailedHours) {
  return `
with queued_targets as (
    select distinct task.task_type, task.target_type, task.target_id
    from async_task_records task
    where task.task_type in ('video_media_process', 'image_media_process')
      and task.queue_name = 'media-processing'
      and task.status_code in ('queued', 'processing')
),
recent_failed_targets as (
    select distinct on (task.task_type, task.target_type, task.target_id)
        task.task_type,
        task.target_type,
        task.target_id,
        task.id as failed_task_id,
        task.updated_at as failed_at,
        task.error_message
    from async_task_records task
    where task.task_type in ('video_media_process', 'image_media_process')
      and task.queue_name = 'media-processing'
      and task.status_code = 'failed'
      and ${skipFailedHours > 0 ? `task.updated_at >= now() - make_interval(hours => ${skipFailedHours})` : "false"}
    order by task.task_type, task.target_type, task.target_id, task.updated_at desc, task.created_at desc
),
video_candidates as (
    select json_build_object(
        'taskType', 'video_media_process',
        'targetType', 'video',
        'targetId', video.id::text,
        'sourceAssetId', source.id::text,
        'title', video.title,
        'sourceSizeBytes', source.size_bytes,
        'needsCover', video.cover_asset_id is null,
        'needsPoster', video.poster_asset_id is null,
        'needsPreview', (
            (video.preview_asset_id is null or preview_asset.asset_role is distinct from 'preview')
            and coalesce(source.size_bytes, 0) > ${videoThresholdBytes}
        ),
        'missingRealPreview', video.preview_asset_id is null or preview_asset.asset_role is distinct from 'preview',
        'recentFailureTaskId', failed.failed_task_id::text,
        'recentFailureAt', to_char(failed.failed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'recentFailureMessage', failed.error_message,
        'coverState', null
    )::text as row_json
    from videos video
    join media_assets source
      on source.id = video.source_asset_id
     and source.asset_kind = 'video'
     and source.status_code = 'ready'
    left join media_assets preview_asset on preview_asset.id = video.preview_asset_id
    left join queued_targets queued
      on queued.task_type = 'video_media_process'
     and queued.target_type = 'video'
     and queued.target_id = video.id
    left join recent_failed_targets failed
      on failed.task_type = 'video_media_process'
     and failed.target_type = 'video'
     and failed.target_id = video.id
    where video.deleted_at is null
      and video.source_asset_id is not null
      and queued.target_id is null
      and (
        video.cover_asset_id is null
        or video.poster_asset_id is null
        or (
            (video.preview_asset_id is null or preview_asset.asset_role is distinct from 'preview')
            and coalesce(source.size_bytes, 0) > ${videoThresholdBytes}
        )
      )
),
prompt_candidates as (
    select json_build_object(
        'taskType', 'video_media_process',
        'targetType', 'prompt',
        'targetId', prompt.id::text,
        'sourceAssetId', source.id::text,
        'title', prompt.title,
        'sourceSizeBytes', source.size_bytes,
        'needsCover', prompt.cover_asset_id is null,
        'needsPoster', false,
        'needsPreview', (
            (preview_link.preview_asset_id is null or preview_link.preview_asset_role is distinct from 'preview')
            and coalesce(source.size_bytes, 0) > ${videoThresholdBytes}
        ),
        'missingRealPreview', preview_link.preview_asset_id is null or preview_link.preview_asset_role is distinct from 'preview',
        'recentFailureTaskId', failed.failed_task_id::text,
        'recentFailureAt', to_char(failed.failed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'recentFailureMessage', failed.error_message,
        'coverState', null
    )::text as row_json
    from prompt_entries prompt
    join media_assets source
      on source.id = prompt.primary_example_asset_id
     and source.asset_kind = 'video'
     and source.status_code = 'ready'
    left join lateral (
        select
            link.media_asset_id as preview_asset_id,
            asset.asset_role as preview_asset_role
        from prompt_example_links link
        left join media_assets asset on asset.id = link.media_asset_id
        where link.prompt_id = prompt.id
          and link.role_code = 'preview'
        order by link.sort_order asc, link.created_at asc
        limit 1
    ) preview_link on true
    left join queued_targets queued
      on queued.task_type = 'video_media_process'
     and queued.target_type = 'prompt'
     and queued.target_id = prompt.id
    left join recent_failed_targets failed
      on failed.task_type = 'video_media_process'
     and failed.target_type = 'prompt'
     and failed.target_id = prompt.id
    where prompt.deleted_at is null
      and prompt.modality = 'video'
      and prompt.primary_example_asset_id is not null
      and queued.target_id is null
      and (
        prompt.cover_asset_id is null
        or (
            (preview_link.preview_asset_id is null or preview_link.preview_asset_role is distinct from 'preview')
            and coalesce(source.size_bytes, 0) > ${videoThresholdBytes}
        )
      )
),
image_prompt_candidates as (
    select json_build_object(
        'taskType', 'image_media_process',
        'targetType', 'prompt',
        'targetId', prompt.id::text,
        'sourceAssetId', source.id::text,
        'title', prompt.title,
        'sourceSizeBytes', source.size_bytes,
        'needsCover', true,
        'needsPoster', false,
        'needsPreview', false,
        'missingRealPreview', false,
        'recentFailureTaskId', failed.failed_task_id::text,
        'recentFailureAt', to_char(failed.failed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'recentFailureMessage', failed.error_message,
        'coverState', case
            when prompt.cover_asset_id is null then 'missing'
            when prompt.cover_asset_id = prompt.primary_example_asset_id then 'source'
            when cover.id is null then 'missing-asset'
            when cover.asset_kind <> 'image' then 'wrong-kind'
            when cover.asset_role is distinct from 'cover' then 'role-' || coalesce(cover.asset_role, 'null')
            else 'derived-cover'
        end
    )::text as row_json
    from prompt_entries prompt
    join media_assets source
      on source.id = prompt.primary_example_asset_id
     and source.asset_kind = 'image'
     and source.status_code = 'ready'
    left join media_assets cover on cover.id = prompt.cover_asset_id
    left join queued_targets queued
      on queued.task_type = 'image_media_process'
     and queued.target_type = 'prompt'
     and queued.target_id = prompt.id
    left join recent_failed_targets failed
      on failed.task_type = 'image_media_process'
     and failed.target_type = 'prompt'
     and failed.target_id = prompt.id
    where prompt.deleted_at is null
      and prompt.modality = 'image'
      and prompt.primary_example_asset_id is not null
      and queued.target_id is null
      and coalesce(source.size_bytes, 0) > ${imageThresholdBytes}
      and (
        prompt.cover_asset_id is null
        or prompt.cover_asset_id = prompt.primary_example_asset_id
        or cover.id is null
        or cover.asset_kind <> 'image'
        or cover.asset_role is distinct from 'cover'
      )
)
select row_json
from (
    select row_json from video_candidates
    union all
    select row_json from prompt_candidates
    union all
    select row_json from image_prompt_candidates
) candidates
;
`;
}

function buildInsertSql(candidates, priority) {
  const statements = ["begin;"];

  for (const candidate of candidates) {
    const desiredOutputs = candidate.taskType === "image_media_process"
      ? ["cover"]
      : ["cover", "duration"];

    if (candidate.taskType === "video_media_process" && candidate.needsPreview) {
      desiredOutputs.push("preview");
    }

    const payload = {
      sourceAssetId: candidate.sourceAssetId,
      targetType: candidate.targetType,
      targetId: candidate.targetId,
      submitMode: "backfill",
      reason: "media-derivative-backfill",
      desiredOutputs,
    };

    if (candidate.coverState) {
      payload.coverState = candidate.coverState;
    }

    statements.push(`
insert into async_task_records (
    id, task_type, target_type, target_id, queue_name, priority_level,
    status_code, payload_json, retry_count, max_retry_count, scheduled_at, created_at, updated_at
) values (
    ${sqlLiteral(crypto.randomUUID())}::uuid,
    ${sqlLiteral(candidate.taskType)},
    ${sqlLiteral(candidate.targetType)},
    ${sqlLiteral(candidate.targetId)}::uuid,
    'media-processing',
    ${priority},
    'queued',
    cast(${sqlLiteral(JSON.stringify(payload))} as jsonb),
    0,
    3,
    now(),
    now(),
    now()
);`);
  }

  statements.push("commit;");
  return statements.join("\n");
}

function createGroupBucket() {
  return {
    total: 0,
    needsCover: 0,
    needsPoster: 0,
    needsPreview: 0,
  };
}

function groupCandidates(candidates) {
  return candidates.reduce((accumulator, candidate) => {
    if (!accumulator[candidate.taskType]) {
      accumulator[candidate.taskType] = createGroupBucket();
    }

    const bucket = accumulator[candidate.taskType];
    bucket.total += 1;
    if (candidate.needsCover) {
      bucket.needsCover += 1;
    }
    if (candidate.needsPoster) {
      bucket.needsPoster += 1;
    }
    if (candidate.needsPreview) {
      bucket.needsPreview += 1;
    }
    return accumulator;
  }, {});
}

function toFailureTarget(candidate) {
  return {
    taskType: candidate.taskType,
    targetType: candidate.targetType,
    targetId: candidate.targetId,
    sourceAssetId: candidate.sourceAssetId,
    title: candidate.title,
    sourceSizeBytes: candidate.sourceSizeBytes,
    recentFailureTaskId: candidate.recentFailureTaskId ?? null,
    recentFailureAt: candidate.recentFailureAt ?? null,
    recentFailureMessage: candidate.recentFailureMessage ?? null,
    coverState: candidate.coverState ?? null,
  };
}

function buildSummary(
  rawCandidates,
  selectedCandidates,
  skippedRecentFailures,
  thresholds,
  apply,
  priority,
  outputPath,
  runnerMeta,
  limit,
  skipFailedHours,
  onlyTargetIds,
  excludeTargetIds,
) {
  const grouped = groupCandidates(selectedCandidates);
  const skippedGrouped = groupCandidates(skippedRecentFailures);

  return {
    generatedAt: new Date().toISOString(),
    mode: apply ? "apply" : "preview",
    target: runnerMeta.target,
    selection: {
      limit,
      skipFailedHours,
      onlyTargetIds: Array.from(onlyTargetIds),
      excludeTargetIds: Array.from(excludeTargetIds),
      inventoryCandidateCount: rawCandidates.length,
      selectedCandidateCount: selectedCandidates.length,
      skippedRecentFailureCount: skippedRecentFailures.length,
    },
    thresholds: {
      videoThresholdBytes: thresholds.videoThresholdBytes,
      videoThresholdMb: Number((thresholds.videoThresholdBytes / MB).toFixed(2)),
      imageThresholdBytes: thresholds.imageThresholdBytes,
      imageThresholdMb: Number((thresholds.imageThresholdBytes / MB).toFixed(2)),
    },
    priority,
    rawCandidateCount: rawCandidates.length,
    candidateCount: selectedCandidates.length,
    grouped,
    skippedGrouped,
    runner: runnerMeta,
    outputPath,
    skippedRecentFailures: skippedRecentFailures.slice(0, 50).map(toFailureTarget),
    candidates: selectedCandidates.slice(0, 100),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = normalizeTarget(args.target);
  const apply = args.apply === "true";
  const limit = toPositiveInt(args.limit, defaultLimit);
  const priority = toPositiveInt(args.priority, defaultPriority);
  const skipFailedHours = toPositiveInt(args["skip-failed-hours"], defaultSkipFailedHours);
  const onlyTargetIds = parseIdSet(args["only-target-ids"]);
  const excludeTargetIds = parseIdSet(args["exclude-target-ids"]);
  const legacyThresholdMb = args["threshold-mb"] ? Number(args["threshold-mb"]) : null;
  const videoThresholdBytes = toThresholdBytes(
    args,
    "video-threshold-bytes",
    "video-threshold-mb",
    defaultVideoThresholdBytes,
    legacyThresholdMb,
  );
  const imageThresholdBytes = toThresholdBytes(
    args,
    "image-threshold-bytes",
    "image-threshold-mb",
    defaultImageThresholdBytes,
  );
  const outputPath = path.resolve(args.output ?? resolveDefaultOutputFile(target));

  const runner = await createRunner(args);
  let rawCandidates = [];
  let selectedCandidates = [];
  let skippedRecentFailures = [];

  try {
    const rawCandidateRows = await runner.query(buildCandidateSql(videoThresholdBytes, imageThresholdBytes, skipFailedHours));
    rawCandidates = parseJsonLines(rawCandidateRows);
    if (onlyTargetIds.size > 0) {
      rawCandidates = rawCandidates.filter((candidate) => onlyTargetIds.has(candidate.targetId));
    }
    if (excludeTargetIds.size > 0) {
      rawCandidates = rawCandidates.filter((candidate) => !excludeTargetIds.has(candidate.targetId));
    }
    skippedRecentFailures = skipFailedHours > 0
      ? rawCandidates.filter((candidate) => Boolean(candidate.recentFailureTaskId))
      : [];
    const actionableCandidates = skipFailedHours > 0
      ? rawCandidates.filter((candidate) => !candidate.recentFailureTaskId)
      : rawCandidates;
    selectedCandidates = limit > 0 ? actionableCandidates.slice(0, limit) : actionableCandidates;

    if (apply && selectedCandidates.length > 0) {
      await runner.query(buildInsertSql(selectedCandidates, priority));
    }
  } finally {
    runner.close();
  }

  const summary = buildSummary(
    rawCandidates,
    selectedCandidates,
    skippedRecentFailures,
    { videoThresholdBytes, imageThresholdBytes },
    apply,
    priority,
    outputPath,
    runner.meta,
    limit,
    skipFailedHours,
    onlyTargetIds,
    excludeTargetIds,
  );

  writeJson(outputPath, summary);
  process.stdout.write(
    `[${runner.meta.target}] ${apply ? "Queued" : "Found"} media derivative candidates: ${selectedCandidates.length}` +
      ` (inventory=${rawCandidates.length}, skippedRecentFailures=${skippedRecentFailures.length})\n`,
  );
  process.stdout.write(`Summary: ${outputPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? String(error)}\n`);
  process.exit(1);
});

