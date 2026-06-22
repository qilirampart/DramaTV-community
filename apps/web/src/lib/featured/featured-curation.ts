import type { ApiFeaturedInventoryFilter } from "../contracts/community-api";

type FeaturedFilter = ApiFeaturedInventoryFilter;

export type FeaturedCuratedMergeSort = "hot" | "latest";

export type FeaturedCuratedMergeState = {
  filter: FeaturedFilter;
  sort: FeaturedCuratedMergeSort;
  keyword: string;
  workflowSecondary: string;
  model: string | null;
  content: string | null;
};

export type FeaturedCuratedListItem = {
  id: string;
  href: string;
  filterGroup: Exclude<FeaturedFilter, "all">;
};

export type FeaturedCuratedItemsByFilter<T extends FeaturedCuratedListItem> = Partial<Record<FeaturedFilter, T[]>>;

const FEATURED_DEFAULT_SECONDARY_ID = "all";

function dedupeFeaturedCuratedItems<T extends FeaturedCuratedListItem>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.href)) {
      return false;
    }

    seen.add(item.href);
    return true;
  });
}

export function shouldUseCuratedFeaturedItems(state: FeaturedCuratedMergeState) {
  return (
    state.sort === "latest" &&
    state.keyword.trim().length === 0 &&
    state.workflowSecondary === FEATURED_DEFAULT_SECONDARY_ID &&
    !state.model &&
    !state.content
  );
}

export function mergeCuratedFeaturedItems<T extends FeaturedCuratedListItem>({
  state,
  inventoryItems,
  curatedItemsByFilter
}: {
  state: FeaturedCuratedMergeState;
  inventoryItems: T[];
  curatedItemsByFilter: FeaturedCuratedItemsByFilter<T>;
}) {
  const dedupedInventoryItems = dedupeFeaturedCuratedItems(inventoryItems);

  if (!shouldUseCuratedFeaturedItems(state)) {
    return dedupedInventoryItems;
  }

  const curatedItems = dedupeFeaturedCuratedItems(curatedItemsByFilter[state.filter] ?? []);
  if (curatedItems.length === 0) {
    return dedupedInventoryItems;
  }

  const inventoryItemsByHref = new Map(dedupedInventoryItems.map((item) => [item.href, item]));
  const mergedItems: T[] = [];
  const seen = new Set<string>();

  for (const curatedItem of curatedItems) {
    if (seen.has(curatedItem.href)) {
      continue;
    }

    mergedItems.push(inventoryItemsByHref.get(curatedItem.href) ?? curatedItem);
    seen.add(curatedItem.href);
  }

  for (const inventoryItem of dedupedInventoryItems) {
    if (seen.has(inventoryItem.href)) {
      continue;
    }

    mergedItems.push(inventoryItem);
    seen.add(inventoryItem.href);
  }

  return mergedItems;
}
