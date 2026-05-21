import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const codexRoot = path.join(projectRoot, ".codex");
const defaultPostgresContainer = process.env.DRAMATV_POSTGRES_CONTAINER || "dramatv-postgres";
const defaultLocalPort = Number(process.env.DRAMATV_CLOUD_DB_TUNNEL_PORT || 15432);
const puttyHostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk";
const defaultPassword = process.env.DRAMATV_IMPORT_PASSWORD || "dramatv-local-dev";

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

  return {
    serverHost,
    serverPassword,
    dbHost,
    dbPort,
    dbName,
    dbUser,
    dbPassword
  };
}

function sqlLiteral(value) {
  if (value == null) {
    return "null";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
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
        resolve(stdout.trim());
        return;
      }
      reject(new Error(`cloud psql exited with code ${code}\n${stderr || stdout}`));
    });

    child.stdin.end(sql);
  });
}

function buildSql({
  username,
  displayName,
  bio,
  headline,
  password,
  sourcePlatforms,
  sourceCampaigns,
  sourceAuthorPrefix,
  dryRun
}) {
  const platformArray = `array[${sourcePlatforms.map(sqlLiteral).join(", ")}]::text[]`;
  const campaignArray = `array[${sourceCampaigns.map(sqlLiteral).join(", ")}]::text[]`;

  return `
begin;

create temporary table tmp_target_user (
    id uuid
) on commit drop;

insert into users (
    id,
    username,
    display_name,
    password_hash,
    identity_provider,
    external_subject,
    bio,
    role_code,
    status_code,
    created_at,
    updated_at
)
select
    gen_random_uuid(),
    ${sqlLiteral(username)},
    ${sqlLiteral(displayName)},
    crypt(${sqlLiteral(password)}, gen_salt('bf', 10)),
    'local',
    ${sqlLiteral(username)},
    ${sqlLiteral(bio)},
    'creator',
    'active',
    now(),
    now()
where not exists (
    select 1
    from users
    where username = ${sqlLiteral(username)}
);

insert into tmp_target_user (id)
select id
from users
where username = ${sqlLiteral(username)}
limit 1;

update users user_account
set display_name = ${sqlLiteral(displayName)},
    bio = ${sqlLiteral(bio)},
    role_code = 'creator',
    status_code = 'active',
    identity_provider = 'local',
    external_subject = coalesce(user_account.external_subject, user_account.username),
    password_hash = coalesce(user_account.password_hash, crypt(${sqlLiteral(password)}, gen_salt('bf', 10))),
    updated_at = now()
where user_account.id = (select id from tmp_target_user limit 1);

insert into creator_profiles (
    id,
    user_id,
    headline,
    featured_status,
    created_at,
    updated_at
)
select
    gen_random_uuid(),
    target.id,
    ${sqlLiteral(headline)},
    'normal',
    now(),
    now()
from tmp_target_user target
where not exists (
    select 1
    from creator_profiles profile
    where profile.user_id = target.id
);

update creator_profiles
set headline = ${sqlLiteral(headline)},
    updated_at = now()
where user_id = (select id from tmp_target_user limit 1);

create temporary table tmp_matched_prompts
on commit drop
as
select prompt.id
from prompt_entries prompt
join users current_author on current_author.id = prompt.author_id
where prompt.publish_status = 'published'
  and prompt.deleted_at is null
  and prompt.source_platform = any(${platformArray})
  and prompt.source_campaign = any(${campaignArray})
  and current_author.username like ${sqlLiteral(`${sourceAuthorPrefix}%`)};

create temporary table tmp_matched_assets
on commit drop
as
select asset.id
from media_assets asset
where asset.biz_type = 'prompt'
  and asset.biz_id in (select id from tmp_matched_prompts);

${dryRun ? `
select
    (select id::text from tmp_target_user limit 1) as community_user_id,
    (select count(*)::text from tmp_matched_prompts) as prompt_count,
    (select count(*)::text from tmp_matched_assets) as asset_count;

rollback;
` : `
update prompt_entries prompt
set author_id = (select id from tmp_target_user limit 1),
    updated_at = now()
where prompt.id in (select id from tmp_matched_prompts);

update media_assets asset
set created_by = (select id from tmp_target_user limit 1),
    updated_at = now()
where asset.id in (select id from tmp_matched_assets);

update creator_profiles profile
set video_count = (
        select count(*)
        from videos video
        where video.author_id = profile.user_id
          and video.publish_status = 'published'
          and video.deleted_at is null
    ),
    workflow_count = (
        select count(*)
        from workflows workflow
        where workflow.author_id = profile.user_id
          and workflow.publish_status = 'published'
          and workflow.deleted_at is null
    ),
    like_received_count = (
        select coalesce(sum(target_like_count), 0)
        from (
            select sum(prompt.like_count)::bigint as target_like_count
            from prompt_entries prompt
            where prompt.author_id = profile.user_id
              and prompt.publish_status = 'published'
              and prompt.deleted_at is null
            union all
            select sum(video.like_count)::bigint
            from videos video
            where video.author_id = profile.user_id
              and video.publish_status = 'published'
              and video.deleted_at is null
            union all
            select sum(workflow.like_count)::bigint
            from workflows workflow
            where workflow.author_id = profile.user_id
              and workflow.publish_status = 'published'
              and workflow.deleted_at is null
            union all
            select sum(thread.like_count)::bigint
            from discussion_threads thread
            where thread.author_id = profile.user_id
              and thread.publish_status = 'published'
              and thread.deleted_at is null
        ) stats
    ),
    updated_at = now()
where profile.user_id = (select id from tmp_target_user limit 1);

select
    (select id::text from tmp_target_user limit 1) as community_user_id,
    (select count(*)::text from tmp_matched_prompts) as reassigned_prompt_count,
    (select count(*)::text from tmp_matched_assets) as reassigned_asset_count;

commit;
`}
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const resourceFile = resolveResourcePath(args["resource-file"]);
  const resource = parseResourceFile(resourceFile);
  const localPort = Number(args["local-port"] ?? defaultLocalPort);
  const containerName = args.container ?? defaultPostgresContainer;
  const username = args["author-username"] ?? "community";
  const displayName = args["author-display-name"] ?? "community";
  const bio = args["author-bio"] ?? "社区初始数据";
  const headline = args["author-headline"] ?? "社区初始数据";
  const password = args.password ?? defaultPassword;
  const dryRun = args["dry-run"] === "true";
  const sourceAuthorPrefix = args["source-author-prefix"] ?? "ymimport-";
  const sourcePlatforms = (args["source-platforms"] ?? "youmind,github")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const sourceCampaigns = (args["source-campaigns"] ?? "youmind-seedance,youmind-nano-banana,nano-banana-pro-prompts,gpt-image-2-prompts,awesome-gpt-image-2-prompts")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const tunnel = await startDbTunnel(resource, localPort);
  try {
    const output = await runCloudPsqlWithStdin(
      {
        ...resource,
        localPort,
        containerName
      },
      buildSql({
        username,
        displayName,
        bio,
        headline,
        password,
        sourcePlatforms,
        sourceCampaigns,
        sourceAuthorPrefix,
        dryRun
      })
    );
    process.stdout.write(`${output}\n`);
  } finally {
    closeTunnel(tunnel);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
