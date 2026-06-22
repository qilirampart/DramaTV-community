import { NextRequest, NextResponse } from "next/server";
import {
  getPublicFeaturedPromptInventory,
  toFeaturedPromptInventoryQueryFromRouteInput
} from "@/lib/api/featured-prompt-inventory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const promptInventoryQuery = toFeaturedPromptInventoryQueryFromRouteInput({
    filter: request.nextUrl.searchParams.get("filter") ?? undefined,
    sort: request.nextUrl.searchParams.get("sort") ?? undefined,
    q: request.nextUrl.searchParams.get("q") ?? undefined,
    model: request.nextUrl.searchParams.get("modelCategory") ?? undefined,
    content: request.nextUrl.searchParams.get("contentCategory") ?? undefined
  });
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = request.nextUrl.searchParams.get("limit");
  const promptInventory = await getPublicFeaturedPromptInventory({
    ...promptInventoryQuery,
    cursor: cursor?.trim() || undefined,
    limit: limit ? Number.parseInt(limit, 10) : undefined
  });

  return NextResponse.json(
    {
      summary: promptInventory.data.summary,
      page: promptInventory.data.page,
      requestId: promptInventory.requestId
    },
    {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=60"
      }
    }
  );
}
