import { isVideoAssetUrl, normalizeCommunityMediaAssetUrl } from "./media-asset-url.js";

type CardVideoPlaybackCandidate = {
  previewUrl?: string;
  sourceUrl?: string;
  promptModality?: "image" | "video";
  resourceType?: "prompt" | "workflow";
  allowSourceFallback?: boolean;
};

export function resolveCardVideoPlaybackUrl(candidate: CardVideoPlaybackCandidate): string | undefined {
  const previewUrl = normalizeCommunityMediaAssetUrl(candidate.previewUrl);
  if (previewUrl && isVideoAssetUrl(previewUrl)) {
    return previewUrl;
  }

  if (candidate.allowSourceFallback === false) {
    return undefined;
  }

  const sourceUrl = normalizeCommunityMediaAssetUrl(candidate.sourceUrl);
  if (!sourceUrl || !isVideoAssetUrl(sourceUrl)) {
    return undefined;
  }

  if (candidate.promptModality === "image" || candidate.resourceType === "workflow") {
    return undefined;
  }

  return sourceUrl;
}
