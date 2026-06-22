const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const SCRIPT_DIR = __dirname;
const EXTRACTED_ROOT = path.join(
  SCRIPT_DIR,
  "youmind-video-assets",
  "youmind-seedance-extracted"
);
const FETCH_SCRIPT = path.join(SCRIPT_DIR, "fetch-youmind-seedance-current.js");
const DOWNLOAD_SCRIPT = path.join(SCRIPT_DIR, "download-youmind-videos.js");

function parseArgs(argv) {
  const options = {
    start: 36,
    count: 764,
    batchSize: 12,
    dateTag: "2026-06-18",
    batchNumberStart: null,
    force: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--start" && next) {
      options.start = Number(next);
      index += 1;
      continue;
    }

    if (arg === "--count" && next) {
      options.count = Number(next);
      index += 1;
      continue;
    }

    if (arg === "--batchSize" && next) {
      options.batchSize = Number(next);
      index += 1;
      continue;
    }

    if (arg === "--dateTag" && next) {
      options.dateTag = next;
      index += 1;
      continue;
    }

    if (arg === "--batchNumberStart" && next) {
      options.batchNumberStart = Number(next);
      index += 1;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
    }
  }

  if (!Number.isInteger(options.start) || options.start < 0) {
    throw new Error("--start must be a non-negative integer");
  }

  if (!Number.isInteger(options.count) || options.count <= 0) {
    throw new Error("--count must be a positive integer");
  }

  if (!Number.isInteger(options.batchSize) || options.batchSize <= 0) {
    throw new Error("--batchSize must be a positive integer");
  }

  if (
    options.batchNumberStart !== null &&
    (!Number.isInteger(options.batchNumberStart) || options.batchNumberStart <= 0)
  ) {
    throw new Error("--batchNumberStart must be a positive integer when provided");
  }

  return options;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function runNodeScript(scriptPath, args) {
  execFileSync("node", [scriptPath, ...args], {
    stdio: "inherit",
    cwd: SCRIPT_DIR,
    maxBuffer: 50 * 1024 * 1024
  });
}

function buildBatchLabel(batchNumber) {
  return `batch${batchNumber}`;
}

function countMp4Files(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.mp4$/i.test(entry.name)).length;
}

function buildBatchPlan(options) {
  const plan = [];
  let remaining = options.count;
  let currentStart = options.start;
  let explicitBatchNumber = options.batchNumberStart;

  while (remaining > 0) {
    const currentCount = Math.min(options.batchSize, remaining);
    const batchNumber =
      explicitBatchNumber !== null
        ? explicitBatchNumber
        : Math.floor(currentStart / options.batchSize) + 1;
    const batchLabel = buildBatchLabel(batchNumber);
    const outputName = `seedance-items.current.${options.dateTag}.${batchLabel}.json`;
    const outputPath = path.join(EXTRACTED_ROOT, outputName);
    const videoDir = path.join(EXTRACTED_ROOT, `videos-current-${options.dateTag}-${batchLabel}`);

    plan.push({
      batchNumber,
      batchLabel,
      start: currentStart,
      count: currentCount,
      outputName,
      outputPath,
      videoDir
    });

    currentStart += currentCount;
    remaining -= currentCount;
    if (explicitBatchNumber !== null) {
      explicitBatchNumber += 1;
    }
  }

  return plan;
}

function shouldSkipBatch(batch, force) {
  if (force) {
    return false;
  }

  if (!fs.existsSync(batch.outputPath)) {
    return false;
  }

  return countMp4Files(batch.videoDir) > 0;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDir(EXTRACTED_ROOT);

  const plan = buildBatchPlan(options);
  const summary = {
    generatedAt: new Date().toISOString(),
    options,
    batches: []
  };

  for (const batch of plan) {
    const mp4CountBefore = countMp4Files(batch.videoDir);

    if (shouldSkipBatch(batch, options.force)) {
      summary.batches.push({
        ...batch,
        skipped: true,
        existingVideoCount: mp4CountBefore
      });
      continue;
    }

    runNodeScript(FETCH_SCRIPT, [
      "--start",
      String(batch.start),
      "--count",
      String(batch.count),
      "--output",
      batch.outputName
    ]);

    runNodeScript(DOWNLOAD_SCRIPT, [batch.outputPath, batch.videoDir]);

    summary.batches.push({
      ...batch,
      skipped: false,
      downloadedVideoCount: countMp4Files(batch.videoDir)
    });
  }

  const summaryPath = path.join(
    EXTRACTED_ROOT,
    `seedance-current-bulk-run.${options.dateTag}.start${options.start}.count${options.count}.summary.json`
  );
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        summaryPath,
        totalBatches: summary.batches.length,
        skippedBatches: summary.batches.filter((item) => item.skipped).length,
        executedBatches: summary.batches.filter((item) => !item.skipped).length
      },
      null,
      2
    )
  );
}

main();
