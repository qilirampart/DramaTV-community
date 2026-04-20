import {
  getComments,
  getCommunityDataMode,
  getConfiguredApiBaseUrl,
  getCreator,
  getVideoDetail,
  getWorkflowDetail
} from "@/lib/api/community-service";
import type {
  ApiComment,
  ApiCreatorProfile,
  ApiVideoDetail,
  ApiWorkflowDetail
} from "@/lib/contracts/community-api";

export const LOCAL_SMOKE_FIXTURES = {
  videoId: "3d82413b-1036-4c1b-93dd-3a102e0b4683",
  workflowId: "dd715ee9-189b-4450-a4ca-fdf71fb8aafb",
  followSmokeAuthorId: "33333333-3333-3333-3333-333333333333",
  videoRootCommentId: "41ec18fd-e074-4138-a287-9e48aa754949",
  workflowRootCommentId: "a69124df-7fdc-4c09-81ea-e439dc931525"
} as const;

export type LocalSmokeCheckView = {
  label: string;
  current: string;
  expected: string;
  ok: boolean;
};

export type LocalSmokeSectionView = {
  key: "video" | "workflow" | "creator";
  title: string;
  description: string;
  href: string;
  checks: LocalSmokeCheckView[];
};

export type LocalSmokeToolsPageView = {
  environment: {
    dataMode: "real";
    apiBaseUrl: string | null;
    toolEnabled: boolean;
    generatedAt: string;
  };
  overallHealthy: boolean;
  resetCommand: string;
  sections: LocalSmokeSectionView[];
};

