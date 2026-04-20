import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const assetPath = path.join(projectRoot, ".drawio-assets");

const drawioRoot =
  "C:/Users/psk13/AppData/Local/npm-cache/_npx/a34dfef1e92abe10/node_modules/drawio-mcp-server/build";

const { ensureAssets } = await import(`file:///${drawioRoot}/assets/index.js`);

await mkdir(assetPath, { recursive: true });

const result = await ensureAssets(
  { assetPath },
  (message) => process.stderr.write(`${message}\n`),
);

process.stdout.write(`Assets ready at ${result.assetRoot}\n`);
