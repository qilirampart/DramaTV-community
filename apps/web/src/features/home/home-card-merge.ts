type MergeableAuthor = {
  id: string;
  displayName: string;
  avatarUrl?: string;
};

export type MergeableMediaCard = {
  id: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  author: MergeableAuthor;
};

function mergeCardWithPreferredMedia<T extends MergeableMediaCard>(base: T, preferred?: T): T {
  if (!preferred) {
    return base;
  }

  return {
    ...base,
    ...preferred,
    title: preferred.title || base.title,
    summary: preferred.summary || base.summary,
    coverUrl: preferred.coverUrl || preferred.posterUrl || base.coverUrl || base.posterUrl,
    posterUrl: preferred.posterUrl || preferred.coverUrl || base.posterUrl || base.coverUrl,
    previewUrl: preferred.previewUrl || base.previewUrl,
    sourceUrl: preferred.sourceUrl || preferred.previewUrl || base.sourceUrl,
    author: {
      ...base.author,
      ...preferred.author,
      id: preferred.author?.id || base.author.id,
      displayName: preferred.author?.displayName || base.author.displayName,
      avatarUrl: preferred.author?.avatarUrl || base.author.avatarUrl
    }
  };
}

export function mergeCardsPreferCatalogMedia<T extends MergeableMediaCard>(feedCards: T[], catalogCards: T[]): T[] {
  const catalogById = new Map(catalogCards.map((card) => [card.id, card]));
  const mergedFeedCards = feedCards.map((card) => mergeCardWithPreferredMedia(card, catalogById.get(card.id)));
  const seen = new Set(mergedFeedCards.map((card) => card.id));
  const catalogOnlyCards = catalogCards.filter((card) => !seen.has(card.id));

  return [...mergedFeedCards, ...catalogOnlyCards];
}
