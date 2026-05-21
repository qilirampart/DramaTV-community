import { cookies } from "next/headers";

const API_BASE_URL = process.env.DRAMATV_API_BASE_URL?.trim() ?? "";
const COMMUNITY_ACCESS_TOKEN_COOKIE = "dramatv_access_token";
const AUTHORIZATION_HEADER_NAME = "Authorization";
const REQUEST_ID_HEADER_NAME = "X-Request-Id";

function createRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `web-upload-${globalThis.crypto.randomUUID()}`;
  }

  return `web-upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveRequestId(request: Request) {
  const incoming = request.headers.get(REQUEST_ID_HEADER_NAME)?.trim();
  return incoming && incoming.length > 0 ? incoming : createRequestId();
}

function absoluteBackendUrl(path: string) {
  if (API_BASE_URL.length === 0) {
    throw new Error("DRAMATV_API_BASE_URL is required for upload proxy routes.");
  }

  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

function buildFailureResponse(message: string, requestId: string, status = 500) {
  return new Response(
    JSON.stringify({
      code: "UPLOAD_PROXY_FAILED",
      message,
      data: null,
      requestId
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        [REQUEST_ID_HEADER_NAME]: requestId
      }
    }
  );
}

function buildProxyHeaders(requestId: string, contentType?: string | null) {
  const headers = new Headers();
  headers.set(REQUEST_ID_HEADER_NAME, requestId);
  if (contentType && contentType.trim().length > 0) {
    headers.set("Content-Type", contentType);
  }
  return headers;
}

async function applyAuthorizationHeader(request: Request, headers: Headers) {
  const incomingAuthorization = request.headers.get(AUTHORIZATION_HEADER_NAME)?.trim();
  if (incomingAuthorization && incomingAuthorization.toLowerCase().startsWith("bearer ")) {
    headers.set(AUTHORIZATION_HEADER_NAME, incomingAuthorization);
    return;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COMMUNITY_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (accessToken) {
    headers.set(AUTHORIZATION_HEADER_NAME, `Bearer ${accessToken}`);
  }
}

function buildPassThroughResponse(
  backendResponse: Response,
  requestId: string
) {
  const headers = new Headers();
  const contentType = backendResponse.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  headers.set(
    REQUEST_ID_HEADER_NAME,
    backendResponse.headers.get(REQUEST_ID_HEADER_NAME)?.trim() || requestId
  );

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers
  });
}

export async function proxyUploadJsonRequest(request: Request, backendPath: string) {
  const requestId = resolveRequestId(request);

  try {
    const headers = buildProxyHeaders(requestId, "application/json");
    await applyAuthorizationHeader(request, headers);

    const backendResponse = await fetch(absoluteBackendUrl(backendPath), {
      method: "POST",
      headers,
      body: await request.text(),
      cache: "no-store"
    });

    return buildPassThroughResponse(backendResponse, requestId);
  } catch {
    return buildFailureResponse("Upload policy proxy failed.", requestId);
  }
}

export async function proxyUploadBinaryRequest(request: Request, backendPath: string) {
  const requestId = resolveRequestId(request);

  try {
    const headers = buildProxyHeaders(requestId, request.headers.get("Content-Type"));
    const contentLength = request.headers.get("Content-Length")?.trim();
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    await applyAuthorizationHeader(request, headers);

    if (!request.body) {
      return buildFailureResponse("Binary upload request body is missing.", requestId, 400);
    }

    const backendResponse = await fetch(absoluteBackendUrl(backendPath), {
      method: "PUT",
      headers,
      body: request.body,
      duplex: "half",
      cache: "no-store"
    } as RequestInit & { duplex: "half" });

    return buildPassThroughResponse(backendResponse, requestId);
  } catch {
    return buildFailureResponse("Binary upload proxy failed.", requestId);
  }
}
