import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const codexRoot = path.join(projectRoot, ".codex");

const puttyHostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk";
const defaultRemoteRoot = "/tmp";
const defaultRemoteStateFile = "/tmp/stage-batch1/artifacts/youmind-import/latest/state.cloud-batch1.json";
const defaultLocalStateSnapshot = path.join(projectRoot, "artifacts", "youmind-import", "latest", "state.cloud-batch1.snapshot.json");
const defaultSkipSourcePairsFile = path.join(projectRoot, "artifacts", "youmind-import", "latest", "cloud-seeded-source-pairs.json");

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

  return {
    serverHost,
    serverPassword
  };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function runFile(command, args, options = {}) {
  try {
    const result = execFileSync(command, args, {
      cwd: options.cwd ?? projectRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true
    });
    return result.trim();
  } catch (error) {
    const stdout = typeof error?.stdout === "string" ? error.stdout : error?.stdout?.toString?.("utf8") ?? "";
    const stderr = typeof error?.stderr === "string" ? error.stderr : error?.stderr?.toString?.("utf8") ?? "";
    const details = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
    throw new Error(`command failed: ${command} ${args.join(" ")}${details ? `\n${details}` : ""}`);
  }
}

function shQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function buildKindLimitArgs(kind) {
  switch (kind) {
    case "seedance":
      return ["--seedance-limit", "0"];
    case "nano":
      return ["--nano-limit", "0"];
    case "gpt-comic":
      return ["--gpt-comic-limit", "0"];
    case "nano-comic":
      return ["--nano-comic-limit", "0"];
    case "awesome-gpt-image-2":
      return ["--awesome-limit", "0"];
    default:
      throw new Error(`unsupported batch kind: ${kind}`);
  }
}

function buildRemoteImportCommand({ remoteStageDir, remoteStateFile, backendBaseUrl, kind }) {
  const args = [
    "node",
    "./scripts/import-youmind-assets-via-api.mjs",
    "--backend-base-url",
    backendBaseUrl,
    "--state-file",
    remoteStateFile,
    "--skip-source-pairs-file",
    "./artifacts/youmind-import/latest/cloud-seeded-source-pairs.json",
    "--author-mode",
    "fixed",
    "--author-username",
    "community",
    "--author-display-name",
    "community",
    "--author-bio",
    "community",
    "--author-headline",
    "community",
    "--kind",
    kind,
    ...buildKindLimitArgs(kind)
  ];

  return `cd ${shQuote(remoteStageDir)} && ${args.map(shQuote).join(" ")}`;
}

function summarizeStateCounts(state) {
  const counts = {};
  for (const key of Object.keys(state.items ?? {})) {
    const prefix = key.split(":", 1)[0] || "unknown";
    counts[prefix] = (counts[prefix] ?? 0) + 1;
  }
  return counts;
}

