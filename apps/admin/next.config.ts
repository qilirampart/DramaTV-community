import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configuredDistDir = process.env.DRAMATV_ADMIN_NEXT_DIST_DIR?.trim();
const configuredOutput = process.env.DRAMATV_ADMIN_NEXT_OUTPUT?.trim();
const configuredBasePath = (process.env.DRAMATV_ADMIN_BASE_PATH?.trim() || "/admin").replace(/\/$/, "");
const resolvedOutput: NextConfig["output"] =
  configuredOutput === "standalone" || configuredOutput === "export" ? configuredOutput : undefined;
const adminApiBaseUrl = (process.env.DRAMATV_ADMIN_API_BASE_URL?.trim() || "http://127.0.0.1:18080").replace(/\/$/, "");
const webBaseUrl = (
  process.env.DRAMATV_WEB_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_DRAMATV_WEB_BASE_URL?.trim() ||
  "http://127.0.0.1:3106"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  basePath: configuredBasePath,
  distDir: configuredDistDir && configuredDistDir.length > 0 ? configuredDistDir : undefined,
  output: resolvedOutput,
  async rewrites() {
    return [
      {
        source: "/__admin_proxy__/media/:path*",
        destination: `${adminApiBaseUrl}/media/:path*`
      },
      {
        source: "/__admin_proxy__/seedance-videos/:path*",
        destination: `${webBaseUrl}/seedance-videos/:path*`
      },
      {
        source: "/__admin_proxy__/nano-banana-images/:path*",
        destination: `${webBaseUrl}/nano-banana-images/:path*`
      }
    ];
  },
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url))
  }
};

export default nextConfig;
