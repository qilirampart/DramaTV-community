import { LoginPage } from "@/features/login/LoginPage";
import { hasCommunitySession } from "@/lib/auth/community-auth";
import { redirect } from "next/navigation";

type LoginRouteProps = {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
};

export default async function LoginRoute({ searchParams }: LoginRouteProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTo = resolvedSearchParams?.redirectTo;

  if (await hasCommunitySession()) {
    const target = redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/home";
    redirect(target);
  }

  return <LoginPage redirectTo={redirectTo} />;
}
