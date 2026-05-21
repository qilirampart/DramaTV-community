import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      index += 1;
      continue;
    }

    parsed[key] = "true";
  }

  return parsed;
}

const args = parseArgs(process.argv.slice(2));
const backendBaseUrl = args["backend-base-url"] ?? process.env.DRAMATV_BACKEND_BASE_URL ?? "http://127.0.0.1:18080";
const smokeVideoId = args["smoke-video-id"] ?? process.env.DRAMATV_SMOKE_VIDEO_ID ?? "3d82413b-1036-4c1b-93dd-3a102e0b4683";
const smokeWorkflowId =
  args["smoke-workflow-id"] ?? process.env.DRAMATV_SMOKE_WORKFLOW_ID ?? "dd715ee9-189b-4450-a4ca-fdf71fb8aafb";
const creatorUsername = args["creator-username"] ?? process.env.DRAMATV_SMOKE_CREATOR_USERNAME ?? "creator-a";
const creatorPassword = args["creator-password"] ?? process.env.DRAMATV_SMOKE_CREATOR_PASSWORD ?? "dramatv-local-dev";
const outputPath = args.output ?? "";
const nowLabel = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const tempUsername = `qa-smoke-${nowLabel}`;
const tempPassword = args["temp-password"] ?? "dramatv-local-dev";

const results = [];

