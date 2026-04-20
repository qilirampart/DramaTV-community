"use server";

import { RedirectType, redirect } from "next/navigation";
import { logoutCommunity } from "@/lib/api/community-service";

export async function logoutAction() {
  await logoutCommunity();
  redirect("/", RedirectType.replace);
}
