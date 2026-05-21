import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { projectRoot, resolveLocalPostgresConfig, runLocalPsqlQuery } from "./lib/local-postgres.mjs";

const DEFAULT_OUTPUT = path.join(projectRoot, "artifacts", "moderation-backfill", "latest", "summary.json");
const REPAIR_SOURCE = "scripts/backfill-historical-moderation-audits.mjs";
const REPAIR_REASON = "historical_taken_down_missing_publish_review";
const ALLOWED_TARGET_TYPES = new Set(["video", "workflow", "prompt", "post"]);
const ALLOWED_TARGETS = new Set(["local", "remote", "cloud"]);
const codexRoot = path.join(projectRoot, ".codex");
const defaultPostgresContainer = process.env.DRAMATV_POSTGRES_CONTAINER || "dramatv-postgres";
const defaultLocalPort = Number(process.env.DRAMATV_CLOUD_DB_TUNNEL_PORT || 15432);
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

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
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
  const colonIndex = Math.max(
    line.lastIndexOf(":"),
    line.lastIndexOf("："),
    line.lastIndexOf("锛?"),
  );
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
  if (!ALLOWED_TARGETS.has(target)) {
    throw new Error(`unsupported --target: ${args.target}`);
  }

  if (target === "local") {
    const config = resolveLocalPostgresConfig();
    return {
      target,
      close: () => {},
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

function buildCandidatesCte({ targetType, targetId }) {
  const filters = [];
  if (targetType) {
    filters.push(`target_type = ${sqlLiteral(targetType)}`);
  }
  if (targetId) {
    filters.push(`target_id = ${sqlLiteral(targetId)}::uuid`);
  }

  const filterSql = filters.length > 0 ? `where ${filters.join(" and ")}` : "";

  return `
with historical_taken_down_candidates as (
    select
        'video'::varchar as target_type,
        video.id as target_id,
        video.author_id,
        video.title,
        video.publish_status,
        coalesce(video.updated_at, video.published_at, video.created_at, now()) as audit_created_at
    from videos video
    where video.deleted_at is null
      and video.publish_status = 'taken_down'
      and not exists (
            select 1
            from audit_records audit
            where audit.audit_type = 'publish_review'
              and audit.target_type = 'video'
              and audit.target_id = video.id
      )

    union all

    select
        'workflow'::varchar as target_type,
        workflow.id as target_id,
        workflow.author_id,
        workflow.title,
        workflow.publish_status,
        coalesce(workflow.updated_at, workflow.published_at, workflow.created_at, now()) as audit_created_at
    from workflows workflow
    where workflow.deleted_at is null
      and workflow.publish_status = 'taken_down'
      and not exists (
            select 1
            from audit_records audit
            where audit.audit_type = 'publish_review'
              and audit.target_type = 'workflow'
              and audit.target_id = workflow.id
      )

    union all

    select
        'prompt'::varchar as target_type,
        prompt.id as target_id,
        prompt.author_id,
        prompt.title,
        prompt.publish_status,
        coalesce(prompt.updated_at, prompt.published_at, prompt.created_at, now()) as audit_created_at
    from prompt_entries prompt
    where prompt.deleted_at is null
      and prompt.publish_status = 'taken_down'
      and not exists (
            select 1
            from audit_records audit
            where audit.audit_type = 'publish_review'
              and audit.target_type = 'prompt'
              and audit.target_id = prompt.id
      )

    union all

    select
        'post'::varchar as target_type,
        thread.id as target_id,
        thread.author_id,
        thread.title,
        thread.publish_status,
        coalesce(thread.updated_at, thread.published_at, thread.created_at, now()) as audit_created_at
    from discussion_threads thread
    where thread.deleted_at is null
      and thread.publish_status = 'taken_down'
      and not exists (
            select 1
            from audit_records audit
            where audit.audit_type = 'publish_review'
              and audit.target_type = 'post'
              and audit.target_id = thread.id
      )
),
filtered_candidates as (
    select *
    from historical_taken_down_candidates
    ${filterSql}
)
`;
}

async function queryLines(query, sql) {
  const output = await query(`\\pset pager off\n${sql}`);
  if (!output) {
    return [];
  }
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function queryJsonRows(query, sql) {
  const lines = await queryLines(query, sql);
  return lines.map((line) => JSON.parse(line));
}

async function loadPreview(query, filters) {
  const sql = `
${buildCandidatesCte(filters)}
select json_build_object(
    'targetType', target_type,
    'targetId', target_id::text,
    'authorId', author_id::text,
    'title', title,
    'publishStatus', publish_status,
    'auditCreatedAt', audit_created_at
)::text
from filtered_candidates
order by audit_created_at desc, target_type asc, target_id asc
`;

  return queryJsonRows(query, sql);
}

async function applyBackfill(query, filters) {
  const sql = `
${buildCandidatesCte(filters)}
insert into audit_records (
    id,
    target_type,
    target_id,
    audit_type,
    status_code,
    risk_level,
    reason_code,
    reason_text,
    operator_type,
    operator_id,
    detail_json,
    created_at
)
select
    gen_random_uuid(),
    target_type,
    target_id,
    'publish_review',
    'taken_down',
    'high',
    'historical_backfill',
    'Backfilled missing publish_review record for historical taken_down content.',
    'system',
    null,
    jsonb_build_object(
        'repairSource', ${sqlLiteral(REPAIR_SOURCE)},
        'repairReason', ${sqlLiteral(REPAIR_REASON)},
        'repairedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'backfilledPublishStatus', publish_status,
        'backfilledAuditCreatedAt', to_char(audit_created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ),
    audit_created_at
from filtered_candidates
returning json_build_object(
    'targetType', target_type,
    'targetId', target_id::text,
    'statusCode', status_code,
    'createdAt', created_at
)::text
`;

  return queryJsonRows(query, sql);
}

function summarizeRows(rows) {
  const summaryMap = new Map();

  for (const row of rows) {
    const bucket = summaryMap.get(row.targetType) ?? { targetType: row.targetType, count: 0, sampleTargetIds: [] };
    bucket.count += 1;
    if (bucket.sampleTargetIds.length < 5) {
      bucket.sampleTargetIds.push(row.targetId);
    }
    summaryMap.set(row.targetType, bucket);
  }

  return Array.from(summaryMap.values()).sort((left, right) => left.targetType.localeCompare(right.targetType));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.apply === "true";
  const outputPath = args.output ?? DEFAULT_OUTPUT;
  const target = normalizeTarget(args.target);
  const targetType = args["target-type"] ?? null;
  const targetId = args["target-id"] ?? null;

  if (targetType && !ALLOWED_TARGET_TYPES.has(targetType)) {
    throw new Error(`unsupported --target-type: ${targetType}`);
  }

  if (targetId && !targetType) {
    throw new Error("--target-id requires --target-type");
  }

  const filters = { targetType, targetId };
  const runner = await createRunner(args);

  let previewRows = [];
  let appliedRows = [];
  let remainingRows = [];

  try {
    previewRows = await loadPreview(runner.query, filters);

    if (apply && previewRows.length > 0) {
      appliedRows = await applyBackfill(runner.query, filters);
    }

    remainingRows = apply ? await loadPreview(runner.query, filters) : previewRows;
  } finally {
    runner.close();
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    apply,
    target,
    filters: {
      targetType,
      targetId,
    },
    repairSource: REPAIR_SOURCE,
    repairReason: REPAIR_REASON,
    preview: {
      total: previewRows.length,
      byTargetType: summarizeRows(previewRows),
      items: previewRows,
    },
    applied: {
      total: appliedRows.length,
      byTargetType: summarizeRows(appliedRows),
      items: appliedRows,
    },
    remaining: {
      total: remainingRows.length,
      byTargetType: summarizeRows(remainingRows),
      items: remainingRows,
    },
  };

  ensureParentDir(outputPath);
  fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
