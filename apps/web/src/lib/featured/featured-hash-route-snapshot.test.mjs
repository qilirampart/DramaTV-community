import assert from "node:assert/strict";
import test from "node:test";

import {
  parseFeaturedHashRouteSnapshot,
  serializeFeaturedHashRouteSnapshot
} from "./featured-hash-route-snapshot.ts";

const sampleSnapshot = {
  routeKey: "/featured#featured-item-1",
  cacheKey: "featured:all:hot",
  summary: {
    counts: { all: 1, workflow: 0, videoPrompt: 1, imagePrompt: 0, activity: 0 },
    workflowFacets: { copyable: 0, placeholder: 0 },
    videoPromptFacets: { modelCounts: {}, contentCounts: {} },
    imagePromptFacets: { modelCounts: {}, contentCounts: {} }
  },
  items: [{ itemType: "prompt", targetId: "1" }],
  nextCursor: "cursor-2",
  hasMore: true,
  hasLoaded: true
};

test("featured hash route snapshot round-trips a loaded snapshot", () => {
  const raw = serializeFeaturedHashRouteSnapshot(sampleSnapshot, 100);
  const parsed = parseFeaturedHashRouteSnapshot(raw, 100);

  assert.deepEqual(parsed, {
    ...sampleSnapshot,
    aspectRatioEntries: undefined,
    masonryAssignments: undefined
  });
});

test("featured hash route snapshot drops stale payloads", () => {
  const raw = serializeFeaturedHashRouteSnapshot(sampleSnapshot, 100);
  assert.equal(parseFeaturedHashRouteSnapshot(raw, 100 + 30 * 60 * 1000 + 1), null);
});

test("featured hash route snapshot trims oversized item lists", () => {
  const raw = serializeFeaturedHashRouteSnapshot(
    {
      ...sampleSnapshot,
      items: Array.from({ length: 5 }, (_, index) => ({ itemType: "prompt", targetId: String(index) }))
    },
    100,
    { maxItems: 3 }
  );

  const parsed = parseFeaturedHashRouteSnapshot(raw, 100);
  assert.equal(parsed?.items.length, 3);
});

test("featured hash route snapshot retains the current detail item when trimming", () => {
  const raw = serializeFeaturedHashRouteSnapshot(
    {
      ...sampleSnapshot,
      items: Array.from({ length: 5 }, (_, index) => ({ itemType: "prompt", targetId: String(index) }))
    },
    100,
    {
      maxItems: 3,
      retainItemHref: "/prompts/3"
    }
  );

  const parsed = parseFeaturedHashRouteSnapshot(raw, 100);
  assert.deepEqual(
    parsed?.items.map((item) => item.targetId),
    ["2", "3", "4"]
  );
});

test("featured hash route snapshot keeps optional aspect ratio and masonry state", () => {
  const raw = serializeFeaturedHashRouteSnapshot(
    {
      ...sampleSnapshot,
      aspectRatioEntries: {
        "video_prompt:1": 1.5
      },
      masonryAssignments: {
        columnCount: 3,
        orderedKeys: ["video_prompt:1"],
        assignments: {
          "video_prompt:1": 2
        }
      }
    },
    100
  );

  const parsed = parseFeaturedHashRouteSnapshot(raw, 100);
  assert.deepEqual(parsed?.aspectRatioEntries, {
    "video_prompt:1": 1.5
  });
  assert.deepEqual(parsed?.masonryAssignments, {
    columnCount: 3,
    orderedKeys: ["video_prompt:1"],
    assignments: {
      "video_prompt:1": 2
    }
  });
});
