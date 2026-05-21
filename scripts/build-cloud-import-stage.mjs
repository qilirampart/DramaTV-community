import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

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

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cleanDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  ensureDir(dirPath);
}

function copyFile(sourcePath, targetPath) {
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function copyDir(sourceDir, targetDir) {
  ensureDir(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
      continue;
    }
    copyFile(sourcePath, targetPath);
  }
}

function normalizeEntryFolder(entry) {
  return typeof entry?.folder === "string" ? entry.folder.trim() : "";
}

function listSeedanceRoots(sourceRoot) {
  return fs
    .readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^youmind-seedance-library(?:-p\d{3}-p\d{3})?$/.test(entry.name))
    .map((entry) => path.join(sourceRoot, entry.name))
    .sort((left, right) => left.localeCompare(right, "en"));
}

function buildImageLibrarySubset({ sourceRoot, targetRoot, offset, count }) {
  const manifestPath = path.join(sourceRoot, "library-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest not found: ${manifestPath}`);
  }

  const manifest = loadJson(manifestPath);
  const eligible = manifest.filter((entry) => {
    if (entry?.grade !== "A" || !entry?.hasRawPrompt) {
      return false;
    }

    const folder = normalizeEntryFolder(entry);
    if (!folder) {
      return false;
    }

    const itemRoot = path.join(sourceRoot, folder);
    const metaPath = path.join(itemRoot, "meta.json");
    const imageDir = path.join(itemRoot, "images");
    return fs.existsSync(itemRoot) && fs.existsSync(metaPath) && fs.existsSync(imageDir);
  });

  const selected = eligible.slice(offset, offset + count);
  cleanDir(targetRoot);

  for (const entry of selected) {
    copyDir(path.join(sourceRoot, entry.folder), path.join(targetRoot, entry.folder));
  }
  writeJson(path.join(targetRoot, "library-manifest.json"), selected);

  return {
    eligibleCount: eligible.length,
    selectedCount: selected.length,
    firstFolder: selected[0]?.folder ?? null,
    lastFolder: selected[selected.length - 1]?.folder ?? null
  };
}

