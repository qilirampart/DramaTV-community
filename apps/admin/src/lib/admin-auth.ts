import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AdminRole = "admin" | "operator" | "moderator";

export type AdminSession = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: AdminRole;
  roleLabel: string;
};

export const ADMIN_ACCESS_TOKEN_COOKIE = "dramatv_admin_access_token";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin: "系统管理员",
  operator: "运营",
  moderator: "审核员"
};

const ADMIN_HOME_ROUTES: Record<AdminRole, string> = {
  admin: "/dashboard",
  operator: "/dashboard",
  moderator: "/moderation"
};

export function isAdminRole(value: string): value is AdminRole {
  return value === "admin" || value === "operator" || value === "moderator";
}

export function resolveAdminHomeRoute(role: AdminRole) {
  return ADMIN_HOME_ROUTES[role];
}

export async function setAdminAccessToken(accessToken: string, expiresIn: number) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn
  });
}

export async function clearAdminAccessToken() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_ACCESS_TOKEN_COOKIE);
}

export async function getAdminAccessToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value?.trim();
  return token && token.length > 0 ? token : null;
}

export async function hasAdminSession() {
  return Boolean(await getAdminAccessToken());
}

export async function getAdminSession() {
  const { getAdminCurrentSession } = await import("./admin-service");
  const response = await getAdminCurrentSession();
  return response.data;
}

export async function requireAdminSession(redirectTo: string) {
  const session = await getAdminSession();

  if (!session) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return session;
}

export async function requireAdminAccess(allowedRoles: readonly AdminRole[], redirectTo: string) {
  const session = await requireAdminSession(redirectTo);

  if (!allowedRoles.includes(session.role)) {
    redirect(`${resolveAdminHomeRoute(session.role)}?denied=${encodeURIComponent(redirectTo)}`);
  }

  return session;
}
