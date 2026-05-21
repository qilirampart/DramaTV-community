import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.dirname(path.dirname(__dirname));

const envFile = path.join(projectRoot, "infra", "local", ".env");
const envExampleFile = path.join(projectRoot, "infra", "local", ".env.example");

function readEnvFileValue(filePath, key) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(new RegExp(`^\\s*${key}=(.*)$`));
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

export function resolveLocalPostgresConfig() {
  return {
    containerName: process.env.DRAMATV_POSTGRES_CONTAINER || "dramatv-postgres",
    database:
      process.env.DRAMATV_PG_DB ||
      readEnvFileValue(envFile, "DRAMATV_PG_DB") ||
      readEnvFileValue(envExampleFile, "DRAMATV_PG_DB") ||
      process.env.DRAMATV_DB_NAME ||
      "dramatv",
    username:
      process.env.DRAMATV_PG_USER ||
      readEnvFileValue(envFile, "DRAMATV_PG_USER") ||
      readEnvFileValue(envExampleFile, "DRAMATV_PG_USER") ||
      process.env.DRAMATV_DB_USER ||
      "dramatv",
    password:
      process.env.DRAMATV_PG_PASSWORD ||
      readEnvFileValue(envFile, "DRAMATV_PG_PASSWORD") ||
      readEnvFileValue(envExampleFile, "DRAMATV_PG_PASSWORD") ||
      process.env.DRAMATV_DB_PASSWORD ||
      "dramatv",
  };
}

export function runLocalPsqlQuery(config, sql) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "exec",
        "-e",
        `PGPASSWORD=${config.password}`,
        "-i",
        config.containerName,
        "psql",
        "-X",
        "-q",
        "-t",
        "-A",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        config.username,
        "-d",
        config.database,
      ],
      {
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
      },
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

      reject(new Error(`psql exited with code ${code}\n${stderr}`));
    });

    child.stdin.end(sql);
  });
}
