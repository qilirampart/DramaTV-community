"use server";

import {
  createComment,
  createReport,
  deleteComment,
  copyWorkflowToCanvas,
  getComments,
  getCreator,
  getCreatorWorks,
  getCreatorPosts,
  getCreatorWorkflows,
  getPromptDetail,
  getRelatedVideos,
  getRelatedPrompts,
  getVideoDetail,
  getWorkflowDetail,
  getWorkflowRelatedVideos,
  setFavorite,
  setFollow,
  setLike,
  updateCommentTargetSettings
} from "@/lib/api/community-service";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import type { CreatorPageView, VideoDetailPageView, WorkflowDetailPageView } from "@/lib/contracts/view-models";
import type { ApiReportReasonCode, ApiReportTargetType } from "@/lib/contracts/community-api";
import {
  mapCreatorPageView,
  mapComment,
  mapDiscussionThreadCards,
  mapPromptDetailPageView,
  mapCreatorWorkMiniCard,
  mapVideoDetailPageView,
  mapWorkflowDetailPageView
} from "@/lib/mappers/community";
import { mapWorkflowMiniCard } from "@/lib/mappers/community";

type CommentUpdatePayload = {
  comments: VideoDetailPageView["comments"]["items"] | WorkflowDetailPageView["comments"]["items"];
  commentCount: number;
  nextCursor?: string;
  hasMore: boolean;
  commentPolicy?: VideoDetailPageView["commentPolicy"] | WorkflowDetailPageView["commentPolicy"];
};

type ViewActionSuccess<TView> = {
  ok: true;
  view: TView;
  message: string;
};

type ViewActionFailure = {
  ok: false;
  message: string;
};

export type ViewActionResult<TView> = ViewActionSuccess<TView> | ViewActionFailure;
export type CommentActionResult = {
  ok: true;
  patch: CommentUpdatePayload;
  message: string;
} | ViewActionFailure;

