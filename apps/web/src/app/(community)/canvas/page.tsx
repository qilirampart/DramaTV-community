import { COMMUNITY_CANVAS_ENTRY_URL } from "@/lib/routes/community-routes";
import { redirect } from "next/navigation";

export default async function CanvasEntryRoute() {
  redirect(COMMUNITY_CANVAS_ENTRY_URL);
}
