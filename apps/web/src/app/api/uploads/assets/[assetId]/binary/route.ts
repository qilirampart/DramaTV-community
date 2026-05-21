import { proxyUploadBinaryRequest } from "@/app/api/uploads/_shared";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await context.params;
  return proxyUploadBinaryRequest(request, `/api/uploads/assets/${encodeURIComponent(assetId)}/binary`);
}
