"use server";

import {
  createComment,
  createReport,
  deleteComment,
  getComments,
  getDiscussionThread,
  setFavorite,
  setLike,
  updateCommentTargetSettings
} from "@/lib/api/community-service";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import type { ApiReportReasonCode } from "@/lib/contracts/community-api";
import type { DiscussionDetailPageView } from "@/lib/contracts/view-models";
import { mapComment, mapDiscussionDetailPageView } from "@/lib/mappers/community";

type ViewActionSuccess = {
  ok: true;
  view: DiscussionDetailPageView;
  message: string;
};

type ViewActionFailure = {
  ok: false;
  message: string;
};

type DiscussionCommentPatch = {
  comments: DiscussionDetailPageView["comments"]["items"];
  replyCount: number;
  nextCursor?: string;
  hasMore: boolean;
  commentPolicy?: DiscussionDetailPageView["commentPolicy"];
};

type CommentActionSuccess = {
  ok: true;
  patch: DiscussionCommentPatch;
  message: string;
};

export type DiscussionDetailActionResult = ViewActionSuccess | ViewActionFailure;
export type DiscussionCommentActionResult = CommentActionSuccess | ViewActionFailure;
export type DiscussionThreadQuickActionResult = ViewActionFailure | {
  ok: true;
  message: string;
};
export type DiscussionReportActionResult = ViewActionFailure | {
  ok: true;
  message: string;
};

function toActionMessage(error: unknown, fallback: string) {
  return formatCommunityActionError(error, fallback);
}

function replyPostedMessage(statusCode?: string) {
  return statusCode === "hidden"
    ? "回复已提交，但触发了安全检查，暂时不会公开展示。"
    : "回复已发布。";
}

async function loadDiscussionView(slug: string): Promise<DiscussionDetailPageView | null> {
  const detail = await getDiscussionThread(slug);
  if (!detail.data) {
    return null;
  }

  const comments = await getComments("post", detail.data.id);
  return mapDiscussionDetailPageView({ ...detail, data: detail.data }, comments);
}

async function loadDiscussionCommentPatch(slug: string): Promise<DiscussionCommentPatch | null> {
  const detail = await getDiscussionThread(slug);
  if (!detail.data) {
    return null;
  }

  const comments = await getComments("post", detail.data.id);
  return {
    comments: comments.data.items.map(mapComment),
    replyCount: detail.data.stats.replyCount,
    nextCursor: comments.data.nextCursor ?? undefined,
    hasMore: comments.data.hasMore,
    commentPolicy: detail.data.commentPolicy
  };
}

export async function loadMoreDiscussionCommentsAction(input: {
  threadId: string;
  cursor: string;
}): Promise<DiscussionCommentActionResult> {
  try {
    const comments = await getComments("post", input.threadId, input.cursor);
    return {
      ok: true,
      patch: {
        comments: comments.data.items.map(mapComment),
        replyCount: comments.data.items.length,
        nextCursor: comments.data.nextCursor ?? undefined,
        hasMore: comments.data.hasMore
      },
      message: "More replies loaded."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Loading more replies failed.")
    };
  }
}

export async function submitDiscussionReportAction(input: {
  targetId: string;
  reasonCode: ApiReportReasonCode;
  descriptionText?: string;
}): Promise<DiscussionReportActionResult> {
  try {
    await createReport({
      targetType: "post",
      targetId: input.targetId,
      reasonCode: input.reasonCode,
      descriptionText: input.descriptionText
    });
    return {
      ok: true,
      message: "举报已提交。"
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Submitting the report failed.")
    };
  }
}

export async function submitDiscussionCommentAction(input: {
  slug: string;
  threadId: string;
  content: string;
  parentId?: string;
}): Promise<DiscussionCommentActionResult> {
  try {
    const comment = await createComment({
      targetType: "post",
      targetId: input.threadId,
      content: input.content,
      parentId: input.parentId
    });

    const patch = await loadDiscussionCommentPatch(input.slug);
    if (!patch) {
      return {
        ok: false,
        message: "The reply was posted but the thread refresh failed."
      };
    }

    return {
      ok: true,
      patch,
      message: replyPostedMessage(comment.data.statusCode)
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Posting the reply failed.")
    };
  }
}

