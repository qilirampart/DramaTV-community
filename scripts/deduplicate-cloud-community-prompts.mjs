import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const codexRoot = path.join(projectRoot, ".codex");
const defaultOutputFile = path.join(
  projectRoot,
  "artifacts",
  "youmind-import",
  "latest",
  "cloud-prompt-dedup-audit.json",
);
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

function parseCsvList(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

  for (const candidate of candidates) {
    const content = fs.readFileSync(candidate, "utf8");
    if (
      /\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(content)
      && /\.pg\.rds\.aliyuncs\.com/.test(content)
      && /\.redis\.rds\.aliyuncs\.com/.test(content)
    ) {
      return candidate;
    }
  }

  throw new Error("could not auto-discover the test environment resource file under .codex");
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

function sqlLiteral(value) {
  if (value == null) {
    return "null";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildAuthorSqlArray(authorUsernames) {
  return `array[${authorUsernames.map(sqlLiteral).join(", ")}]::text[]`;
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
    resource.serverPassword,
  ];

  const child = spawn(plinkPath, args, {
    cwd: projectRoot,
    stdio: "ignore",
    windowsHide: true,
  });

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
    // ignore
  }
}

function runCloudPsqlWithStdin(config, sql) {
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
      reject(new Error(`cloud psql exited with code ${code}\n${stderr || stdout}`));
    });

    child.stdin.end(sql);
  });
}

function buildBaseDuplicateCte(authorUsernames) {
  const authorArray = buildAuthorSqlArray(authorUsernames);
  return `
with target_authors as (
    select id, username
    from users
    where username = any(${authorArray})
),
normalized_prompts as (
    select
        prompt.id,
        prompt.author_id,
        author.username as author_username,
        prompt.modality,
        prompt.title,
        md5(coalesce(nullif(prompt.prompt_text_raw, ''), prompt.prompt_text, '')) as prompt_hash,
        coalesce(prompt.source_platform, '') as source_platform,
        coalesce(prompt.source_campaign, '') as source_campaign,
        coalesce(prompt.source_item_id, '') as source_item_id,
        coalesce(prompt.source_campaign, '') || ':' || coalesce(prompt.source_item_id, '') as source_pair,
        prompt.created_at,
        prompt.updated_at
    from prompt_entries prompt
    join target_authors author on author.id = prompt.author_id
    where prompt.deleted_at is null
      and prompt.publish_status = 'published'
),
ranked_prompts as (
    select
        normalized_prompts.*,
        first_value(id) over prompt_group as survivor_id,
        row_number() over prompt_group as group_rank
    from normalized_prompts
    window prompt_group as (
        partition by author_id, modality, title, prompt_hash
        order by created_at asc, id asc
    )
)
`;
}

function buildAuditSql(authorUsernames) {
  return `
${buildBaseDuplicateCte(authorUsernames)},
duplicate_groups as (
    select
        author_username,
        modality,
        title,
        prompt_hash,
        survivor_id,
        count(*) as total_count,
        count(*) - 1 as duplicate_count,
        json_agg(id::text order by created_at asc, id asc) as prompt_ids,
        json_agg(source_pair order by created_at asc, id asc) as source_pairs,
        json_agg(created_at order by created_at asc, id asc) as created_ats
    from ranked_prompts
    group by author_username, modality, title, prompt_hash, survivor_id
    having count(*) > 1
)
select json_build_object(
    'authorUsername', author_username,
    'modality', modality,
    'title', title,
    'survivorId', survivor_id::text,
    'totalCount', total_count,
    'duplicateCount', duplicate_count,
    'promptIds', prompt_ids,
    'sourcePairs', source_pairs,
    'createdAts', created_ats
)::text
from duplicate_groups
order by duplicate_count desc, modality asc, title asc;
`;
}

