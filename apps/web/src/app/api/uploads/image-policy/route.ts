import { proxyUploadJsonRequest } from "@/app/api/uploads/_shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return proxyUploadJsonRequest(request, "/api/uploads/image-policy");
}
