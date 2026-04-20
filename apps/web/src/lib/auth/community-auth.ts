import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COMMUNITY_ACCESS_TOKEN_COOKIE = "dramatv_access_token";

export async function hasCommunitySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COMMUNITY_ACCESS_TOKEN_COOKIE)?.value?.trim();
  return Boolean(token);
}

export async function requireCommunitySession(redirectTo: string) {
  if (await hasCommunitySession()) {
    return;
  }

  redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
}