function pushResult(name, passed, detail) {
  results.push({ name, passed, detail });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requestId(label) {
  return `qa-${label}-${randomUUID()}`;
}

async function request(path, options = {}) {
  const headers = {
    Accept: "application/json",
    "X-Request-Id": options.requestId ?? requestId("api"),
    ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${backendBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    text,
    json
  };
}

async function expectOk(path, options = {}) {
  const response = await request(path, options);
  assert(
    response.status >= 200 && response.status < 300,
    `${options.method ?? "GET"} ${path} expected 2xx but got ${response.status}: ${response.text}`
  );
  assert(response.json?.code === "OK", `${path} expected code=OK but got ${response.text}`);
  return response.json;
}

async function login(username, password) {
  const response = await expectOk("/api/auth/login", {
    method: "POST",
    requestId: requestId("login"),
    body: {
      loginType: "password",
      username,
      password
    }
  });
  assert(typeof response.data?.accessToken === "string", `login missing accessToken for ${username}`);
  return response.data.accessToken;
}

function countCommentTree(items) {
  return (items ?? []).reduce((total, item) => total + 1 + countCommentTree(item.replies), 0);
}

async function runCase(name, fn) {
  try {
    const detail = await fn();
    pushResult(name, true, detail);
  } catch (error) {
    pushResult(name, false, error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  let creatorToken = null;
  let creatorUserId = null;
  let creatorThread = null;
  let tempToken = null;
  let tempUserId = null;

  await runCase("env.health", async () => {
    const response = await request("/actuator/health", { requestId: requestId("health") });
    assert(response.status >= 200 && response.status < 300, `/actuator/health expected 2xx but got ${response.status}`);
    assert(response.json?.status === "UP", `health status expected UP but got ${response.text}`);
    return "backend health is UP";
  });

  await runCase("public.feed-home", async () => {
    const response = await expectOk("/api/feed/home", { requestId: requestId("feed-home") });
    const feedItems = Array.isArray(response.data?.items)
      ? response.data.items
      : Array.isArray(response.data?.feedItems)
        ? response.data.feedItems
        : null;
    assert(Array.isArray(feedItems), "feed home missing items");
    return `items=${feedItems.length}`;
  });

  await runCase("public.prompts-list-and-detail", async () => {
    const list = await expectOk("/api/prompts?modality=all&limit=3", { requestId: requestId("prompts") });
    const promptItems = Array.isArray(list.data)
      ? list.data
      : Array.isArray(list.data?.items)
        ? list.data.items
        : null;
    assert(Array.isArray(promptItems) && promptItems.length > 0, "prompts list is empty");
    const promptId = promptItems[0].id;
    const detail = await expectOk(`/api/prompts/${promptId}`, { requestId: requestId("prompt-detail") });
    assert(detail.data?.id === promptId, "prompt detail id mismatch");
    return `promptId=${promptId}`;
  });

  await runCase("public.discussions-home", async () => {
    const response = await expectOk("/api/discussions/home", { requestId: requestId("discussions-home") });
    assert(Array.isArray(response.data?.featuredThreads), "discussion home missing featuredThreads");
    return `threads=${response.data.featuredThreads.length}`;
  });

  await runCase("public.video-and-workflow-detail", async () => {
    const video = await expectOk(`/api/videos/${smokeVideoId}`, { requestId: requestId("video-detail") });
    const workflow = await expectOk(`/api/workflows/${smokeWorkflowId}`, { requestId: requestId("workflow-detail") });
    assert(video.data?.id === smokeVideoId, "video detail id mismatch");
    assert(workflow.data?.id === smokeWorkflowId, "workflow detail id mismatch");
    return `video=${video.data.id}, workflow=${workflow.data.id}`;
  });

  await runCase("auth.protected-route-blocks-anonymous", async () => {
    const response = await request("/api/me/hub", { requestId: requestId("anon-me") });
    assert([401, 403].includes(response.status), `/api/me/hub expected 401/403 but got ${response.status}`);
    return `status=${response.status}`;
  });

  await runCase("auth.creator-login-and-session", async () => {
    creatorToken = await login(creatorUsername, creatorPassword);
    const me = await expectOk("/api/auth/me", { token: creatorToken, requestId: requestId("creator-me") });
    const hub = await expectOk("/api/me/hub", { token: creatorToken, requestId: requestId("creator-hub") });
    const notifications = await expectOk("/api/me/notifications/recent", {
      token: creatorToken,
      requestId: requestId("creator-notifications")
    });

    creatorUserId = me.data?.id;
    assert(typeof creatorUserId === "string" && creatorUserId.length > 0, "creator auth/me missing id");
    assert(Array.isArray(hub.data?.draftItems), "creator hub missing draftItems");
    assert(Array.isArray(notifications.data?.items), "recent notifications missing items");
    return `creatorUserId=${creatorUserId}, drafts=${hub.data.draftItems.length}, notifications=${notifications.data.items.length}`;
  });

  await runCase("auth.creator-posts-query", async () => {
    assert(creatorUserId, "creator user id unavailable");
    const posts = await expectOk(`/api/creators/${creatorUserId}/posts`, {
      token: creatorToken,
      requestId: requestId("creator-posts")
    });
    assert(Array.isArray(posts.data?.items) && posts.data.items.length > 0, "creator posts list is empty");
    creatorThread = posts.data.items[0];
    return `threadId=${creatorThread.id}, slug=${creatorThread.slug}`;
  });

  await runCase("auth.temp-user-login", async () => {
    tempToken = await login(tempUsername, tempPassword);
    const me = await expectOk("/api/auth/me", { token: tempToken, requestId: requestId("temp-me") });
    tempUserId = me.data?.id;
    assert(tempUserId, "temp auth/me missing id");
    return `tempUser=${tempUsername}, tempUserId=${tempUserId}`;
  });

  await runCase("drafts.post-create-update-delete", async () => {
    assert(tempToken, "temp token unavailable");
    const created = await expectOk("/api/post-drafts", {
      method: "POST",
      token: tempToken,
      requestId: requestId("post-draft-create")
    });
    const draftId = created.data?.draftId;
    assert(draftId, "post draft create missing draftId");

    const updated = await expectOk(`/api/post-drafts/${draftId}`, {
      method: "PUT",
      token: tempToken,
      requestId: requestId("post-draft-update"),
      body: {
        title: `QA Draft ${nowLabel}`,
        channelSlug: "video-production",
        content: `QA draft content ${nowLabel}`,
        tagNames: ["qa", "smoke"],
        bindingTargetType: null,
        bindingTargetId: null
      }
    });
    assert(updated.data?.title === `QA Draft ${nowLabel}`, "post draft title mismatch after update");

    const deleted = await request(`/api/post-drafts/${draftId}`, {
      method: "DELETE",
      token: tempToken,
      requestId: requestId("post-draft-delete")
    });
    assert(deleted.status === 200, `post draft delete expected 200 but got ${deleted.status}`);

    const missing = await request(`/api/post-drafts/${draftId}`, {
      token: tempToken,
      requestId: requestId("post-draft-check-deleted")
    });
    assert(missing.status === 404, `deleted post draft expected 404 but got ${missing.status}`);
    return `draftId=${draftId}`;
  });

  await runCase("drafts.video-create-update-delete", async () => {
    assert(tempToken, "temp token unavailable");
    const created = await expectOk("/api/video-drafts", {
      method: "POST",
      token: tempToken,
      requestId: requestId("video-draft-create")
    });
    const draftId = created.data?.draftId;
    assert(draftId, "video draft create missing draftId");

    const updated = await expectOk(`/api/video-drafts/${draftId}`, {
      method: "PUT",
      token: tempToken,
      requestId: requestId("video-draft-update"),
      body: {
        title: `QA Video Draft ${nowLabel}`,
        summary: "QA smoke draft",
        categoryCode: "cinematic-short",
        tagNames: ["qa", "video"],
        workflowId: null,
        visibility: "public",
        coverAssetId: null,
        sourceAssetId: null
      }
    });
    assert(updated.data?.title === `QA Video Draft ${nowLabel}`, "video draft title mismatch after update");

    const deleted = await request(`/api/video-drafts/${draftId}`, {
      method: "DELETE",
      token: tempToken,
      requestId: requestId("video-draft-delete")
    });
    assert(deleted.status === 200, `video draft delete expected 200 but got ${deleted.status}`);
    return `draftId=${draftId}`;
  });

  await runCase("drafts.workflow-create-update-delete", async () => {
    assert(tempToken, "temp token unavailable");
    const created = await expectOk("/api/workflow-drafts", {
      method: "POST",
      token: tempToken,
      requestId: requestId("workflow-draft-create")
    });
    const draftId = created.data?.draftId;
    assert(draftId, "workflow draft create missing draftId");

    const updated = await expectOk(`/api/workflow-drafts/${draftId}`, {
      method: "PUT",
      token: tempToken,
      requestId: requestId("workflow-draft-update"),
      body: {
        title: `QA Workflow Draft ${nowLabel}`,
        summary: "QA smoke workflow draft",
        scenarioText: "QA smoke scenario",
        tagNames: ["qa", "workflow"],
        allowCopy: true,
        allowFork: false,
        visibility: "public",
        coverAssetId: null
      }
    });
    assert(updated.data?.title === `QA Workflow Draft ${nowLabel}`, "workflow draft title mismatch after update");

    const deleted = await request(`/api/workflow-drafts/${draftId}`, {
      method: "DELETE",
      token: tempToken,
      requestId: requestId("workflow-draft-delete")
    });
    assert(deleted.status === 200, `workflow draft delete expected 200 but got ${deleted.status}`);
    return `draftId=${draftId}`;
  });

  await runCase("uploads.policy-create", async () => {
    assert(tempToken, "temp token unavailable");
    const videoPolicy = await expectOk("/api/uploads/video-policy", {
      method: "POST",
      token: tempToken,
      requestId: requestId("video-policy"),
      body: {
        fileName: "qa-smoke.mp4",
        mimeType: "video/mp4",
        sizeBytes: 1024,
        assetRole: "source"
      }
    });
    const imagePolicy = await expectOk("/api/uploads/image-policy", {
      method: "POST",
      token: tempToken,
      requestId: requestId("image-policy"),
      body: {
        fileName: "qa-smoke.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        assetRole: "attachment"
      }
    });
    assert(videoPolicy.data?.assetId, "video policy missing assetId");
    assert(imagePolicy.data?.assetId, "image policy missing assetId");
    return `videoAsset=${videoPolicy.data.assetId}, imageAsset=${imagePolicy.data.assetId}`;
  });

  await runCase("interactions.video-like-toggle", async () => {
    assert(tempToken, "temp token unavailable");
    const before = await expectOk(`/api/videos/${smokeVideoId}`, {
      token: tempToken,
      requestId: requestId("video-before-like")
    });
    const beforeLikes = before.data?.stats?.likeCount;

    try {
      await expectOk("/api/interactions/like", {
        method: "POST",
        token: tempToken,
        requestId: requestId("video-like"),
        body: { targetType: "video", targetId: smokeVideoId }
      });
      const afterLike = await expectOk(`/api/videos/${smokeVideoId}`, {
        token: tempToken,
        requestId: requestId("video-after-like")
      });
      assert(afterLike.data?.viewerActions?.liked === true, "video liked state did not flip to true");
      assert(afterLike.data?.stats?.likeCount === beforeLikes + 1, "video likeCount did not increment");
    } finally {
      await request("/api/interactions/like", {
        method: "DELETE",
        token: tempToken,
        requestId: requestId("video-unlike"),
        body: { targetType: "video", targetId: smokeVideoId }
      });
    }

    const afterUnlike = await expectOk(`/api/videos/${smokeVideoId}`, {
      token: tempToken,
      requestId: requestId("video-after-unlike")
    });
    assert(afterUnlike.data?.viewerActions?.liked === false, "video liked state did not restore");
    assert(afterUnlike.data?.stats?.likeCount === beforeLikes, "video likeCount did not restore");
    return `likeCount restored to ${beforeLikes}`;
  });

  await runCase("interactions.video-favorite-toggle", async () => {
    assert(tempToken, "temp token unavailable");
    const before = await expectOk(`/api/videos/${smokeVideoId}`, {
      token: tempToken,
      requestId: requestId("video-before-favorite")
    });
    const beforeFavorites = before.data?.stats?.favoriteCount;

    try {
      await expectOk("/api/interactions/favorite", {
        method: "POST",
        token: tempToken,
        requestId: requestId("video-favorite"),
        body: { targetType: "video", targetId: smokeVideoId }
      });
      const afterFavorite = await expectOk(`/api/videos/${smokeVideoId}`, {
        token: tempToken,
        requestId: requestId("video-after-favorite")
      });
      assert(afterFavorite.data?.viewerActions?.favorited === true, "video favorited state did not flip to true");
      assert(
        afterFavorite.data?.stats?.favoriteCount === beforeFavorites + 1,
        "video favoriteCount did not increment"
      );
    } finally {
      await request("/api/interactions/favorite", {
        method: "DELETE",
        token: tempToken,
        requestId: requestId("video-unfavorite"),
        body: { targetType: "video", targetId: smokeVideoId }
      });
    }

    const afterUnfavorite = await expectOk(`/api/videos/${smokeVideoId}`, {
      token: tempToken,
      requestId: requestId("video-after-unfavorite")
    });
    assert(afterUnfavorite.data?.viewerActions?.favorited === false, "video favorited state did not restore");
    assert(afterUnfavorite.data?.stats?.favoriteCount === beforeFavorites, "video favoriteCount did not restore");
    return `favoriteCount restored to ${beforeFavorites}`;
  });

  await runCase("interactions.follow-toggle", async () => {
    assert(tempToken, "temp token unavailable");
    assert(creatorUserId, "creator user id unavailable");
    const before = await expectOk(`/api/creators/${creatorUserId}`, {
      token: tempToken,
      requestId: requestId("creator-before-follow")
    });
    const beforeFollowers = before.data?.stats?.followerCount;

    try {
      await expectOk("/api/interactions/follow", {
        method: "POST",
        token: tempToken,
        requestId: requestId("follow"),
        body: { followeeId: creatorUserId }
      });
      const afterFollow = await expectOk(`/api/creators/${creatorUserId}`, {
        token: tempToken,
        requestId: requestId("creator-after-follow")
      });
      assert(afterFollow.data?.viewerActions?.followed === true, "followed state did not flip to true");
      assert(afterFollow.data?.stats?.followerCount === beforeFollowers + 1, "followerCount did not increment");
    } finally {
      await request(`/api/interactions/follow/${creatorUserId}`, {
        method: "DELETE",
        token: tempToken,
        requestId: requestId("unfollow")
      });
    }

    const afterUnfollow = await expectOk(`/api/creators/${creatorUserId}`, {
      token: tempToken,
      requestId: requestId("creator-after-unfollow")
    });
    assert(afterUnfollow.data?.viewerActions?.followed === false, "followed state did not restore");
    assert(afterUnfollow.data?.stats?.followerCount === beforeFollowers, "followerCount did not restore");
    return `followerCount restored to ${beforeFollowers}`;
  });

  await runCase("comments.settings-toggle-and-block", async () => {
    assert(creatorToken && tempToken && creatorThread, "creator thread context unavailable");
    const before = await expectOk(`/api/discussions/threads/${creatorThread.slug}`, {
      token: creatorToken,
      requestId: requestId("thread-before-toggle")
    });
    const originalEnabled = before.data?.commentPolicy?.commentingEnabled;

    try {
      await expectOk("/api/comments/target-settings", {
        method: "PUT",
        token: creatorToken,
        requestId: requestId("comments-disable"),
        body: {
          targetType: "post",
          targetId: creatorThread.id,
          commentsEnabled: false
        }
      });

      const blocked = await request("/api/comments", {
        method: "POST",
        token: tempToken,
        requestId: requestId("comment-disabled"),
        body: {
          targetType: "post",
          targetId: creatorThread.id,
          content: `qa disabled check ${nowLabel}`
        }
      });
      assert(blocked.status === 400, `disabled comment expected 400 but got ${blocked.status}`);
      assert(
        blocked.json?.code === "COMMENT_DISABLED",
        `disabled comment expected COMMENT_DISABLED but got ${blocked.text}`
      );
    } finally {
      await request("/api/comments/target-settings", {
        method: "PUT",
        token: creatorToken,
        requestId: requestId("comments-restore"),
        body: {
          targetType: "post",
          targetId: creatorThread.id,
          commentsEnabled: originalEnabled ?? true
        }
      });
    }

    const after = await expectOk(`/api/discussions/threads/${creatorThread.slug}`, {
      token: creatorToken,
      requestId: requestId("thread-after-toggle")
    });
    assert(
      after.data?.commentPolicy?.commentingEnabled === (originalEnabled ?? true),
      "commentingEnabled did not restore"
    );
    return `restored commentingEnabled=${originalEnabled ?? true}`;
  });

  await runCase("comments.hidden-comment-create-and-delete", async () => {
    assert(creatorToken && tempToken && creatorThread, "creator thread context unavailable");
    const hidden = await expectOk("/api/comments", {
      method: "POST",
      token: tempToken,
      requestId: requestId("comment-hidden"),
      body: {
        targetType: "post",
        targetId: creatorThread.id,
        content: `vx 12345678 qa hidden ${nowLabel}`
      }
    });
    const commentId = hidden.data?.id;
    assert(commentId, "hidden comment missing id");
    assert(hidden.data?.statusCode === "hidden", `hidden comment expected statusCode=hidden but got ${hidden.text}`);

    const deleted = await expectOk(`/api/comments/${commentId}`, {
      method: "DELETE",
      token: creatorToken,
      requestId: requestId("comment-hidden-delete")
    });
    assert(deleted.data?.active === false, "hidden comment delete did not return active=false");
    return `hiddenCommentId=${commentId}`;
  });

  await runCase("comments.visible-comment-create-and-delete", async () => {
    assert(creatorToken && tempToken && creatorThread, "creator thread context unavailable");
    const beforeList = await expectOk(`/api/comments?targetType=post&targetId=${creatorThread.id}`, {
      token: creatorToken,
      requestId: requestId("comments-before-visible")
    });
    const beforeCount = countCommentTree(beforeList.data?.items);

    const created = await expectOk("/api/comments", {
      method: "POST",
      token: tempToken,
      requestId: requestId("comment-visible"),
      body: {
        targetType: "post",
        targetId: creatorThread.id,
        content: `qa visible comment ${nowLabel}`
      }
    });
    const commentId = created.data?.id;
    assert(commentId, "visible comment missing id");
    assert(created.data?.statusCode === "active", `visible comment expected active but got ${created.text}`);

    const afterCreateList = await expectOk(`/api/comments?targetType=post&targetId=${creatorThread.id}`, {
      token: creatorToken,
      requestId: requestId("comments-after-visible")
    });
    const afterCreateCount = countCommentTree(afterCreateList.data?.items);
    assert(afterCreateCount === beforeCount + 1, "visible comment count did not increment");

    const deleted = await expectOk(`/api/comments/${commentId}`, {
      method: "DELETE",
      token: creatorToken,
      requestId: requestId("comment-visible-delete")
    });
    assert(deleted.data?.active === false, "visible comment delete did not return active=false");

    const afterDeleteList = await expectOk(`/api/comments?targetType=post&targetId=${creatorThread.id}`, {
      token: creatorToken,
      requestId: requestId("comments-after-delete")
    });
    const afterDeleteCount = countCommentTree(afterDeleteList.data?.items);
    assert(afterDeleteCount === beforeCount, "visible comment count did not restore");
    return `commentCount restored to ${beforeCount}`;
  });

  const passed = results.filter((item) => item.passed).length;
  const failed = results.filter((item) => !item.passed).length;
  const summary = {
    backendBaseUrl,
    creatorUsername,
    tempUsername,
    passed,
    failed,
    results
  };

  const outputText = JSON.stringify(summary, null, 2);
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, outputText, "utf8");
  }

  console.log(outputText);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

await main();
