"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useState, useTransition } from "react";
import { PageShell } from "@/components/shared/PageShell";
import { uploadAssetFromClient } from "@/lib/api/upload-client";
import type { ApiVideoDraftUpdateInput, ApiWorkflowDraftUpdateInput } from "@/lib/contracts/community-api";
import type {
  MediaTaskSummaryView,
  PublishPageView,
  VideoDraftView,
  WorkflowDraftView,
  WorkflowMiniCardView
} from "@/lib/contracts/view-models";
import type { PublishDraftActionResult } from "@/features/publish/actions";
import {
  getMediaTaskAction,
  retryMediaTaskAction
} from "@/features/publish/actions";
import type {
  ImagePromptContentCategory,
  ImagePromptModelCategory,
  PromptCompositionCategory,
  VideoPromptContentCategory,
  VideoPromptModelCategory
} from "@/lib/taxonomy/prompt-taxonomy";
import {
  IMAGE_PROMPT_CONTENT_OPTIONS,
  IMAGE_PROMPT_MODEL_OPTIONS,
  PROMPT_COMPOSITION_OPTIONS,
  VIDEO_PROMPT_CONTENT_OPTIONS,
  VIDEO_PROMPT_MODEL_OPTIONS,
  buildPromptTaxonomyTags,
  parsePromptTaxonomySelection
} from "@/lib/taxonomy/prompt-taxonomy";
import {
  saveVideoDraftAction,
  saveWorkflowDraftAction,
  submitVideoDraftAction,
  submitWorkflowDraftAction
} from "@/features/publish/actions";
import styles from "./PublishPage.module.css";

type PublishPageProps = {
  view: PublishPageView;
  availableWorkflows: WorkflowMiniCardView[];
};

type DraftNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

type PublishMode = "video_prompt" | "image_prompt" | "workflow";

type VideoDraftFormState = {
  title: string;
  summary: string;
  categoryCode: "video_prompt" | "image_prompt";
  promptText: string;
  modelCategory: ImagePromptModelCategory | VideoPromptModelCategory | "";
  contentCategory: ImagePromptContentCategory | VideoPromptContentCategory | "";
  compositionCategory: PromptCompositionCategory;
  workflowId: string;
  visibility: VideoDraftView["visibility"];
  coverAssetId: string;
  sourceAssetId: string;
};

type WorkflowDraftFormState = {
  title: string;
  summary: string;
  scenarioText: string;
  allowCopy: boolean;
  allowFork: boolean;
  visibility: WorkflowDraftView["visibility"];
  coverAssetId: string;
  exampleAssetId: string;
};

const MODE_OPTIONS: Array<{
  value: PublishMode;
  label: string;
  description: string;
}> = [
  {
    value: "video_prompt",
    label: "视频提示词",
    description: "上传视频示例，沉淀可复用的镜头和生成提示词。"
  },
  {
    value: "image_prompt",
    label: "图片提示词",
    description: "上传图片示例，沉淀图像提示词和风格方法。"
  },
  {
    value: "workflow",
    label: "工作流",
    description: "发布工作流说明，并带一段由该工作流产出的成果视频。"
  }
];

const MODE_TAGS: Record<PublishMode, string[]> = {
  video_prompt: ["视频提示词"],
  image_prompt: ["图片提示词"],
  workflow: ["工作流"]
};

function textOrEmpty(value?: string) {
  return value ?? "";
}

function normalizeMode(categoryCode?: string): PublishMode {
  switch (categoryCode) {
    case "image_prompt":
      return "image_prompt";
    case "workflow":
      return "workflow";
    case "video_prompt":
    default:
      return "video_prompt";
  }
}

function toVideoFormState(draft: VideoDraftView): VideoDraftFormState {
  const categoryCode = normalizeMode(draft.categoryCode) === "image_prompt" ? "image_prompt" : "video_prompt";
  const taxonomy = parsePromptTaxonomySelection({
    categoryCode,
    tagNames: [
      ...draft.tagNames,
      draft.modelCategory ?? "",
      draft.contentCategory ?? "",
      draft.compositionCategory ?? ""
    ].filter(Boolean),
    modelCategory: draft.modelCategory as ImagePromptModelCategory | VideoPromptModelCategory | undefined,
    contentCategory: draft.contentCategory as ImagePromptContentCategory | VideoPromptContentCategory | undefined,
    compositionCategory: draft.compositionCategory as PromptCompositionCategory | undefined,
    title: draft.title,
    summary: draft.summary ?? draft.promptText
  });

  return {
    title: textOrEmpty(draft.title),
    summary: textOrEmpty(draft.summary),
    categoryCode,
    promptText: textOrEmpty(draft.promptText),
    modelCategory: (draft.modelCategory as ImagePromptModelCategory | VideoPromptModelCategory | undefined) ?? taxonomy.modelCategory ?? "",
    contentCategory: (draft.contentCategory as ImagePromptContentCategory | VideoPromptContentCategory | undefined) ?? taxonomy.contentCategory ?? "",
    compositionCategory: (draft.compositionCategory as PromptCompositionCategory | undefined) ?? taxonomy.compositionCategory,
    workflowId: textOrEmpty(draft.workflowId),
    visibility: draft.visibility,
    coverAssetId: textOrEmpty(draft.coverAssetId),
    sourceAssetId: textOrEmpty(draft.sourceAssetId)
  };
}

