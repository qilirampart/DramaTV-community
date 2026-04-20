import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const defaultAssetPath = path.join(projectRoot, ".drawio-assets");

function autoOpenEditor(url) {
  const platform = process.platform;

  try {
    if (platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], {
        detached: true,
        stdio: "ignore",
      }).unref();
      return;
    }

    if (platform === "darwin") {
      spawn("open", [url], {
        detached: true,
        stdio: "ignore",
      }).unref();
      return;
    }

    spawn("xdg-open", [url], {
      detached: true,
      stdio: "ignore",
    }).unref();
  } catch (error) {
    process.stderr.write(`Failed to auto-open Draw.io editor: ${error?.message ?? String(error)}\n`);
  }
}

function compareVersions(a, b) {
  const aParts = a.split(".").map((part) => Number(part));
  const bParts = b.split(".").map((part) => Number(part));
  const length = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < length; i += 1) {
    const aPart = aParts[i] ?? 0;
    const bPart = bParts[i] ?? 0;

    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }

  return 0;
}

function resolveDrawioBuildRoot() {
  const localAppData =
    process.env.LOCALAPPDATA ??
    path.join(process.env.USERPROFILE ?? "", "AppData", "Local");
  const npxRoot = path.join(localAppData, "npm-cache", "_npx");

  if (!fs.existsSync(npxRoot)) {
    throw new Error(`npx cache directory not found: ${npxRoot}`);
  }

  const candidates = [];

  for (const entry of fs.readdirSync(npxRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageRoot = path.join(
      npxRoot,
      entry.name,
      "node_modules",
      "drawio-mcp-server",
    );
    const packageJsonPath = path.join(packageRoot, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const stat = fs.statSync(packageJsonPath);

    candidates.push({
      packageRoot,
      version: packageJson.version ?? "0.0.0",
      mtimeMs: stat.mtimeMs,
    });
  }

  if (candidates.length === 0) {
    throw new Error("drawio-mcp-server was not found in the npx cache");
  }

  candidates.sort((left, right) => {
    const versionDiff = compareVersions(right.version, left.version);
    if (versionDiff !== 0) {
      return versionDiff;
    }

    return right.mtimeMs - left.mtimeMs;
  });

  return path.join(candidates[0].packageRoot, "build");
}

async function main() {
  const buildRoot = resolveDrawioBuildRoot();
  const configModule = await import(
    pathToFileURL(path.join(buildRoot, "config.js")).href
  );
  const assetsModule = await import(
    pathToFileURL(path.join(buildRoot, "assets", "index.js")).href
  );
  const indexModule = await import(
    pathToFileURL(path.join(buildRoot, "index.js")).href
  );

  const { buildConfig, getHttpFeatureConfig, shouldShowHelp } = configModule;
  const { ensureAssets } = assetsModule;
  const { createDrawioMcpApp } = indexModule;

  if (shouldShowHelp(process.argv.slice(2))) {
    process.stderr.write(
      "Use drawio-mcp-server --help for CLI help output.\n",
    );
    process.exit(0);
  }

  const configResult = buildConfig();

  if (configResult instanceof Error) {
    process.stderr.write(`Error: ${configResult.message}\n`);
    process.exit(1);
  }

  const config = {
    ...configResult,
    assetPath: configResult.assetPath ?? defaultAssetPath,
  };
  const features = getHttpFeatureConfig(config);

  if (features.enableEditor) {
    process.stderr.write("Initializing draw.io assets...\n");
    await ensureAssets(
      { assetPath: config.assetPath },
      (message) => process.stderr.write(`${message}\n`),
    );
    process.stderr.write("Assets ready!\n");
  }

  const app = createDrawioMcpApp();

  await app.startWebSocketServer(config.extensionPort);

  if (config.transports.includes("stdio")) {
    await app.startStdioTransport();
  }

  await app.startHttpServer(config.httpPort, config, features);
  if (features.enableEditor && process.env.DRAWIO_AUTO_OPEN_EDITOR !== "false") {
    const editorUrl = `http://127.0.0.1:${config.httpPort}/`;
    process.stderr.write(`Opening Draw.io editor: ${editorUrl}\n`);
    autoOpenEditor(editorUrl);
  }
  app.log.debug(`Draw.io MCP Server running on ${config.transports}`);
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error?.stack ?? String(error)}\n`);
  process.exit(1);
});
