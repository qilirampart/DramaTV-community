import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configuredDistDir = process.env.DRAMATV_ADMIN_NEXT_DIST_DIR?.trim();
const configuredOutput = process.env.DRAMATV_ADMIN_NEXT_OUTPUT?.trim();
const resolvedOutput: NextConfig["output"] =
  configuredOutput === "standalone" || configuredOutput === "export" ? configuredOutput : undefined;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  distDir: configuredDistDir && configuredDistDir.length > 0 ? configuredDistDir : undefined,
  output: resolvedOutput,
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url))
  }
};

export default nextConfig;
