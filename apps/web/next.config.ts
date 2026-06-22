import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configuredDistDir = process.env.DRAMATV_NEXT_DIST_DIR?.trim();
const configuredOutput = process.env.DRAMATV_NEXT_OUTPUT?.trim();
const configuredApiBaseUrl = (
  process.env.DRAMATV_API_BASE_URL?.trim() || process.env.NEXT_PUBLIC_DRAMATV_API_BASE_URL?.trim() || ""
).replace(/\/$/, "");
const resolvedOutput: NextConfig["output"] =
  configuredOutput === "standalone" || configuredOutput === "export" ? configuredOutput : undefined;
const localMediaProxyBaseUrl = isLoopbackUrl(configuredApiBaseUrl) ? configuredApiBaseUrl : "";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
  distDir: configuredDistDir && configuredDistDir.length > 0 ? configuredDistDir : undefined,
  output: resolvedOutput,
  experimental: {
    proxyClientMaxBodySize: 120 * 1024 * 1024,
    serverActions: {
      bodySizeLimit: "100mb"
    }
  },
  async rewrites() {
    if (!localMediaProxyBaseUrl) {
      return [];
    }

    return [
      {
        source: "/media/:path*",
        destination: `${localMediaProxyBaseUrl}/media/:path*`
      }
    ];
  },
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url))
  }
};

export default nextConfig;

function isLoopbackUrl(value: string): boolean {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.trim().toLowerCase();
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
  } catch {
    return false;
  }
}
