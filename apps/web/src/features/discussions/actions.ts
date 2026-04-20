"use server";

import {
  appendCommunityRequestId,
  createComment,
  getComments,
  getDiscussionThread,
  isCommunityBackendCommandError,
  isCommunityBackendUnavailableError,
  setFavorite,
  setLike
} from "@/lib/api/community-service";
import type { DiscussionDetailPageView } from "@/lib/contracts/view-models";
import { mapDiscussionDetailPageView } from "@/lib/mappers/community";

type ViewActionSuccess = {
  ok: true;
  view: DiscussionDetailPageView;
  message: string;
};

type ViewActionFailure = {
  ok: false;
  message: string;
};

export type DiscussionDetailActionResult = ViewActionSuccess | ViewActionFailure;
export type DiscussionThreadQuickActionResult = ViewActionFailure | {
  ok: true;
  message: string;
};

function mapCommandErrorMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "COMMENT_CONTENT_INVALID":
      return "Reply content is invalid.";
    case "COMMENT_TARGET_NOT_FOUND":
      return "The post is missing or cannot accept replies.";
    case "INTERACTION_TARGET_NOT_FOUND":
      return "The post or comment does not exist.";
    case "DISCUSSION_THREAD_NOT_FOUND":
      return "The thread does not exist.";
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

async function loadDiscussionView(slug: string): Promise<DiscussionDetailPageView | null> {
  const detail = await getDiscussionThread(slug);
  if (!detail.data) {
    return null;
  }

  const comments = await getComments("post", detail.data.id);
  return mapDiscussionDetailPageView({ ...detail, data: detail.data }, comments);
}

export async function submitDiscussionCommentAction(input: {
  slug: string;
  threadId: string;
  content: string;
}): Promise<DiscussionDetailActionResult> {
  try {
    await createComment({
      targetType: "post",
      targetId: input.threadId,
      content: input.content
    });

    const view = await loadDiscussionView(input.slug);
    if (!view) {
      return {
        ok: false,
        message: "The reply was posted but the thread refresh failed."
      };
    }

    return {
      ok: true,
      view,
      message: "Reply posted."
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
}): Promise<DiscussionDetailActionResult> {
  try {
    await setLike({
      targetType: "comment",
      targetId: input.commentId,
      active: input.active
    });

    const view = await loadDiscussionView(input.slug);
    if (!view) {
      return {
        ok: false,
        message: "The comment like changed but the thread refresh failed."
      };
    }

    return {
      ok: true,
      view,
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
