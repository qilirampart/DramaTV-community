import assert from "node:assert/strict";
import test from "node:test";

import {
  parseFeaturedInventorySessionCache,
  serializeFeaturedInventorySessionCache
} from "./featured-inventory-session-cache.ts";

function createSummary() {
  return {
    counts: {
      all: 12,
      workflow: 1,
      videoPrompt: 6,
      imagePrompt: 5,
      activity: 0
    },
    workflowFacets: {
      copyable: 1,
      placeholder: 0
    },
    videoPromptFacets: {
      modelCounts: {},
      contentCounts: {}
    },
    imagePromptFacets: {
      modelCounts: {},
      contentCounts: {}
    }
  };
}

function createItem(targetId) {
  return {
    itemType: "prompt",
    contentKind: "prompt",
    promptModality: "video",
    targetId,
    title: `Prompt ${targetId}`,
    summary: "",
    coverUrl: null,
    posterUrl: null,
    previewUrl: null,
    sourceUrl: null,
    author: {
      id: "author-1",
      displayName: "Creator",
      avatarUrl: null
    },
    stats: {
      likeCount: 0
    },
    tagNames: []
  };
}

test("featured inventory session cache round-trips loaded entries", () => {
  const serialized = serializeFeaturedInventorySessionCache(
    {
      "filter=all": {
        summary: createSummary(),
        items: [createItem("prompt-1"), createItem("prompt-2")],
        nextCursor: "offset:24",
        hasMore: true,
        hasLoaded: true
      }
    },
    100
  );

  const parsed = parseFeaturedInventorySessionCache(serialized, 100);
  assert.deepEqual(parsed["filter=all"]?.items.map((item) => item.targetId), ["prompt-1", "prompt-2"]);
  assert.equal(parsed["filter=all"]?.nextCursor, "offset:24");
  assert.equal(parsed["filter=all"]?.hasMore, true);
});

test("featured inventory session cache drops stale entries", () => {
  const raw = JSON.stringify({
    version: 1,
    entries: {
      "filter=all": {
        summary: createSummary(),
        items: [createItem("prompt-1")],
        nextCursor: null,
        hasMore: false,
        hasLoaded: true,
        storedAt: 100
      }
    }
  });

  assert.deepEqual(parseFeaturedInventorySessionCache(raw, 100 + 30 * 60 * 1000 + 1), {});
});

test("featured inventory session cache ignores unfinished or malformed payloads", () => {
  const serialized = serializeFeaturedInventorySessionCache(
    {
      "filter=all": {
        summary: createSummary(),
        items: [createItem("prompt-1")],
        nextCursor: null,
        hasMore: false,
        hasLoaded: false
      }
    },
    100
  );

  assert.equal(serialized, null);
  assert.deepEqual(parseFeaturedInventorySessionCache("{bad-json"), {});
});