export type WorkflowCopyActionResult =
  | {
      ok: true;
      openUrl: string;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

export type ReportActionResult =
  | {
      ok: true;
      message: string;
    }
  | ViewActionFailure;

export type CreatorLoadMoreResult =
  | {
      ok: true;
      patch:
        | {
            kind: "works";
            works: CreatorPageView["works"];
            nextWorksCursor?: string;
          }
        | {
            kind: "workflows";
            workflows: CreatorPageView["workflows"];
            nextWorkflowCursor?: string;
          }
        | {
            kind: "posts";
            posts: CreatorPageView["posts"];
            nextPostCursor?: string;
          };
      message: string;
    }
  | ViewActionFailure;

function toActionMessage(error: unknown, fallback: string) {
  return formatCommunityActionError(error, fallback);
}

async function loadVideoView(id: string): Promise<VideoDetailPageView | null> {
  const [detail, related, comments] = await Promise.all([
    getVideoDetail(id),
    getRelatedVideos(id),
    getComments("video", id)
  ]);

  if (!detail.data) {
    return null;
  }

  return mapVideoDetailPageView({ ...detail, data: detail.data }, related, comments);
}

async function loadPromptView(id: string): Promise<VideoDetailPageView | null> {
  const [detail, related, comments] = await Promise.all([
    getPromptDetail(id),
    getRelatedPrompts(id),
    getComments("prompt", id)
  ]);

  if (!detail.data) {
    return null;
  }

  return mapPromptDetailPageView({ ...detail, data: detail.data }, related, comments);
}

async function loadWorkflowView(id: string): Promise<WorkflowDetailPageView | null> {
  const [detail, related, comments] = await Promise.all([
    getWorkflowDetail(id),
    getWorkflowRelatedVideos(id),
    getComments("workflow", id)
  ]);

  if (!detail.data) {
    return null;
  }

  return mapWorkflowDetailPageView({ ...detail, data: detail.data }, related, comments);
}

async function loadVideoCommentPatch(id: string): Promise<CommentUpdatePayload | null> {
  const [detail, comments] = await Promise.all([
    getVideoDetail(id),
    getComments("video", id)
  ]);

  if (!detail.data) {
    return null;
  }

  return {
    comments: comments.data.items.map(mapComment),
    commentCount: detail.data.stats.commentCount,
    nextCursor: comments.data.nextCursor ?? undefined,
    hasMore: comments.data.hasMore,
    commentPolicy: detail.data.commentPolicy
  };
}

async function loadPromptCommentPatch(id: string): Promise<CommentUpdatePayload | null> {
  const [detail, comments] = await Promise.all([
    getPromptDetail(id),
    getComments("prompt", id)
  ]);

  if (!detail.data) {
    return null;
  }

  return {
    comments: comments.data.items.map(mapComment),
    commentCount: detail.data.stats.commentCount,
    nextCursor: comments.data.nextCursor ?? undefined,
    hasMore: comments.data.hasMore,
    commentPolicy: detail.data.commentPolicy
  };
}

async function loadWorkflowCommentPatch(id: string): Promise<CommentUpdatePayload | null> {
  const [detail, comments] = await Promise.all([
    getWorkflowDetail(id),
    getComments("workflow", id)
  ]);

  if (!detail.data) {
    return null;
  }

  return {
    comments: comments.data.items.map(mapComment),
    commentCount: detail.data.stats.commentCount,
    nextCursor: comments.data.nextCursor ?? undefined,
    hasMore: comments.data.hasMore,
    commentPolicy: detail.data.commentPolicy
  };
}

export async function loadMoreVideoCommentsAction(input: {
  videoId: string;
  cursor: string;
}): Promise<CommentActionResult> {
  try {
    const comments = await getComments("video", input.videoId, input.cursor);
    return {
      ok: true,
      patch: {
        comments: comments.data.items.map(mapComment),
        commentCount: comments.data.items.length,
        nextCursor: comments.data.nextCursor ?? undefined,
        hasMore: comments.data.hasMore
      },
      message: "More comments loaded."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Loading more comments failed.")
    };
  }
}

export async function loadMorePromptCommentsAction(input: {
  promptId: string;
  cursor: string;
}): Promise<CommentActionResult> {
  try {
    const comments = await getComments("prompt", input.promptId, input.cursor);
    return {
      ok: true,
      patch: {
        comments: comments.data.items.map(mapComment),
        commentCount: comments.data.items.length,
        nextCursor: comments.data.nextCursor ?? undefined,
        hasMore: comments.data.hasMore
      },
      message: "More comments loaded."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Loading more comments failed.")
    };
  }
}

export async function loadMoreWorkflowCommentsAction(input: {
  workflowId: string;
  cursor: string;
}): Promise<CommentActionResult> {
  try {
    const comments = await getComments("workflow", input.workflowId, input.cursor);
    return {
      ok: true,
      patch: {
        comments: comments.data.items.map(mapComment),
        commentCount: comments.data.items.length,
        nextCursor: comments.data.nextCursor ?? undefined,
        hasMore: comments.data.hasMore
      },
      message: "More comments loaded."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Loading more comments failed.")
    };
  }
}

export async function submitReportAction(input: {
  targetType: ApiReportTargetType;
  targetId: string;
  reasonCode: ApiReportReasonCode;
  descriptionText?: string;
}): Promise<ReportActionResult> {
  try {
    const result = await createReport(input);
    return {
      ok: true,
      message: result.data.statusCode === "pending" ? "举报已提交。" : "举报已提交。"
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Submitting the report failed.")
    };
  }
}

async function loadCreatorView(id: string): Promise<CreatorPageView | null> {
  const [profile, works, workflows, posts] = await Promise.all([
    getCreator(id),
    getCreatorWorks(id),
    getCreatorWorkflows(id),
    getCreatorPosts(id)
  ]);

  if (!profile.data) {
    return null;
  }

  return mapCreatorPageView({ ...profile, data: profile.data }, works, workflows, posts);
}

function missingViewResult(message: string): ViewActionFailure {
  return {
    ok: false,
    message
  };
}

function commentPostedMessage(statusCode?: string) {
  return statusCode === "hidden"
    ? "评论已提交，但触发了安全检查，暂时不会公开展示。"
    : "评论已发布。";
}

export async function submitVideoCommentAction(input: {
  videoId: string;
  content: string;
  parentId?: string;
}): Promise<CommentActionResult> {
  try {
    const comment = await createComment({
      targetType: "video",
      targetId: input.videoId,
      content: input.content,
      parentId: input.parentId
    });

    const patch = await loadVideoCommentPatch(input.videoId);
    if (!patch) {
      return missingViewResult("The video detail could not be refreshed after commenting.");
    }

    return {
      ok: true,
      patch,
      message: commentPostedMessage(comment.data.statusCode)
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Posting the comment failed.")
    };
  }
}

export async function toggleVideoLikeAction(input: {
  videoId: string;
  active: boolean;
}): Promise<ViewActionResult<VideoDetailPageView>> {
  try {
    await setLike({
      targetType: "video",
      targetId: input.videoId,
      active: input.active
    });

    const view = await loadVideoView(input.videoId);
    if (!view) {
      return missingViewResult("The video detail could not be refreshed after updating like status.");
    }

    return {
      ok: true,
      view,
      message: input.active ? "Video liked." : "Video like removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating video like status failed.")
    };
  }
}

