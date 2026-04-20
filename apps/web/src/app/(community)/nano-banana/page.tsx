import { redirect } from "next/navigation";
import { COMMUNITY_INTERNAL_ROUTES } from "@/lib/routes/community-routes";

export default function NanoBananaReplicaRoute() {
  redirect(COMMUNITY_INTERNAL_ROUTES.nanoBanana);
}
