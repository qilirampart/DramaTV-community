const fs = require("fs");
const path = require("path");

const root = process.cwd();
const outputPath = process.argv[2] ? path.resolve(root, process.argv[2]) : null;
const inputPaths = process.argv.slice(3).map((item) => path.resolve(root, item));

if (!outputPath || inputPaths.length === 0) {
  throw new Error("Usage: node merge-youmind-items.js <outputJson> <inputJson1> [inputJson2] ...");
}

const merged = [];

for (const inputPath of inputPaths) {
  const items = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  merged.push(...items);
}

fs.writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      inputCount: inputPaths.length,
      mergedCount: merged.length,
      inputPaths
    },
    null,
    2
  )
);
