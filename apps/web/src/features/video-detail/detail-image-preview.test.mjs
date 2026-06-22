import assert from "node:assert/strict";
import test from "node:test";
import { resolveDetailImagePreviewUrl } from "./detail-image-preview.ts";

test("resolveDetailImagePreviewUrl prefers prompt primary image for image prompts", () => {
  const url = resolveDetailImagePreviewUrl({
    id: "prompt-1",
    title: "Image Prompt",
    tags: [],
    media: {
      kind: "image",
      coverUrl: "/media/cover.jpg",
      posterUrl: "/media/poster.jpg"
    },
    author: {
      id: "author-1",
      displayName: "Creator",
      followed: false
    },
    promptAssets: {
      primary: {
        id: "asset-1",
        role: "example",
        assetKind: "image",
        fileName: "source.png",
        badgeLabel: "示例图片",
        url: "/media/source.png"
      },
      referenceImages: [],
      referenceAudios: [],
      all: []
    },
    commentPolicy: {
      enabled: true,
      viewerCanComment: true
    },
    stats: {
      playCount: 0,
      likeCount: 0,
      favoriteCount: 0,
      commentCount: 0
    },
    viewerActions: {
      liked: false,
      favorited: false
    },
    relatedVideos: [],
    comments: {
      items: [],
      hasMore: false
    }
  });

  assert.equal(url, "/media/source.png");
});

test("resolveDetailImagePreviewUrl returns null for non-image detail views", () => {
  const url = resolveDetailImagePreviewUrl({
    id: "video-1",
    title: "Video Prompt",
    tags: [],
    media: {
      kind: "video",
      coverUrl: "/media/cover.jpg",
      posterUrl: "/media/poster.jpg",
      sourceUrl: "/media/source.mp4"
    },
    author: {
      id: "author-1",
      displayName: "Creator",
      followed: false
    },
    commentPolicy: {
      enabled: true,
      viewerCanComment: true
    },
    stats: {
      playCount: 0,
      likeCount: 0,
      favoriteCount: 0,
      commentCount: 0
    },
    viewerActions: {
      liked: false,
      favorited: false
    },
    relatedVideos: [],
    comments: {
      items: [],
      hasMore: false
    }
  });

  assert.equal(url, null);
});

test("resolveDetailImagePreviewUrl rewrites legacy bare-ip media URLs back to same-origin paths", () => {
  const url = resolveDetailImagePreviewUrl({
    id: "prompt-legacy-ip",
    title: "Legacy IP Image Prompt",
    tags: [],
    media: {
      kind: "image",
      coverUrl: "http://8.141.20.130/media/community/test/image/source/legacy/cover.jpg"
    },
    author: {
      id: "author-1",
      displayName: "Creator",
      followed: false
    },
    commentPolicy: {
      enabled: true,
      viewerCanComment: true
    },
    stats: {
      playCount: 0,
      likeCount: 0,
      favoriteCount: 0,
      commentCount: 0
    },
    viewerActions: {
      liked: false,
      favorited: false
    },
    relatedVideos: [],
    comments: {
      items: [],
      hasMore: false
    }
  });

  assert.equal(url, "/media/community/test/image/source/legacy/cover.jpg");
});
