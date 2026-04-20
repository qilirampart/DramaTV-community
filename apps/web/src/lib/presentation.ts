const BLOCKED_ASSET_HOSTS = ["cdn.dramatv.local"];
const DISCUSSION_LABEL_OVERRIDES: Array<{
  pattern: RegExp;
  label: string;
}> = [
  { pattern: /standalone[-_\s]*post[-_\s]*smoke/i, label: "独立帖子冒烟验证" },
  { pattern: /post[-_\s]*publish[-_\s]*selector[-_\s]*smoke[-_\s]*workflow[-_\s]*option/i, label: "发帖选择器工作流验证" },
  { pattern: /post[-_\s]*publish[-_\s]*smoke[-_\s]*workflow[-_\s]*binding/i, label: "发帖后工作流绑定验证" },
  { pattern: /review[-_\s]*state[-_\s]*fix[-_\s]*video/i, label: "审核状态修复视频" },
  { pattern: /review[-_\s]*state[-_\s]*fix[-_\s]*workflow/i, label: "审核状态修复工作流" },
  { pattern: /browser[-_\s]*video[-_\s]*smoke/i, label: "浏览器视频冒烟验证" },
  { pattern: /post[-_\s]*selector/i, label: "发帖选择器" },
  { pattern: /post[-_\s]*publish/i, label: "发帖流程" },
  { pattern: /\bsmoke\b/i, label: "冒烟验证" }
];

const DISCUSSION_TAG_OVERRIDES: Record<string, string> = {
  smoke: "冒烟验证",
  post: "帖子",
  "post-publish": "发帖后",
  "post-selector": "选择器",
  standalone: "独立帖子",
  workflow: "工作流",
  binding: "绑定验证",
  selector: "选择器",
  review: "审核修复"
};

const ASCII_WORD_LABELS: Record<string, string> = {
  standalone: "独立",
  post: "帖子",
  publish: "发布",
  selector: "选择器",
  smoke: "验证",
  workflow: "工作流",
  option: "选项",
  binding: "绑定",
  review: "审核",
  state: "状态",
  fix: "修复",
  video: "视频",
  browser: "浏览器",
  thread: "讨论",
  test: "测试"
};

export function normalizeText(value?: string | null): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const lower = trimmed.toLowerCase();
  if (lower === "null" || lower === "undefined") {
    return undefined;
  }

  return trimmed;
}

export function normalizeAssetUrl(value?: string | null): string | undefined {
  const url = normalizeText(value);
  if (!url) {
    return undefined;
  }

  const lower = url.toLowerCase();
  if (BLOCKED_ASSET_HOSTS.some((host) => lower.includes(host))) {
    return undefined;
  }

  return url;
}

export function isVideoAssetUrl(value?: string | null): boolean {
  const url = normalizeAssetUrl(value);
  if (!url) {
    return false;
  }

  const pathname = url.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  return [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".ogv", ".m3u8"].some((ext) => pathname.endsWith(ext));
}

function containsCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

function isAsciiHeavy(value: string): boolean {
  const compact = value.replace(/\s+/g, "");
  if (!compact) {
    return false;
  }

  const asciiChars = compact.match(/[A-Za-z0-9\-_./]/g)?.length ?? 0;
  return asciiChars / compact.length >= 0.68;
}

function stripGeneratedSuffix(value: string): string {
  return value
    .replace(/(?:^|[-_\s])\d{8,14}(?:[-_]\d+)?(?=$|[-_\s])/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveDiscussionOverride(value: string): string | undefined {
  for (const item of DISCUSSION_LABEL_OVERRIDES) {
    if (item.pattern.test(value)) {
      return item.label;
    }
  }

  return undefined;
}

function truncateLabel(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}…`;
}

export function formatDiscussionDisplayTitle(value?: string | null): string | undefined {
  const title = normalizeText(value);
  if (!title) {
    return undefined;
  }

  if (containsCjk(title)) {
    return title;
  }

  const normalized = stripGeneratedSuffix(title);
  const overridden = resolveDiscussionOverride(normalized);
  if (overridden) {
    return overridden;
  }

  if (!isAsciiHeavy(normalized)) {
    return truncateLabel(normalized, 28);
  }

  const tokens = normalized
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token && !/^\d+$/.test(token))
    .slice(0, 5);

  const localized = tokens.map((token) => DISCUSSION_TAG_OVERRIDES[token] ?? ASCII_WORD_LABELS[token] ?? token);
  const allLocalized = localized.every((token, index) => token !== tokens[index]);
  const compact = allLocalized
    ? localized.join("")
    : localized
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
        .join(" ");

  return truncateLabel(compact, allLocalized ? 16 : 28);
}

export function formatDiscussionDisplayExcerpt(value?: string | null): string | undefined {
  const excerpt = normalizeText(value);
  if (!excerpt) {
    return undefined;
  }

  if (containsCjk(excerpt)) {
    return excerpt;
  }

  const normalized = stripGeneratedSuffix(excerpt);
  if (/smoke|test|binding|selector|workflow|publish/i.test(normalized)) {
    return "这是一条用于验证当前讨论区流程的测试内容，正式社区文案后续会替换进来。";
  }

  return truncateLabel(normalized, 48);
}

export function formatDiscussionDisplayTag(value?: string | null): string | undefined {
  const tag = normalizeText(value);
  if (!tag) {
    return undefined;
  }

  if (containsCjk(tag)) {
    return tag;
  }

  const normalized = tag.toLowerCase();
  return DISCUSSION_TAG_OVERRIDES[normalized] ?? formatDiscussionDisplayTitle(tag);
}

export function formatPublishStatus(statusCode?: string | null): string {
  switch (statusCode) {
    case "draft":
      return "Draft";
    case "in_review":
      return "In Review";
    case "published":
      return "Published";
    case "rejected":
      return "Rejected";
    default:
      return normalizeText(statusCode) ?? "Unknown";
  }
}

export function formatVisibility(visibility: "public" | "link" | "private"): string {
  switch (visibility) {
    case "public":
      return "Public";
    case "link":
      return "Link Only";
    case "private":
      return "Private";
    default:
      return visibility;
  }
}

export function formatRoleCode(roleCode?: string | null): string {
  switch (roleCode) {
    case "creator":
      return "Creator";
    case "admin":
      return "Admin";
    default:
      return normalizeText(roleCode) ?? "Community Member";
  }
}

export function formatRuntimeStatus(statusCode?: string | null): string {
  switch (statusCode) {
    case "creating":
      return "Creating";
    case "runtime_ready":
      return "Ready";
    case "reconciling":
      return "Reconciling";
    case "failed":
      return "Failed";
    case "archived":
      return "Archived";
    default:
      return normalizeText(statusCode) ?? "Unknown";
  }
}
