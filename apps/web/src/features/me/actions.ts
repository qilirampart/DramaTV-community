"use server";

import { revalidatePath } from "next/cache";
import {
  deletePostDraft,
  deleteVideoDraft,
  deleteWorkflowDraft,
  updateMeProfile
} from "@/lib/api/community-service";
import { formatCommunityActionError } from "@/lib/api/community-error-presenter";
import type {
  ApiMeDraftItem,
  ApiMeProfile,
  ApiMeProfileUpdateInput
} from "@/lib/contracts/community-api";

type MeActionFailure = {
  ok: false;
  message: string;
};

type ProfileUpdateSuccess = {
  ok: true;
  message: string;
  profile: ApiMeProfile;
};

type DraftDeleteSuccess = {
  ok: true;
  message: string;
};

export type MeProfileActionResult = ProfileUpdateSuccess | MeActionFailure;
export type MeDraftActionResult = DraftDeleteSuccess | MeActionFailure;

function normalizeOptional(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export async function updateMeProfileAction(input: ApiMeProfileUpdateInput): Promise<MeProfileActionResult> {
  const displayName = normalizeOptional(input.displayName);

  if (!displayName || displayName.length < 2) {
    return {
      ok: false,
      message: "昵称至少需要 2 个字符。"
    };
  }

  try {
    const payload: ApiMeProfileUpdateInput = {
      displayName,
      headline: normalizeOptional(input.headline),
      bio: normalizeOptional(input.bio),
      avatarAssetId: normalizeOptional(input.avatarAssetId),
      avatarUrl: normalizeOptional(input.avatarUrl)
    };
    const response = await updateMeProfile(payload);

    revalidatePath("/me");
    revalidatePath(`/creators/${response.data.id}`);

    return {
      ok: true,
      profile: response.data,
      message: "资料已保存。"
    };
  } catch (error) {
    return {
      ok: false,
      message: formatCommunityActionError(error, "保存资料失败。")
    };
  }
}

export async function deleteMeDraftAction(input: {
  draftType: ApiMeDraftItem["draftType"];
  draftId: string;
}): Promise<MeDraftActionResult> {
  try {
    if (input.draftType === "video") {
      await deleteVideoDraft(input.draftId);
    } else if (input.draftType === "workflow") {
      await deleteWorkflowDraft(input.draftId);
    } else {
      await deletePostDraft(input.draftId);
    }

    revalidatePath("/me");
    revalidatePath("/publish");
    revalidatePath("/discussions/new");

    return {
      ok: true,
      message: "草稿已删除。"
    };
  } catch (error) {
    return {
      ok: false,
      message: formatCommunityActionError(error, "删除草稿失败。")
    };
  }
}
