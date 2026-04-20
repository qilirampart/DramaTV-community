"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useMemo, useRef, useState, useTransition } from "react";
import { PageShell } from "@/components/shared/PageShell";
import type { ApiPostDraftUpdateInput } from "@/lib/contracts/community-api";
import type {
  DiscussionChannelView,
  PostDraftView,
  PublishPageView
} from "@/lib/contracts/view-models";
import {
  savePostDraftAction,
  submitPostDraftAction,
  uploadAssetAction,
  type PublishDraftActionResult
} from "@/features/publish/actions";
import { DiscussionMarkdown } from "./discussion-markdown";
import styles from "./DiscussionComposerPage.module.css";

type DiscussionComposerPageProps = {
  view: PublishPageView;
  channels: DiscussionChannelView[];
};

type NoticeTone = "neutral" | "success" | "error";

type ComposerNotice = {
  tone: NoticeTone;
  text: string;
};

type PostFormState = {
  title: string;
  channelSlug: string;
  tagNames: string;
  content: string;
};

const TEXT = {
  back: "\u2190 \u8fd4\u56de\u8d85\u80fd\u793e\u533a",
  preview: "\u9884\u89c8",
  edit: "\u8fd4\u56de\u7f16\u8f91",
  save: "\u4fdd\u5b58\u8349\u7a3f",
  submit: "\u53d1\u5e03\u5e16\u5b50",
  processing: "\u5904\u7406\u4e2d...",
  title: "\u53d1\u8d77\u4e00\u7bc7\u50cf\u6837\u7684\u8ba8\u8bba\u5e16",
  subtitle:
    "\u8fd9\u91cc\u4e0d\u53d1\u4f5c\u54c1\u6863\u6848\uff0c\u800c\u662f\u53d1\u5e03\u95ee\u9898\u3001\u590d\u76d8\u3001\u65b9\u6cd5\u8bba\u548c\u793e\u533a\u8ba8\u8bba\u3002\u652f\u6301 Markdown \u7f16\u5199\uff0c\u56fe\u7247\u548c\u89c6\u9891\u53ef\u4ee5\u76f4\u63a5\u63d2\u5165\u6b63\u6587\u3002",
  currentChannel: "\u5f53\u524d\u677f\u5757",
  format: "\u7f16\u8f91\u683c\u5f0f",
  formatValue: "Markdown + \u5a92\u4f53\u63d2\u5165",
  draftStatus: "\u8349\u7a3f\u72b6\u6001",
  draftLocked: "\u5df2\u9501\u5b9a",
  draftEditable: "\u53ef\u7ee7\u7eed\u7f16\u8f91",
  postTitle: "\u5e16\u5b50\u6807\u9898",
  postTitlePlaceholder:
    "\u4f8b\u5982\uff1a\u53d1\u5e16\u540e\u5de5\u4f5c\u6d41\u7ed1\u5b9a\u5e94\u8be5\u5982\u4f55\u8bbe\u8ba1\uff1f",
  heading: "\u6807\u9898",
  quote: "\u5f15\u7528",
  list: "\u5217\u8868",
  code: "\u4ee3\u7801\u5757",
  image: "\u63d2\u56fe",
  video: "\u63d2\u89c6\u9891",
  livePreview: "\u5b9e\u65f6\u9884\u89c8",
  previewEmpty: "\u6b63\u6587\u8fd8\u6ca1\u6709\u5185\u5bb9\uff0c\u5148\u5728\u5de6\u4fa7\u5199\u70b9\u4e1c\u897f\u3002",
  chooseChannel: "\u677f\u5757\u9009\u62e9",
  chooseChannelFallback: "\u9009\u62e9\u4e00\u4e2a\u677f\u5757",
  tags: "\u6807\u7b7e",
  tagsPlaceholder: "\u4f8b\u5982\uff1a\u5de5\u4f5c\u6d41\u8bbe\u8ba1, \u793e\u533a\u673a\u5236, \u590d\u76d8",
  guide: "\u53d1\u5e16\u5efa\u8bae",
  guideOne: "\u5148\u5199\u7ed3\u8bba\uff0c\u518d\u5199\u8fc7\u7a0b\uff0c\u522b\u4eba\u66f4\u5bb9\u6613\u53c2\u4e0e\u8ba8\u8bba\u3002",
  guideTwo: "\u5982\u679c\u6709\u56fe\u6216\u89c6\u9891\uff0c\u63d2\u8fdb\u6b63\u6587\uff0c\u4e0d\u8981\u53ea\u5199\u201c\u89c1\u9644\u4ef6\u201d\u3002",
  guideThree: "\u6807\u9898\u5c3d\u91cf\u5177\u4f53\uff0c\u907f\u514d\u201c\u6c42\u52a9\u201d\u201c\u6709\u95ee\u9898\u201d\u8fd9\u79cd\u6cdb\u6807\u9898\u3002",
  guideFour: "Markdown \u9002\u5408\u6c89\u6dc0\u65b9\u6cd5\u8bba\uff0c\u540e\u9762\u4e5f\u65b9\u4fbf\u7ee7\u7eed\u5f15\u7528\u548c\u6574\u7406\u3002",
  listPreview: "\u5217\u8868\u9884\u89c8",
  unselectedChannel: "\u672a\u9009\u677f\u5757",
  draftLockedText: "\u5f53\u524d\u5e16\u5b50\u8349\u7a3f\u5df2\u4e0d\u518d\u53ef\u7f16\u8f91\u3002",
  summaryFallback: "\u8fd9\u91cc\u4f1a\u63d0\u53d6\u6b63\u6587\u6458\u8981\uff0c\u4f5c\u4e3a\u5217\u8868\u9875\u91cc\u7684\u9884\u89c8\u6587\u6848\u3002",
  titleFallback: "\u8fd9\u91cc\u4f1a\u663e\u793a\u4f60\u7684\u5e16\u5b50\u6807\u9898",
  saving: "\u6b63\u5728\u4fdd\u5b58\u5e16\u5b50\u8349\u7a3f...",
  publishing: "\u6b63\u5728\u53d1\u5e03\u5e16\u5b50...",
  imageTypeError: "\u8bf7\u9009\u62e9\u56fe\u7247\u6587\u4ef6\u3002",
  videoTypeError: "\u8bf7\u9009\u62e9\u89c6\u9891\u6587\u4ef6\u3002",
  imageUploadingPrefix: "\u6b63\u5728\u4e0a\u4f20\u56fe\u7247\uff1a",
  videoUploadingPrefix: "\u6b63\u5728\u4e0a\u4f20\u89c6\u9891\uff1a",
  imageInserted: "\u56fe\u7247\u5df2\u63d2\u5165\u6b63\u6587\u3002",
  videoInserted: "\u89c6\u9891\u5df2\u63d2\u5165\u6b63\u6587\u3002",
  imageUploadFailed: "\u56fe\u7247\u4e0a\u4f20\u5931\u8d25\u3002",
  videoUploadFailed: "\u89c6\u9891\u4e0a\u4f20\u5931\u8d25\u3002",
  previewFocus: "Preview Focus",
  splitView: "Split View"
} as const;

