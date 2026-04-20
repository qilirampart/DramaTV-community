"use client";

import Link from "next/link";
import { type ChangeEvent, useState, useTransition } from "react";
import { PageShell } from "@/components/shared/PageShell";
import type { ApiVideoDraftUpdateInput } from "@/lib/contracts/community-api";
import type { PublishPageView, VideoDraftView } from "@/lib/contracts/view-models";
import type { PublishDraftActionResult } from "@/features/publish/actions";
import {
  saveVideoDraftAction,
  submitVideoDraftAction,
  uploadAssetAction
} from "@/features/publish/actions";
import styles from "./PublishPage.module.css";

type PublishPageProps = {
  view: PublishPageView;
};

type DraftNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

type ArchiveType = "prompt" | "tool" | "asset" | "workflow";

type VideoDraftFormState = {
  title: string;
  summary: string;
  categoryCode: ArchiveType;
  visibility: VideoDraftView["visibility"];
  coverAssetId: string;
  sourceAssetId: string;
};

const ARCHIVE_TYPES: Array<{
  value: ArchiveType;
  label: string;
  icon: string;
}> = [
  { value: "prompt", label: "导演提示词", icon: "⌁" },
  { value: "tool", label: "AI 工具库", icon: "⌘" },
  { value: "asset", label: "素材品", icon: "▧" },
  { value: "workflow", label: "工作流", icon: "▤" }
];

function textOrEmpty(value?: string) {
  return value ?? "";
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toVideoFormState(draft: VideoDraftView): VideoDraftFormState {
  const normalizedCategory = draft.categoryCode as ArchiveType | undefined;
  const categoryCode = ARCHIVE_TYPES.some((item) => item.value === normalizedCategory)
    ? normalizedCategory ?? "prompt"
    : "prompt";

  return {
    title: textOrEmpty(draft.title),
    summary: textOrEmpty(draft.summary),
    categoryCode,
    visibility: draft.visibility,
    coverAssetId: textOrEmpty(draft.coverAssetId),
    sourceAssetId: textOrEmpty(draft.sourceAssetId)
  };
}

function getArchiveTypeLabel(value: ArchiveType) {
  return ARCHIVE_TYPES.find((item) => item.value === value)?.label ?? "导演提示词";
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
      <path d="M10 6.5v15M18 6.5v15M5 12h18M5 16h18" stroke="currentColor" strokeWidth="1.15" />
    </svg>
  );
}

function WandIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 18 18">
      <path d="m12.8 2.8 2.4 2.4-8.6 8.6-2.4-2.4 8.6-8.6Z" stroke="currentColor" strokeWidth="1.35" />
      <path d="m11.5 4.2 2.2 2.2M4 4.6l.5 1.3 1.3.5-1.3.5L4 8.2l-.5-1.3-1.3-.5 1.3-.5L4 4.6ZM13.7 11.4l.4 1 .9.4-.9.4-.4 1-.4-1-.9-.4.9-.4.4-1Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.15" />
    </svg>
  );
}

