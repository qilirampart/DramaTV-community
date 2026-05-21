import { NextResponse } from "next/server";
import { getRecentNotifications, isCommunityAuthRequiredError } from "@/lib/api/community-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notifications = await getRecentNotifications();
    return NextResponse.json(notifications, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const isAnonymous = isCommunityAuthRequiredError(error);
    return NextResponse.json(
      {
        code: isAnonymous ? "OK" : "ME_NOTIFICATIONS_PROXY_FAILED",
        message: isAnonymous ? "ok" : "Loading recent notifications failed.",
        data: {
          items: []
        },
        requestId: isAnonymous ? "me-notifications-anonymous" : "me-notifications-error"
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
