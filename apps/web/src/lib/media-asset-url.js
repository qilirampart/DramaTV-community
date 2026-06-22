const LEGACY_COMMUNITY_MEDIA_HOSTS = new Set([
  "8.141.20.130",
  "community.8.141.20.130.nip.io",
  "127.0.0.1",
  "localhost",
  "::1"
]);

function normalizeTextValue(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const lower = trimmed.toLowerCase();
  if (lower === "null" || lower === "undefined") {
    return undefined;
  }

  return trimmed;
}

function isMediaPath(pathname) {
  return pathname === "/media" || pathname.startsWith("/media/");
}

export function normalizeCommunityMediaAssetUrl(value) {
  const normalized = normalizeTextValue(value);
  if (!normalized) {
    return undefined;
  }

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.trim().toLowerCase();
    if (!LEGACY_COMMUNITY_MEDIA_HOSTS.has(hostname) || !isMediaPath(parsed.pathname)) {
      return normalized;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}` || normalized;
  } catch {
    return normalized;
  }
}

export function isVideoAssetUrl(value) {
  const normalized = normalizeCommunityMediaAssetUrl(value);
  if (!normalized) {
    return false;
  }

  const pathname = normalized.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  return [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".ogv", ".m3u8"].some((ext) => pathname.endsWith(ext));
}
