import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const codexRoot = path.join(projectRoot, ".codex");
const defaultOutputFile = path.join(projectRoot, "artifacts", "youmind-import", "latest", "cloud-seeded-source-pairs.json");
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

function runCloudPsql(config, sql) {
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
        "ON_ERROR_STOP=1",
        "-c",
        sql
      ],
      {
        cwd: projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
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
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const resourceFile = resolveResourcePath(args["resource-file"]);
  const resource = parseResourceFile(resourceFile);
  const localPort = Number(args["local-port"] ?? defaultLocalPort);
  const containerName = args.container ?? defaultPostgresContainer;
  const sourceAuthorPrefix = args["source-author-prefix"] ?? "ymimport-";
  const authorUsernames = parseCsvList(args["author-usernames"] ?? "community");
  const outputFile = path.isAbsolute(args.output ?? defaultOutputFile)
    ? (args.output ?? defaultOutputFile)
    : path.join(projectRoot, args.output ?? defaultOutputFile);

  const tunnel = await startDbTunnel(resource, localPort);
  try {
    const authorConditions = [];
    if (String(sourceAuthorPrefix ?? "").trim()) {
      authorConditions.push(`author.username like '${String(sourceAuthorPrefix).replace(/'/g, "''")}%'`);
    }
    if (authorUsernames.length > 0) {
      authorConditions.push(
        `author.username in (${authorUsernames.map((value) => `'${String(value).replace(/'/g, "''")}'`).join(", ")})`
      );
    }

    const sql = `
select distinct concat(prompt.source_campaign, '|', prompt.source_item_id)
from prompt_entries prompt
join users author on author.id = prompt.author_id
where prompt.publish_status = 'published'
  and prompt.deleted_at is null
  and prompt.source_campaign is not null
  and prompt.source_item_id is not null
  and (${authorConditions.join("\n    or ")})
order by 1 asc;
`;

    const raw = await runCloudPsql(
      {
        ...resource,
        localPort,
        containerName
      },
      sql
    );

    const pairs = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(
      outputFile,
      `${JSON.stringify({
        exportedAt: new Date().toISOString(),
        sourceAuthorPrefix,
        authorUsernames,
        count: pairs.length,
        pairs
      }, null, 2)}\n`,
      "utf8"
    );

    process.stdout.write(`${outputFile}\n${pairs.length}\n`);
  } finally {
    closeTunnel(tunnel);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
