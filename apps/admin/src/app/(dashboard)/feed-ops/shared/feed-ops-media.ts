import type { FeedOpsPageData } from "./feed-ops-types";

const ADMIN_MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_DRAMATV_ADMIN_API_BASE_URL?.trim() || "http://127.0.0.1:18080";
const WEB_MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_DRAMATV_WEB_BASE_URL?.trim() || "http://127.0.0.1:3106";
const WEB_STATIC_MEDIA_PREFIXES = ["/seedance-videos/", "/nano-banana-images/"];

type FeedOpsMediaItem = FeedOpsPageData["candidatePool"][number];

export function resolveFeedOpsMediaUrl(input?: string | null) {
  const value = input?.trim();
  if (!value) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return rewriteLocalWebStaticUrl(value);
  }

  const normalizedPath = value.startsWith("/") ? value : `/${value.replace(/^\/+/, "")}`;
  if (isWebStaticMediaPath(normalizedPath)) {
    return `${WEB_MEDIA_BASE_URL}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/")) {
    return `${ADMIN_MEDIA_BASE_URL}${normalizedPath}`;
  }

  return `${ADMIN_MEDIA_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

export function getFeedOpsMediaSources(item: Pick<FeedOpsMediaItem, "coverUrl" | "posterUrl" | "previewUrl" | "sourceUrl" | "promptModality">) {
  const sourceUrl = resolveFeedOpsMediaUrl(item.sourceUrl);
  const coverUrl = resolveFeedOpsMediaUrl(item.coverUrl) ?? resolveFeedOpsMediaUrl(item.posterUrl);
  const posterUrl = resolveFeedOpsMediaUrl(item.posterUrl) ?? coverUrl;
  const previewUrl = resolveFeedOpsMediaUrl(item.previewUrl) ?? sourceUrl;
  const canPreviewVideo =
    item.promptModality === "video" || isVideoAssetUrl(item.previewUrl) || isVideoAssetUrl(item.sourceUrl);

  return {
    coverUrl,
    posterUrl,
    previewUrl,
    sourceUrl,
    canPreviewVideo: canPreviewVideo && Boolean(previewUrl ?? sourceUrl)
  };
}

function isWebStaticMediaPath(value: string) {
  return WEB_STATIC_MEDIA_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function rewriteLocalWebStaticUrl(value: string) {
  try {
    const url = new URL(value);
    if (!isLocalDevelopmentHost(url.hostname)) {
      return value;
    }

    if (!isWebStaticMediaPath(url.pathname)) {
      return value;
    }

    return `${WEB_MEDIA_BASE_URL}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
}

function isLocalDevelopmentHost(hostname: string) {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
}

function isVideoAssetUrl(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) {
    return false;
  }

  return /\.(mp4|mov|webm|m3u8)(\?.*)?$/i.test(normalized);
}
