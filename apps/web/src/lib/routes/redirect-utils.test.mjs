import assert from "node:assert/strict";
import test from "node:test";
import {
  appendBackSource,
  normalizeBackTarget,
  shouldReplaceHistoryEntryForBackSource
} from "./redirect-utils.ts";

test("normalizeBackTarget preserves only the current route hash while encoding nested from hashes", () => {
  const value = normalizeBackTarget(
    "/creators/04e32520-c171-40af-8c93-7bb1ad58d6d5?from=/prompts/f6b41e94-a1b1-425a-a3f8-9c1401bbd240?from=/featured#featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240#creator-work-5d3864e6-7621-47ab-9d40-6970f5009e02"
  );

  assert.equal(
    value,
    "/creators/04e32520-c171-40af-8c93-7bb1ad58d6d5?from=/prompts/f6b41e94-a1b1-425a-a3f8-9c1401bbd240?from=/featured%23featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240#creator-work-5d3864e6-7621-47ab-9d40-6970f5009e02"
  );
});

test("normalizeBackTarget keeps simple internal routes unchanged", () => {
  assert.equal(normalizeBackTarget("/featured#featured-item-123"), "/featured#featured-item-123");
});

test("normalizeBackTarget does not assign featured hash to prompt detail routes", () => {
  const value = normalizeBackTarget(
    "/prompts/f6b41e94-a1b1-425a-a3f8-9c1401bbd240?from=/featured#featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240"
  );

  assert.equal(value, "/prompts/f6b41e94-a1b1-425a-a3f8-9c1401bbd240?from=/featured%23featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240");
});

test("normalizeBackTarget collapses encoded and decoded creator return routes to the same key", () => {
  const encodedCreatorRoute = normalizeBackTarget(
    "/creators/04e32520-c171-40af-8c93-7bb1ad58d6d5?from=%2Fprompts%2Ff6b41e94-a1b1-425a-a3f8-9c1401bbd240%3Ffrom%3D%2Ffeatured%2523featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240"
  );
  const decodedCreatorRoute = normalizeBackTarget(
    "/creators/04e32520-c171-40af-8c93-7bb1ad58d6d5?from=/prompts/f6b41e94-a1b1-425a-a3f8-9c1401bbd240?from=/featured%23featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240"
  );

  assert.equal(encodedCreatorRoute, decodedCreatorRoute);
});

test("appendBackSource preserves nested from chains for multi-hop returns", () => {
  const href = appendBackSource(
    "/creators/04e32520-c171-40af-8c93-7bb1ad58d6d5",
    "/prompts/f6b41e94-a1b1-425a-a3f8-9c1401bbd240?from=/featured%23featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240"
  );

  assert.equal(
    href,
    "/creators/04e32520-c171-40af-8c93-7bb1ad58d6d5?from=%2Fprompts%2Ff6b41e94-a1b1-425a-a3f8-9c1401bbd240%3Ffrom%3D%2Ffeatured%2523featured-item-f6b41e94-a1b1-425a-a3f8-9c1401bbd240"
  );
});

test("shouldReplaceHistoryEntryForBackSource upgrades same-route returns to anchored variants", () => {
  assert.equal(
    shouldReplaceHistoryEntryForBackSource("/featured", "/featured#featured-item-123"),
    true
  );
});

test("shouldReplaceHistoryEntryForBackSource ignores different routes", () => {
  assert.equal(
    shouldReplaceHistoryEntryForBackSource(
      "/prompts/abc?from=/featured%23featured-item-123",
      "/featured#featured-item-123"
    ),
    false
  );
});