function copyDir(sourceDir, targetDir) {
  fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const stageName = args["stage-name"];
  if (!stageName) {
    throw new Error("missing required argument: --stage-name");
  }

  const resourceFile = resolveResourcePath(args["resource-file"]);
  const resource = parseResourceFile(resourceFile);
  const pscpPath = path.join(projectRoot, ".tools", "putty", "pscp.exe");
  const plinkPath = path.join(projectRoot, ".tools", "putty", "plink.exe");
  const stageDir = path.join(projectRoot, "artifacts", "cloud-import", stageName);
  const stageSummaryPath = path.join(stageDir, "stage-summary.json");
  const skipSourcePairsFile = path.resolve(args["skip-source-pairs-file"] ?? defaultSkipSourcePairsFile);
  const backendBaseUrl = args["backend-base-url"] ?? "http://127.0.0.1:18080";
  const remoteRoot = args["remote-root"] ?? defaultRemoteRoot;
  const remoteStateFile = args["remote-state-file"] ?? defaultRemoteStateFile;
  const localStateSnapshot = path.resolve(args["local-state-snapshot"] ?? defaultLocalStateSnapshot);
  const tarPath = process.env.SystemRoot
    ? path.join(process.env.SystemRoot, "System32", "tar.exe")
    : "tar.exe";

  if (!fs.existsSync(pscpPath)) {
    throw new Error(`pscp not found: ${pscpPath}`);
  }
  if (!fs.existsSync(plinkPath)) {
    throw new Error(`plink not found: ${plinkPath}`);
  }
  if (!fs.existsSync(stageDir)) {
    throw new Error(`stage directory not found: ${stageDir}`);
  }
  if (!fs.existsSync(stageSummaryPath)) {
    throw new Error(`stage summary not found: ${stageSummaryPath}`);
  }
  if (!fs.existsSync(skipSourcePairsFile)) {
    throw new Error(`skip source pairs file not found: ${skipSourcePairsFile}`);
  }

  const stageSummary = JSON.parse(fs.readFileSync(stageSummaryPath, "utf8").replace(/^\uFEFF/, ""));
  const kinds = Object.keys(stageSummary.batches ?? {});
  if (kinds.length === 0) {
    throw new Error(`no batches declared in ${stageSummaryPath}`);
  }

  const tempRoot = path.join(os.tmpdir(), "dramatv-cloud-import", stageName);
  const tempStageDir = path.join(tempRoot, stageName);
  cleanDir(tempRoot);
  copyDir(stageDir, tempStageDir);
  ensureDir(path.join(tempStageDir, "artifacts", "youmind-import", "latest"));
  fs.copyFileSync(
    skipSourcePairsFile,
    path.join(tempStageDir, "artifacts", "youmind-import", "latest", path.basename(skipSourcePairsFile))
  );

  const remoteStageDir = `${remoteRoot.replace(/\/+$/, "")}/${stageName}`;
  const archivePath = path.join(tempRoot, `${stageName}.tar.gz`);
  const remoteArchivePath = `${remoteRoot.replace(/\/+$/, "")}/${stageName}.tar.gz`;
  runFile(tarPath, ["-czf", archivePath, "-C", tempRoot, stageName]);

  runFile(
    pscpPath,
    [
      "-batch",
      "-hostkey",
      puttyHostKey,
      "-pw",
      resource.serverPassword,
      archivePath,
      `root@${resource.serverHost}:${remoteArchivePath}`
    ]
  );

  runFile(
    plinkPath,
    [
      "-ssh",
      "-batch",
      "-hostkey",
      puttyHostKey,
      `root@${resource.serverHost}`,
      "-pw",
      resource.serverPassword,
      `mkdir -p ${shQuote(remoteRoot)} && rm -rf ${shQuote(remoteStageDir)} && tar -xzf ${shQuote(remoteArchivePath)} -C ${shQuote(remoteRoot)}`
    ]
  );

  const importResults = [];
  for (const kind of kinds) {
    const remoteCommand = buildRemoteImportCommand({
      remoteStageDir,
      remoteStateFile,
      backendBaseUrl,
      kind
    });

    const stdout = runFile(
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
      ]
    );

    importResults.push({
      kind,
      summary: JSON.parse(stdout)
    });
  }

  ensureDir(path.dirname(localStateSnapshot));
  const remoteStateRaw = runFile(
    plinkPath,
    [
      "-ssh",
      "-batch",
      "-hostkey",
      puttyHostKey,
      `root@${resource.serverHost}`,
      "-pw",
      resource.serverPassword,
      `cat ${shQuote(remoteStateFile)}`
    ]
  );
  fs.writeFileSync(localStateSnapshot, `${remoteStateRaw}\n`, "utf8");

  const state = JSON.parse(fs.readFileSync(localStateSnapshot, "utf8").replace(/^\uFEFF/, ""));
  const counts = summarizeStateCounts(state);

  process.stdout.write(
    `${JSON.stringify(
      {
        stageName,
        remoteStageDir,
        importResults,
        stateSnapshot: localStateSnapshot,
        stateCounts: counts
      },
      null,
      2
    )}\n`
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
}