export function PublishPage({ view }: PublishPageProps) {
  const [videoDraft, setVideoDraft] = useState(view.videoDraft);
  const [videoForm, setVideoForm] = useState(() => toVideoFormState(view.videoDraft));
  const [coreContent, setCoreContent] = useState("");
  const [notice, setNotice] = useState<DraftNotice | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploadPending, setUploadPending] = useState(false);

  const locked = videoDraft.statusCode !== "draft";
  const busy = pending || uploadPending;
  const coverReady = videoForm.coverAssetId.trim().length > 0;
  const sourceReady = videoForm.sourceAssetId.trim().length > 0;
  const canEdit = !busy && !locked;
  const selectedTypeLabel = getArchiveTypeLabel(videoForm.categoryCode);

  function buildVideoPayload(): ApiVideoDraftUpdateInput {
    return {
      title: normalizeOptionalText(videoForm.title),
      summary: normalizeOptionalText(videoForm.summary),
      categoryCode: videoForm.categoryCode,
      tagNames: [selectedTypeLabel],
      visibility: videoForm.visibility,
      coverAssetId: normalizeOptionalText(videoForm.coverAssetId),
      sourceAssetId: normalizeOptionalText(videoForm.sourceAssetId)
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
    setNotice({
      tone: "success",
      text: result.message
    });
  }

  function handleSaveDraft() {
    setNotice({
      tone: "neutral",
      text: "正在保存档案草稿..."
    });

    startTransition(async () => {
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
      text: "正在提交档案..."
    });

    startTransition(async () => {
      const result = await submitVideoDraftAction({
        draftId: videoDraft.draftId,
        payload: buildVideoPayload()
      });
      applyVideoResult(result);
    });
  }

  async function uploadAsset(file: File, kind: "image" | "video") {
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);
    return uploadAssetAction(formData);
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
        text: "请选择 JPG、PNG 或 WEBP 封面。"
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
      const uploadResponse = await uploadAsset(file, "image");
      if (!uploadResponse.ok) {
        throw new Error(uploadResponse.message);
      }

      const nextPayload = {
        ...buildVideoPayload(),
        coverAssetId: uploadResponse.asset.assetId
      };

      setVideoForm((current) => ({
        ...current,
        coverAssetId: uploadResponse.asset.assetId
      }));

      const result = await saveVideoDraftAction({
        draftId: videoDraft.draftId,
        payload: nextPayload
      });
      applyVideoResult(result);
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

    if (!file.type.startsWith("video/")) {
      setNotice({
        tone: "error",
        text: "请选择视频文件。"
      });
      input.value = "";
      return;
    }

    setUploadPending(true);
    setNotice({
      tone: "neutral",
      text: `正在上传视频：${file.name}`
    });

    try {
      const uploadResponse = await uploadAsset(file, "video");
      if (!uploadResponse.ok) {
        throw new Error(uploadResponse.message);
      }

      const nextPayload = {
        ...buildVideoPayload(),
        sourceAssetId: uploadResponse.asset.assetId
      };

      setVideoForm((current) => ({
        ...current,
        sourceAssetId: uploadResponse.asset.assetId
      }));

      const result = await saveVideoDraftAction({
        draftId: videoDraft.draftId,
        payload: nextPayload
      });
      applyVideoResult(result);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "视频上传失败。"
      });
    } finally {
      setUploadPending(false);
      input.value = "";
    }
  }

  return (
    <PageShell variant="home" topNavActive="featured">
      <main className={styles.page}>
        <Link className={styles.cancelLink} href="/featured">
          ← 取消发布
        </Link>

        <section className={styles.heroGrid}>
          <div className={styles.leftColumn}>
            <div className={styles.titleRow}>
              <span className={styles.titleIcon}>
                <PlusIcon />
              </span>
              <div>
                <h1 className={styles.title}>发布新档案</h1>
                <p className={styles.subtitle}>分享你的 AI 创作资产，帮助社区共同成长。</p>
              </div>
            </div>

            <div className={styles.formBlock}>
              <label className={styles.field}>
                <span className={styles.label}>档案标题</span>
                <input
                  className={styles.input}
                  disabled={!canEdit}
                  placeholder="例如：电影感赛博朋克街道"
                  value={videoForm.title}
                  onChange={(event) =>
                    setVideoForm((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                />
              </label>

              <div className={styles.typeField}>
                <span className={styles.label}>档案类型</span>
                <div className={styles.typeGrid}>
                  {ARCHIVE_TYPES.map((item) => (
                    <button
                      className={videoForm.categoryCode === item.value ? styles.typeButtonActive : styles.typeButton}
                      disabled={!canEdit}
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setVideoForm((current) => ({
                          ...current,
                          categoryCode: item.value
                        }))
                      }
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className={styles.field}>
                <span className={styles.labelRow}>
                  <span className={styles.label}>档案描述</span>
                  <button className={styles.aiButton} disabled={!canEdit} type="button">
                    <WandIcon />
                    AI 优化描述
                  </button>
                </span>
                <textarea
                  className={styles.descriptionArea}
                  disabled={!canEdit}
                  placeholder="简介这个档案的核心价值..."
                  value={videoForm.summary}
                  onChange={(event) =>
                    setVideoForm((current) => ({
                      ...current,
                      summary: event.target.value
                    }))
                  }
                />
              </label>
            </div>
          </div>

          <aside className={styles.rightColumn}>
            <label className={styles.coverUploader}>
              <input accept="image/*" disabled={!canEdit} type="file" onChange={handleCoverSelect} />
              <span className={styles.uploaderIcon}>
                <UploadImageIcon />
              </span>
              <strong>{coverReady ? "封面已上传" : "点击上传封面"}</strong>
              <span>{coverReady ? videoForm.coverAssetId : "支持 JPG、PNG、WEBP"}</span>
            </label>

            <article className={styles.guideCard}>
              <h2>发布指南</h2>
              <ol>
                <li>
                  <span>01</span>
                  确保内容具有原创性或已获得授权
                </li>
                <li>
                  <span>02</span>
                  清晰的标题和描述有助于获得更多关注
                </li>
                <li>
                  <span>03</span>
                  分类准确能提高档案的搜索权重
                </li>
                <li>
                  <span>04</span>
                  高质量的封面图能显著提升点击率
                </li>
              </ol>
            </article>
          </aside>
        </section>

        <section className={styles.detailSection}>
          <div className={styles.detailColumn}>
            <div className={styles.mediaPickerRow}>
              <label className={styles.mediaPicker}>
                <input accept="image/*" disabled={!canEdit} type="file" onChange={handleCoverSelect} />
                <span>
                  <PlusIcon />
                </span>
                <strong>添加文件</strong>
              </label>

              <label className={styles.mediaPicker}>
                <input accept="video/*" disabled={!canEdit} type="file" onChange={handleSourceSelect} />
                <span>
                  <VideoIcon />
                </span>
                <strong>{sourceReady ? "视频已上传" : "VIDEO 01.MP4"}</strong>
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>核心内容（提示词 / 链接）</span>
              <textarea
                className={styles.coreArea}
                disabled={!canEdit}
                placeholder="输入提示词、工具链接或工作流说明..."
                value={coreContent}
                onChange={(event) => setCoreContent(event.target.value)}
              />
            </label>

            <button
              className={styles.submitButton}
              disabled={busy || locked}
              type="button"
              onClick={handleSubmit}
            >
              {busy ? "正在处理..." : "确认发布档案"}
            </button>

            <div className={styles.secondaryActions}>
              <button className={styles.saveButton} disabled={busy || locked} type="button" onClick={handleSaveDraft}>
                保存草稿
              </button>
              <select
                className={styles.visibilitySelect}
                disabled={!canEdit}
                value={videoForm.visibility}
                onChange={(event) =>
                  setVideoForm((current) => ({
                    ...current,
                    visibility: event.target.value as VideoDraftView["visibility"]
                  }))
                }
              >
                <option value="public">公开</option>
                <option value="link">链接可见</option>
                <option value="private">私密</option>
              </select>
            </div>

            {notice ? <p className={noticeClassName(notice)}>{notice.text}</p> : null}
            {locked ? <p className={styles.lockedText}>当前草稿已不再可编辑。</p> : null}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
