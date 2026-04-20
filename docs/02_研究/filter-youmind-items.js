const fs = require("fs");
const path = require("path");

const root = process.cwd();
const inputPath = process.argv[2] ? path.resolve(root, process.argv[2]) : null;
const excludePath = process.argv[3] ? path.resolve(root, process.argv[3]) : null;
const outputPath = process.argv[4] ? path.resolve(root, process.argv[4]) : null;

if (!inputPath || !excludePath || !outputPath) {
  throw new Error(
    "Usage: node filter-youmind-items.js <inputJson> <excludeJson> <outputJson>"
  );
}

const inputItems = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const excludeItems = JSON.parse(fs.readFileSync(excludePath, "utf8"));

const excludeStreamIds = new Set(excludeItems.map((item) => item.streamId).filter(Boolean));
const excludeSourceLinks = new Set(excludeItems.map((item) => item.sourceLink).filter(Boolean));

const seenStreamIds = new Set();
const seenSourceLinks = new Set();

const filtered = [];
const skipped = [];

for (const item of inputItems) {
  const duplicateAgainstBase =
    (item.streamId && excludeStreamIds.has(item.streamId)) ||
    (item.sourceLink && excludeSourceLinks.has(item.sourceLink));
  const duplicateInsideBatch =
    (item.streamId && seenStreamIds.has(item.streamId)) ||
    (item.sourceLink && seenSourceLinks.has(item.sourceLink));

  if (duplicateAgainstBase || duplicateInsideBatch) {
    skipped.push({
      rank: item.rank,
      id: item.id,
      streamId: item.streamId,
      sourceLink: item.sourceLink,
      reason: duplicateAgainstBase ? "duplicate against exclude set" : "duplicate inside batch"
    });
    continue;
  }

  if (item.streamId) {
    seenStreamIds.add(item.streamId);
  }

  if (item.sourceLink) {
    seenSourceLinks.add(item.sourceLink);
  }

  filtered.push(item);
}

fs.writeFileSync(outputPath, `${JSON.stringify(filtered, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      inputPath,
      excludePath,
      outputPath,
      inputCount: inputItems.length,
      outputCount: filtered.length,
      skippedCount: skipped.length,
      skipped
    },
    null,
    2
  )
);
