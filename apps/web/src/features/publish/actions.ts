"use server";

import { revalidatePath } from "next/cache";
import {
  appendCommunityRequestId,
  createUploadPolicy,
  submitPostDraft,
  submitVideoDraft,
  submitWorkflowDraft,
  updatePostDraft,
  updateVideoDraft,
  updateWorkflowDraft,
  uploadBinaryAsset
} from "@/lib/api/community-service";
import type {
  ApiDraftSubmitResult,
  ApiPostDraftUpdateInput,
  ApiUploadAssetKind,
  ApiUploadedAsset,
  ApiVideoDraftUpdateInput,
  ApiWorkflowDraftUpdateInput
} from "@/lib/contracts/community-api";
import type { PostDraftView, VideoDraftView, WorkflowDraftView } from "@/lib/contracts/view-models";

type PublishActionFailure = {
  ok: false;
  message: string;
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

type UploadAssetActionSuccess = {
  ok: true;
  asset: ApiUploadedAsset;
};

type UploadAssetActionFailure = {
  ok: false;
  message: string;
};

export type UploadAssetActionResult = UploadAssetActionSuccess | UploadAssetActionFailure;

function fail(message: string, error: unknown): PublishActionFailure {
  return {
    ok: false,
    message: appendCommunityRequestId(message, error)
  };
}

export async function uploadAssetAction(formData: FormData): Promise<UploadAssetActionResult> {
  const kind = formData.get("kind");
  const fileValue = formData.get("file");

  if ((kind !== "image" && kind !== "video") || !(fileValue instanceof File)) {
    return {
      ok: false,
      message: "Upload payload is invalid."
    };
  }

  try {
    const policy = await createUploadPolicy({
      kind: kind as ApiUploadAssetKind,
      fileName: fileValue.name,
      mimeType: fileValue.type || "application/octet-stream",
      sizeBytes: fileValue.size
    });
    const uploaded = await uploadBinaryAsset({
      policy: policy.data,
      file: fileValue,
      mimeType: fileValue.type
    });

    return {
      ok: true,
      asset: uploaded.data
    };
  } catch (error) {
    return {
      ok: false,
      message: appendCommunityRequestId(
        kind === "image" ? "Image upload failed." : "Video upload failed.",
        error
      )
    };
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
      message: "Video draft saved."
    };
  } catch (error) {
    return fail("Saving the video draft failed.", error);
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
      message: "Workflow draft saved."
    };
  } catch (error) {
    return fail("Saving the workflow draft failed.", error);
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
      message: "Post draft saved."
    };
  } catch (error) {
    return fail("Saving the post draft failed.", error);
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
      statusCode: submitResult.data.publishStatus
    };

    revalidatePath("/publish");

    return {
      ok: true,
      draft,
      submitResult: submitResult.data,
      message: `Video submitted. Target ID: ${submitResult.data.targetId}.`
    };
  } catch (error) {
    return fail("Submitting the video draft failed.", error);
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
      statusCode: submitResult.data.publishStatus
    };

    revalidatePath("/publish");

    return {
      ok: true,
      draft,
      submitResult: submitResult.data,
      message: `Workflow submitted. Target ID: ${submitResult.data.targetId}.`
    };
  } catch (error) {
    return fail("Submitting the workflow draft failed.", error);
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
      statusCode: submitResult.data.publishStatus
    };

    revalidatePath("/publish");
    revalidatePath("/discussions/new");
    revalidatePath("/discussions");

    return {
      ok: true,
      draft,
      submitResult: submitResult.data,
      href: submitResult.data.slug ? `/discussions/${submitResult.data.slug}` : undefined,
      message: submitResult.data.slug
        ? `Post submitted. Open thread: /discussions/${submitResult.data.slug}`
        : `Post submitted. Thread ID: ${submitResult.data.targetId}.`
    };
  } catch (error) {
    return fail("Submitting the post draft failed.", error);
  }
}
