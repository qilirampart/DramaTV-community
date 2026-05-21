import type { ReactNode } from "react";
import { AdminShell } from "@/components/AdminShell";
import { getAdminSession } from "@/lib/admin-auth";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await getAdminSession();
  if (!session) {
    return <>{children}</>;
  }
  return <AdminShell session={session}>{children}</AdminShell>;
}
