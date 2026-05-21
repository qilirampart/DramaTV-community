import { getAdminSession, resolveAdminHomeRoute } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";

type LoginPageProps = {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();
  if (session) {
    redirect(resolveAdminHomeRoute(session.role));
  }

  const params = await searchParams;

  return <AdminLoginForm redirectTo={params.redirectTo} />;
}