export async function toggleDiscussionCommentLikeAction(input: {
  slug: string;
  commentId: string;
  active: boolean;
}): Promise<DiscussionCommentActionResult> {
  try {
    await setLike({
      targetType: "comment",
      targetId: input.commentId,
      active: input.active
    });

    const patch = await loadDiscussionCommentPatch(input.slug);
    if (!patch) {
      return {
        ok: false,
        message: "The comment like changed but the thread refresh failed."
      };
    }

    return {
      ok: true,
      patch,
      message: input.active ? "Comment liked." : "Comment like removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating comment like failed.")
    };
  }
}

export async function toggleDiscussionLikeAction(input: {
  slug: string;
  threadId: string;
  active: boolean;
}): Promise<DiscussionDetailActionResult> {
  try {
    await setLike({
      targetType: "post",
      targetId: input.threadId,
      active: input.active
    });

    const view = await loadDiscussionView(input.slug);
    if (!view) {
      return {
        ok: false,
        message: "The post like changed but the thread refresh failed."
      };
    }

    return {
      ok: true,
      view,
      message: input.active ? "Post liked." : "Post like removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating post like failed.")
    };
  }
}

export async function toggleDiscussionFavoriteAction(input: {
  slug: string;
  threadId: string;
  active: boolean;
}): Promise<DiscussionDetailActionResult> {
  try {
    await setFavorite({
      targetType: "post",
      targetId: input.threadId,
      active: input.active
    });

    const view = await loadDiscussionView(input.slug);
    if (!view) {
      return {
        ok: false,
        message: "The post favorite changed but the thread refresh failed."
      };
    }

    return {
      ok: true,
      view,
      message: input.active ? "Post favorited." : "Post favorite removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating post favorite failed.")
    };
  }
}

export async function toggleDiscussionThreadFavoriteQuickAction(input: {
  threadId: string;
  active: boolean;
}): Promise<DiscussionThreadQuickActionResult> {
  try {
    await setFavorite({
      targetType: "post",
      targetId: input.threadId,
      active: input.active
    });

    return {
      ok: true,
      message: input.active ? "Post favorited." : "Post favorite removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating post favorite failed.")
    };
  }
}

export async function toggleDiscussionThreadLikeQuickAction(input: {
  threadId: string;
  active: boolean;
}): Promise<DiscussionThreadQuickActionResult> {
  try {
    await setLike({
      targetType: "post",
      targetId: input.threadId,
      active: input.active
    });

    return {
      ok: true,
      message: input.active ? "Post liked." : "Post like removed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating post like failed.")
    };
  }
}

export async function deleteDiscussionCommentAction(input: {
  slug: string;
  commentId: string;
}): Promise<DiscussionCommentActionResult> {
  try {
    await deleteComment(input.commentId);

    const patch = await loadDiscussionCommentPatch(input.slug);
    if (!patch) {
      return {
        ok: false,
        message: "The reply was deleted but the thread refresh failed."
      };
    }

    return {
      ok: true,
      patch,
      message: "Reply deleted."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Deleting the reply failed.")
    };
  }
}

export async function updateDiscussionCommentSettingsAction(input: {
  slug: string;
  threadId: string;
  commentsEnabled: boolean;
}): Promise<DiscussionCommentActionResult> {
  try {
    const policy = await updateCommentTargetSettings({
      targetType: "post",
      targetId: input.threadId,
      commentsEnabled: input.commentsEnabled
    });

    const patch = await loadDiscussionCommentPatch(input.slug);
    if (!patch) {
      return {
        ok: false,
        message: "Comment settings updated but the thread refresh failed."
      };
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
      message: input.commentsEnabled ? "Replies enabled." : "Replies closed."
    };
  } catch (error) {
    return {
      ok: false,
      message: toActionMessage(error, "Updating reply settings failed.")
    };
  }
}
