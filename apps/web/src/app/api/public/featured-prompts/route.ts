import { NextResponse } from "next/server";
import { getAllPrompts } from "@/lib/api/community-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const [videoPrompts, imagePrompts] = await Promise.all([
    getAllPrompts({ modality: "video", sort: "latest" }, { includeAuth: false, timeoutMs: 8000 }),
    getAllPrompts({ modality: "image", sort: "latest" }, { includeAuth: false, timeoutMs: 8000 })
  ]);

  return NextResponse.json(
    {
      items: [...videoPrompts.data, ...imagePrompts.data],
      requestId: videoPrompts.requestId
    },
    {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=60"
      }
    }
  );
}
