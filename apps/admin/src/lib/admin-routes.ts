function normalizeBasePath(value: string | undefined) {
  const trimmed = value?.trim() || "";
  if (!trimmed || trimmed === "/") {
    return "";
  }

  const prefixed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return prefixed.replace(/\/+$/, "");
}

function normalizeRoutePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const ADMIN_BROWSER_BASE_PATH = normalizeBasePath(process.env.DRAMATV_ADMIN_BASE_PATH ?? "/admin");

export function buildAdminBrowserPath(routePath: string) {
  const normalizedRoutePath = normalizeRoutePath(routePath);
  if (!ADMIN_BROWSER_BASE_PATH) {
    return normalizedRoutePath;
  }

  if (
    normalizedRoutePath === ADMIN_BROWSER_BASE_PATH ||
    normalizedRoutePath.startsWith(`${ADMIN_BROWSER_BASE_PATH}/`)
  ) {
    return normalizedRoutePath;
  }

  if (normalizedRoutePath === "/") {
    return ADMIN_BROWSER_BASE_PATH;
  }

  return `${ADMIN_BROWSER_BASE_PATH}${normalizedRoutePath}`;
}
