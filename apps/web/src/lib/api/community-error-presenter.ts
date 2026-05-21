type CommunityErrorMessageOverrides = Partial<Record<string, string>>;

type CommunityErrorMeta = {
  kind: "command" | "unavailable";
  status?: number;
  code?: string;
  requestId?: string;
};

const COMMUNITY_UNAVAILABLE_MESSAGE = "服务暂时不可用，请稍后重试。";

const COMMUNITY_COMMAND_ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: "账号或密码不正确。",
  AUTH_RATE_LIMITED: "登录尝试过于频繁，请稍后再试。",
  AUTH_LOGIN_TYPE_DISABLED: "当前登录方式暂不可用。",
  AUTH_LOGIN_TYPE_UNSUPPORTED: "当前登录方式暂不可用。",
  AUTH_REQUIRED: "请先登录后再继续。",
  FORBIDDEN: "请先登录后再继续。",
  RESOURCE_NOT_FOUND: "请求的内容不存在。",
  FOLLOW_SELF_FORBIDDEN: "不能关注自己。",
  FOLLOW_TARGET_NOT_FOUND: "要关注的创作者不存在。",
  COMMENT_CONTENT_INVALID: "评论内容不能为空。",
  COMMENT_CONTENT_TOO_LONG: "评论内容过长，请精简后再试。",
  COMMENT_CONTENT_BLOCKED: "评论内容包含不适合发布的信息，请修改后再试。",
  COMMENT_RATE_LIMITED: "操作太频繁了，请稍后再试。",
  COMMENT_DUPLICATE_BLOCKED: "请勿重复发布相同内容。",
  COMMENT_DISABLED: "当前内容已关闭评论区。",
  COMMENT_DELETE_FORBIDDEN: "当前无权管理这条评论。",
  COMMENT_MANAGE_FORBIDDEN: "当前无权管理这条评论。",
  COMMENT_NOT_FOUND: "评论不存在或已被删除。",
  COMMENT_TARGET_NOT_FOUND: "评论对象不存在。",
  COMMENT_CURSOR_INVALID: "评论分页参数无效，请刷新后重试。",
  INTERACTION_TARGET_NOT_FOUND: "目标内容不存在或已下线。",
  WORKFLOW_NOT_FOUND: "工作流不存在。",
  WORKFLOW_ID_INVALID: "工作流标识无效。",
  CANVAS_COPY_MODE_INVALID: "画布复制参数无效。",
  CANVAS_COPY_FORBIDDEN: "当前工作流暂不支持进入画布。",
  REPORT_TARGET_TYPE_INVALID: "举报对象类型无效。",
  REPORT_TARGET_ID_INVALID: "举报对象标识无效。",
  REPORT_TARGET_NOT_FOUND: "被举报内容不存在。",
  REPORT_REASON_INVALID: "举报原因无效。",
  REPORT_DUPLICATE: "该内容已举报，请勿重复提交。",
  REPORT_RATE_LIMITED: "举报操作过于频繁，请稍后再试。",
  ME_PROFILE_USER_NOT_FOUND: "当前登录状态异常，请重新登录后再试。",
  ME_AVATAR_ASSET_ID_INVALID: "头像资源标识无效。",
  ME_AVATAR_ASSET_NOT_FOUND: "头像资源不存在，请重新上传。",
  ME_AVATAR_ASSET_KIND_INVALID: "头像必须使用图片资源。",
  ME_AVATAR_ASSET_NOT_READY: "头像资源还在处理中，请稍后再试。",
  ME_AVATAR_ASSET_FORBIDDEN: "只能使用自己上传的头像资源。",
  ME_DISPLAY_NAME_INVALID: "昵称格式不正确。",
  ME_PROFILE_FIELD_TOO_LONG: "资料内容过长，请精简后再试。",
  DRAFT_ALREADY_SUBMITTED: "该草稿已提交，不能继续编辑。",
  VIDEO_DRAFT_ALREADY_SUBMITTED: "该视频草稿已提交，不能继续编辑。",
  WORKFLOW_DRAFT_ALREADY_SUBMITTED: "该工作流草稿已提交，不能继续编辑。",
  POST_DRAFT_ALREADY_SUBMITTED: "该帖子草稿已提交，不能继续编辑。",
  VIDEO_DRAFT_NOT_FOUND: "视频草稿不存在或已被删除。",
  WORKFLOW_DRAFT_NOT_FOUND: "工作流草稿不存在或已被删除。",
  POST_DRAFT_NOT_FOUND: "帖子草稿不存在或已被删除。",
  VIDEO_SOURCE_ASSET_REQUIRED: "请先上传视频文件。",
  VIDEO_SOURCE_ASSET_INVALID: "视频文件无效或尚未处理完成。",
  VIDEO_SOURCE_ASSET_KIND_INVALID: "视频素材类型不正确。",
  VIDEO_COVER_ASSET_INVALID: "封面资源无效或尚未处理完成。",
  VIDEO_COVER_ASSET_KIND_INVALID: "封面必须使用图片资源。",
  WORKFLOW_EXAMPLE_ASSET_REQUIRED: "请先上传工作流示例视频。",
  WORKFLOW_EXAMPLE_ASSET_INVALID: "工作流示例视频无效或尚未处理完成。",
  WORKFLOW_EXAMPLE_ASSET_KIND_INVALID: "工作流示例必须使用视频资源。",
  WORKFLOW_COVER_ASSET_INVALID: "工作流封面无效或尚未处理完成。",
  WORKFLOW_COVER_ASSET_KIND_INVALID: "工作流封面必须使用图片资源。",
  PROMPT_MODALITY_INVALID: "提示词类型无效。",
  PROMPT_TEXT_REQUIRED: "请填写提示词内容。",
  PROMPT_COVER_ASSET_INVALID: "封面资源无效或尚未处理完成。",
  PROMPT_COVER_ASSET_KIND_INVALID: "封面必须使用图片资源。",
  PROMPT_EXAMPLE_ASSET_REQUIRED: "请先上传示例素材。",
  PROMPT_EXAMPLE_ASSET_INVALID: "示例素材无效或尚未处理完成。",
  PROMPT_EXAMPLE_ASSET_KIND_INVALID: "示例素材类型与提示词类型不匹配。",
  POST_CHANNEL_INVALID: "帖子分区无效，请重新选择。",
  POST_BINDING_INVALID: "绑定内容无效，请重新选择。",
  POST_BINDING_TYPE_INVALID: "绑定内容类型无效。",
  POST_BINDING_TARGET_NOT_FOUND: "绑定内容不存在或未发布。",
  UPLOAD_FILE_TOO_LARGE: "上传文件过大，请压缩后再试。",
  UPLOAD_MIME_NOT_ALLOWED: "当前文件类型不支持上传。",
  UPLOAD_FILE_EXTENSION_NOT_ALLOWED: "当前文件扩展名不支持上传。",
  UPLOAD_CONTENT_TYPE_MISMATCH: "上传文件类型与登记信息不一致，请重新选择文件。",
  UPLOAD_ASSET_KIND_INVALID: "上传资源类型无效。",
  UPLOAD_ASSET_ID_INVALID: "上传资源标识无效。",
  UPLOAD_ASSET_NOT_FOUND: "上传资源不存在，请重新上传。",
  UPLOAD_ASSET_FORBIDDEN: "只能继续上传自己登记的资源。",
  UPLOAD_ASSET_ALREADY_READY: "该文件已经上传完成，无需重复上传。",
  UPLOAD_ASSET_STATUS_INVALID: "当前上传状态无效，请重新上传。",
  UPLOAD_ASSET_ROLE_INVALID: "上传资源用途无效。",
  UPLOAD_RATE_LIMITED: "上传操作过于频繁，请稍后再试。",
  UPLOAD_PROVIDER_NOT_READY: "上传服务暂未就绪，请稍后再试。",
  UPLOAD_EMPTY_FILE: "上传文件为空，请重新选择。",
  UPLOAD_WRITE_FAILED: "上传失败，请稍后再试。",
  UPLOAD_OSS_WRITE_FAILED: "上传失败，请稍后再试。",
  UPLOAD_STREAM_READ_FAILED: "上传失败，请稍后再试。",
  UPLOAD_PATH_INVALID: "上传失败，请稍后再试。",
  MEDIA_TASK_NOT_FOUND: "媒体任务不存在。",
  MEDIA_TASK_TYPE_UNSUPPORTED: "媒体任务类型暂不支持。",
  MEDIA_TASK_RETRY_FORBIDDEN: "当前媒体任务暂不支持重试。",
  MEDIA_TASK_ID_INVALID: "媒体任务标识无效。"
};

