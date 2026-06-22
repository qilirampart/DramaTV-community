export const FEATURED_CARD_ANCHOR_PREFIX = "featured-item-";

export function getFeaturedCardAnchorId(targetId: string) {
  return `${FEATURED_CARD_ANCHOR_PREFIX}${targetId}`;
}

export function isFeaturedCardAnchor(anchorId: string | null | undefined) {
  return Boolean(anchorId?.startsWith(FEATURED_CARD_ANCHOR_PREFIX));
}

export function shouldAutoLoadFeaturedBackAnchor(input: {
  anchorId: string | null;
  targetExists: boolean;
  hasMore: boolean;
  isLoading: boolean;
  loadMoreError: boolean;
}) {
  return Boolean(
    isFeaturedCardAnchor(input.anchorId) &&
      !input.targetExists &&
      input.hasMore &&
      !input.isLoading &&
      !input.loadMoreError
  );
}

export function shouldForceFeaturedBackAnchorRestore(input: {
  anchorId: string | null;
  hasStoredScroll: boolean;
}) {
  return Boolean(isFeaturedCardAnchor(input.anchorId) && input.hasStoredScroll);
}

export function shouldShowFeaturedBackAnchorRestoreOverlay(input: {
  routeKey: string | null;
  restoreStateRouteKey: string | null;
  restoreCompleted: boolean;
  restoreActive: boolean;
}) {
  if (!input.restoreActive || !input.routeKey) {
    return false;
  }

  return input.restoreStateRouteKey !== input.routeKey || !input.restoreCompleted;
}
