import type {
  ApiUploadAssetKind,
  ApiUploadAssetRole,
  ApiUploadPolicy,
  ApiUploadedAsset
} from "@/lib/contracts/community-api";
import { formatCommunityBackendFailure } from "@/lib/api/community-error-presenter";

type ApiEnvelope<T> = {
  code: string;
  message: string;
  data: T;
  requestId: string;
};

const REQUEST_ID_HEADER_NAME = "X-Request-Id";
const MAX_UPLOAD_SIZE_BYTES = {
  image: 20 * 1024 * 1024,
  video: 300 * 1024 * 1024
} as const;

function createRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `web-upload-${globalThis.crypto.randomUUID()}`;
  }

  return `web-upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatMaxUploadSize(sizeBytes: number) {
  const sizeInMb = sizeBytes / (1024 * 1024);
  return Number.isInteger(sizeInMb) ? `${sizeInMb}MB` : `${sizeInMb.toFixed(1)}MB`;
}

function resolveUploadTargetLabel(kind: ApiUploadAssetKind, assetRole?: ApiUploadAssetRole) {
  if (kind === "image") {
    return assetRole === "avatar" ? "头像图片" : "图片";
  }

  return "视频";
}

function resolveFileTooLargeMessage(kind: ApiUploadAssetKind, assetRole?: ApiUploadAssetRole) {
  const label = resolveUploadTargetLabel(kind, assetRole);
  return `${label}不能超过 ${formatMaxUploadSize(MAX_UPLOAD_SIZE_BYTES[kind])}。`;
}

function validateUploadFile(input: {
  kind: ApiUploadAssetKind;
  assetRole?: ApiUploadAssetRole;
  file: File;
}) {
  const maxSizeBytes = MAX_UPLOAD_SIZE_BYTES[input.kind];
  if (input.file.size > maxSizeBytes) {
    throw new Error(resolveFileTooLargeMessage(input.kind, input.assetRole));
  }
}

async function parseEnvelope<T>(
  response: Response,
  fallbackRequestId: string,
  fallbackMessage: string,
  customErrorMessages?: Partial<Record<string, string>>
): Promise<ApiEnvelope<T>> {
  const responseRequestId = response.headers.get(REQUEST_ID_HEADER_NAME) ?? fallbackRequestId;
  let payload: Partial<ApiEnvelope<T>> | null = null;

  try {
    payload = (await response.json()) as Partial<ApiEnvelope<T>>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const customMessage =
      typeof payload?.code === "string" ? customErrorMessages?.[payload.code] : undefined;

    throw new Error(
      formatCommunityBackendFailure({
        fallback:
          typeof customMessage === "string" && customMessage.trim().length > 0
            ? customMessage
            : fallbackMessage,
        code: typeof payload?.code === "string" ? payload.code : undefined,
        requestId:
          typeof payload?.requestId === "string" && payload.requestId.trim().length > 0
            ? payload.requestId
            : responseRequestId,
        overrides: customErrorMessages
      })
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new Error(
      formatCommunityBackendFailure({
        fallback: fallbackMessage,
        requestId: responseRequestId
      })
    );
  }

  return {
    code: typeof payload.code === "string" ? payload.code : "OK",
    message: typeof payload.message === "string" ? payload.message : "ok",
    data: payload.data as T,
    requestId:
      typeof payload.requestId === "string" && payload.requestId.trim().length > 0
        ? payload.requestId
        : responseRequestId
  };
}

export async function uploadAssetFromClient(input: {
  kind: ApiUploadAssetKind;
  assetRole?: ApiUploadAssetRole;
  file: File;
}): Promise<ApiUploadedAsset> {
  validateUploadFile(input);

  const requestId = createRequestId();
  const policyPath = input.kind === "image" ? "/api/uploads/image-policy" : "/api/uploads/video-policy";
  const kindLabel = input.kind === "image" ? "Image" : "Video";
  const customErrorMessages = {
    UPLOAD_FILE_TOO_LARGE: resolveFileTooLargeMessage(input.kind, input.assetRole)
  };

  const policyResponse = await fetch(policyPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [REQUEST_ID_HEADER_NAME]: requestId
    },
    cache: "no-store",
    body: JSON.stringify({
      fileName: input.file.name,
      mimeType: input.file.type || "application/octet-stream",
      sizeBytes: input.file.size,
      assetRole: input.assetRole
    })
  });

  const policyEnvelope = await parseEnvelope<ApiUploadPolicy>(
    policyResponse,
    requestId,
    `${kindLabel}上传策略申请失败。`,
    customErrorMessages
  );

  const uploadResponse = await fetch(policyEnvelope.data.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.file.type || "application/octet-stream",
      [REQUEST_ID_HEADER_NAME]: requestId
    },
    cache: "no-store",
    body: input.file
  });

  const uploadEnvelope = await parseEnvelope<ApiUploadedAsset>(
    uploadResponse,
    requestId,
    `${kindLabel}上传失败。`,
    customErrorMessages
  );

  return uploadEnvelope.data;
}