function textOrEmpty(value?: string) {
  return value ?? "";
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toTagArray(value: string) {
  return value
    .split(/[，,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function toPostFormState(draft: PostDraftView, channels: DiscussionChannelView[]): PostFormState {
  return {
    title: textOrEmpty(draft.title),
    channelSlug: textOrEmpty(draft.channelSlug) || textOrEmpty(channels[0]?.slug),
    tagNames: draft.tagNames.join(", "),
    content: textOrEmpty(draft.content)
  };
}

function noticeClassName(tone: NoticeTone) {
  if (tone === "success") {
    return `${styles.notice} ${styles.noticeSuccess}`;
  }

  if (tone === "error") {
    return `${styles.notice} ${styles.noticeError}`;
  }

  return styles.notice;
}

function createMediaMarkup(kind: "image" | "video", url: string, name: string) {
  if (kind === "image") {
    return `\n![${name}](${url})\n`;
  }

  return `\n[${"\u89c6\u9891\uff1a"}${name}](${url})\n`;
}

function insertAtCursor(
  currentValue: string,
  selectionStart: number | null,
  selectionEnd: number | null,
  snippet: string
) {
  const start = selectionStart ?? currentValue.length;
  const end = selectionEnd ?? currentValue.length;
  return `${currentValue.slice(0, start)}${snippet}${currentValue.slice(end)}`;
}

function MarkdownIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M3.8 4.5h12.4a1.3 1.3 0 0 1 1.3 1.3v8.4a1.3 1.3 0 0 1-1.3 1.3H3.8a1.3 1.3 0 0 1-1.3-1.3V5.8a1.3 1.3 0 0 1 1.3-1.3Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="m5.9 12.7.1-4.4 1.9 2.3 1.9-2.3.1 4.4M13 12.7V8.3m0 4.4 1.8-2.2 1.8 2.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <rect width="12.5" height="10" x="3.75" y="5" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8.2" r="1.2" fill="currentColor" />
      <path d="m5.9 13.1 2.6-2.5 1.9 1.7 1.8-2.2 2 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <rect width="11.5" height="9" x="3.25" y="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m9 8 3 2-3 2V8Z" fill="currentColor" />
      <path d="m14.8 8.2 2-.9v5.4l-2-.9" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.3" />
    </svg>
  );
}

function PreviewIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M2.7 10s2.6-4.3 7.3-4.3 7.3 4.3 7.3 4.3-2.6 4.3-7.3 4.3S2.7 10 2.7 10Z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M5 4.2h8l2 2v9.6a1.2 1.2 0 0 1-1.2 1.2H6.2A1.2 1.2 0 0 1 5 15.8V4.2Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 4.2h5.5v3H7zM7.3 15v-4.2h5.4V15" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PublishIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="m4 10 11.5-5-3.6 10-2.2-3.2L4 10Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="m9.7 11.8-2 3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

export function DiscussionComposerPage({ view, channels }: DiscussionComposerPageProps) {
  const router = useRouter();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [postDraft, setPostDraft] = useState(view.postDraft);
  const [form, setForm] = useState(() => toPostFormState(view.postDraft, channels));
  const [previewMode, setPreviewMode] = useState(false);
  const [notice, setNotice] = useState<ComposerNotice | null>(null);
  const [uploadPending, setUploadPending] = useState(false);
  const [pending, startTransition] = useTransition();

  const currentChannel =
    channels.find((channel) => channel.slug === form.channelSlug) ??
    channels[0];

  const busy = pending || uploadPending;
  const locked = postDraft.statusCode !== "draft";

  const previewSummary = useMemo(() => {
    const excerpt = form.content
      .replace(/!\[[^\]]*]\(([^)]+)\)/g, "")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/[#>*`\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return excerpt.length > 120 ? `${excerpt.slice(0, 120)}...` : excerpt;
  }, [form.content]);

  function buildPayload(): ApiPostDraftUpdateInput {
    return {
      title: normalizeOptionalText(form.title),
      channelSlug: normalizeOptionalText(form.channelSlug),
      content: normalizeOptionalText(form.content),
      tagNames: toTagArray(form.tagNames)
    };
  }

  function applyPostResult(result: PublishDraftActionResult<PostDraftView>) {
    if (!result.ok) {
      setNotice({
        tone: "error",
        text: result.message
      });
      return;
    }

    setPostDraft(result.draft);
    setForm(toPostFormState(result.draft, channels));
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
      text: TEXT.saving
    });

    startTransition(async () => {
      const result = await savePostDraftAction({
        draftId: postDraft.draftId,
        payload: buildPayload()
      });
      applyPostResult(result);
    });
  }

  function handleSubmit() {
    setNotice({
      tone: "neutral",
      text: TEXT.publishing
    });

    startTransition(async () => {
      const result = await submitPostDraftAction({
        draftId: postDraft.draftId,
        payload: buildPayload()
      });
      applyPostResult(result);
    });
  }

  async function uploadMedia(file: File, kind: "image" | "video") {
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);
    return uploadAssetAction(formData);
  }

  async function handleMediaInsert(
    event: ChangeEvent<HTMLInputElement>,
    kind: "image" | "video"
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const expectedPrefix = kind === "image" ? "image/" : "video/";
    if (!file.type.startsWith(expectedPrefix)) {
      setNotice({
        tone: "error",
        text: kind === "image" ? TEXT.imageTypeError : TEXT.videoTypeError
      });
      input.value = "";
      return;
    }

    setUploadPending(true);
    setNotice({
      tone: "neutral",
      text:
        kind === "image"
          ? `${TEXT.imageUploadingPrefix}${file.name}`
          : `${TEXT.videoUploadingPrefix}${file.name}`
    });

    try {
      const uploadResponse = await uploadMedia(file, kind);
      if (!uploadResponse.ok) {
        throw new Error(uploadResponse.message);
      }

      insertSnippet(createMediaMarkup(kind, uploadResponse.asset.publicUrl, file.name));
      setNotice({
        tone: "success",
        text: kind === "image" ? TEXT.imageInserted : TEXT.videoInserted
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : kind === "image"
              ? TEXT.imageUploadFailed
              : TEXT.videoUploadFailed
      });
    } finally {
      setUploadPending(false);
      input.value = "";
    }
  }

  function insertSnippet(snippet: string) {
    const selectionStart = editorRef.current?.selectionStart ?? null;
    const selectionEnd = editorRef.current?.selectionEnd ?? null;

    setForm((current) => ({
      ...current,
      content: insertAtCursor(current.content, selectionStart, selectionEnd, snippet)
    }));

    window.requestAnimationFrame(() => {
      if (!editorRef.current) {
        return;
      }

      const nextCursor = (selectionStart ?? editorRef.current.value.length) + snippet.length;
      editorRef.current.focus();
      editorRef.current.setSelectionRange(nextCursor, nextCursor);
    });
  }

  return (
    <PageShell variant="home" topNavActive="community">
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.topbar}>
            <Link className={styles.backLink} href="/discussions">
              {TEXT.back}
            </Link>

            <div className={styles.topbarActions}>
              <button className={styles.secondaryButton} disabled={busy || locked} type="button" onClick={handleSaveDraft}>
                <SaveIcon />
                {TEXT.save}
              </button>
              <button className={styles.primaryButton} disabled={busy || locked} type="button" onClick={handleSubmit}>
                <PublishIcon />
                {busy ? TEXT.processing : TEXT.submit}
              </button>
            </div>
          </div>

          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>DISCUSSION COMPOSER</span>
              <h1 className={styles.title}>{TEXT.title}</h1>
              <p className={styles.subtitle}>{TEXT.subtitle}</p>
            </div>

            <div className={styles.heroMeta}>
              <div className={styles.metaCard}>
                <strong>{TEXT.currentChannel}</strong>
                <span>{currentChannel?.title ?? TEXT.chooseChannelFallback}</span>
              </div>
              <div className={styles.metaCard}>
                <strong>{TEXT.format}</strong>
                <span>{TEXT.formatValue}</span>
              </div>
              <div className={styles.metaCard}>
                <strong>{TEXT.draftStatus}</strong>
                <span>{locked ? TEXT.draftLocked : TEXT.draftEditable}</span>
              </div>
            </div>
          </section>

          <div className={styles.layout}>
            <section className={styles.editorPanel}>
              <label className={styles.field}>
                <span className={styles.label}>{TEXT.postTitle}</span>
                <input
                  className={styles.titleInput}
                  disabled={busy || locked}
                  placeholder={TEXT.postTitlePlaceholder}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                />
              </label>

              <div className={styles.toolbar}>
                <button className={styles.toolbarButton} disabled={busy || locked} type="button" onClick={() => insertSnippet("\n## 小标题\n")}>
                  <MarkdownIcon />
                  {TEXT.heading}
                </button>
                <button className={styles.toolbarButton} disabled={busy || locked} type="button" onClick={() => insertSnippet("\n> 这里写引用或总结\n")}>
                  {TEXT.quote}
                </button>
                <button className={styles.toolbarButton} disabled={busy || locked} type="button" onClick={() => insertSnippet("\n- 要点一\n- 要点二\n")}>
                  {TEXT.list}
                </button>
                <button className={styles.toolbarButton} disabled={busy || locked} type="button" onClick={() => insertSnippet("\n```\n代码或配置\n```\n")}>
                  {TEXT.code}
                </button>
                <label className={styles.toolbarUpload}>
                  <input accept="image/*" disabled={busy || locked} type="file" onChange={(event) => handleMediaInsert(event, "image")} />
                  <ImageIcon />
                  {TEXT.image}
                </label>
                <label className={styles.toolbarUpload}>
                  <input accept="video/*" disabled={busy || locked} type="file" onChange={(event) => handleMediaInsert(event, "video")} />
                  <VideoIcon />
                  {TEXT.video}
                </label>
                <button
                  className={styles.toolbarPreviewButton}
                  disabled={busy}
                  type="button"
                  onClick={() => setPreviewMode(true)}
                >
                  <PreviewIcon />
                  {TEXT.preview}
                </button>
              </div>

              <textarea
                ref={editorRef}
                className={styles.editor}
                disabled={busy || locked}
                placeholder={"# \u4f60\u60f3\u8ba8\u8bba\u4ec0\u4e48\uff1f\n\n\u5148\u4ea4\u4ee3\u80cc\u666f\uff0c\u518d\u629b\u51fa\u95ee\u9898\uff0c\u6700\u540e\u9644\u4e0a\u4f60\u7684\u7ed3\u8bba\u6216\u5f85\u9a8c\u8bc1\u65b9\u6848\u3002"}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value
                  }))
                }
              />
            </section>

            <aside className={styles.sidePanel}>
              <div className={styles.sideCard}>
                <span className={styles.label}>{TEXT.chooseChannel}</span>
                <div className={styles.channelList}>
                  {channels.map((channel) => (
                    <button
                      className={form.channelSlug === channel.slug ? styles.channelButtonActive : styles.channelButton}
                      disabled={busy || locked}
                      key={channel.slug}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          channelSlug: channel.slug
                        }))
                      }
                    >
                      <strong>{channel.title}</strong>
                      <span>{channel.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.sideCard}>
                <label className={styles.field}>
                  <span className={styles.label}>{TEXT.tags}</span>
                  <input
                    className={styles.sideInput}
                    disabled={busy || locked}
                    placeholder={TEXT.tagsPlaceholder}
                    value={form.tagNames}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tagNames: event.target.value
                      }))
                    }
                  />
                </label>
              </div>

              <div className={styles.sideCard}>
                <span className={styles.label}>{TEXT.guide}</span>
                <ul className={styles.guidelines}>
                  <li>{TEXT.guideOne}</li>
                  <li>{TEXT.guideTwo}</li>
                  <li>{TEXT.guideThree}</li>
                  <li>{TEXT.guideFour}</li>
                </ul>
              </div>

              <div className={styles.sideCard}>
                <span className={styles.label}>{TEXT.listPreview}</span>
                <article className={styles.threadPreview}>
                  <div className={styles.threadPreviewMeta}>
                    <span>{currentChannel?.title ?? TEXT.unselectedChannel}</span>
                    <span>{toTagArray(form.tagNames).length} tags</span>
                  </div>
                  <strong>{form.title.trim() || TEXT.titleFallback}</strong>
                  <p>{previewSummary || TEXT.summaryFallback}</p>
                </article>
              </div>

              {notice ? <p className={noticeClassName(notice.tone)}>{notice.text}</p> : null}
              {locked ? <p className={styles.lockedText}>{TEXT.draftLockedText}</p> : null}
            </aside>
          </div>
        </div>
      </main>
      {previewMode ? (
        <div className={styles.previewOverlay} role="dialog" aria-modal="true" aria-label={TEXT.preview}>
          <div className={styles.previewDialog}>
            <div className={styles.previewHeader}>
              <span className={styles.label}>{TEXT.preview}</span>
              <button className={styles.previewCloseButton} type="button" onClick={() => setPreviewMode(false)}>
                {TEXT.edit}
              </button>
            </div>
            <div className={styles.previewBody}>
              {form.content.trim() ? (
                <DiscussionMarkdown content={form.content} />
              ) : (
                <div className={styles.previewEmpty}>{TEXT.previewEmpty}</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
