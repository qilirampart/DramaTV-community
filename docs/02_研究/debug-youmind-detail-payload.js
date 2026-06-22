const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2];
const needle = process.argv[3] || "6159";

if (!inputPath) {
  throw new Error("Usage: node debug-youmind-detail-payload.js <htmlPath> [needle]");
}

function decodeJsStringLiteral(raw) {
  return JSON.parse(`"${raw}"`);
}

function collectFlightPayload(html) {
  const regex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  const chunks = [];
  let match;

  while ((match = regex.exec(html))) {
    chunks.push(decodeJsStringLiteral(match[1]));
  }

  return chunks.join("");
}

const resolvedPath = path.resolve(process.cwd(), inputPath);
const html = fs.readFileSync(resolvedPath, "utf8");
const payload = collectFlightPayload(html);
const index = payload.indexOf(needle);

console.log(
  JSON.stringify(
    {
      resolvedPath,
      payloadLength: payload.length,
      needle,
      index,
      excerpt:
        index === -1
          ? null
          : payload.slice(Math.max(0, index - 1000), Math.min(payload.length, index + 4000))
    },
    null,
    2
  )
);
