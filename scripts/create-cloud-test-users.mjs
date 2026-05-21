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
const defaultPassword = "123456";
const defaultUsernames = Array.from({ length: 10 }, (_, index) => `creator-${String.fromCharCode("b".charCodeAt(0) + index)}`);

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
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildValuesSql(usernames) {
  return usernames
    .map((username) => {
      const suffix = username.slice(username.lastIndexOf("-") + 1).toUpperCase();
      const displayName = username;
      const headline = `Test creator ${suffix}`;
      return `(${sqlLiteral(username)}, ${sqlLiteral(displayName)}, ${sqlLiteral(headline)})`;
    })
    .join(",\n    ");
}

function buildExistingUsersSql(usernames) {
  return `
with target_users(username) as (
    values
    ${usernames.map((username) => `(${sqlLiteral(username)})`).join(",\n    ")}
)
select username
from users
where username in (select username from target_users)
order by username asc;
`;
}

function buildInsertSql(usernames, password) {
  const valuesSql = buildValuesSql(usernames);
  return `
with target_users(username, display_name, headline) as (
    values
    ${valuesSql}
),
inserted_users as (
    insert into users (
        id,
        username,
        display_name,
        password_hash,
        identity_provider,
        external_subject,
        role_code,
        status_code,
        created_at,
        updated_at
    )
    select
        gen_random_uuid(),
        target_users.username,
        target_users.display_name,
        crypt(${sqlLiteral(password)}, gen_salt('bf', 10)),
        'local',
        target_users.username,
        'creator',
        'active',
        now(),
        now()
    from target_users
    returning id, username
)
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
    inserted_users.id,
    target_users.headline,
    'normal',
    now(),
    now()
from inserted_users
join target_users on target_users.username = inserted_users.username;
`;
}

function buildSummarySql(usernames) {
  return `
select
    users.username,
    users.display_name,
    users.identity_provider,
    users.role_code,
    users.status_code,
    coalesce(creator_profiles.headline, '') as headline
from users
left join creator_profiles on creator_profiles.user_id = users.id
where users.username in (${usernames.map(sqlLiteral).join(", ")})
order by users.username asc;
`;
}

function parseLineSet(stdout) {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
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
        "-F",
        "|",
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
  const usernames = (args.usernames ? args.usernames.split(",") : defaultUsernames)
    .map((value) => value.trim())
    .filter(Boolean);
  const password = args.password ?? defaultPassword;
  const resourceFile = resolveResourcePath(args["resource-file"]);
  const resource = parseResourceFile(resourceFile);
  const localPort = Number(args["local-port"] ?? defaultLocalPort);
  const containerName = args.container ?? defaultPostgresContainer;
  const tunnel = await startDbTunnel(resource, localPort);

  try {
    const existing = parseLineSet(
      await runCloudPsqlWithStdin(
        {
          ...resource,
          localPort,
          containerName
        },
        buildExistingUsersSql(usernames)
      )
    );

    if (existing.length > 0) {
      throw new Error(`target usernames already exist: ${existing.join(", ")}`);
    }

    await runCloudPsqlWithStdin(
      {
        ...resource,
        localPort,
        containerName
      },
      buildInsertSql(usernames, password)
    );

    const summary = parseLineSet(
      await runCloudPsqlWithStdin(
        {
          ...resource,
          localPort,
          containerName
        },
        buildSummarySql(usernames)
      )
    );

    process.stdout.write(`${JSON.stringify({ createdUsernames: usernames, summary }, null, 2)}\n`);
  } finally {
    closeTunnel(tunnel);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
