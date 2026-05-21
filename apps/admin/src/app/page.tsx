import { redirect } from "next/navigation";
import { getAdminSession, resolveAdminHomeRoute } from "@/lib/admin-auth";

export default async function RootPage() {
  const session = await getAdminSession();
  redirect(session ? resolveAdminHomeRoute(session.role) : "/login?redirectTo=%2F");
}