function getPromptModelOptions(categoryCode: VideoDraftFormState["categoryCode"]) {
  return categoryCode === "image_prompt" ? IMAGE_PROMPT_MODEL_OPTIONS : VIDEO_PROMPT_MODEL_OPTIONS;
}

function getPromptContentOptions(categoryCode: VideoDraftFormState["categoryCode"]) {
  return categoryCode === "image_prompt" ? IMAGE_PROMPT_CONTENT_OPTIONS : VIDEO_PROMPT_CONTENT_OPTIONS;
}

function getPromptModelName(form: VideoDraftFormState) {
  if (!form.modelCategory) {
    return undefined;
  }

  const option = getPromptModelOptions(form.categoryCode).find((item) => item.id === form.modelCategory);
  return option?.label;
}

function getPromptTaxonomyTags(form: VideoDraftFormState) {
  return buildPromptTaxonomyTags({
    categoryCode: form.categoryCode,
    modelCategory: form.modelCategory || undefined,
    contentCategory: form.contentCategory || undefined,
    compositionCategory: form.compositionCategory
  });
}

function toWorkflowFormState(draft: WorkflowDraftView): WorkflowDraftFormState {
  return {
    title: textOrEmpty(draft.title),
    summary: textOrEmpty(draft.summary),
    scenarioText: textOrEmpty(draft.scenarioText),
    allowCopy: draft.allowCopy,
    allowFork: draft.allowFork,
    visibility: draft.visibility,
    coverAssetId: textOrEmpty(draft.coverAssetId),
    exampleAssetId: textOrEmpty(draft.exampleAssetId)
  };
}

function noticeClassName(notice: DraftNotice) {
  if (notice.tone === "success") {
    return `${styles.notice} ${styles.noticeSuccess}`;
  }

  if (notice.tone === "error") {
    return `${styles.notice} ${styles.noticeError}`;
  }

  return styles.notice;
}

