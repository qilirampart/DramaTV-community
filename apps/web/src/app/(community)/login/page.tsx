import { LoginPage } from "@/features/login/LoginPage";
import { getAuthProviderConfig } from "@/lib/api/community-service";
import { hasCommunitySession } from "@/lib/auth/community-auth";
import { normalizeRedirectTarget } from "@/lib/routes/redirect-utils";
import { redirect } from "next/navigation";

type LoginRouteProps = {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
};

export default async function LoginRoute({ searchParams }: LoginRouteProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTo = normalizeRedirectTarget(resolvedSearchParams?.redirectTo);

  if (await hasCommunitySession()) {
    redirect(redirectTo);
  }

  const providerConfig = await getAuthProviderConfig({
    includeAuth: false,
    timeoutMs: 2500
  });

  return <LoginPage redirectTo={redirectTo} providerConfig={providerConfig.data} />;
}
