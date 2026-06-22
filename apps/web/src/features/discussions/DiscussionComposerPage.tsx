"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ContextBackLink } from "@/components/shared/ContextBackLink";
import { PageShell } from "@/components/shared/PageShell";
import { uploadAssetFromClient } from "@/lib/api/upload-client";
import { stripDiscussionContentToPlainText } from "@/lib/discussion-content";
import type { ApiPostDraftUpdateInput } from "@/lib/contracts/community-api";
import type {
  DiscussionComposerPageView,
  DiscussionChannelView,
  PostDraftView
} from "@/lib/contracts/view-models";
import {
  savePostDraftAction,
  submitPostDraftAction,
  type PublishDraftActionResult
} from "@/features/publish/actions";
import { DiscussionMarkdown } from "./discussion-markdown";
import { DiscussionRichEditor } from "./discussion-rich-editor";
import styles from "./DiscussionComposerPage.module.css";

type DiscussionComposerPageProps = {
  view: DiscussionComposerPageView;
  channels: DiscussionChannelView[];
  initialChannelSlug?: string;
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
  breadcrumbRoot: "社区",
  breadcrumbCurrent: "发布帖子",
  save: "保存草稿",
  submit: "发布帖子",
  processing: "处理中...",
  title: "发起一篇值得讨论的帖子",
  subtitle: "分享你的创作经验、方法与思考，帮助更多创作者成长。",
  titleLabel: "帖子标题",
  titlePlaceholder: "给帖子起一个清晰、有吸引力的标题吧（建议 5-80 字）",
  titleHint: "标题越具体，越容易被别人理解并参与讨论。",
  channelLabel: "发布频道",
  editorLabel: "编辑内容",
  editorHint: "现在是所见即所得编辑，标题、字号、颜色、图片和视频都会直接在正文里呈现。",
  editorPlaceholder:
    "在这里写下你的想法吧...\n\n建议包含以下内容，让你的帖子更有价值：\n\n- 背景与目标：你想要解决什么问题，达成什么效果？\n- 方法与步骤：你具体做了哪些尝试，使用了哪些工具或模型？\n- 结果与效果：效果如何？有哪些值得注意的细节？\n- 问题与思考：遇到了哪些问题？有哪些思考或改进方向？\n- 总结与建议：你的总结、经验或建议是什么？",
  tagsLabel: "话题标签",
  tagsHint: "添加合适的话题，帮助更多人发现你的内容。",
  tagsPlaceholder: "例如：AI视频，工作流，社区讨论，剪辑，提示词",
  sideChannelLabel: "发布频道",
  sideRulesLabel: "社区规范",
  sideTopicsLabel: "推荐话题",
  sideSummaryLabel: "发布摘要",
  preview: "预览",
  backToEdit: "返回编辑",
  draftLockedText: "当前帖子草稿已提交，不能继续编辑。",
  channelFallback: "未选择频道",
  summaryEmptyTitle: "未填写",
  summaryFilledTitle: "已填写",
  summaryNoTag: "0 个",
  summaryReadingFallback: "1 分钟内",
  previewEmpty: "正文还没有内容，先在编辑区写点东西。",
  saving: "正在保存帖子草稿...",
  publishing: "正在发布帖子...",
  imageUploadingPrefix: "正在上传图片：",
  videoUploadingPrefix: "正在上传视频：",
  imageInserted: "图片已插入正文。",
  videoInserted: "视频已插入正文。",
  imageUploadFailed: "图片上传失败。",
  videoUploadFailed: "视频上传失败。",
  summaryTitleStatus: "标题状态",
  summaryChannel: "发布频道",
  summaryTags: "话题标签",
  summaryReading: "预计阅读时长",
  summaryMedia: "插入媒体",
  summaryPending: "未填写",
  rules: [
    "尊重他人，友善讨论。",
    "内容真实，禁止虚假传播与引战。",
    "禁止广告、引流与恶意推广。",
    "图片和视频请尽量服务于正文表达。",
    "优先使用和内容真实相关的话题标签。"
  ],
  quickTopics: ["AI视频", "工作流", "社区讨论", "剪辑", "提示词", "创作复盘"]
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
    .slice(0, 8);
}

