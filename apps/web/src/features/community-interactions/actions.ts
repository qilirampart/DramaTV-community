"use server";

import {
  appendCommunityRequestId,
  createComment,
  copyWorkflowToCanvas,
  getComments,
  getCreator,
  getCreatorVideos,
  getCreatorWorkflows,
  getPromptDetail,
  getRelatedVideos,
  getRelatedPrompts,
  getVideoDetail,
  getWorkflowDetail,
  getWorkflowRelatedVideos,
  isCommunityBackendCommandError,
  isCommunityBackendUnavailableError,
  setFavorite,
  setFollow,
  setLike
} from "@/lib/api/community-service";
import type { CreatorPageView, VideoDetailPageView, WorkflowDetailPageView } from "@/lib/contracts/view-models";
import {
  mapCreatorPageView,
  mapPromptDetailPageView,
  mapVideoDetailPageView,
  mapWorkflowDetailPageView
} from "@/lib/mappers/community";

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

function mapCommandErrorMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "FOLLOW_SELF_FORBIDDEN":
      return "You cannot follow yourself.";
    case "FOLLOW_TARGET_NOT_FOUND":
      return "The creator to follow does not exist.";
    case "COMMENT_CONTENT_INVALID":
      return "Comment content is invalid.";
    case "COMMENT_TARGET_NOT_FOUND":
      return "The comment target does not exist.";
    case "INTERACTION_TARGET_NOT_FOUND":
      return "The interaction target does not exist.";
    case "WORKFLOW_NOT_FOUND":
      return "The workflow does not exist.";
    case "WORKFLOW_ID_INVALID":
      return "The workflow id is invalid.";
    case "CANVAS_COPY_MODE_INVALID":
      return "The canvas copy mode is invalid.";
    case "CANVAS_COPY_FORBIDDEN":
      return "This workflow cannot be copied to canvas.";
    default:
      return fallback;
  }
}

function toActionMessage(error: unknown, fallback: string) {
  if (isCommunityBackendCommandError(error)) {
    return appendCommunityRequestId(mapCommandErrorMessage(error.code, fallback), error);
  }

  if (isCommunityBackendUnavailableError(error)) {
    return appendCommunityRequestId("The backend is currently unavailable.", error);
  }

  return appendCommunityRequestId(fallback, error);
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

async function loadCreatorView(id: string): Promise<CreatorPageView | null> {
  const [profile, videos, workflows] = await Promise.all([
    getCreator(id),
    getCreatorVideos(id),
    getCreatorWorkflows(id)
  ]);

  if (!profile.data) {
    return null;
  }

  return mapCreatorPageView({ ...profile, data: profile.data }, videos, workflows);
}

function missingViewResult(message: string): ViewActionFailure {
  return {
    ok: false,
    message
  };
}

export async function submitVideoCommentAction(input: {
  videoId: string;
  content: string;
}): Promise<ViewActionResult<VideoDetailPageView>> {
  try {
    await createComment({
      targetType: "video",
      targetId: input.videoId,
      content: input.content
    });

    const view = await loadVideoView(input.videoId);
    if (!view) {
      return missingViewResult("The video detail could not be refreshed after commenting.");
    }

    return {
      ok: true,
      view,
      message: "Comment posted."
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
}): Promise<ViewActionResult<VideoDetailPageView>> {
  try {
    await setLike({
      targetType: "comment",
      targetId: input.commentId,
      active: input.active
    });

    const view = await loadVideoView(input.videoId);
    if (!view) {
      return missingViewResult("The video detail could not be refreshed after updating comment like status.");
    }

    return {
      ok: true,
      view,
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
}): Promise<ViewActionResult<VideoDetailPageView>> {
  try {
    await createComment({
      targetType: "prompt",
      targetId: input.promptId,
      content: input.content
    });

    const view = await loadPromptView(input.promptId);
    if (!view) {
      return missingViewResult("The prompt detail could not be refreshed after commenting.");
    }

    return {
      ok: true,
      view,
      message: "Comment posted."
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
}): Promise<ViewActionResult<VideoDetailPageView>> {
  try {
    await setLike({
      targetType: "comment",
      targetId: input.commentId,
      active: input.active
    });

    const view = await loadPromptView(input.promptId);
    if (!view) {
      return missingViewResult("The prompt detail could not be refreshed after updating comment like status.");
    }

    return {
      ok: true,
      view,
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
}): Promise<ViewActionResult<WorkflowDetailPageView>> {
  try {
    await createComment({
      targetType: "workflow",
      targetId: input.workflowId,
      content: input.content
    });

    const view = await loadWorkflowView(input.workflowId);
    if (!view) {
      return missingViewResult("The workflow detail could not be refreshed after commenting.");
    }

    return {
      ok: true,
      view,
      message: "Comment posted."
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
}): Promise<ViewActionResult<WorkflowDetailPageView>> {
  try {
    await setLike({
      targetType: "comment",
      targetId: input.commentId,
      active: input.active
    });

    const view = await loadWorkflowView(input.workflowId);
    if (!view) {
      return missingViewResult("The workflow detail could not be refreshed after updating comment like status.");
    }

    return {
      ok: true,
      view,
      message: input.active ? "Comment liked." : "Comment like removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating comment like status failed.")
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
