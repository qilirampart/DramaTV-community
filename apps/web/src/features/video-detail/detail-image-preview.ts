import { isVideoAssetUrl, normalizeCommunityMediaAssetUrl } from "../../lib/media-asset-url.js";

type DetailImagePreviewInput = {
  media: {
    kind?: "video" | "image";
    coverUrl?: string;
    posterUrl?: string;
    sourceUrl?: string;
  };
  promptAssets?: {
    primary?: {
      url?: string;
    };
  };
};

export function resolveDetailImagePreviewUrl(view: DetailImagePreviewInput): string | null {
  if (view.media.kind !== "image") {
    return null;
  }

  const primaryAssetUrl = normalizeCommunityMediaAssetUrl(view.promptAssets?.primary?.url);
  if (primaryAssetUrl && !isVideoAssetUrl(primaryAssetUrl)) {
    return primaryAssetUrl;
  }

  const sourceUrl = normalizeCommunityMediaAssetUrl(view.media.sourceUrl);
  if (sourceUrl && !isVideoAssetUrl(sourceUrl)) {
    return sourceUrl;
  }

  const posterUrl = normalizeCommunityMediaAssetUrl(view.media.posterUrl);
  if (posterUrl && !isVideoAssetUrl(posterUrl)) {
    return posterUrl;
  }

  const coverUrl = normalizeCommunityMediaAssetUrl(view.media.coverUrl);
  if (coverUrl && !isVideoAssetUrl(coverUrl)) {
    return coverUrl;
  }

  return null;
}