function appendRequestId(message: string, requestId?: string) {
  return requestId ? `${message} Request ID: ${requestId}` : message;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function readCommunityErrorMeta(error: unknown): CommunityErrorMeta | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as {
    name?: unknown;
    status?: unknown;
    code?: unknown;
    requestId?: unknown;
  };

  if (candidate.name === "CommunityBackendCommandError") {
    return {
      kind: "command",
      status: typeof candidate.status === "number" ? candidate.status : undefined,
      code: hasText(candidate.code) ? candidate.code : undefined,
      requestId: hasText(candidate.requestId) ? candidate.requestId : undefined
    };
  }

  if (candidate.name === "CommunityBackendUnavailableError") {
    return {
      kind: "unavailable",
      status: typeof candidate.status === "number" ? candidate.status : undefined,
      code: hasText(candidate.code) ? candidate.code : undefined,
      requestId: hasText(candidate.requestId) ? candidate.requestId : undefined
    };
  }

  return null;
}

export function resolveCommunityCommandErrorMessage(
  code: string | undefined,
  fallback: string,
  overrides?: CommunityErrorMessageOverrides
) {
  if (hasText(code) && hasText(overrides?.[code])) {
    return overrides[code];
  }

  if (hasText(code) && hasText(COMMUNITY_COMMAND_ERROR_MESSAGES[code])) {
    return COMMUNITY_COMMAND_ERROR_MESSAGES[code];
  }

  return fallback;
}

export function formatCommunityBackendFailure(input: {
  fallback: string;
  code?: string;
  requestId?: string;
  unavailable?: boolean;
  overrides?: CommunityErrorMessageOverrides;
}) {
  const message = input.unavailable
    ? COMMUNITY_UNAVAILABLE_MESSAGE
    : resolveCommunityCommandErrorMessage(input.code, input.fallback, input.overrides);

  return appendRequestId(message, input.requestId);
}

export function formatCommunityActionError(
  error: unknown,
  fallback: string,
  overrides?: CommunityErrorMessageOverrides
) {
  const meta = readCommunityErrorMeta(error);
  if (!meta) {
    return fallback;
  }

  return formatCommunityBackendFailure({
    fallback,
    code: meta.code,
    requestId: meta.requestId,
    unavailable: meta.kind === "unavailable",
    overrides
  });
}
