import assert from "node:assert/strict";
import test from "node:test";

import {
  formatCommunityActionError,
  resolveCommunityCommandErrorMessage
} from "./community-error-presenter.ts";

function createCommunityCommandError({
  code,
  requestId,
  message = "command failed",
  status
}) {
  return Object.assign(new Error(message), {
    name: "CommunityBackendCommandError",
    path: "/api/test",
    status,
    code,
    requestId
  });
}

function createCommunityUnavailableError({
  code,
  requestId,
  message = "backend unavailable",
  status
}) {
  return Object.assign(new Error(message), {
    name: "CommunityBackendUnavailableError",
    path: "/api/test",
    status,
    code,
    requestId
  });
}

test("resolveCommunityCommandErrorMessage maps auth invalid credentials to user-safe copy", () => {
  assert.equal(
    resolveCommunityCommandErrorMessage("AUTH_INVALID_CREDENTIALS", "登录失败。"),
    "账号或密码不正确。"
  );
});

test("formatCommunityActionError maps stable command codes and appends request id", () => {
  const error = createCommunityCommandError({
    code: "PROMPT_TEXT_REQUIRED",
    requestId: "web-req-1",
    status: 400
  });

  assert.equal(
    formatCommunityActionError(error, "提交失败。"),
    "请填写提示词内容。 Request ID: web-req-1"
  );
});

test("formatCommunityActionError honors custom per-code overrides", () => {
  const error = createCommunityCommandError({
    code: "UPLOAD_FILE_TOO_LARGE",
    requestId: "web-upload-1",
    status: 400
  });

  assert.equal(
    formatCommunityActionError(error, "上传失败。", {
      UPLOAD_FILE_TOO_LARGE: "视频不能超过 300MB。"
    }),
    "视频不能超过 300MB。 Request ID: web-upload-1"
  );
});

test("formatCommunityActionError converts backend unavailable errors to generic safe copy", () => {
  const error = createCommunityUnavailableError({
    code: "REQUEST_TIMEOUT",
    requestId: "web-timeout-1"
  });

  assert.equal(
    formatCommunityActionError(error, "读取失败。"),
    "服务暂时不可用，请稍后重试。 Request ID: web-timeout-1"
  );
});