export async function toggleVideoFavoriteAction(input: {
  videoId: string;
  active: boolean;
}): Promise<ViewActionResult<VideoDetailPageView>> {
  try {
    await setFavorite({
      targetType: "video",
      targetId: input.videoId,
      active: input.active
    });

    const view = await loadVideoView(input.videoId);
    if (!view) {
      return missingViewResult("The video detail could not be refreshed after updating favorite status.");
    }

    return {
      ok: true,
      view,
      message: input.active ? "Video favorited." : "Video favorite removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating video favorite status failed.")
    };
  }
}

export async function toggleVideoAuthorFollowAction(input: {
  videoId: string;
  authorId: string;
  active: boolean;
}): Promise<ViewActionResult<VideoDetailPageView>> {
  try {
    await setFollow({
      followeeId: input.authorId,
      active: input.active
    });

    const view = await loadVideoView(input.videoId);
    if (!view) {
      return missingViewResult("The video detail could not be refreshed after updating follow status.");
    }

    return {
      ok: true,
      view,
      message: input.active ? "Creator followed." : "Creator unfollowed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating follow status failed.")
    };
  }
}

export async function toggleVideoCommentLikeAction(input: {
  videoId: string;
  commentId: string;
  active: boolean;
}): Promise<CommentActionResult> {
  try {
    await setLike({
      targetType: "comment",
      targetId: input.commentId,
      active: input.active
    });

    const patch = await loadVideoCommentPatch(input.videoId);
    if (!patch) {
      return missingViewResult("The video detail could not be refreshed after updating comment like status.");
    }

    return {
      ok: true,
      patch,
      message: input.active ? "Comment liked." : "Comment like removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating comment like status failed.")
    };
  }
}

export async function submitPromptCommentAction(input: {
  promptId: string;
  content: string;
  parentId?: string;
}): Promise<CommentActionResult> {
  try {
    const comment = await createComment({
      targetType: "prompt",
      targetId: input.promptId,
      content: input.content,
      parentId: input.parentId
    });

    const patch = await loadPromptCommentPatch(input.promptId);
    if (!patch) {
      return missingViewResult("The prompt detail could not be refreshed after commenting.");
    }

    return {
      ok: true,
      patch,
      message: commentPostedMessage(comment.data.statusCode)
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Posting the prompt comment failed.")
    };
  }
}

export async function togglePromptLikeAction(input: {
  promptId: string;
  active: boolean;
}): Promise<ViewActionResult<VideoDetailPageView>> {
  try {
    await setLike({
      targetType: "prompt",
      targetId: input.promptId,
      active: input.active
    });

    const view = await loadPromptView(input.promptId);
    if (!view) {
      return missingViewResult("The prompt detail could not be refreshed after updating like status.");
    }

    return {
      ok: true,
      view,
      message: input.active ? "Prompt liked." : "Prompt like removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating prompt like status failed.")
    };
  }
}

export async function togglePromptFavoriteAction(input: {
  promptId: string;
  active: boolean;
}): Promise<ViewActionResult<VideoDetailPageView>> {
  try {
    await setFavorite({
      targetType: "prompt",
      targetId: input.promptId,
      active: input.active
    });

    const view = await loadPromptView(input.promptId);
    if (!view) {
      return missingViewResult("The prompt detail could not be refreshed after updating favorite status.");
    }

    return {
      ok: true,
      view,
      message: input.active ? "Prompt favorited." : "Prompt favorite removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating prompt favorite status failed.")
    };
  }
}

export async function togglePromptAuthorFollowAction(input: {
  promptId: string;
  authorId: string;
  active: boolean;
}): Promise<ViewActionResult<VideoDetailPageView>> {
  try {
    await setFollow({
      followeeId: input.authorId,
      active: input.active
    });

    const view = await loadPromptView(input.promptId);
    if (!view) {
      return missingViewResult("The prompt detail could not be refreshed after updating follow status.");
    }

    return {
      ok: true,
      view,
      message: input.active ? "Creator followed." : "Creator unfollowed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating prompt author follow status failed.")
    };
  }
}

