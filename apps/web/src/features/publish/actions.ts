"use server";

import { revalidatePath } from "next/cache";
import {
  getMediaTask,
  retryMediaTask,
  submitPostDraft,
  submitVideoDraft,
  submitWorkflowDraft,
  updatePostDraft,
  updateVideoDraft,
  updateWorkflowDraft
} from "@/lib/api/community-service";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import type {
  ApiDraftSubmitResult,
  ApiPostDraftUpdateInput,
  ApiVideoDraftUpdateInput,
  ApiWorkflowDraftUpdateInput
} from "@/lib/contracts/community-api";
import type { PostDraftView, VideoDraftView, WorkflowDraftView } from "@/lib/contracts/view-models";

type PublishActionFailure = {
  ok: false;
  message: string;
};

type MediaTaskActionFailure = PublishActionFailure;

type MediaTaskActionSuccess = {
  ok: true;
  message: string;
  task: Awaited<ReturnType<typeof getMediaTask>>["data"];
};

type PublishActionSuccess<TDraft> = {
  ok: true;
  message: string;
  draft: TDraft;
  submitResult?: ApiDraftSubmitResult;
  href?: string;
};

export type PublishDraftActionResult<TDraft> =
  | PublishActionFailure
  | PublishActionSuccess<TDraft>;

export type MediaTaskActionResult = MediaTaskActionFailure | MediaTaskActionSuccess;

function fail(message: string, error: unknown): PublishActionFailure {
  return {
    ok: false,
    message: formatCommunityActionError(error, message)
  };
}

export async function getMediaTaskAction(taskId: string): Promise<MediaTaskActionResult> {
  try {
    const response = await getMediaTask(taskId);
    return {
      ok: true,
      task: response.data,
      message: "媒体任务状态已刷新。"
    };
  } catch (error) {
    return fail("读取媒体任务状态失败。", error);
  }
}

export async function retryMediaTaskAction(taskId: string): Promise<MediaTaskActionResult> {
  try {
    const response = await retryMediaTask(taskId);
    revalidatePath("/publish");

    return {
      ok: true,
      task: response.data,
      message: "已重新加入媒体处理队列。"
    };
  } catch (error) {
    return fail("重试媒体任务失败。", error);
  }
}
export async function saveVideoDraftAction(input: {
  draftId: string;
  payload: ApiVideoDraftUpdateInput;
}): Promise<PublishDraftActionResult<VideoDraftView>> {
  try {
    const response = await updateVideoDraft(input.draftId, input.payload);
    revalidatePath("/publish");

    return {
      ok: true,
      draft: response.data,
      message: "发布草稿已保存。"
    };
  } catch (error) {
    return fail("保存发布草稿失败。", error);
  }
}

export async function saveWorkflowDraftAction(input: {
  draftId: string;
  payload: ApiWorkflowDraftUpdateInput;
}): Promise<PublishDraftActionResult<WorkflowDraftView>> {
  try {
    const response = await updateWorkflowDraft(input.draftId, input.payload);
    revalidatePath("/publish");

    return {
      ok: true,
      draft: response.data,
      message: "工作流草稿已保存。"
    };
  } catch (error) {
    return fail("保存工作流草稿失败。", error);
  }
}

export async function savePostDraftAction(input: {
  draftId: string;
  payload: ApiPostDraftUpdateInput;
}): Promise<PublishDraftActionResult<PostDraftView>> {
  try {
    const response = await updatePostDraft(input.draftId, input.payload);
    revalidatePath("/publish");
    revalidatePath("/discussions/new");

    return {
      ok: true,
      draft: response.data,
      message: "帖子草稿已保存。"
    };
  } catch (error) {
    return fail("保存帖子草稿失败。", error);
  }
}

export async function submitVideoDraftAction(input: {
  draftId: string;
  payload: ApiVideoDraftUpdateInput;
}): Promise<PublishDraftActionResult<VideoDraftView>> {
  try {
    const savedDraft = await updateVideoDraft(input.draftId, input.payload);
    const submitResult = await submitVideoDraft(input.draftId, "creator_submit");
    const draft: VideoDraftView = {
      ...savedDraft.data,
      targetId: submitResult.data.targetId,
      statusCode: submitResult.data.draftStatus,
      lifecycle: submitResult.data.lifecycle
    };
    const isPromptDraft =
      draft.categoryCode === "video_prompt" || draft.categoryCode === "image_prompt";
    const detailHref = isPromptDraft
      ? `/prompts/${submitResult.data.targetId}`
      : `/videos/${submitResult.data.targetId}`;
    const href = draft.categoryCode === "image_prompt"
      ? "/featured?filter=image_prompt&sort=latest"
      : draft.categoryCode === "video_prompt"
        ? "/featured?filter=video_prompt&sort=latest"
        : detailHref;

    revalidatePath("/publish");
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/featured");
    revalidatePath("/me");
    revalidatePath(detailHref);

    return {
      ok: true,
      draft,
      submitResult: submitResult.data,
      href,
      message: isPromptDraft
        ? `提示词内容已发布，可前往 ${href} 查看。`
        : `视频内容已发布，可前往 ${href} 查看。`
    };
  } catch (error) {
    return fail("提交发布内容失败。", error);
  }
}

export async function submitWorkflowDraftAction(input: {
  draftId: string;
  payload: ApiWorkflowDraftUpdateInput;
}): Promise<PublishDraftActionResult<WorkflowDraftView>> {
  try {
    const savedDraft = await updateWorkflowDraft(input.draftId, input.payload);
    const submitResult = await submitWorkflowDraft(input.draftId, "creator_submit");
    const draft: WorkflowDraftView = {
      ...savedDraft.data,
      targetId: submitResult.data.targetId,
      statusCode: submitResult.data.draftStatus,
      lifecycle: submitResult.data.lifecycle
    };
    const detailHref = `/workflows/${submitResult.data.targetId}`;
    const href = "/featured?filter=workflow&sort=latest";

    revalidatePath("/publish");
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/featured");
    revalidatePath("/me");
    revalidatePath(detailHref);

    return {
      ok: true,
      draft,
      submitResult: submitResult.data,
      href,
      message: `工作流内容已发布，可前往 ${href} 查看。`
    };
  } catch (error) {
    return fail("提交工作流内容失败。", error);
  }
}

export async function submitPostDraftAction(input: {
  draftId: string;
  payload: ApiPostDraftUpdateInput;
}): Promise<PublishDraftActionResult<PostDraftView>> {
  try {
    const savedDraft = await updatePostDraft(input.draftId, input.payload);
    const submitResult = await submitPostDraft(input.draftId, "creator_submit");
    const draft: PostDraftView = {
      ...savedDraft.data,
      targetId: submitResult.data.targetId,
      statusCode: submitResult.data.draftStatus,
      lifecycle: submitResult.data.lifecycle
    };

    revalidatePath("/publish");
    revalidatePath("/discussions/new");
    revalidatePath("/discussions");
    revalidatePath("/me");

    const discussionHref = draft.channelSlug?.trim()
      ? `/discussions?channel=${encodeURIComponent(draft.channelSlug.trim())}`
      : "/discussions";
    const detailHref = submitResult.data.slug
      ? `/discussions/${submitResult.data.slug}`
      : undefined;

    if (detailHref) {
      revalidatePath(detailHref);
    }

    return {
      ok: true,
      draft,
      submitResult: submitResult.data,
      href: discussionHref,
      message: "帖子已发布，可前往社区列表查看。"
    };
  } catch (error) {
    return fail("发布帖子失败。", error);
  }
}