function buildApplySql(authorUsernames) {
  return `
begin;

create temporary table tmp_duplicate_pairs
on commit drop
as
${buildBaseDuplicateCte(authorUsernames)}
select
    author_username,
    modality,
    title,
    prompt_hash,
    survivor_id,
    id as duplicate_id
from ranked_prompts
where group_rank > 1;

create temporary table tmp_feed_candidates
on commit drop
as
select
    feed.channel_code,
    min(coalesce(feed.item_type, 'prompt')) as item_type,
    pair.survivor_id as target_id,
    max(feed.rank_score) as rank_score,
    coalesce(
        max(case when feed.status_code = 'active' then feed.status_code end),
        min(feed.status_code),
        'active'
    ) as status_code,
    max(feed.published_at) as published_at,
    min(coalesce(feed.content_kind, 'prompt')) as content_kind,
    'prompt'::varchar(16) as target_type
from feed_items feed
join tmp_duplicate_pairs pair
  on coalesce(feed.target_type, feed.item_type) = 'prompt'
 and feed.target_id = pair.duplicate_id
group by feed.channel_code, pair.survivor_id;

insert into feed_items (
    id,
    channel_code,
    item_type,
    target_id,
    rank_score,
    status_code,
    published_at,
    created_at,
    updated_at,
    content_kind,
    target_type
)
select
    gen_random_uuid(),
    channel_code,
    item_type,
    target_id,
    rank_score,
    status_code,
    published_at,
    now(),
    now(),
    content_kind,
    target_type
from tmp_feed_candidates
on conflict (channel_code, target_type, target_id) do update
set item_type = excluded.item_type,
    content_kind = excluded.content_kind,
    rank_score = greatest(feed_items.rank_score, excluded.rank_score),
    status_code = case
        when feed_items.status_code = 'active' or excluded.status_code = 'active'
            then 'active'
        else excluded.status_code
    end,
    published_at = coalesce(feed_items.published_at, excluded.published_at),
    updated_at = now();

delete from feed_items feed
using tmp_duplicate_pairs pair
where coalesce(feed.target_type, feed.item_type) = 'prompt'
  and feed.target_id = pair.duplicate_id;

update comments comment_row
set target_id = pair.survivor_id,
    updated_at = now()
from tmp_duplicate_pairs pair
where comment_row.target_type = 'prompt'
  and comment_row.target_id = pair.duplicate_id;

create temporary table tmp_interaction_candidates
on commit drop
as
select
    action.actor_id,
    action.action_type,
    'prompt'::varchar(16) as target_type,
    pair.survivor_id as target_id,
    case
        when bool_or(action.status_code = 'active') then 'active'
        else min(action.status_code)
    end as status_code,
    min(action.created_at) as created_at,
    max(action.updated_at) as updated_at
from interaction_actions action
join tmp_duplicate_pairs pair
  on action.target_type = 'prompt'
 and action.target_id = pair.duplicate_id
group by action.actor_id, action.action_type, pair.survivor_id;

insert into interaction_actions (
    id,
    actor_id,
    action_type,
    target_type,
    target_id,
    status_code,
    created_at,
    updated_at
)
select
    gen_random_uuid(),
    actor_id,
    action_type,
    target_type,
    target_id,
    status_code,
    created_at,
    updated_at
from tmp_interaction_candidates
on conflict (actor_id, action_type, target_type, target_id) do update
set status_code = case
        when interaction_actions.status_code = 'active'
          or excluded.status_code = 'active'
            then 'active'
        else excluded.status_code
    end,
    updated_at = now();

delete from interaction_actions action
using tmp_duplicate_pairs pair
where action.target_type = 'prompt'
  and action.target_id = pair.duplicate_id;

update report_tickets ticket
set target_id = pair.survivor_id,
    updated_at = now()
from tmp_duplicate_pairs pair
where ticket.target_type = 'prompt'
  and ticket.target_id = pair.duplicate_id;

update audit_records audit
set target_id = pair.survivor_id
from tmp_duplicate_pairs pair
where audit.target_type = 'prompt'
  and audit.target_id = pair.duplicate_id;

update async_task_records task
set target_id = pair.survivor_id,
    updated_at = now()
from tmp_duplicate_pairs pair
where task.target_type = 'prompt'
  and task.target_id = pair.duplicate_id;

update prompt_entries prompt
set comment_count = stats.comment_count,
    like_count = stats.like_count,
    favorite_count = stats.favorite_count,
    updated_at = now()
from (
    select
        survivor.survivor_id as prompt_id,
        (
            select count(*)
            from comments comment_row
            where comment_row.target_type = 'prompt'
              and comment_row.target_id = survivor.survivor_id
              and comment_row.deleted_at is null
        ) as comment_count,
        (
            select count(*)
            from interaction_actions action
            where action.target_type = 'prompt'
              and action.target_id = survivor.survivor_id
              and action.action_type = 'like'
              and action.status_code = 'active'
        ) as like_count,
        (
            select count(*)
            from interaction_actions action
            where action.target_type = 'prompt'
              and action.target_id = survivor.survivor_id
              and action.action_type = 'favorite'
              and action.status_code = 'active'
        ) as favorite_count
    from (
        select distinct survivor_id
        from tmp_duplicate_pairs
    ) survivor
) stats
where prompt.id = stats.prompt_id;

update prompt_entries prompt
set deleted_at = now(),
    updated_at = now()
where prompt.id in (
    select duplicate_id
    from tmp_duplicate_pairs
);

select json_build_object(
    'duplicateGroups', (
        select count(distinct survivor_id)
        from tmp_duplicate_pairs
    ),
    'duplicateRowsSoftDeleted', (
        select count(*)
        from tmp_duplicate_pairs
    ),
    'feedRowsAffected', (
        select count(*)
        from tmp_feed_candidates
    ),
    'interactionRowsAffected', (
        select count(*)
        from tmp_interaction_candidates
    )
)::text;

commit;
`;
}

