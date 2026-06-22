import type { ApiFeaturedPromptInventoryFilter } from "@/lib/contracts/community-api";

const MAX_FEATURED_PROMPT_PAGE_LIMIT = 48;
export const DEFAULT_FEATURED_PROMPT_PAGE_LIMIT = 24;

export type FeaturedPromptInventoryQuery = {
  filter?: ApiFeaturedPromptInventoryFilter;
  sort?: "latest" | "hot";
  q?: string;
  modelCategory?: string | null;
  contentCategory?: string | null;
  limit?: number;
  cursor?: string | null;
};

export type FeaturedPromptInventoryRouteInput = {
  filter?: string | string[];
  sort?: string | string[];
  q?: string | string[];
  model?: string | string[];
  content?: string | string[];
};

function firstQueryValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return firstQueryValue(value[0]);
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeFeaturedPromptInventoryQuery(
  query: FeaturedPromptInventoryQuery = {}
): Required<Pick<FeaturedPromptInventoryQuery, "filter" | "sort" | "limit">> &
  Pick<FeaturedPromptInventoryQuery, "q" | "modelCategory" | "contentCategory" | "cursor"> {
  const filter =
    query.filter === "video_prompt" || query.filter === "image_prompt" ? query.filter : "all";
  const sort = query.sort === "hot" ? "hot" : "latest";
  const q = query.q?.trim() || undefined;
  const modelCategory = query.modelCategory?.trim() || undefined;
  const contentCategory = query.contentCategory?.trim() || undefined;
  const cursor = query.cursor?.trim() || undefined;
  const limit =
    typeof query.limit === "number" && Number.isFinite(query.limit) && query.limit > 0
      ? Math.min(Math.trunc(query.limit), MAX_FEATURED_PROMPT_PAGE_LIMIT)
      : DEFAULT_FEATURED_PROMPT_PAGE_LIMIT;

  return {
    filter,
    sort,
    q,
    modelCategory,
    contentCategory,
    limit,
    cursor
  };
}

export function serializeFeaturedPromptInventoryQuery(query: FeaturedPromptInventoryQuery = {}) {
  const normalized = normalizeFeaturedPromptInventoryQuery(query);
  const params = new URLSearchParams();

  if (normalized.filter !== "all") {
    params.set("filter", normalized.filter);
  }

  if (normalized.sort !== "latest") {
    params.set("sort", normalized.sort);
  }

  if (normalized.q) {
    params.set("q", normalized.q);
  }

  if (normalized.modelCategory) {
    params.set("modelCategory", normalized.modelCategory);
  }

  if (normalized.contentCategory) {
    params.set("contentCategory", normalized.contentCategory);
  }

  if (normalized.limit !== DEFAULT_FEATURED_PROMPT_PAGE_LIMIT) {
    params.set("limit", String(normalized.limit));
  }

  if (normalized.cursor) {
    params.set("cursor", normalized.cursor);
  }

  return params.toString();
}

export function deserializeFeaturedPromptInventoryQuery(queryString: string): FeaturedPromptInventoryQuery {
  const params = new URLSearchParams(queryString);
  const limit = params.get("limit");

  return {
    filter:
      params.get("filter") === "video_prompt" || params.get("filter") === "image_prompt"
        ? (params.get("filter") as "video_prompt" | "image_prompt")
        : "all",
    sort: params.get("sort") === "hot" ? "hot" : "latest",
    q: params.get("q") ?? undefined,
    modelCategory: params.get("modelCategory") ?? undefined,
    contentCategory: params.get("contentCategory") ?? undefined,
    limit: limit ? Number.parseInt(limit, 10) : undefined,
    cursor: params.get("cursor") ?? undefined
  };
}

export function toFeaturedPromptInventoryQueryFromRouteInput(
  input: FeaturedPromptInventoryRouteInput = {}
): FeaturedPromptInventoryQuery {
  const filterValue = firstQueryValue(input.filter);
  const promptFilter =
    filterValue === "video_prompt" || filterValue === "image_prompt" ? filterValue : "all";

  return {
    filter: promptFilter,
    sort: firstQueryValue(input.sort) === "hot" ? "hot" : "latest",
    q: firstQueryValue(input.q),
    modelCategory: promptFilter === "all" ? undefined : firstQueryValue(input.model),
    contentCategory: promptFilter === "all" ? undefined : firstQueryValue(input.content),
    limit: DEFAULT_FEATURED_PROMPT_PAGE_LIMIT
  };
}