function buildSeedanceSubset({ sourceRoot, targetRoot, offset, count }) {
  const allEligible = [];

  for (const libraryRoot of listSeedanceRoots(sourceRoot)) {
    const manifestPath = path.join(libraryRoot, "library-manifest.json");
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const manifest = loadJson(manifestPath);
    for (const entry of manifest) {
      if (entry?.grade !== "A") {
        continue;
      }

      const folder = normalizeEntryFolder(entry);
      if (!folder) {
        continue;
      }

      const itemRoot = path.join(libraryRoot, folder);
      if (!fs.existsSync(path.join(itemRoot, "meta.json")) || !fs.existsSync(path.join(itemRoot, "video.mp4"))) {
        continue;
      }

      allEligible.push({
        ...entry,
        __libraryRoot: libraryRoot
      });
    }
  }

  const selected = allEligible.slice(offset, offset + count);
  cleanDir(targetRoot);

  const groupedByLibrary = new Map();
  for (const entry of selected) {
    const libraryRoot = entry.__libraryRoot;
    if (!groupedByLibrary.has(libraryRoot)) {
      groupedByLibrary.set(libraryRoot, []);
    }
    groupedByLibrary.get(libraryRoot).push(entry);
  }

  for (const [libraryRoot, entries] of groupedByLibrary.entries()) {
    const libraryName = path.basename(libraryRoot);
    const targetLibraryRoot = path.join(targetRoot, libraryName);
    cleanDir(targetLibraryRoot);
    for (const entry of entries) {
      copyDir(path.join(libraryRoot, entry.folder), path.join(targetLibraryRoot, entry.folder));
    }
    writeJson(
      path.join(targetLibraryRoot, "library-manifest.json"),
      entries.map(({ __libraryRoot, ...rest }) => rest)
    );
  }

  return {
    eligibleCount: allEligible.length,
    selectedCount: selected.length,
    firstFolder: selected[0]?.folder ?? null,
    lastFolder: selected[selected.length - 1]?.folder ?? null,
    selectedLibraries: [...new Set(selected.map((entry) => path.basename(entry.__libraryRoot)))]
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const researchRoot = path.resolve(args["research-root"] ?? path.join(projectRoot, "docs", "02_研究"));
  const stageName = args["stage-name"] ?? "stage-batch2";
  const outputRoot = path.resolve(args["output-root"] ?? path.join(projectRoot, "artifacts", "cloud-import", stageName));

  cleanDir(outputRoot);

  const scriptTargets = [
    ["scripts/import-youmind-assets-via-api.mjs", "scripts/import-youmind-assets-via-api.mjs"],
    ["scripts/lib/prompt-taxonomy.mjs", "scripts/lib/prompt-taxonomy.mjs"]
  ];

  for (const [sourceRel, targetRel] of scriptTargets) {
    copyFile(path.join(projectRoot, sourceRel), path.join(outputRoot, targetRel));
  }

  const summary = {
    stageName,
    researchRoot,
    outputRoot,
    builtAt: new Date().toISOString(),
    batches: {}
  };

  const awesomeCount = toPositiveInt(args["awesome-count"], 0);
  if (awesomeCount > 0) {
    summary.batches["awesome-gpt-image-2"] = buildImageLibrarySubset({
      sourceRoot: path.join(researchRoot, "github-image-assets", "awesome-gpt-image-2-prompts-library"),
      targetRoot: path.join(outputRoot, "docs", "02_研究", "github-image-assets", "awesome-gpt-image-2-prompts-library"),
      offset: toPositiveInt(args["awesome-start"], 0),
      count: awesomeCount
    });
  }

  const gptComicCount = toPositiveInt(args["gpt-comic-count"], 0);
  if (gptComicCount > 0) {
    summary.batches["gpt-comic"] = buildImageLibrarySubset({
      sourceRoot: path.join(researchRoot, "youmind-image-assets", "gpt-image-2-comic-storyboard-library-p001-p014"),
      targetRoot: path.join(outputRoot, "docs", "02_研究", "youmind-image-assets", "gpt-image-2-comic-storyboard-library-p001-p014"),
      offset: toPositiveInt(args["gpt-comic-start"], 0),
      count: gptComicCount
    });
  }

  const nanoCount = toPositiveInt(args["nano-count"], 0);
  if (nanoCount > 0) {
    summary.batches.nano = buildImageLibrarySubset({
      sourceRoot: path.join(researchRoot, "youmind-image-assets", "nano-banana-library-p001-p190"),
      targetRoot: path.join(outputRoot, "docs", "02_研究", "youmind-image-assets", "nano-banana-library-p001-p190"),
      offset: toPositiveInt(args["nano-start"], 0),
      count: nanoCount
    });
  }

  const nanoComicCount = toPositiveInt(args["nano-comic-count"], 0);
  if (nanoComicCount > 0) {
    summary.batches["nano-comic"] = buildImageLibrarySubset({
      sourceRoot: path.join(researchRoot, "youmind-image-assets", "nano-banana-comic-storyboard-library-p001-p023"),
      targetRoot: path.join(outputRoot, "docs", "02_研究", "youmind-image-assets", "nano-banana-comic-storyboard-library-p001-p023"),
      offset: toPositiveInt(args["nano-comic-start"], 0),
      count: nanoComicCount
    });
  }

  const seedanceCount = toPositiveInt(args["seedance-count"], 0);
  if (seedanceCount > 0) {
    summary.batches.seedance = buildSeedanceSubset({
      sourceRoot: path.join(researchRoot, "youmind-video-assets"),
      targetRoot: path.join(outputRoot, "docs", "02_研究", "youmind-video-assets"),
      offset: toPositiveInt(args["seedance-start"], 0),
      count: seedanceCount
    });
  }

  writeJson(path.join(outputRoot, "stage-summary.json"), summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main();