function formatSubmittedAt(value?: string) {
  if (!value) {
    return "尚未提交";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "已提交";
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getModerationStatusLabel(status: string) {
  switch (status) {
    case "not_applicable":
      return "无需审核";
    case "not_submitted":
      return "未提交";
    case "pending_review":
      return "待审核";
    case "approved":
      return "已通过";
    case "rejected":
      return "未通过";
    case "taken_down":
      return "已下架";
    default:
      return status || "未知";
  }
}

function getProcessingStatusLabel(status: string) {
  switch (status) {
    case "not_applicable":
      return "不涉及";
    case "not_submitted":
      return "未提交";
    case "not_requested":
      return "未触发";
    case "queued":
      return "排队中";
    case "processing":
      return "处理中";
    case "succeeded":
      return "已完成";
    case "failed":
      return "失败";
    default:
      return status || "未知";
  }
}

function getMediaTaskStatusLabel(status: string) {
  switch (status) {
    case "queued":
      return "排队中";
    case "processing":
      return "处理中";
    case "succeeded":
      return "已完成";
    case "failed":
      return "失败";
    default:
      return status || "未知";
  }
}

function UploadImageIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 28 28">
      <rect height="14.5" rx="2.5" stroke="currentColor" strokeWidth="1.7" width="17.5" x="5.25" y="6.75" />
      <circle cx="11" cy="12" fill="currentColor" r="1.45" />
      <path
        d="m7.8 18 4.1-4 3 2.8 2.8-3.4 3 4.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 28 28">
      <path d="M14 6.5v15" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M6.5 14h15" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 28 28">
      <rect height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" width="18" x="5" y="6.5" />
      <path d="m12 11.1 6 3-6 3v-6Z" fill="currentColor" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 28 28">
      <rect height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.7" width="18" x="5" y="6.25" />
      <circle cx="11.2" cy="11.2" fill="currentColor" r="1.6" />
      <path
        d="m8 18.2 4.1-4.2 3.1 3 2.7-2.8 2.1 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function PublishPage({ view, availableWorkflows }: PublishPageProps) {
  const router = useRouter();
  const [mode, setMode] = useState<PublishMode>(() => normalizeMode(view.videoDraft.categoryCode));
  const [videoDraft, setVideoDraft] = useState(view.videoDraft);
  const [videoForm, setVideoForm] = useState(() => toVideoFormState(view.videoDraft));
  const [workflowDraft, setWorkflowDraft] = useState(view.workflowDraft);
  const [workflowForm, setWorkflowForm] = useState(() => toWorkflowFormState(view.workflowDraft));
  const [notice, setNotice] = useState<DraftNotice | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploadPending, setUploadPending] = useState(false);
  const [mediaTask, setMediaTask] = useState<MediaTaskSummaryView | undefined>(
    () => view.videoDraft.lifecycle.mediaTask
  );

  const isWorkflowMode = mode === "workflow";
  const isImagePrompt = mode === "image_prompt";
  const isPromptMode = !isWorkflowMode;
  const locked = isWorkflowMode ? !workflowDraft.lifecycle.editable : !videoDraft.lifecycle.editable;
  const busy = pending || uploadPending;
  const canEdit = !busy && !locked;
  const coverReady = isWorkflowMode
    ? workflowForm.coverAssetId.trim().length > 0
    : videoForm.coverAssetId.trim().length > 0;
  const sourceReady = isWorkflowMode
    ? workflowForm.exampleAssetId.trim().length > 0
    : videoForm.sourceAssetId.trim().length > 0;
  const promptReady = videoForm.promptText.trim().length > 0;
  const taxonomyReady = isWorkflowMode || (videoForm.modelCategory.length > 0 && videoForm.contentCategory.length > 0);
  const canSubmit = !busy && !locked && (isWorkflowMode ? sourceReady : sourceReady && promptReady && taxonomyReady);
  const selectedPromptTags = isWorkflowMode ? [] : getPromptTaxonomyTags(videoForm);
  const sourceAssetKind: "image" | "video" = isWorkflowMode ? "video" : isImagePrompt ? "image" : "video";
  const sourceLabel = isWorkflowMode ? "成果视频" : isImagePrompt ? "示例图片" : "演示视频";
  const sourceAction = isWorkflowMode ? "上传成果视频" : isImagePrompt ? "上传图片" : "上传视频";
  const contentTargetLabel = isWorkflowMode
    ? "工作流内容库"
    : isImagePrompt
      ? "图片提示词内容库"
      : "视频提示词内容库";
  const submitLabel = isWorkflowMode
    ? canSubmit
      ? "发布工作流"
      : "上传成果视频后发布工作流"
    : canSubmit
      ? isImagePrompt
        ? "发布图片提示词"
        : "发布视频提示词"
      : `${sourceAction}并补全提示词后发布`;
  const primaryModeMeta = MODE_OPTIONS.find((item) => item.value === mode);

  function buildVideoPayload(): ApiVideoDraftUpdateInput {
    return {
      title: videoForm.title,
      summary: videoForm.summary,
      categoryCode: videoForm.categoryCode,
      promptText: videoForm.promptText,
      modelName: getPromptModelName(videoForm),
      modelCategory: videoForm.modelCategory || undefined,
      contentCategory: videoForm.contentCategory || undefined,
      compositionCategory: videoForm.compositionCategory,
      sourcePlatform: "community",
      sourceCampaign: "community-manual-publish",
      tagNames: getPromptTaxonomyTags(videoForm),
      workflowId: textOrEmpty(videoForm.workflowId),
      visibility: videoForm.visibility,
      coverAssetId: videoForm.coverAssetId,
      sourceAssetId: videoForm.sourceAssetId
    };
  }

  function buildWorkflowPayload(): ApiWorkflowDraftUpdateInput {
    return {
      title: workflowForm.title,
      summary: workflowForm.summary,
      scenarioText: workflowForm.scenarioText,
      tagNames: MODE_TAGS.workflow,
      allowCopy: workflowForm.allowCopy,
      allowFork: workflowForm.allowFork,
      visibility: workflowForm.visibility,
      coverAssetId: workflowForm.coverAssetId,
      exampleAssetId: workflowForm.exampleAssetId
    };
  }

  function applyVideoResult(result: PublishDraftActionResult<VideoDraftView>) {
    if (!result.ok) {
      setNotice({
        tone: "error",
        text: result.message
      });
      return;
    }

    setVideoDraft(result.draft);
    setVideoForm(toVideoFormState(result.draft));
    setMediaTask(result.draft.lifecycle.mediaTask);
    setNotice({
      tone: "success",
      text: result.message
    });

    if (result.href) {
      router.push(result.href);
    }
  }

  function applyWorkflowResult(result: PublishDraftActionResult<WorkflowDraftView>) {
    if (!result.ok) {
      setNotice({
        tone: "error",
        text: result.message
      });
      return;
    }

    setWorkflowDraft(result.draft);
    setWorkflowForm(toWorkflowFormState(result.draft));
    setMediaTask(undefined);
    setNotice({
      tone: "success",
      text: result.message
    });

    if (result.href) {
      router.push(result.href);
    }
  }

  function handleSaveDraft() {
    setNotice({
      tone: "neutral",
      text: isWorkflowMode ? "正在保存工作流草稿..." : "正在保存发布草稿..."
    });

    startTransition(async () => {
      if (isWorkflowMode) {
        const result = await saveWorkflowDraftAction({
          draftId: workflowDraft.draftId,
          payload: buildWorkflowPayload()
        });
        applyWorkflowResult(result);
        return;
      }

      const result = await saveVideoDraftAction({
        draftId: videoDraft.draftId,
        payload: buildVideoPayload()
      });
      applyVideoResult(result);
    });
  }

  function handleSubmit() {
    setNotice({
      tone: "neutral",
      text: isWorkflowMode ? "正在提交工作流内容..." : "正在提交发布内容..."
    });

    startTransition(async () => {
      if (isWorkflowMode) {
        const result = await submitWorkflowDraftAction({
          draftId: workflowDraft.draftId,
          payload: buildWorkflowPayload()
        });
        applyWorkflowResult(result);
        return;
      }

      const result = await submitVideoDraftAction({
        draftId: videoDraft.draftId,
        payload: buildVideoPayload()
      });
      applyVideoResult(result);
    });
  }

  function handleModeChange(nextMode: PublishMode) {
    setMode(nextMode);
    setMediaTask(nextMode === "workflow" ? undefined : videoDraft.lifecycle.mediaTask);

    if (nextMode === "workflow") {
      setNotice({
        tone: "neutral",
        text: "工作流发布会保存工作流说明，并要求上传一段该工作流产出的成果视频。"
      });
      return;
    }

    setVideoForm((current) => ({
      ...current,
      categoryCode: nextMode,
      modelCategory: "",
      contentCategory: "",
      compositionCategory: "single-model",
      sourceAssetId: current.categoryCode === nextMode ? current.sourceAssetId : ""
    }));

    setNotice({
      tone: "neutral",
      text: `已切换到${nextMode === "image_prompt" ? "图片提示词" : "视频提示词"}发布模式，请确认示例素材类型。`
    });
  }

  function applyMediaTaskRefresh(nextTask: MediaTaskSummaryView | undefined, message: string) {
    setMediaTask(nextTask);
    setNotice({
      tone: nextTask?.statusCode === "failed" ? "error" : "success",
      text: message
    });
  }

  function handleRefreshMediaTask() {
    if (!mediaTask?.taskId || busy) {
      return;
    }

    setNotice({
      tone: "neutral",
      text: "正在刷新媒体任务状态..."
    });

    startTransition(async () => {
      const result = await getMediaTaskAction(mediaTask.taskId);
      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.message
        });
        return;
      }

      applyMediaTaskRefresh(result.task, result.message);
    });
  }

  function handleRetryMediaTask() {
    if (!mediaTask?.taskId || busy) {
      return;
    }

    setNotice({
      tone: "neutral",
      text: "正在重新加入媒体处理队列..."
    });

    startTransition(async () => {
      const result = await retryMediaTaskAction(mediaTask.taskId);
      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.message
        });
        return;
      }

      applyMediaTaskRefresh(result.task, result.message);
    });
  }

  async function uploadAsset(file: File, kind: "image" | "video", assetRole: "cover" | "source") {
    return uploadAssetFromClient({
      kind,
      assetRole,
      file
    });
  }

  async function handleCoverSelect(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setNotice({
        tone: "error",
        text: "封面必须是图片文件。"
      });
      input.value = "";
      return;
    }

    setUploadPending(true);
    setNotice({
      tone: "neutral",
      text: `正在上传封面：${file.name}`
    });

    try {
      const uploadResponse = await uploadAsset(file, "image", "cover");

      if (isWorkflowMode) {
        const nextPayload = {
          ...buildWorkflowPayload(),
          coverAssetId: uploadResponse.assetId
        };

        setWorkflowForm((current) => ({
          ...current,
          coverAssetId: uploadResponse.assetId
        }));

        const result = await saveWorkflowDraftAction({
          draftId: workflowDraft.draftId,
          payload: nextPayload
        });
        applyWorkflowResult(result);
      } else {
        const nextPayload = {
          ...buildVideoPayload(),
          coverAssetId: uploadResponse.assetId
        };

        setVideoForm((current) => ({
          ...current,
          coverAssetId: uploadResponse.assetId
        }));

        const result = await saveVideoDraftAction({
          draftId: videoDraft.draftId,
          payload: nextPayload
        });
        applyVideoResult(result);
      }
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "封面上传失败。"
      });
    } finally {
      setUploadPending(false);
      input.value = "";
    }
  }

  async function handleSourceSelect(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith(`${sourceAssetKind}/`)) {
      setNotice({
        tone: "error",
        text: isWorkflowMode
          ? "工作流模式当前只支持上传视频成果。"
          : isImagePrompt
            ? "图片提示词模式只能上传图片。"
            : "视频提示词模式只能上传视频。"
      });
      input.value = "";
      return;
    }

    setUploadPending(true);
    setNotice({
      tone: "neutral",
      text: `正在上传${sourceLabel}：${file.name}`
    });

    try {
      const uploadResponse = await uploadAsset(file, sourceAssetKind, "source");

      if (isWorkflowMode) {
        const nextPayload = {
          ...buildWorkflowPayload(),
          exampleAssetId: uploadResponse.assetId
        };

        setWorkflowForm((current) => ({
          ...current,
          exampleAssetId: uploadResponse.assetId
        }));

        const result = await saveWorkflowDraftAction({
          draftId: workflowDraft.draftId,
          payload: nextPayload
        });
        applyWorkflowResult(result);
      } else {
        const nextPayload = {
          ...buildVideoPayload(),
          sourceAssetId: uploadResponse.assetId
        };

        setVideoForm((current) => ({
          ...current,
          sourceAssetId: uploadResponse.assetId
        }));

        const result = await saveVideoDraftAction({
          draftId: videoDraft.draftId,
          payload: nextPayload
        });
        applyVideoResult(result);
      }
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : `${sourceLabel}上传失败。`
      });
    } finally {
      setUploadPending(false);
      input.value = "";
    }
  }

  const visibilityValue = isWorkflowMode ? workflowForm.visibility : videoForm.visibility;
  const visibilityLabel =
    visibilityValue === "public" ? "公开" : visibilityValue === "link" ? "链接可见" : "仅自己可见";
  const activeLifecycle = isWorkflowMode ? workflowDraft.lifecycle : videoDraft.lifecycle;
  const activeMediaTask = isWorkflowMode ? undefined : mediaTask ?? activeLifecycle.mediaTask;
  const draftStatusLabel = activeLifecycle.draftStatus === "draft" ? "编辑中" : "已提交";
  const moderationStatusLabel = getModerationStatusLabel(activeLifecycle.moderationStatus);
  const processingStatusLabel = getProcessingStatusLabel(activeLifecycle.processingStatus);
  const mediaTaskStatusLabel = activeMediaTask ? getMediaTaskStatusLabel(activeMediaTask.statusCode) : null;
  const submittedAtLabel = formatSubmittedAt(activeLifecycle.submittedAt);
  const showProcessingStatus = isWorkflowMode || !isImagePrompt;

  return (
    <PageShell variant="home" topNavActive="featured">
      <main className={styles.page}>
        <Link className={styles.cancelLink} href="/featured">
          返回精选页
        </Link>

        <section className={styles.heroGrid}>
          <div className={styles.leftColumn}>
            <div className={styles.titleRow}>
              <span className={styles.titleIcon}>
                <PlusIcon />
              </span>
              <div>
                <h1 className={styles.title}>发布内容</h1>
                <p className={styles.subtitle}>
                  发布页现在分成三条路：视频提示词、图片提示词和工作流。工作流内容不是单独一段视频，而是
                  “工作流说明/配置 + 这个工作流产出的成果视频”。
                </p>
              </div>
            </div>

            <div className={styles.formBlock}>
              <div className={styles.modeField}>
                <span className={styles.label}>内容类型</span>
                <div className={styles.modeGrid}>
                  {MODE_OPTIONS.map((item) => (
                    <button
                      className={mode === item.value ? styles.modeButtonActive : styles.modeButton}
                      disabled={!canEdit}
                      key={item.value}
                      type="button"
                      onClick={() => handleModeChange(item.value)}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>标题</span>
                <input
                  className={styles.input}
                  disabled={!canEdit}
                  placeholder={isWorkflowMode ? "给这个工作流写一个名称" : "给这条内容写一个标题"}
                  value={isWorkflowMode ? workflowForm.title : videoForm.title}
                  onChange={(event) => {
                    const { value } = event.target;
                    if (isWorkflowMode) {
                      setWorkflowForm((current) => ({ ...current, title: value }));
                      return;
                    }

                    setVideoForm((current) => ({ ...current, title: value }));
                  }}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.labelRow}>
                  <span className={styles.label}>内容简介</span>
                  <span className={styles.labelHint}>
                    {isWorkflowMode ? "一句话说清工作流产出方向和适用场景" : "一句话说清用途、风格和适用场景"}
                  </span>
                </span>
                <textarea
                  className={styles.descriptionArea}
                  disabled={!canEdit}
                  placeholder={
                    isWorkflowMode
                      ? "例如：适合做短剧角色转场和情绪拉升镜头，重点在人物表情、镜头推进和光影节奏。"
                      : "例如：适合做情绪拉满的短剧封面、角色海报或极具氛围感的镜头生成。"
                  }
                  value={isWorkflowMode ? workflowForm.summary : videoForm.summary}
                  onChange={(event) => {
                    const { value } = event.target;
                    if (isWorkflowMode) {
                      setWorkflowForm((current) => ({ ...current, summary: value }));
                      return;
                    }

                    setVideoForm((current) => ({ ...current, summary: value }));
                  }}
                />
              </label>

              {isPromptMode ? (
                <>
                  <label className={styles.field}>
                    <span className={styles.labelRow}>
                      <span className={styles.label}>提示词正文</span>
                      <span className={styles.labelHint}>这里是必填区，直接填写可复用 Prompt</span>
                    </span>
                    <textarea
                      className={styles.coreArea}
                      disabled={!canEdit}
                      placeholder={
                        isImagePrompt
                          ? "写清主体、构图、材质、光线、镜头语言、氛围和风格词，方便后续直接复用到图片生成。"
                          : "写清人物、镜头、动作、节奏、场景、光影、机位、时长和你希望保留的关键细节。"
                      }
                      value={videoForm.promptText}
                      onChange={(event) =>
                        setVideoForm((current) => ({
                          ...current,
                          promptText: event.target.value
                        }))
                      }
                    />
                  </label>

                  <article className={styles.taxonomyPanel}>
                    <div className={styles.taxonomyHeader}>
                      <div>
                        <strong>标准标签</strong>
                        <p>先选模型分类、内容母类和是否模型组合，系统会自动生成规范标签。</p>
                      </div>
                      <span className={styles.taxonomyStatus}>
                        {taxonomyReady ? "分类已补齐" : "分类待补齐"}
                      </span>
                    </div>

                    <div className={styles.taxonomyGroup}>
                      <span className={styles.taxonomyLabel}>模型分类</span>
                      <div className={styles.taxonomyChips}>
                        {getPromptModelOptions(videoForm.categoryCode).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            disabled={!canEdit}
                            className={videoForm.modelCategory === option.id ? styles.taxonomyChipActive : styles.taxonomyChip}
                            onClick={() =>
                              setVideoForm((current) => ({
                                ...current,
                                modelCategory: option.id
                              }))
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.taxonomyGroup}>
                      <span className={styles.taxonomyLabel}>内容母类</span>
                      <div className={styles.taxonomyChips}>
                        {getPromptContentOptions(videoForm.categoryCode).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            disabled={!canEdit}
                            className={videoForm.contentCategory === option.id ? styles.taxonomyChipActive : styles.taxonomyChip}
                            onClick={() =>
                              setVideoForm((current) => ({
                                ...current,
                                contentCategory: option.id
                              }))
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.taxonomyGroup}>
                      <span className={styles.taxonomyLabel}>模型关系</span>
                      <div className={styles.taxonomyChips}>
                        {PROMPT_COMPOSITION_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            disabled={!canEdit}
                            className={videoForm.compositionCategory === option.id ? styles.taxonomyChipActive : styles.taxonomyChip}
                            onClick={() =>
                              setVideoForm((current) => ({
                                ...current,
                                compositionCategory: option.id
                              }))
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.taxonomyPreview}>
                      {selectedPromptTags.map((tag) => (
                        <span className={styles.taxonomyTag} key={tag}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </article>
                </>
              ) : (
                <>
                  <label className={styles.field}>
                    <span className={styles.labelRow}>
                      <span className={styles.label}>工作流说明 / 配置摘要</span>
                      <span className={styles.labelHint}>当前先用文字描述节点、输入输出和关键参数</span>
                    </span>
                    <textarea
                      className={styles.coreArea}
                      disabled={!canEdit}
                      placeholder="写清这个工作流做什么、输入什么素材、关键节点是什么、参数如何控制，以及最终会产出什么类型的视频结果。"
                      value={workflowForm.scenarioText}
                      onChange={(event) =>
                        setWorkflowForm((current) => ({
                          ...current,
                          scenarioText: event.target.value
                        }))
                      }
                    />
                  </label>

                  <article className={styles.workflowPlaceholder}>
                    <div className={styles.workflowPlaceholderHeader}>
                      <span className={styles.workflowPlaceholderBadge}>工作流文件</span>
                      <span className={styles.workflowPlaceholderMeta}>后续接画布</span>
                    </div>
                    <p>
                      工作流真正的文件、JSON 配置或画布节点快照，后续会直接和画布软件打通。当前阶段先把发布逻辑
                      收口成“工作流说明 + 成果视频”，不伪装成已经接通文件上传。
                    </p>
                    {availableWorkflows.length > 0 ? (
                      <div className={styles.workflowPreviewList}>
                        {availableWorkflows.slice(0, 3).map((workflow) => (
                          <span key={workflow.id}>{workflow.title}</span>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.workflowEmpty}>当前还没有可参考的工作流示例。</span>
                    )}
                  </article>
                </>
              )}
            </div>
          </div>

          <aside className={styles.rightColumn}>
            <label className={styles.coverUploader}>
              <input accept="image/*" disabled={!canEdit} type="file" onChange={handleCoverSelect} />
              <span className={styles.uploadIcon}>
                <UploadImageIcon />
              </span>
              <strong>{coverReady ? "封面已就绪" : "上传封面图（可选）"}</strong>
              <span>
                {coverReady
                  ? isWorkflowMode
                    ? workflowForm.coverAssetId
                    : videoForm.coverAssetId
                  : "不传也可以，详情页会优先使用封面或示例素材兜底。"}
              </span>
            </label>

            <article className={styles.sideCard}>
              <h2>{primaryModeMeta?.label ?? "发布说明"}</h2>
              <ul className={styles.modeMetaList}>
                <li>
                  <span>01</span>
                  <div>
                    <strong>{isWorkflowMode ? "成果视频必填" : "素材要求"}</strong>
                    <p>
                      {isWorkflowMode
                        ? "工作流模式必须至少上传一段视频，用来展示这个工作流实际产出的效果。"
                        : `${sourceLabel}必填，当前模式只接受${isImagePrompt ? "图片" : "视频"}文件。`}
                    </p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>{isWorkflowMode ? "工作流文件后续接入" : "Prompt 必填"}</strong>
                    <p>
                      {isWorkflowMode
                        ? "真实工作流文件和画布配置后续直接接到画布系统，当前先用工作流说明承接。"
                        : "提示词正文会直接进入内容库，后续会在详情页和精选页被复用和展示。"}
                    </p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>当前状态</strong>
                    <p>
                      {locked
                        ? "这条草稿已经提交，当前表单会锁定。"
                        : "当前阶段默认直接发布到社区内容库，后续审核会接入后台管理系统。"}
                    </p>
                  </div>
                </li>
              </ul>
            </article>

            {isWorkflowMode ? (
              <article className={`${styles.sideCard} ${styles.statusCard}`}>
                <div className={styles.statusRow}>
                  <span className={styles.statusLabel}>允许复制</span>
                  <button
                    className={workflowForm.allowCopy ? styles.switchButtonActive : styles.switchButton}
                    disabled={!canEdit}
                    type="button"
                    onClick={() =>
                      setWorkflowForm((current) => ({
                        ...current,
                        allowCopy: !current.allowCopy
                      }))
                    }
                  >
                    {workflowForm.allowCopy ? "开启" : "关闭"}
                  </button>
                </div>
                <div className={styles.statusRow}>
                  <span className={styles.statusLabel}>允许派生</span>
                  <button
                    className={workflowForm.allowFork ? styles.switchButtonActive : styles.switchButton}
                    disabled={!canEdit}
                    type="button"
                    onClick={() =>
                      setWorkflowForm((current) => ({
                        ...current,
                        allowFork: !current.allowFork
                      }))
                    }
                  >
                    {workflowForm.allowFork ? "开启" : "关闭"}
                  </button>
                </div>
              </article>
            ) : null}

            <article className={`${styles.sideCard} ${styles.statusCard}`}>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>草稿状态</span>
                <span className={styles.statusValue}>{draftStatusLabel}</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>提交时间</span>
                <span className={styles.statusValue}>{submittedAtLabel}</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>审核状态</span>
                <span className={styles.statusValue}>{moderationStatusLabel}</span>
              </div>
              {activeLifecycle.moderationMessage ? (
                <p className={styles.statusHint}>{activeLifecycle.moderationMessage}</p>
              ) : null}
              {showProcessingStatus ? (
                <>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>媒体处理</span>
                    <span className={styles.statusValue}>{processingStatusLabel}</span>
                  </div>
                  {activeLifecycle.processingMessage ? (
                    <p
                      className={
                        activeLifecycle.processingStatus === "failed"
                          ? `${styles.statusHint} ${styles.statusHintError}`
                          : styles.statusHint
                      }
                    >
                      {activeLifecycle.processingMessage}
                    </p>
                  ) : null}
                </>
              ) : null}
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>当前模式</span>
                <span className={styles.statusValue}>{primaryModeMeta?.label}</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>发布可见性</span>
                <span className={styles.statusValue}>{visibilityLabel}</span>
              </div>
              {activeMediaTask ? (
                <div className={styles.mediaTaskPanel}>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>任务状态</span>
                    <span className={styles.statusValue}>{mediaTaskStatusLabel}</span>
                  </div>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>任务编号</span>
                    <span className={styles.statusValueMono}>{activeMediaTask.taskId.slice(0, 8)}</span>
                  </div>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>重试次数</span>
                    <span className={styles.statusValue}>
                      {activeMediaTask.retryCount}/{activeMediaTask.maxRetryCount}
                    </span>
                  </div>
                  {activeMediaTask.errorMessage ? (
                    <p className={`${styles.statusHint} ${styles.statusHintError}`}>{activeMediaTask.errorMessage}</p>
                  ) : null}
                  <div className={styles.mediaTaskActions}>
                    <button
                      className={styles.taskActionButton}
                      disabled={busy}
                      type="button"
                      onClick={handleRefreshMediaTask}
                    >
                      刷新状态
                    </button>
                    {activeMediaTask.retryable ? (
                      <button
                        className={styles.taskActionButtonPrimary}
                        disabled={busy}
                        type="button"
                        onClick={handleRetryMediaTask}
                      >
                        重试处理
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </article>
          </aside>
        </section>

        <section className={styles.sourceSection}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.sectionEyebrow}>{isWorkflowMode ? "成果演示" : "示例素材"}</span>
              <h2 className={styles.sectionTitle}>
                {isWorkflowMode ? "工作流成果视频上传区" : `${sourceLabel}上传区`}
              </h2>
            </div>
            <p className={styles.sectionSummary}>
              {isWorkflowMode
                ? "至少上传一段视频，作为该工作流产出的展示成果。它属于工作流内容的一部分，不会额外作为独立视频发布。"
                : isImagePrompt
                  ? "至少上传一张图片，后端会按图片提示词写入内容库。"
                  : "至少上传一段视频，后端会按视频提示词写入内容库。"}
            </p>
          </div>

          <div className={styles.mediaGrid}>
            <label className={styles.sourceUploader}>
              <input
                accept={sourceAssetKind === "image" ? "image/*" : "video/*"}
                disabled={!canEdit}
                type="file"
                onChange={handleSourceSelect}
              />
              <span className={styles.sourceIcon}>
                {sourceAssetKind === "image" ? <ImageIcon /> : <VideoIcon />}
              </span>
              <strong>{sourceReady ? `${sourceLabel}已上传` : `上传${sourceLabel}`}</strong>
              <span>
                {sourceReady
                  ? isWorkflowMode
                    ? workflowForm.exampleAssetId
                    : videoForm.sourceAssetId
                  : `当前模式要求${sourceAssetKind === "image" ? "图片" : "视频"}素材。`}
              </span>
            </label>

            <div className={styles.mediaMetaCard}>
              <div className={styles.mediaMetaItem}>
                <span>{isWorkflowMode ? "成果视频状态" : "素材状态"}</span>
                <strong>
                  {sourceReady
                    ? showProcessingStatus && activeLifecycle.draftStatus === "submitted"
                      ? processingStatusLabel
                      : "已就绪"
                    : "待上传"}
                </strong>
              </div>
              <div className={styles.mediaMetaItem}>
                <span>{isWorkflowMode ? "工作流文件状态" : "Prompt 状态"}</span>
                <strong>
                  {isWorkflowMode ? "后续接画布" : promptReady ? "已填写" : "待补全"}
                </strong>
              </div>
              <div className={styles.mediaMetaItem}>
                <span>发布去向</span>
                <strong>{contentTargetLabel}</strong>
              </div>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              className={styles.submitButton}
              disabled={!canSubmit}
              type="button"
              onClick={handleSubmit}
            >
              {busy ? "处理中..." : submitLabel}
            </button>

            <div className={styles.secondaryActions}>
              <button className={styles.saveButton} disabled={busy || locked} type="button" onClick={handleSaveDraft}>
                保存草稿
              </button>
              <select
                className={styles.visibilitySelect}
                disabled={!canEdit}
                value={visibilityValue}
                onChange={(event) => {
                  const nextVisibility = event.target.value as VideoDraftView["visibility"];
                  if (isWorkflowMode) {
                    setWorkflowForm((current) => ({
                      ...current,
                      visibility: nextVisibility
                    }));
                    return;
                  }

                  setVideoForm((current) => ({
                    ...current,
                    visibility: nextVisibility
                  }));
                }}
              >
                <option value="public">公开</option>
                <option value="link">链接可见</option>
                <option value="private">仅自己可见</option>
              </select>
            </div>
          </div>

          {notice ? <p className={noticeClassName(notice)}>{notice.text}</p> : null}
          {locked ? <p className={styles.lockedText}>当前草稿已提交，如需继续修改，请创建新的发布草稿。</p> : null}
        </section>
      </main>
    </PageShell>
  );
}
