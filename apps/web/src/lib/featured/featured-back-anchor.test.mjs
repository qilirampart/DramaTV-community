import assert from "node:assert/strict";
import test from "node:test";

import {
  FEATURED_CARD_ANCHOR_PREFIX,
  getFeaturedCardAnchorId,
  isFeaturedCardAnchor,
  shouldAutoLoadFeaturedBackAnchor,
  shouldForceFeaturedBackAnchorRestore,
  shouldShowFeaturedBackAnchorRestoreOverlay
} from "./featured-back-anchor.ts";

test("getFeaturedCardAnchorId keeps featured card anchors on one stable prefix", () => {
  assert.equal(getFeaturedCardAnchorId("prompt-123"), `${FEATURED_CARD_ANCHOR_PREFIX}prompt-123`);
});

test("isFeaturedCardAnchor recognizes only featured card anchors", () => {
  assert.equal(isFeaturedCardAnchor("featured-item-prompt-25"), true);
  assert.equal(isFeaturedCardAnchor("discussion-thread-1"), false);
  assert.equal(isFeaturedCardAnchor(null), false);
});

test("shouldAutoLoadFeaturedBackAnchor requests more inventory when the target card is not mounted yet", () => {
  assert.equal(
    shouldAutoLoadFeaturedBackAnchor({
      anchorId: "featured-item-prompt-25",
      targetExists: false,
      hasMore: true,
      isLoading: false,
      loadMoreError: false
    }),
    true
  );
});

test("shouldAutoLoadFeaturedBackAnchor stays idle when the target already exists or the hash is unrelated", () => {
  assert.equal(
    shouldAutoLoadFeaturedBackAnchor({
      anchorId: "featured-item-prompt-25",
      targetExists: true,
      hasMore: true,
      isLoading: false,
      loadMoreError: false
    }),
    false
  );

  assert.equal(
    shouldAutoLoadFeaturedBackAnchor({
      anchorId: "discussion-thread-1",
      targetExists: false,
      hasMore: true,
      isLoading: false,
      loadMoreError: false
    }),
    false
  );
});

test("shouldForceFeaturedBackAnchorRestore only enables blocking restore for real back-scroll entries", () => {
  assert.equal(
    shouldForceFeaturedBackAnchorRestore({
      anchorId: "featured-item-prompt-25",
      hasStoredScroll: true
    }),
    true
  );

  assert.equal(
    shouldForceFeaturedBackAnchorRestore({
      anchorId: "featured-item-prompt-25",
      hasStoredScroll: false
    }),
    false
  );

  assert.equal(
    shouldForceFeaturedBackAnchorRestore({
      anchorId: "discussion-thread-1",
      hasStoredScroll: true
    }),
    false
  );
});

test("shouldShowFeaturedBackAnchorRestoreOverlay stays hidden for manual hash refreshes", () => {
  assert.equal(
    shouldShowFeaturedBackAnchorRestoreOverlay({
      routeKey: "/featured#featured-item-prompt-25",
      restoreStateRouteKey: null,
      restoreCompleted: true,
      restoreActive: false
    }),
    false
  );
});

test("shouldShowFeaturedBackAnchorRestoreOverlay stays visible only while a real blocking restore is unfinished", () => {
  assert.equal(
    shouldShowFeaturedBackAnchorRestoreOverlay({
      routeKey: "/featured#featured-item-prompt-25",
      restoreStateRouteKey: null,
      restoreCompleted: true,
      restoreActive: true
    }),
    true
  );

  assert.equal(
    shouldShowFeaturedBackAnchorRestoreOverlay({
      routeKey: "/featured#featured-item-prompt-25",
      restoreStateRouteKey: "/featured#featured-item-prompt-25",
      restoreCompleted: false,
      restoreActive: true
    }),
    true
  );

  assert.equal(
    shouldShowFeaturedBackAnchorRestoreOverlay({
      routeKey: "/featured#featured-item-prompt-25",
      restoreStateRouteKey: "/featured#featured-item-prompt-25",
      restoreCompleted: true,
      restoreActive: true
    }),
    false
  );
});
