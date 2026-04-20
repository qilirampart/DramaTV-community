import { redirect } from "next/navigation";
import { COMMUNITY_INTERNAL_ROUTES } from "@/lib/routes/community-routes";

export default function SeedanceReferenceRoute() {
  redirect(COMMUNITY_INTERNAL_ROUTES.seedance);
}