function parseJsonLines(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const resourceFile = resolveResourcePath(args["resource-file"]);
  const resource = parseResourceFile(resourceFile);
  const localPort = Number(args["local-port"] ?? defaultLocalPort);
  const containerName = args.container ?? defaultPostgresContainer;
  const authorUsernames = parseCsvList(args["author-usernames"] ?? "community");
  const apply = args.apply === "true";
  const outputFile = path.isAbsolute(args.output ?? defaultOutputFile)
    ? (args.output ?? defaultOutputFile)
    : path.join(projectRoot, args.output ?? defaultOutputFile);

  if (authorUsernames.length === 0) {
    throw new Error("at least one author username is required");
  }

  const tunnel = await startDbTunnel(resource, localPort);
  try {
    const auditRaw = await runCloudPsqlWithStdin(
      {
        ...resource,
        localPort,
        containerName,
      },
      buildAuditSql(authorUsernames),
    );

    const groups = parseJsonLines(auditRaw);
    const duplicateRows = groups.reduce((sum, entry) => sum + Number(entry.duplicateCount ?? 0), 0);

    const payload = {
      exportedAt: new Date().toISOString(),
      applied: false,
      strategy: "community-authors + modality + title + prompt-hash",
      authorUsernames,
      duplicateGroupCount: groups.length,
      duplicateRowCount: duplicateRows,
      groups,
    };

    if (apply && groups.length > 0) {
      const applyRaw = await runCloudPsqlWithStdin(
        {
          ...resource,
          localPort,
          containerName,
        },
        buildApplySql(authorUsernames),
      );
      const applySummary = JSON.parse(applyRaw);
      payload.applied = true;
      payload.applySummary = applySummary;
      payload.appliedAt = new Date().toISOString();
    }

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(`${outputFile}`, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

    process.stdout.write(`${outputFile}\n`);
    process.stdout.write(`${groups.length}|${duplicateRows}\n`);
    if (payload.applySummary) {
      process.stdout.write(`${JSON.stringify(payload.applySummary)}\n`);
    }
  } finally {
    closeTunnel(tunnel);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
