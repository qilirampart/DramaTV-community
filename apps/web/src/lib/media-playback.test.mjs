import test from "node:test";
import assert from "node:assert/strict";

import { resolveCardVideoPlaybackUrl } from "./media-playback.ts";

test("returns preview url when a real preview video exists", () => {
  const playbackUrl = resolveCardVideoPlaybackUrl({
    previewUrl: "/media/community/test/video/preview/demo/video-preview.mp4",
    sourceUrl: "/media/community/test/video/source/demo/video.mp4",
    promptModality: "video"
  });

  assert.equal(playbackUrl, "/media/community/test/video/preview/demo/video-preview.mp4");
});

test("can disable source fallback for heavy list-card previews", () => {
  const playbackUrl = resolveCardVideoPlaybackUrl({
    sourceUrl: "/media/community/test/video/source/demo/video.mp4",
    promptModality: "video",
    allowSourceFallback: false
  });

  assert.equal(playbackUrl, undefined);
});

test("keeps source fallback available for explicitly allowed callers", () => {
  const playbackUrl = resolveCardVideoPlaybackUrl({
    sourceUrl: "/media/community/test/video/source/demo/video.mp4",
    promptModality: "video",
    allowSourceFallback: true
  });

  assert.equal(playbackUrl, "/media/community/test/video/source/demo/video.mp4");
});