export function isLocalSmokeToolsEnabled() {
  if (getCommunityDataMode() !== "real") {
    return false;
  }

  const apiBaseUrl = getConfiguredApiBaseUrl();
  if (!apiBaseUrl) {
    return false;
  }

  try {
    const { hostname } = new URL(apiBaseUrl);
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
}

function boolText(value: boolean) {
  return value ? "是" : "否";
}

function countText(value: number) {
  return `${value}`;
}

function makeCheck(label: string, current: string, expected: string, ok: boolean): LocalSmokeCheckView {
  return {
    label,
    current,
    expected,
    ok
  };
}

function buildVideoChecks(detail: ApiVideoDetail, comments: ApiComment[]): LocalSmokeCheckView[] {
  const baselineRoot = comments.find((comment) => comment.id === LOCAL_SMOKE_FIXTURES.videoRootCommentId);

  return [
    makeCheck("总评论数", countText(detail.stats.commentCount), "2", detail.stats.commentCount === 2),
    makeCheck("点赞数", countText(detail.stats.likeCount), "0", detail.stats.likeCount === 0),
    makeCheck("收藏数", countText(detail.stats.favoriteCount), "0", detail.stats.favoriteCount === 0),
    makeCheck("当前用户已点赞", boolText(detail.viewerActions.liked), "否", !detail.viewerActions.liked),
    makeCheck("当前用户已收藏", boolText(detail.viewerActions.favorited), "否", !detail.viewerActions.favorited),
    makeCheck("根评论条数", countText(comments.length), "1", comments.length === 1),
    makeCheck(
      "基线根评论 ID",
      baselineRoot?.id ?? "缺失",
      LOCAL_SMOKE_FIXTURES.videoRootCommentId,
      baselineRoot?.id === LOCAL_SMOKE_FIXTURES.videoRootCommentId
    ),
    makeCheck("根评论回复数", countText(baselineRoot?.replyCount ?? -1), "1", baselineRoot?.replyCount === 1),
    makeCheck("根评论已点赞", boolText(baselineRoot?.viewerActions.liked ?? false), "否", !baselineRoot?.viewerActions.liked)
  ];
}

function buildWorkflowChecks(detail: ApiWorkflowDetail, comments: ApiComment[]): LocalSmokeCheckView[] {
  const baselineRoot = comments.find((comment) => comment.id === LOCAL_SMOKE_FIXTURES.workflowRootCommentId);

  return [
    makeCheck("总评论数", countText(detail.stats.commentCount), "1", detail.stats.commentCount === 1),
    makeCheck("点赞数", countText(detail.stats.likeCount), "0", detail.stats.likeCount === 0),
    makeCheck("收藏数", countText(detail.stats.favoriteCount), "0", detail.stats.favoriteCount === 0),
    makeCheck("当前用户已点赞", boolText(detail.viewerActions.liked), "否", !detail.viewerActions.liked),
    makeCheck("当前用户已收藏", boolText(detail.viewerActions.favorited), "否", !detail.viewerActions.favorited),
    makeCheck("根评论条数", countText(comments.length), "1", comments.length === 1),
    makeCheck(
      "基线评论 ID",
      baselineRoot?.id ?? "缺失",
      LOCAL_SMOKE_FIXTURES.workflowRootCommentId,
      baselineRoot?.id === LOCAL_SMOKE_FIXTURES.workflowRootCommentId
    ),
    makeCheck("评论已点赞", boolText(baselineRoot?.viewerActions.liked ?? false), "否", !baselineRoot?.viewerActions.liked)
  ];
}

function buildCreatorChecks(profile: ApiCreatorProfile): LocalSmokeCheckView[] {
  return [
    makeCheck("粉丝数", countText(profile.stats.followerCount), "0", profile.stats.followerCount === 0),
    makeCheck("当前用户已关注", boolText(profile.viewerActions.followed), "否", !profile.viewerActions.followed)
  ];
}

export async function loadLocalSmokeToolsView(): Promise<LocalSmokeToolsPageView> {
  const [videoDetail, workflowDetail, creatorProfile, videoComments, workflowComments] = await Promise.all([
    getVideoDetail(LOCAL_SMOKE_FIXTURES.videoId),
    getWorkflowDetail(LOCAL_SMOKE_FIXTURES.workflowId),
    getCreator(LOCAL_SMOKE_FIXTURES.followSmokeAuthorId),
    getComments("video", LOCAL_SMOKE_FIXTURES.videoId),
    getComments("workflow", LOCAL_SMOKE_FIXTURES.workflowId)
  ]);

  if (!videoDetail.data) {
    throw new Error(`视频 smoke 基线不存在：${LOCAL_SMOKE_FIXTURES.videoId}`);
  }

  if (!workflowDetail.data) {
    throw new Error(`工作流 smoke 基线不存在：${LOCAL_SMOKE_FIXTURES.workflowId}`);
  }

  if (!creatorProfile.data) {
    throw new Error(`作者 smoke 基线不存在：${LOCAL_SMOKE_FIXTURES.followSmokeAuthorId}`);
  }

  const sections: LocalSmokeSectionView[] = [
    {
      key: "video",
      title: "视频 smoke 基线",
      description: videoDetail.data.title,
      href: `/videos/${LOCAL_SMOKE_FIXTURES.videoId}`,
      checks: buildVideoChecks(videoDetail.data, videoComments.data)
    },
    {
      key: "workflow",
      title: "工作流 smoke 基线",
      description: workflowDetail.data.title,
      href: `/workflows/${LOCAL_SMOKE_FIXTURES.workflowId}`,
      checks: buildWorkflowChecks(workflowDetail.data, workflowComments.data)
    },
    {
      key: "creator",
      title: "关注 smoke 作者",
      description: creatorProfile.data.displayName,
      href: `/creators/${LOCAL_SMOKE_FIXTURES.followSmokeAuthorId}`,
      checks: buildCreatorChecks(creatorProfile.data)
    }
  ];

  return {
    environment: {
      dataMode: getCommunityDataMode(),
      apiBaseUrl: getConfiguredApiBaseUrl(),
      toolEnabled: isLocalSmokeToolsEnabled(),
      generatedAt: new Date().toISOString()
    },
    overallHealthy: sections.every((section) => section.checks.every((check) => check.ok)),
    resetCommand: "powershell -ExecutionPolicy Bypass -File scripts\\reset-local-browser-smoke-state.ps1",
    sections
  };
}
