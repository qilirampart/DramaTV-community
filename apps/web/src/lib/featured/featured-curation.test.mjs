import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeCuratedFeaturedItems,
  shouldUseCuratedFeaturedItems
} from "./featured-curation.ts";

function createItem({ id, href, filterGroup = "video_prompt" }) {
  return {
    id,
    href,
    filterGroup
  };
}

test("shouldUseCuratedFeaturedItems only enables curated injection for the default featured view", () => {
  assert.equal(
    shouldUseCuratedFeaturedItems({
      filter: "all",
      sort: "latest",
      keyword: "",
      workflowSecondary: "all",
      model: null,
      content: null
    }),
    true
  );

  assert.equal(
    shouldUseCuratedFeaturedItems({
      filter: "video_prompt",
      sort: "hot",
      keyword: "",
      workflowSecondary: "all",
      model: null,
      content: null
    }),
    false
  );

  assert.equal(
    shouldUseCuratedFeaturedItems({
      filter: "image_prompt",
      sort: "latest",
      keyword: "seedance",
      workflowSecondary: "all",
      model: null,
      content: null
    }),
    false
  );
});

test("mergeCuratedFeaturedItems injects configured featured items ahead of inventory on the default view", () => {
  const curatedOnly = createItem({
    id: "curated-only",
    href: "/prompts/curated-only"
  });
  const overlap = createItem({
    id: "inventory-overlap",
    href: "/prompts/inventory-overlap"
  });
  const trailing = createItem({
    id: "inventory-trailing",
    href: "/prompts/inventory-trailing"
  });

  const merged = mergeCuratedFeaturedItems({
    state: {
      filter: "all",
      sort: "latest",
      keyword: "",
      workflowSecondary: "all",
      model: null,
      content: null
    },
    inventoryItems: [overlap, trailing],
    curatedItemsByFilter: {
      all: [curatedOnly, overlap]
    }
  });

  assert.deepEqual(
    merged.map((item) => item.href),
    ["/prompts/curated-only", "/prompts/inventory-overlap", "/prompts/inventory-trailing"]
  );
});

test("mergeCuratedFeaturedItems keeps filtered views on pure inventory results", () => {
  const workflowCurated = createItem({
    id: "workflow-curated",
    href: "/workflows/workflow-curated",
    filterGroup: "workflow"
  });
  const inventoryOnly = createItem({
    id: "workflow-live",
    href: "/workflows/workflow-live",
    filterGroup: "workflow"
  });

  const merged = mergeCuratedFeaturedItems({
    state: {
      filter: "workflow",
      sort: "latest",
      keyword: "",
      workflowSecondary: "copyable",
      model: null,
      content: null
    },
    inventoryItems: [inventoryOnly],
    curatedItemsByFilter: {
      workflow: [workflowCurated]
    }
  });

  assert.deepEqual(merged.map((item) => item.href), ["/workflows/workflow-live"]);
});
