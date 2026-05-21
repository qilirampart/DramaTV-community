import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentAuthSession, isCommunityAuthRequiredError } from "@/lib/api/community-service";
import type { ApiAuthSession } from "@/lib/contracts/community-api";
import { encodeRedirectTarget } from "@/lib/routes/redirect-utils";

const COMMUNITY_ACCESS_TOKEN_COOKIE = "dramatv_access_token";

const readCommunityAccessToken = cache(async () => {
  const cookieStore = await cookies();
  return cookieStore.get(COMMUNITY_ACCESS_TOKEN_COOKIE)?.value?.trim() ?? "";
});

export const getVerifiedCommunitySession = cache(async (): Promise<ApiAuthSession | null> => {
  const accessToken = await readCommunityAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    const session = await getCurrentAuthSession();
    return session.data;
  } catch (error) {
    if (isCommunityAuthRequiredError(error)) {
      return null;
    }

    throw error;
  }
});

export async function hasCommunitySession() {
  return Boolean(await getVerifiedCommunitySession());
}

export async function requireCommunitySession(redirectTo: string) {
  const session = await getVerifiedCommunitySession();
  if (session) {
    return session;
  }

  redirect(`/login?redirectTo=${encodeRedirectTarget(redirectTo)}`);
}
