export function normalizeRedirectTarget(target?: string | null) {
  return normalizeInternalPath(target, "/home");
}

export function normalizeBackTarget(target?: string | null, fallback = "/featured") {
  return normalizeInternalPath(target, fallback);
}

export function appendBackSource(href: string, sourcePath: string) {
  if (!isInternalPath(href)) {
    return href;
  }

  const normalizedSource = normalizeBackTarget(sourcePath);
  const url = new URL(href, "http://dramatv.local");
  url.searchParams.set("from", normalizedSource);

  return `${url.pathname}${url.search}${url.hash}`;
}

export function shouldReplaceHistoryEntryForBackSource(currentRoute: string, sourcePath: string) {
  const current = parseNormalizedInternalRoute(currentRoute, currentRoute);
  const source = parseNormalizedInternalRoute(sourcePath, currentRoute);

  if (!current || !source) {
    return false;
  }

  return (
    current.pathname === source.pathname &&
    current.search === source.search &&
    Boolean(source.hash) &&
    current.fullPath !== source.fullPath
  );
}

function normalizeInternalPath(target: string | null | undefined, fallback: string) {
  const trimmed = target?.trim();
  if (!trimmed) {
    return fallback;
  }

  const decoded = decodeRepeatedUriComponent(trimmed);
  const normalized = normalizeNestedInternalPath(decoded);

  if (!normalized || !isInternalPath(normalized)) {
    return fallback;
  }

  return normalized;
}

function parseNormalizedInternalRoute(target: string, fallback: string) {
  const normalized = normalizeInternalPath(target, fallback);
  if (!normalized || !isInternalPath(normalized)) {
    return null;
  }

  try {
    const url = new URL(normalized, "http://dramatv.local");
    return {
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      fullPath: `${url.pathname}${url.search}${url.hash}`
    };
  } catch {
    return null;
  }
}

function normalizeNestedInternalPath(value: string) {
  const [routeWithoutOuterHash, outerHash = ""] = splitOuterHash(value);
  const normalizedRoute = routeWithoutOuterHash.replace(/#/g, "%23");

  try {
    const url = new URL(normalizedRoute, "http://dramatv.local");
    const activeHash = resolveActiveHashForPath(url.pathname, url.search, outerHash);
    const encodedOuterHash =
      outerHash && !activeHash ? `${url.pathname}${url.search}${url.search ? `%23${outerHash}` : ""}` : `${url.pathname}${url.search}`;

    return `${encodedOuterHash}${activeHash ? `#${activeHash}` : ""}`;
  } catch {
    return null;
  }
}

function splitOuterHash(value: string) {
  const lastHashIndex = value.lastIndexOf("#");
  if (lastHashIndex <= 0) {
    return [value] as const;
  }

  return [value.slice(0, lastHashIndex), value.slice(lastHashIndex + 1)] as const;
}

export function encodeRedirectTarget(target: string) {
  return encodeURIComponent(normalizeRedirectTarget(target));
}

export function normalizeDynamicSegment(segment: string) {
  return decodeRepeatedUriComponent(segment);
}

function decodeRepeatedUriComponent(value: string) {
  let current = value;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) {
        break;
      }
      current = decoded;
    } catch {
      break;
    }
  }

  return current;
}

function isInternalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

function resolveActiveHashForPath(pathname: string, search: string, outerHash: string) {
  const normalizedOuterHash = outerHash.trim();
  if (normalizedOuterHash && isHashAllowedForPath(pathname, normalizedOuterHash)) {
    return normalizedOuterHash;
  }

  const decodedSearch = decodeRepeatedUriComponent(search);
  const hashMatches = [...decodedSearch.matchAll(/#([A-Za-z0-9_-]+)/g)].map((match) => match[1]);
  for (let index = hashMatches.length - 1; index >= 0; index -= 1) {
    const candidate = hashMatches[index];
    if (isHashAllowedForPath(pathname, candidate)) {
      return candidate;
    }
  }

  return "";
}

function isHashAllowedForPath(pathname: string, hash: string) {
  if (!hash) {
    return false;
  }

  if (pathname === "/featured") {
    return hash.startsWith("featured-item-");
  }

  if (pathname.startsWith("/creators/")) {
    return (
      hash.startsWith("creator-work-") ||
      hash.startsWith("creator-workflow-") ||
      hash.startsWith("creator-post-")
    );
  }

  if (pathname === "/discussions") {
    return hash.startsWith("discussion-thread-") || hash.startsWith("discussion-contributor-");
  }

  if (pathname === "/home" || pathname === "/") {
    return hash.startsWith("home-card-") || hash.startsWith("home-hero-") || hash.startsWith("landing-card-");
  }

  if (pathname === "/me") {
    return hash.startsWith("me-");
  }

  return false;
}
