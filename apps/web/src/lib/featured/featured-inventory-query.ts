import type {
  ApiFeaturedInventoryFilter,
  ApiFeaturedWorkflowInventoryType
} from "@/lib/contracts/community-api";

const MAX_FEATURED_PAGE_LIMIT = 48;
export const DEFAULT_FEATURED_PAGE_LIMIT = 12;

export type FeaturedInventoryQuery = {
  filter?: ApiFeaturedInventoryFilter;
  sort?: "latest" | "hot";
  q?: string;
  modelCategory?: string | null;
  contentCategory?: string | null;
  workflowType?: ApiFeaturedWorkflowInventoryType | null;
  limit?: number;
  cursor?: string | null;
};

export type FeaturedInventoryRouteInput = {
  filter?: string | string[];
  sort?: string | string[];
  q?: string | string[];
  model?: string | string[];
  content?: string | string[];
  secondary?: string | string[];
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

function normalizeFeaturedInventoryFilter(value?: string | null): ApiFeaturedInventoryFilter {
  return value === "workflow" ||
    value === "video_prompt" ||
    value === "image_prompt" ||
    value === "activity"
    ? value
    : "all";
}

function normalizeWorkflowType(value?: string | null): ApiFeaturedWorkflowInventoryType | undefined {
  return value === "copyable" || value === "placeholder" ? value : undefined;
}

export function normalizeFeaturedInventoryQuery(
  query: FeaturedInventoryQuery = {}
): Required<Pick<FeaturedInventoryQuery, "filter" | "sort" | "limit">> &
  Pick<FeaturedInventoryQuery, "q" | "modelCategory" | "contentCategory" | "workflowType" | "cursor"> {
  const filter = normalizeFeaturedInventoryFilter(query.filter);
  const sort = query.sort === "latest" ? "latest" : "hot";
  const q = query.q?.trim() || undefined;
  const cursor = query.cursor?.trim() || undefined;
  const limit =
    typeof query.limit === "number" && Number.isFinite(query.limit) && query.limit > 0
      ? Math.min(Math.trunc(query.limit), MAX_FEATURED_PAGE_LIMIT)
      : DEFAULT_FEATURED_PAGE_LIMIT;

  return {
    filter,
    sort,
    q,
    modelCategory:
      filter === "video_prompt" || filter === "image_prompt" ? query.modelCategory?.trim() || undefined : undefined,
    contentCategory:
      filter === "video_prompt" || filter === "image_prompt" ? query.contentCategory?.trim() || undefined : undefined,
    workflowType: filter === "workflow" ? normalizeWorkflowType(query.workflowType) : undefined,
    limit,
    cursor
  };
}

export function serializeFeaturedInventoryQuery(query: FeaturedInventoryQuery = {}) {
  const normalized = normalizeFeaturedInventoryQuery(query);
  const params = new URLSearchParams();

  if (normalized.filter !== "all") {
    params.set("filter", normalized.filter);
  }

  if (normalized.sort !== "hot") {
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

  if (normalized.workflowType) {
    params.set("workflowType", normalized.workflowType);
  }

  if (normalized.limit !== DEFAULT_FEATURED_PAGE_LIMIT) {
    params.set("limit", String(normalized.limit));
  }

  if (normalized.cursor) {
    params.set("cursor", normalized.cursor);
  }

  return params.toString();
}

export function deserializeFeaturedInventoryQuery(queryString: string): FeaturedInventoryQuery {
  const params = new URLSearchParams(queryString);
  const limit = params.get("limit");

  return {
    filter: normalizeFeaturedInventoryFilter(params.get("filter")),
    sort: params.get("sort") === "latest" ? "latest" : "hot",
    q: params.get("q") ?? undefined,
    modelCategory: params.get("modelCategory") ?? undefined,
    contentCategory: params.get("contentCategory") ?? undefined,
    workflowType: normalizeWorkflowType(params.get("workflowType")),
    limit: limit ? Number.parseInt(limit, 10) : undefined,
    cursor: params.get("cursor") ?? undefined
  };
}

export function toFeaturedInventoryQueryFromRouteInput(
  input: FeaturedInventoryRouteInput = {}
): FeaturedInventoryQuery {
  const filter = normalizeFeaturedInventoryFilter(firstQueryValue(input.filter));

  return {
    filter,
    sort: firstQueryValue(input.sort) === "latest" ? "latest" : "hot",
    q: firstQueryValue(input.q),
    modelCategory:
      filter === "video_prompt" || filter === "image_prompt" ? firstQueryValue(input.model) : undefined,
    contentCategory:
      filter === "video_prompt" || filter === "image_prompt" ? firstQueryValue(input.content) : undefined,
    workflowType: filter === "workflow" ? normalizeWorkflowType(firstQueryValue(input.secondary)) : undefined,
    limit: DEFAULT_FEATURED_PAGE_LIMIT
  };
}
