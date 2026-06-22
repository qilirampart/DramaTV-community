import assert from "node:assert/strict";
import test from "node:test";

import { resolvePrefillVideoCardMediaFallback } from "./prefill-video-fallback.ts";

test("resolvePrefillVideoCardMediaFallback fills missing media for historical rain-night chase videos", () => {
  const fallback = resolvePrefillVideoCardMediaFallback({
    title: "雨夜追逐短片",
    summary: "用于展示夜景追逐、路面反光和节奏切换的写实动作样片。",
    coverUrl: "",
    posterUrl: "",
    previewUrl: "",
    sourceUrl: ""
  });

  assert.ok(fallback);
  assert.equal(fallback.coverUrl, "/nano-banana-images/000014-13327/01.jpg");
  assert.equal(fallback.posterUrl, "/nano-banana-images/000014-13327/01.jpg");
  assert.equal(fallback.previewUrl, "/prefill-videos/009-warehouse-fight.mp4");
  assert.equal(fallback.sourceUrl, "/prefill-videos/009-warehouse-fight.mp4");
});

test("resolvePrefillVideoCardMediaFallback does not override real preview media", () => {
  const fallback = resolvePrefillVideoCardMediaFallback({
    title: "悬浮列车穿城",
    summary: "用于展示高速穿行、建筑尺度和空间纵深的城市科幻镜头样片。",
    coverUrl: "",
    posterUrl: "",
    previewUrl: "/media/community/local/video/preview/example.mp4",
    sourceUrl: "/media/video/example.mp4"
  });

  assert.ok(fallback);
  assert.equal(fallback.coverUrl, "/nano-banana-images/000028-13310/01.jpg");
  assert.equal(fallback.posterUrl, "/nano-banana-images/000028-13310/01.jpg");
  assert.equal(fallback.previewUrl, undefined);
  assert.equal(fallback.sourceUrl, undefined);
});