function mergeTags(currentValue: string, tag: string) {
  const currentTags = toTagArray(currentValue);
  if (currentTags.includes(tag)) {
    return currentTags.filter((item) => item !== tag).join(", ");
  }
  return [...currentTags, tag].slice(0, 8).join(", ");
}

function toPostFormState(
  draft: PostDraftView,
  channels: DiscussionChannelView[],
  initialChannelSlug?: string
): PostFormState {
  return {
    title: textOrEmpty(draft.title),
    channelSlug: textOrEmpty(draft.channelSlug) || textOrEmpty(initialChannelSlug) || textOrEmpty(channels[0]?.slug),
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

function computeReadingLabel(value: string) {
  const plainText = stripDiscussionContentToPlainText(value);

  if (!plainText) {
    return TEXT.summaryReadingFallback;
  }

  const minutes = Math.max(1, Math.ceil(plainText.length / 360));
  return `${minutes} 分钟`;
}

function countMediaSnippets(value: string) {
  const imageCount = (value.match(/<img\b[^>]*>/gi) ?? []).length + (value.match(/!\[[^\]]*]\(([^)]+)\)/g) ?? []).length;
  const videoCount =
    (value.match(/<figure\b[^>]*discussion-rich-video[^>]*>/gi) ?? []).length +
    (value.match(/\[视频：[^\]]+]\(([^)]+)\)/g) ?? []).length;
  return imageCount + videoCount;
}

function countCharacters(value: string) {
  return stripDiscussionContentToPlainText(value).replace(/\s+/g, "").length;
}

