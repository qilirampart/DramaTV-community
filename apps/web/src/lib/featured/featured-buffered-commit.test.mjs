import assert from "node:assert/strict";
import test from "node:test";

import { shouldAutoCommitBufferedFeaturedPage } from "./featured-buffered-commit.ts";

test("auto-commits a buffered featured page when a load-more request is already in progress", () => {
  assert.equal(
    shouldAutoCommitBufferedFeaturedPage({
      hasBufferedPage: true,
      isLoading: true,
      forceCommit: false,
      remainingDistanceToBottom: 1200,
      commitDistancePx: 520
    }),
    true
  );
});

test("auto-commits a buffered featured page when the user is already within the bottom commit range", () => {
  assert.equal(
    shouldAutoCommitBufferedFeaturedPage({
      hasBufferedPage: true,
      isLoading: false,
      forceCommit: false,
      remainingDistanceToBottom: 240,
      commitDistancePx: 520
    }),
    true
  );
});

test("keeps a buffered featured page parked when neither load-more nor bottom-distance conditions are met", () => {
  assert.equal(
    shouldAutoCommitBufferedFeaturedPage({
      hasBufferedPage: true,
      isLoading: false,
      forceCommit: false,
      remainingDistanceToBottom: 860,
      commitDistancePx: 520
    }),
    false
  );
});
