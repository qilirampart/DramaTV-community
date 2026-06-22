import type { VideoDetailPageView } from "@/lib/contracts/view-models";
import {
  homeHeroPrefillVideo,
  homePrefillShowcaseVideos,
  resolvePrefillVideoForTextOrHero,
  type PrefillVideoAsset
} from "@/lib/prefill/prefill-video-fallback";

export type { PrefillVideoAsset } from "@/lib/prefill/prefill-video-fallback";
export { homeHeroPrefillVideo, homePrefillShowcaseVideos } from "@/lib/prefill/prefill-video-fallback";

export function resolvePrefillVideoForDetail(
  view: Pick<VideoDetailPageView, "title" | "summary" | "tags">
): PrefillVideoAsset {
  return resolvePrefillVideoForTextOrHero(view);
}