function countLines(value: string) {
  const plainText = stripDiscussionContentToPlainText(value);
  if (!plainText.trim()) {
    return 0;
  }

  return plainText.replace(/\r\n/g, "\n").split("\n").length;
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

function PreviewIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M2.7 10s2.6-4.3 7.3-4.3 7.3 4.3 7.3 4.3-2.6 4.3-7.3 4.3S2.7 10 2.7 10Z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function DiscussionComposerPage({ view, channels, initialChannelSlug }: DiscussionComposerPageProps) {
  const router = useRouter();
  const [postDraft, setPostDraft] = useState(view.postDraft);
  const [form, setForm] = useState(() => toPostFormState(view.postDraft, channels, initialChannelSlug));
  const [previewMode, setPreviewMode] = useState(false);
  const [notice, setNotice] = useState<ComposerNotice | null>(null);
  const [uploadPending, setUploadPending] = useState(false);
  const [pending, startTransition] = useTransition();

  const currentChannel =
    channels.find((channel) => channel.slug === form.channelSlug) ??
    channels[0];

  const busy = pending || uploadPending;
  const locked = !postDraft.lifecycle.editable;
  const tags = useMemo(() => toTagArray(form.tagNames), [form.tagNames]);
  const quickTopics = useMemo<string[]>(() => {
    const merged = [...TEXT.quickTopics] as string[];
    if (currentChannel?.title && !merged.includes(currentChannel.title)) {
      merged.unshift(currentChannel.title);
    }
    return merged.slice(0, 8);
  }, [currentChannel?.title]);

  const previewSummary = useMemo(() => {
    const excerpt = stripDiscussionContentToPlainText(form.content);
    return excerpt.length > 120 ? `${excerpt.slice(0, 120)}...` : excerpt;
  }, [form.content]);

  const titleLength = form.title.trim().length;
  const readingLabel = useMemo(() => computeReadingLabel(form.content), [form.content]);
  const mediaCount = useMemo(() => countMediaSnippets(form.content), [form.content]);
  const characterCount = useMemo(() => countCharacters(form.content), [form.content]);
  const lineCount = useMemo(() => countLines(form.content), [form.content]);

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
    setForm(toPostFormState(result.draft, channels, initialChannelSlug));
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
    return uploadAssetFromClient({
      kind,
      assetRole: "attachment",
      file
    });
  }

  async function handleImageUpload(file: File) {
    setNotice({
      tone: "neutral",
      text: `${TEXT.imageUploadingPrefix}${file.name}`
    });

    try {
      const uploadResponse = await uploadMedia(file, "image");
      const url = uploadResponse.mediaPath || uploadResponse.publicUrl;
      setNotice({
        tone: "success",
        text: TEXT.imageInserted
      });
      return {
        url,
        alt: file.name
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : TEXT.imageUploadFailed;
      setNotice({
        tone: "error",
        text: message
      });
      throw error;
    }
  }

  async function handleVideoUpload(file: File) {
    setNotice({
      tone: "neutral",
      text: `${TEXT.videoUploadingPrefix}${file.name}`
    });

    try {
      const uploadResponse = await uploadMedia(file, "video");
      const url = uploadResponse.mediaPath || uploadResponse.publicUrl;
      setNotice({
        tone: "success",
        text: TEXT.videoInserted
      });
      return {
        url,
        title: file.name
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : TEXT.videoUploadFailed;
      setNotice({
        tone: "error",
        text: message
      });
      throw error;
    }
  }

  return (
    <PageShell variant="home" topNavActive="community">
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.breadcrumbs}>
            <ContextBackLink className={styles.breadcrumbLink} href="/discussions">
              {TEXT.breadcrumbRoot}
            </ContextBackLink>
            <span className={styles.breadcrumbDivider}>›</span>
            <span className={styles.breadcrumbCurrent}>{TEXT.breadcrumbCurrent}</span>
          </div>

          <div className={styles.layout}>
            <section className={styles.editorColumn}>
              <section className={styles.hero}>
                <div className={styles.heroCopy}>
                  <h1 className={styles.title}>{TEXT.title}</h1>
                  <p className={styles.subtitle}>{TEXT.subtitle}</p>
                </div>

                <div className={styles.heroActions}>
                  <button className={styles.secondaryButton} disabled={busy || locked} type="button" onClick={handleSaveDraft}>
                    <SaveIcon />
                    {TEXT.save}
                  </button>
                  <button className={styles.primaryButton} disabled={busy || locked} type="button" onClick={handleSubmit}>
                    <PublishIcon />
                    {busy ? TEXT.processing : TEXT.submit}
                  </button>
                </div>
              </section>

              <section className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>
                  <div>
                    <h2 className={styles.sectionTitle}>{TEXT.titleLabel}</h2>
                    <p className={styles.sectionHint}>{TEXT.titleHint}</p>
                  </div>
                  <span className={styles.sectionMeta}>{titleLength}/80</span>
                </div>
                <article className={styles.sectionCard}>
                  <input
                    className={styles.titleInput}
                    disabled={busy || locked}
                    placeholder={TEXT.titlePlaceholder}
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value
                      }))
                    }
                  />
                </article>
              </section>

              <section className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>
                  <div>
                    <h2 className={styles.sectionTitle}>{TEXT.channelLabel}</h2>
                  </div>
                </div>
                <article className={styles.sectionCard}>
                  <div className={styles.channelGrid}>
                    {channels.map((channel) => {
                      const active = form.channelSlug === channel.slug;
                      return (
                        <button
                          className={active ? styles.channelButtonActive : styles.channelButton}
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
                          <span className={styles.channelIndicator} />
                          <div className={styles.channelCopy}>
                            <strong>{channel.title}</strong>
                            <span>{channel.description}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </article>
              </section>

              <section className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>
                  <div>
                    <h2 className={styles.sectionTitle}>{TEXT.editorLabel}</h2>
                    <p className={styles.sectionHint}>{TEXT.editorHint}</p>
                  </div>
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

                <article className={styles.sectionCard}>
                  <DiscussionRichEditor
                    disabled={busy || locked}
                    placeholder={TEXT.editorPlaceholder}
                    value={form.content}
                    onBusyChange={setUploadPending}
                    onChange={(content) =>
                      setForm((current) => ({
                        ...current,
                        content
                      }))
                    }
                    onImageUpload={handleImageUpload}
                    onVideoUpload={handleVideoUpload}
                  />
                </article>
              </section>

              <section className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>
                  <div>
                    <h2 className={styles.sectionTitle}>{TEXT.tagsLabel}</h2>
                    <p className={styles.sectionHint}>{TEXT.tagsHint}</p>
                  </div>
                  <span className={styles.sectionMeta}>已选 {tags.length}/8</span>
                </div>

                <article className={styles.sectionCard}>
                  <input
                    className={styles.tagInput}
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

                  <div className={styles.tagRow}>
                    {quickTopics.map((topic) => {
                      const active = tags.includes(topic);
                      return (
                        <button
                          className={active ? styles.tagChipActive : styles.tagChip}
                          disabled={busy || locked}
                          key={topic}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              tagNames: mergeTags(current.tagNames, topic)
                            }))
                          }
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </article>
              </section>
            </section>

            <aside className={styles.sidePanel}>
              <article className={styles.sideCard}>
                <div className={styles.sideHeader}>
                  <span className={styles.sideLabel}>{TEXT.sideChannelLabel}</span>
                </div>
                <div className={styles.currentChannelCard}>
                  <strong>{currentChannel?.title ?? TEXT.channelFallback}</strong>
                  <p>{currentChannel?.description ?? "选择一个频道，让帖子进入正确的讨论语境。"}</p>
                  <span>{currentChannel?.threadCountLabel ?? "频道数据加载中"}</span>
                </div>
              </article>

              <article className={styles.sideCard}>
                <div className={styles.sideHeader}>
                  <span className={styles.sideLabel}>{TEXT.sideRulesLabel}</span>
                </div>
                <ul className={styles.ruleList}>
                  {TEXT.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </article>

              <article className={styles.sideCard}>
                <div className={styles.sideHeader}>
                  <span className={styles.sideLabel}>{TEXT.sideTopicsLabel}</span>
                </div>
                <div className={styles.topicList}>
                  {quickTopics.map((topic) => {
                    const active = tags.includes(topic);
                    return (
                      <button
                        className={active ? styles.topicButtonActive : styles.topicButton}
                        disabled={busy || locked}
                        key={`side-${topic}`}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            tagNames: mergeTags(current.tagNames, topic)
                          }))
                        }
                      >
                        #{topic}
                      </button>
                    );
                  })}
                </div>
              </article>

              <article className={styles.sideCard}>
                <div className={styles.sideHeader}>
                  <span className={styles.sideLabel}>{TEXT.sideSummaryLabel}</span>
                </div>
                <div className={styles.summaryList}>
                  <div className={styles.summaryRow}>
                    <span>{TEXT.summaryTitleStatus}</span>
                    <strong>{titleLength > 0 ? TEXT.summaryFilledTitle : TEXT.summaryEmptyTitle}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>{TEXT.summaryChannel}</span>
                    <strong>{currentChannel?.title ?? TEXT.channelFallback}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>{TEXT.summaryTags}</span>
                    <strong>{tags.length > 0 ? `${tags.length} 个` : TEXT.summaryNoTag}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>{TEXT.summaryReading}</span>
                    <strong>{readingLabel}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>{TEXT.summaryMedia}</span>
                    <strong>{mediaCount > 0 ? `${mediaCount} 个` : TEXT.summaryPending}</strong>
                  </div>
                </div>
              </article>

              {notice ? <p className={noticeClassName(notice.tone)}>{notice.text}</p> : null}
              {locked ? <p className={styles.lockedText}>{TEXT.draftLockedText}</p> : null}
            </aside>
          </div>
        </div>
      </main>

      {previewMode ? (
        <div aria-label={TEXT.preview} aria-modal="true" className={styles.previewOverlay} role="dialog">
          <div className={styles.previewDialog}>
            <div className={styles.previewHeader}>
              <span className={styles.sideLabel}>{TEXT.preview}</span>
              <button className={styles.previewCloseButton} type="button" onClick={() => setPreviewMode(false)}>
                {TEXT.backToEdit}
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