export async function togglePromptCommentLikeAction(input: {
  promptId: string;
  commentId: string;
  active: boolean;
}): Promise<CommentActionResult> {
  try {
    await setLike({
      targetType: "comment",
      targetId: input.commentId,
      active: input.active
    });

    const patch = await loadPromptCommentPatch(input.promptId);
    if (!patch) {
      return missingViewResult("The prompt detail could not be refreshed after updating comment like status.");
    }

    return {
      ok: true,
      patch,
      message: input.active ? "Comment liked." : "Comment like removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating prompt comment like status failed.")
    };
  }
}

export async function submitWorkflowCommentAction(input: {
  workflowId: string;
  content: string;
  parentId?: string;
}): Promise<CommentActionResult> {
  try {
    const comment = await createComment({
      targetType: "workflow",
      targetId: input.workflowId,
      content: input.content,
      parentId: input.parentId
    });

    const patch = await loadWorkflowCommentPatch(input.workflowId);
    if (!patch) {
      return missingViewResult("The workflow detail could not be refreshed after commenting.");
    }

    return {
      ok: true,
      patch,
      message: commentPostedMessage(comment.data.statusCode)
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Posting the comment failed.")
    };
  }
}

export async function toggleWorkflowLikeAction(input: {
  workflowId: string;
  active: boolean;
}): Promise<ViewActionResult<WorkflowDetailPageView>> {
  try {
    await setLike({
      targetType: "workflow",
      targetId: input.workflowId,
      active: input.active
    });

    const view = await loadWorkflowView(input.workflowId);
    if (!view) {
      return missingViewResult("The workflow detail could not be refreshed after updating like status.");
    }

    return {
      ok: true,
      view,
      message: input.active ? "Workflow liked." : "Workflow like removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating workflow like status failed.")
    };
  }
}

export async function toggleWorkflowFavoriteAction(input: {
  workflowId: string;
  active: boolean;
}): Promise<ViewActionResult<WorkflowDetailPageView>> {
  try {
    await setFavorite({
      targetType: "workflow",
      targetId: input.workflowId,
      active: input.active
    });

    const view = await loadWorkflowView(input.workflowId);
    if (!view) {
      return missingViewResult("The workflow detail could not be refreshed after updating favorite status.");
    }

    return {
      ok: true,
      view,
      message: input.active ? "Workflow favorited." : "Workflow favorite removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating workflow favorite status failed.")
    };
  }
}

export async function toggleWorkflowCommentLikeAction(input: {
  workflowId: string;
  commentId: string;
  active: boolean;
}): Promise<CommentActionResult> {
  try {
    await setLike({
      targetType: "comment",
      targetId: input.commentId,
      active: input.active
    });

    const patch = await loadWorkflowCommentPatch(input.workflowId);
    if (!patch) {
      return missingViewResult("The workflow detail could not be refreshed after updating comment like status.");
    }

    return {
      ok: true,
      patch,
      message: input.active ? "Comment liked." : "Comment like removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating comment like status failed.")
    };
  }
}

export async function deleteVideoCommentAction(input: {
  videoId: string;
  commentId: string;
}): Promise<CommentActionResult> {
  try {
    await deleteComment(input.commentId);

    const patch = await loadVideoCommentPatch(input.videoId);
    if (!patch) {
      return missingViewResult("The video detail could not be refreshed after deleting the comment.");
    }

    return {
      ok: true,
      patch,
      message: "Comment deleted."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Deleting the comment failed.")
    };
  }
}

export async function deletePromptCommentAction(input: {
  promptId: string;
  commentId: string;
}): Promise<CommentActionResult> {
  try {
    await deleteComment(input.commentId);

    const patch = await loadPromptCommentPatch(input.promptId);
    if (!patch) {
      return missingViewResult("The prompt detail could not be refreshed after deleting the comment.");
    }

    return {
      ok: true,
      patch,
      message: "Comment deleted."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Deleting the comment failed.")
    };
  }
}

export async function deleteWorkflowCommentAction(input: {
  workflowId: string;
  commentId: string;
}): Promise<CommentActionResult> {
  try {
    await deleteComment(input.commentId);

    const patch = await loadWorkflowCommentPatch(input.workflowId);
    if (!patch) {
      return missingViewResult("The workflow detail could not be refreshed after deleting the comment.");
    }

    return {
      ok: true,
      patch,
      message: "Comment deleted."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Deleting the comment failed.")
    };
  }
}

