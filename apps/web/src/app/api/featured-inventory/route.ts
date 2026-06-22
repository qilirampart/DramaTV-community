import { NextRequest, NextResponse } from "next/server";
import {
  getFeaturedInventory,
  toFeaturedInventoryQueryFromRouteInput
} from "@/lib/api/featured-inventory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const inventoryQuery = toFeaturedInventoryQueryFromRouteInput({
    filter: request.nextUrl.searchParams.get("filter") ?? undefined,
    sort: request.nextUrl.searchParams.get("sort") ?? undefined,
    q: request.nextUrl.searchParams.get("q") ?? undefined,
    model: request.nextUrl.searchParams.get("modelCategory") ?? undefined,
    content: request.nextUrl.searchParams.get("contentCategory") ?? undefined,
    secondary: request.nextUrl.searchParams.get("workflowType") ?? undefined
  });
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = request.nextUrl.searchParams.get("limit");
  const inventory = await getFeaturedInventory({
    ...inventoryQuery,
    cursor: cursor?.trim() || undefined,
    limit: limit ? Number.parseInt(limit, 10) : undefined
  });

  return NextResponse.json(
    {
      summary: inventory.data.summary,
      page: inventory.data.page,
      requestId: inventory.requestId
    },
    {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
        Vary: "Cookie"
      }
    }
  );
}
