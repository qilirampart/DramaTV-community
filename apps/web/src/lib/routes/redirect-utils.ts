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

function normalizeInternalPath(target: string | null | undefined, fallback: string) {
  const trimmed = target?.trim();
  if (!trimmed) {
    return fallback;
  }

  const decoded = decodeRepeatedUriComponent(trimmed);
  if (!isInternalPath(decoded)) {
    return fallback;
  }

  return decoded;
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