export async function updateVideoCommentSettingsAction(input: {
  videoId: string;
  commentsEnabled: boolean;
}): Promise<CommentActionResult> {
  try {
    const policy = await updateCommentTargetSettings({
      targetType: "video",
      targetId: input.videoId,
      commentsEnabled: input.commentsEnabled
    });

    const patch = await loadVideoCommentPatch(input.videoId);
    if (!patch) {
      return missingViewResult("The video detail could not be refreshed after updating comment settings.");
    }

    return {
      ok: true,
      patch: {
        ...patch,
        commentPolicy: {
          commentingEnabled: policy.data.commentsEnabled,
          canManageComments: policy.data.canManageComments
        }
      },
      message: input.commentsEnabled ? "Comments enabled." : "Comments closed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating comment settings failed.")
    };
  }
}

export async function updatePromptCommentSettingsAction(input: {
  promptId: string;
  commentsEnabled: boolean;
}): Promise<CommentActionResult> {
  try {
    const policy = await updateCommentTargetSettings({
      targetType: "prompt",
      targetId: input.promptId,
      commentsEnabled: input.commentsEnabled
    });

    const patch = await loadPromptCommentPatch(input.promptId);
    if (!patch) {
      return missingViewResult("The prompt detail could not be refreshed after updating comment settings.");
    }

    return {
      ok: true,
      patch: {
        ...patch,
        commentPolicy: {
          commentingEnabled: policy.data.commentsEnabled,
          canManageComments: policy.data.canManageComments
        }
      },
      message: input.commentsEnabled ? "Comments enabled." : "Comments closed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating comment settings failed.")
    };
  }
}

export async function updateWorkflowCommentSettingsAction(input: {
  workflowId: string;
  commentsEnabled: boolean;
}): Promise<CommentActionResult> {
  try {
    const policy = await updateCommentTargetSettings({
      targetType: "workflow",
      targetId: input.workflowId,
      commentsEnabled: input.commentsEnabled
    });

    const patch = await loadWorkflowCommentPatch(input.workflowId);
    if (!patch) {
      return missingViewResult("The workflow detail could not be refreshed after updating comment settings.");
    }

    return {
      ok: true,
      patch: {
        ...patch,
        commentPolicy: {
          commentingEnabled: policy.data.commentsEnabled,
          canManageComments: policy.data.canManageComments
        }
      },
      message: input.commentsEnabled ? "Comments enabled." : "Comments closed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating comment settings failed.")
    };
  }
}

export async function toggleCreatorFollowAction(input: {
  creatorId: string;
  active: boolean;
}): Promise<ViewActionResult<CreatorPageView>> {
  try {
    await setFollow({
      followeeId: input.creatorId,
      active: input.active
    });

    const view = await loadCreatorView(input.creatorId);
    if (!view) {
      return missingViewResult("The creator page could not be refreshed after updating follow status.");
    }

    return {
      ok: true,
      view,
      message: input.active ? "Creator followed." : "Creator unfollowed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating creator follow status failed.")
    };
  }
}

export async function loadMoreCreatorWorksAction(input: {
  creatorId: string;
  cursor: string;
}): Promise<CreatorLoadMoreResult> {
  try {
    const works = await getCreatorWorks(input.creatorId, input.cursor);

    return {
      ok: true,
      patch: {
        kind: "works",
        works: works.data.items.map(mapCreatorWorkMiniCard),
        nextWorksCursor: works.data.nextCursor ?? undefined
      },
      message: "More works loaded."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Loading more works failed.")
    };
  }
}

export async function loadMoreCreatorWorkflowsAction(input: {
  creatorId: string;
  cursor: string;
}): Promise<CreatorLoadMoreResult> {
  try {
    const workflows = await getCreatorWorkflows(input.creatorId, input.cursor);
    return {
      ok: true,
      patch: {
        kind: "workflows",
        workflows: workflows.data.items.map(mapWorkflowMiniCard),
        nextWorkflowCursor: workflows.data.nextCursor ?? undefined
      },
      message: "More workflows loaded."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Loading more workflows failed.")
    };
  }
}

export async function loadMoreCreatorPostsAction(input: {
  creatorId: string;
  cursor: string;
}): Promise<CreatorLoadMoreResult> {
  try {
    const posts = await getCreatorPosts(input.creatorId, input.cursor);
    return {
      ok: true,
      patch: {
        kind: "posts",
        posts: mapDiscussionThreadCards(posts.data.items),
        nextPostCursor: posts.data.nextCursor ?? undefined
      },
      message: "More posts loaded."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Loading more posts failed.")
    };
  }
}

export async function copyWorkflowToCanvasAction(input: {
  workflowId: string;
}): Promise<WorkflowCopyActionResult> {
  try {
    const response = await copyWorkflowToCanvas(input.workflowId);
    return {
      ok: true,
      openUrl: response.data.openUrl,
      message: "Workflow copy task created."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Copying the workflow to canvas failed.")
    };
  }
}
