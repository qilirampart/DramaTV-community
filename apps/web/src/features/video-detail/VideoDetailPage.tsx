"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CommentThread } from "@/components/comments/CommentThread";
import { ReportModal } from "@/components/report/ReportModal";
import { ContextBackLink } from "@/components/shared/ContextBackLink";
import { PageShell } from "@/components/shared/PageShell";
import { useInteractiveVideoPreview } from "@/components/shared/useInteractiveVideoPreview";
import {
  type CommentActionResult,
  deletePromptCommentAction,
  deleteVideoCommentAction,
  loadMorePromptCommentsAction,
  loadMoreVideoCommentsAction,
  submitPromptCommentAction,
  submitVideoCommentAction,
  submitReportAction,
  togglePromptAuthorFollowAction,
  togglePromptCommentLikeAction,
  togglePromptFavoriteAction,
  togglePromptLikeAction,
  updatePromptCommentSettingsAction,
  updateVideoCommentSettingsAction,
  toggleVideoAuthorFollowAction,
  toggleVideoCommentLikeAction,
  toggleVideoFavoriteAction,
  toggleVideoLikeAction
} from "@/features/community-interactions/actions";
import { copyText } from "@/lib/browser/copy-text";
import type { VideoDetailPageView } from "@/lib/contracts/view-models";
import { promptPreviewVideoId } from "@/lib/prefill/prompt-detail-demo";
import { resolvePrefillVideoForDetail } from "@/lib/prefill/prefill-videos";
import { isVideoAssetUrl, normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import { appendBackSource } from "@/lib/routes/redirect-utils";
import styles from "./VideoDetailPage.module.css";

type VideoDetailPageProps = {
  view: VideoDetailPageView;
  backHref?: string;
};

type ActionNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

function applyCommentPatch(
  view: VideoDetailPageView,
  result: CommentActionResult,
  mode: "replace" | "append" = "replace"
): VideoDetailPageView {
  if (!result.ok) {
    return view;
  }

  return {
    ...view,
    commentPolicy: result.patch.commentPolicy ?? view.commentPolicy,
    stats: {
      ...view.stats,
      commentCount: mode === "replace" ? result.patch.commentCount : view.stats.commentCount
    },
    comments: {
      items: mode === "append" ? [...view.comments.items, ...result.patch.comments] : result.patch.comments,
      nextCursor: result.patch.nextCursor,
      hasMore: result.patch.hasMore
    }
  };
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 16.2 3.6 9.9a3.9 3.9 0 0 1 5.5-5.5L10 5.3l.9-.9a3.9 3.9 0 1 1 5.5 5.5L10 16.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.6 3.2h8.8c.8 0 1.4.6 1.4 1.4v12l-5.8-3.5-5.8 3.5v-12c0-.8.6-1.4 1.4-1.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.2 4.8h11.6c.7 0 1.2.5 1.2 1.2V13c0 .7-.5 1.2-1.2 1.2H9.2L5.3 17v-2.8H4.2c-.7 0-1.2-.5-1.2-1.2V6c0-.7.5-1.2 1.2-1.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.2 16.4V3.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.45" />
      <path
        d="M6.4 4.2h7.1l-1.8 3.1 1.8 3.1H6.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <rect height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.45" width="8.5" x="7.3" y="5.3" />
      <path
        d="M5.6 12.9H4.2A1.5 1.5 0 0 1 2.7 11.4V4.2A1.5 1.5 0 0 1 4.2 2.7h7.2a1.5 1.5 0 0 1 1.5 1.5v1.4"
        stroke="currentColor"
        strokeWidth="1.45"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="m7 13 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45" />
      <path
        d="M8 5h5v5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
      <path
        d="M13 10.5v3a1.2 1.2 0 0 1-1.2 1.2H5.5a1.2 1.2 0 0 1-1.2-1.2V7.2A1.2 1.2 0 0 1 5.5 6H8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <rect height="12.5" rx="1.5" stroke="currentColor" strokeWidth="1.45" width="14.5" x="2.75" y="3.75" />
      <circle cx="7.1" cy="8.1" fill="currentColor" r="1.15" />
      <path
        d="m4.8 13.4 3.2-3.1 2.3 2.1 2.4-2.9 2.5 3.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="10" cy="5.1" rx="5.6" ry="2.2" stroke="currentColor" strokeWidth="1.45" />
      <path d="M4.4 5.1v4.4c0 1.2 2.5 2.2 5.6 2.2s5.6-1 5.6-2.2V5.1" stroke="currentColor" strokeWidth="1.45" />
      <path d="M4.4 9.5v4.4c0 1.2 2.5 2.2 5.6 2.2s5.6-1 5.6-2.2V9.5" stroke="currentColor" strokeWidth="1.45" />
    </svg>
  );
}

function noticeClassName(notice: ActionNotice) {
  if (notice.tone === "success") {
    return "interaction-notice interaction-notice-success";
  }

  if (notice.tone === "error") {
    return "interaction-notice interaction-notice-error";
  }

  return "interaction-notice";
}

function getAvatarFallback(name: string) {
  return name.trim().charAt(0) || "D";
}

function formatCount(value: number) {
  return value.toLocaleString("zh-CN");
}

function formatDurationLabel(durationMs?: number) {
  if (!durationMs || !Number.isFinite(durationMs)) {
    return "时长待同步";
  }

  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${totalSeconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function buildPromptLikeText(view: VideoDetailPageView, summary?: string, workflowTitle?: string) {
  const cleanTags = view.tags.map((tag) => normalizeText(tag)).filter(Boolean);
  const tagSegment = cleanTags.length > 0 ? cleanTags.join("、") : "电影感、角色关系、体积光、冷色舞台、地面反光";
  const primaryScene =
    summary ?? `${view.title}，强调主体站位、材质细节、空间层次和氛围控制。`;
  const workflowSegment = workflowTitle
    ? `延展参考：如果后续需要拆方法，可继续绑定工作流「${workflowTitle}」。`
    : "延展参考：当前是独立提示词资源，先聚焦可复制提示词本身。";

  return [
    `主体描述：${primaryScene}`,
    `画面关键词：${tagSegment}`,
    "镜头建议：中近景构图，保留人物主体，强调光束方向、环境反射和前后景层次。",
    "氛围控制：冷色主调，顶部聚光，薄雾与边缘轮廓光同时存在，保证画面干净但不空。",
    "生成参数：纵向 2:3 构图，优先保留人物比例、服装纹理与地面反光质感。",
    workflowSegment
  ].join("\n\n");
}

function buildWorkflowArchiveText(workflowTitle: string, summary?: string, allowCopy?: boolean) {
  return [
    `工作流名称：${workflowTitle}`,
    summary ?? "这条内容当前归类为工作流资源，详情页这里不再展示提示词文本，只保留工作流入口与后续画布联动位。",
    allowCopy ? "当前状态：支持继续查看工作流，后续接入复制到画布。" : "当前状态：仅开放查看工作流详情。"
  ].join("\n\n");
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "刚刚";
  }

  const deltaMs = Date.now() - date.getTime();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (deltaMs < hour) {
    const minutes = Math.max(1, Math.round(deltaMs / (60 * 1000)));
    return `${minutes}分钟前`;
  }

  if (deltaMs < day) {
    return `${Math.max(1, Math.round(deltaMs / hour))}小时前`;
  }

  return `${Math.max(1, Math.round(deltaMs / day))}天前`;
}

function RelatedVideoCard({
  href,
  title,
  authorName,
  coverUrl,
  posterUrl,
  previewUrl,
  sourceUrl
}: {
  href: string;
  title: string;
  authorName: string;
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
}) {
  const imageUrl = [normalizeAssetUrl(posterUrl), normalizeAssetUrl(coverUrl)].find(
    (value): value is string => Boolean(value) && !isVideoAssetUrl(value)
  );
  const previewMediaUrl = normalizeAssetUrl(previewUrl) ?? normalizeAssetUrl(sourceUrl);
  const hasPreviewVideo = Boolean(previewMediaUrl);
  const {
    handlePreviewImmediateStart,
    handlePreviewStart,
    handlePreviewStop,
    isVideoReady,
    mediaRef,
    shouldLoadVideo,
    videoRef
  } =
    useInteractiveVideoPreview({
    enabled: hasPreviewVideo,
    loadOnViewport: false,
    unloadDelayMs: 1200,
    previewGroup: "video-detail-related",
    previewStartDelayMs: 160
    });

  return (
    <Link
      className={styles.recommendCard}
      href={href}
      onBlur={handlePreviewStop}
      onFocus={handlePreviewImmediateStart}
      onMouseEnter={handlePreviewStart}
      onMouseLeave={handlePreviewStop}
    >
      {hasPreviewVideo && previewMediaUrl ? (
        <span className={styles.recommendCardMediaSlot} ref={mediaRef}>
          <span
            className={styles.recommendCardMedia}
            style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
          />
          {shouldLoadVideo ? (
            <video
              ref={videoRef}
              className={`${styles.recommendCardMediaVideo} ${isVideoReady ? styles.recommendCardMediaVideoReady : ""}`}
              loop
              muted
              playsInline
              preload="metadata"
              src={previewMediaUrl}
            />
          ) : null}
        </span>
      ) : (
        <span
          className={styles.recommendCardMedia}
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        />
      )}
      <span className={styles.recommendCardShade} />
      <span className={styles.recommendCardCopy}>
        <strong>{title}</strong>
        <span>{authorName}</span>
      </span>
    </Link>
  );
}


export function VideoDetailPage({ view, backHref = "/featured" }: VideoDetailPageProps) {
  const [currentView, setCurrentView] = useState(view);
  const [interactionPendingKey, setInteractionPendingKey] = useState<string | null>(null);
  const [interactionNotice, setInteractionNotice] = useState<ActionNotice | null>(null);
  const [commentPending, setCommentPending] = useState(false);
  const [commentLikePendingId, setCommentLikePendingId] = useState<string | null>(null);
  const [commentManagementPendingId, setCommentManagementPendingId] = useState<string | null>(null);
  const [commentPolicyPending, setCommentPolicyPending] = useState(false);
  const [commentLoadMorePending, setCommentLoadMorePending] = useState(false);
  const [commentNotice, setCommentNotice] = useState<ActionNotice | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportPending, setReportPending] = useState(false);
  const [reportNotice, setReportNotice] = useState<ActionNotice | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(false);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [isMediaVideoReady, setIsMediaVideoReady] = useState(false);
  const mediaVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setCurrentView(view);
  }, [view]);

  const coverUrl =
    normalizeAssetUrl(currentView.media.coverUrl) ?? normalizeAssetUrl(currentView.media.posterUrl);
  const actualPlaybackUrl =
    normalizeAssetUrl(currentView.media.previewUrl) ?? normalizeAssetUrl(currentView.media.sourceUrl);
  const posterImageUrl = [coverUrl, normalizeAssetUrl(currentView.media.posterUrl)].find(
    (value): value is string => Boolean(value) && !isVideoAssetUrl(value)
  );
  const fallbackPrefillVideo = actualPlaybackUrl ? null : resolvePrefillVideoForDetail(currentView);
  const playbackUrl = actualPlaybackUrl ?? fallbackPrefillVideo?.src;
  const isImagePrompt = currentView.media.kind === "image";
  const summary = normalizeText(currentView.summary);
  const authorId = normalizeText(currentView.author.id);
  const authorName = normalizeText(currentView.author.displayName) ?? "匿名创作者";
  const authorAvatarUrl = normalizeAssetUrl(currentView.author.avatarUrl);
  const authorHref = authorId ? appendBackSource(`/creators/${authorId}`, backHref) : undefined;
  const workflowId = normalizeText(currentView.workflow?.id);
  const workflowHref = workflowId ? `/workflows/${workflowId}#canvas-entry` : undefined;
  const workflowTitle = normalizeText(currentView.workflow?.title) ?? "未公开工作流";
  const durationLabel = formatDurationLabel(currentView.media.durationMs);
  const resourceMode = currentView.workflow ? "workflow" : "prompt";
  const isPromptResource = resourceMode === "prompt";
  const isPromptPreviewDemo = currentView.id === promptPreviewVideoId;
  const isReadonlyPromptDetail = isPromptResource && (!authorId || isPromptPreviewDemo);
  const primaryBadge = isPromptResource ? "提示词" : "作品";
  const resourceText = isPromptResource
    ? normalizeText(currentView.promptText) ??
      buildPromptLikeText(currentView, summary, normalizeText(currentView.workflow?.title))
    : buildWorkflowArchiveText(workflowTitle, summary, currentView.workflow?.allowCopy);
  const detailTags = currentView.tags.slice(0, 4);
  const renderedComments = currentView.comments;
  const isCommentEmpty = currentView.comments.items.length === 0;
  const recommendationVideos = currentView.relatedVideos.slice(0, isPromptResource ? 4 : 2);
  const summaryText = isPromptResource
    ? summary ?? "这条提示词详情页会承接画面描述、镜头语言和可复制内容。"
    : summary ?? "这条作品暂时还没有补充简介。后续会在这里对齐参考页里的作品描述。";
  const authorMetaText = isPromptResource
    ? `社区提示词 · ${durationLabel} · 可直接复制`
    : currentView.workflow
      ? `社区作品 · ${durationLabel} · 已绑定工作流`
      : `社区作品 · ${durationLabel}`;
  const communityTitle = isPromptResource ? "提示词讨论" : "讨论区";
  const communityCountLabel = isPromptResource ? "条讨论" : "条评论";
  const emptyHintText = isPromptResource
    ? "还没有人参与讨论，快来发表你的想法吧。"
    : "还没有人发表评论，快来聊聊你的看法吧。";
  const composerPlaceholder = isPromptResource
    ? "补充这个提示词的适用题材、镜头语言、调参建议或替换关键词..."
    : "加入讨论，分享你的见解...";
  const sideSectionLabel = isPromptResource ? "相关作品" : "相关推荐";
  const previewNoticeText = isPromptPreviewDemo
    ? "当前是前端样式预览页，复制提示词可用，其余互动先不接真实后端。"
    : isReadonlyPromptDetail
      ? "当前提示词详情来自本地导入数据，支持浏览与复制，互动能力暂不写入后端。"
      : null;

  useEffect(() => {
    setHasPlaybackStarted(false);
    setIsPlaybackActive(false);
    setIsMediaVideoReady(false);
  }, [currentView.id, playbackUrl, isImagePrompt]);

  useEffect(() => {
    const video = mediaVideoRef.current;
    if (!video) {
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setIsMediaVideoReady(true);
    }
  }, [currentView.id, playbackUrl, isImagePrompt]);

  useEffect(() => {
    if (reportNotice?.tone !== "success") {
      return;
    }

    const timer = window.setTimeout(() => {
      setReportNotice(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [reportNotice]);

  const handleMediaVideoRef = useCallback((node: HTMLVideoElement | null) => {
    mediaVideoRef.current = node;
    if (node && node.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setIsMediaVideoReady((current) => current || true);
    }
  }, []);

  function handlePlaybackToggle() {
    if (!playbackUrl || isImagePrompt) {
      return;
    }

    const videoElement = mediaVideoRef.current;

    if (!videoElement) {
      return;
    }

    if (videoElement.paused) {
      setHasPlaybackStarted(true);
      setIsPlaybackActive(true);
      void videoElement.play().catch(() => {});
      return;
    }

    videoElement.pause();
    setIsPlaybackActive(false);
  }

  async function runInteraction(
    pendingKey: string,
    runner: () => Promise<{ ok: boolean; view?: VideoDetailPageView; message: string }>
  ) {
    setInteractionPendingKey(pendingKey);
    setInteractionNotice({
      tone: "neutral",
      text: "正在同步操作..."
    });

    try {
      const result = await runner();

      if (result.ok && result.view) {
        setCurrentView(result.view);
        setInteractionNotice({
          tone: "success",
          text: result.message
        });
        return;
      }

      setInteractionNotice({
        tone: "error",
        text: result.message
      });
    } finally {
      setInteractionPendingKey(null);
    }
  }

  async function handleCommentSubmit(input: { content: string; parentId?: string }) {
    setCommentPending(true);
    setCommentNotice({
      tone: "neutral",
      text: "正在发布评论..."
    });

    try {
      const result = isPromptResource
        ? await submitPromptCommentAction({
            promptId: currentView.id,
            content: input.content,
            parentId: input.parentId
          })
        : await submitVideoCommentAction({
            videoId: currentView.id,
            content: input.content,
            parentId: input.parentId
          });

      if (result.ok) {
        setCurrentView((current) => applyCommentPatch(current, result, "replace"));
        setCommentNotice({
          tone: "success",
          text: result.message
        });
        return true;
      }

      setCommentNotice({
        tone: "error",
        text: result.message
      });
      return false;
    } finally {
      setCommentPending(false);
    }
  }

  async function handleCommentLike(commentId: string, active: boolean) {
    if (isReadonlyPromptDetail) {
      return;
    }

    setCommentLikePendingId(commentId);
    setCommentNotice({
      tone: "neutral",
      text: "正在同步评论状态..."
    });

    try {
      const result = isPromptResource
        ? await togglePromptCommentLikeAction({
            promptId: currentView.id,
            commentId,
            active
          })
        : await toggleVideoCommentLikeAction({
            videoId: currentView.id,
            commentId,
            active
          });

      if (result.ok) {
        setCurrentView((current) => applyCommentPatch(current, result, "replace"));
        setCommentNotice({
          tone: "success",
          text: result.message
        });
        return;
      }

      setCommentNotice({
        tone: "error",
        text: result.message
      });
    } finally {
      setCommentLikePendingId(null);
    }
  }

  async function handleCommentDelete(commentId: string) {
    if (isReadonlyPromptDetail) {
      return;
    }

    setCommentManagementPendingId(commentId);
    setCommentNotice({
      tone: "neutral",
      text: "正在删除评论..."
    });

    try {
      const result = isPromptResource
        ? await deletePromptCommentAction({
            promptId: currentView.id,
            commentId
          })
        : await deleteVideoCommentAction({
            videoId: currentView.id,
            commentId
          });

      if (result.ok) {
        setCurrentView((current) => applyCommentPatch(current, result, "replace"));
        setCommentNotice({
          tone: "success",
          text: result.message
        });
        return;
      }

      setCommentNotice({
        tone: "error",
        text: result.message
      });
    } finally {
      setCommentManagementPendingId(null);
    }
  }

  async function handleCommentPolicyToggle(nextEnabled: boolean) {
    if (isReadonlyPromptDetail) {
      return;
    }

    setCommentPolicyPending(true);
    setCommentNotice({
      tone: "neutral",
      text: nextEnabled ? "正在开启评论区..." : "正在关闭评论区..."
    });

    try {
      const result = isPromptResource
        ? await updatePromptCommentSettingsAction({
            promptId: currentView.id,
            commentsEnabled: nextEnabled
          })
        : await updateVideoCommentSettingsAction({
            videoId: currentView.id,
            commentsEnabled: nextEnabled
          });

      if (result.ok) {
        setCurrentView((current) => applyCommentPatch(current, result, "replace"));
        setCommentNotice({
          tone: "success",
          text: result.message
        });
        return;
      }

      setCommentNotice({
        tone: "error",
        text: result.message
      });
    } finally {
      setCommentPolicyPending(false);
    }
  }

  async function handleLoadMoreComments() {
    const cursor = currentView.comments.nextCursor;
    if (!cursor) {
      return;
    }

    setCommentLoadMorePending(true);
    setCommentNotice({
      tone: "neutral",
      text: isPromptResource ? "正在加载更多讨论..." : "正在加载更多评论..."
    });

    try {
      const result = isPromptResource
        ? await loadMorePromptCommentsAction({
            promptId: currentView.id,
            cursor
          })
        : await loadMoreVideoCommentsAction({
            videoId: currentView.id,
            cursor
          });

      if (result.ok) {
        setCurrentView((current) => applyCommentPatch(current, result, "append"));
        setCommentNotice({
          tone: "success",
          text: result.message
        });
        return;
      }

      setCommentNotice({
        tone: "error",
        text: result.message
      });
    } finally {
      setCommentLoadMorePending(false);
    }
  }

  async function handleReportSubmit(input: {
    targetType: "video" | "workflow" | "prompt" | "post";
    targetId: string;
    reasonCode: "pornographic" | "political" | "spam" | "abuse" | "copyright" | "misleading" | "other";
    descriptionText?: string;
  }) {
    setReportPending(true);
    setReportNotice({
      tone: "neutral",
      text: "正在提交举报..."
    });

    try {
      const result = await submitReportAction(input);
      if (result.ok) {
        setReportNotice({
          tone: "success",
          text: "举报已提交。"
        });
        setReportOpen(false);
        return;
      }

      setReportNotice({
        tone: "error",
        text: result.message
      });
    } finally {
      setReportPending(false);
    }
  }

  async function handleCopyPrompt() {
    if (!isPromptResource) {
      return;
    }

    try {
      await copyText(resourceText);
      setInteractionNotice({
        tone: "success",
        text: "提示词已复制。"
      });
    } catch {
      setInteractionNotice({
        tone: "error",
        text: "复制失败，请稍后重试。"
      });
    }
  }

  async function handleComposerSubmit() {
    if (isReadonlyPromptDetail) {
      return;
    }

    const normalized = commentDraft.trim();
    if (!normalized) {
      return;
    }

    const success = await handleCommentSubmit({
      content: normalized
    });
    if (success) {
      setCommentDraft("");
    }
  }

  return (
    <PageShell variant="home" topNavActive="featured">
      <div className={styles.page}>
        <section className={styles.heroSection}>
          <ContextBackLink className={styles.backLink} href={backHref}>
            ← 返回列表
          </ContextBackLink>

          <div className={styles.heroGrid}>
            <div className={styles.mediaColumn}>
              <div className={styles.mediaFrame}>
                <div
                  className={styles.mediaPoster}
                  style={posterImageUrl ? { backgroundImage: `url(${posterImageUrl})` } : undefined}
                />
                {playbackUrl ? (
                  <video
                    ref={handleMediaVideoRef}
                    className={`${styles.mediaVideo} ${isMediaVideoReady ? styles.mediaVideoReady : ""}`}
                    controls={hasPlaybackStarted}
                    onCanPlay={() => setIsMediaVideoReady(true)}
                    onEnded={() => setIsPlaybackActive(false)}
                    onEmptied={() => setIsMediaVideoReady(false)}
                    onLoadedData={() => setIsMediaVideoReady(true)}
                    onPause={() => setIsPlaybackActive(false)}
                    onPlay={() => setIsPlaybackActive(true)}
                    playsInline
                    poster={posterImageUrl}
                    preload="metadata"
                    src={playbackUrl}
                    style={{ opacity: isMediaVideoReady ? 1 : 0 }}
                  />
                ) : null}

                {playbackUrl && !isImagePrompt ? (
                  <button className={styles.mediaToggle} type="button" onClick={handlePlaybackToggle}>
                    {isPlaybackActive ? "暂停播放" : "开始播放"}
                  </button>
                ) : null}
              </div>

              <article className={styles.authorCard}>
                <div className={styles.authorInfo}>
                  <span className={styles.authorAvatar}>
                    {authorAvatarUrl ? (
                      <span className={styles.authorAvatarImage} style={{ backgroundImage: `url(${authorAvatarUrl})` }} />
                    ) : (
                      <span className={styles.authorAvatarFallback}>{getAvatarFallback(authorName)}</span>
                    )}
                  </span>

                  <span className={styles.authorCopy}>
                    <strong>{authorName}</strong>
                    <span>{authorMetaText}</span>
                  </span>
                </div>

                <div className={styles.authorActions}>
                  {authorHref ? (
                    <Link className={styles.authorLink} href={authorHref}>
                      进入主页
                    </Link>
                  ) : null}
                  <button
                    className={`${styles.followButton} ${currentView.author.followed ? styles.followButtonActive : ""}`}
                  disabled={isReadonlyPromptDetail || !authorId || interactionPendingKey !== null}
                    type="button"
                    onClick={() =>
                      runInteraction("video-follow", () =>
                        isPromptResource
                          ? togglePromptAuthorFollowAction({
                              promptId: currentView.id,
                              authorId: currentView.author.id,
                              active: !currentView.author.followed
                            })
                          : toggleVideoAuthorFollowAction({
                              videoId: currentView.id,
                              authorId: currentView.author.id,
                              active: !currentView.author.followed
                            })
                      )
                    }
                  >
                    {!authorId
                      ? "作者待绑定"
                      : isReadonlyPromptDetail
                        ? "预览态"
                        : interactionPendingKey === "video-follow"
                          ? "处理中..."
                          : currentView.author.followed
                            ? "已关注"
                            : "关注作者"}
                  </button>
                </div>
              </article>
            </div>

            <div className={styles.contentColumn}>
              <div className={styles.metaRow}>
                <span className={styles.typeBadge}>{primaryBadge}</span>
                {detailTags.map((tag) => (
                  <span className={styles.keywordTag} key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>

              <h1 className={styles.title}>{currentView.title}</h1>
              <p className={styles.summary}>{summaryText}</p>

              <div className={styles.panelHeader}>
                <span className={styles.panelLabel}>{isPromptResource ? "提示词内容" : "核心内容"}</span>
                <div className={styles.panelLinks}>
                  {!isPromptResource && workflowHref ? (
                    <Link className={styles.panelLink} href={workflowHref}>
                      <ExternalLinkIcon />
                      查看工作流
                    </Link>
                  ) : null}
                  {isPromptResource ? (
                    <button className={styles.panelLinkButton} type="button" onClick={handleCopyPrompt}>
                      <CopyIcon />
                      复制提示词
                    </button>
                  ) : null}
                </div>
              </div>

              <div
                className={`${styles.promptPanel} ${
                  isPromptResource ? styles.promptPanelPrompt : styles.promptPanelWorkflow
                }`}
              >
                <pre>{resourceText}</pre>
              </div>

              <div className={styles.metricRow}>
                <button
                  className={`${styles.metricButton} ${currentView.viewerActions.liked ? styles.metricButtonActive : ""}`}
                  disabled={isReadonlyPromptDetail || interactionPendingKey !== null}
                  type="button"
                  onClick={() =>
                    runInteraction("video-like", () =>
                      isPromptResource
                        ? togglePromptLikeAction({
                            promptId: currentView.id,
                            active: !currentView.viewerActions.liked
                          })
                        : toggleVideoLikeAction({
                            videoId: currentView.id,
                            active: !currentView.viewerActions.liked
                          })
                    )
                  }
                >
                  <HeartIcon />
                  <span>
                    {isReadonlyPromptDetail
                      ? `点赞 ${formatCount(currentView.stats.likeCount)}`
                      : interactionPendingKey === "video-like"
                        ? "处理中..."
                        : `点赞 ${formatCount(currentView.stats.likeCount)}`}
                  </span>
                </button>

                <button
                  className={`${styles.metricButton} ${currentView.viewerActions.favorited ? styles.metricButtonActive : ""}`}
                  disabled={isReadonlyPromptDetail || interactionPendingKey !== null}
                  type="button"
                  onClick={() =>
                    runInteraction("video-favorite", () =>
                      isPromptResource
                        ? togglePromptFavoriteAction({
                            promptId: currentView.id,
                            active: !currentView.viewerActions.favorited
                          })
                        : toggleVideoFavoriteAction({
                            videoId: currentView.id,
                            active: !currentView.viewerActions.favorited
                          })
                    )
                  }
                >
                  <BookmarkIcon />
                  <span>
                    {isReadonlyPromptDetail
                      ? `收藏 ${formatCount(currentView.stats.favoriteCount)}`
                      : interactionPendingKey === "video-favorite"
                        ? "处理中..."
                        : `收藏 ${formatCount(currentView.stats.favoriteCount)}`}
                  </span>
                </button>

                <Link className={styles.metricButton} href="#video-comment-thread">
                  <CommentIcon />
                  <span>{isPromptResource ? `讨论 ${formatCount(currentView.stats.commentCount)}` : `评论 ${formatCount(currentView.stats.commentCount)}`}</span>
                </Link>

                <button className={styles.metricButton} type="button" onClick={() => setReportOpen(true)}>
                  <ReportIcon />
                  <span>举报</span>
                </button>
              </div>

              {interactionNotice ? (
                <p className={noticeClassName(interactionNotice)}>{interactionNotice.text}</p>
              ) : null}
              {reportNotice ? <p className={noticeClassName(reportNotice)}>{reportNotice.text}</p> : null}
              {previewNoticeText ? <p className={styles.previewNotice}>{previewNoticeText}</p> : null}
            </div>
          </div>
        </section>

        <section className={styles.communitySection} id="video-comment-thread">
          <div className={styles.communityGrid}>
            <div className={styles.commentsColumn}>
              <div className={styles.commentsHeader}>
                <div className={styles.commentsTitleRow}>
                  <CommentIcon />
                  <h2>{communityTitle}</h2>
                </div>
                <span className={styles.commentsCount}>
                  {formatCount(currentView.stats.commentCount)} {communityCountLabel}
                </span>
              </div>

              <CommentThread
                comments={renderedComments}
                emptyText={emptyHintText}
                hideHeader
                variant="video"
                disabled={isReadonlyPromptDetail}
                composer={{
                  placeholder: composerPlaceholder,
                  submitLabel: isPromptResource ? "发布讨论" : "发表评论",
                  notice: commentNotice,
                  pending: commentPending,
                  disabled: isReadonlyPromptDetail,
                  onSubmit: handleCommentSubmit
                }}
                commentActionPendingId={commentLikePendingId}
                commentManagementPendingId={commentManagementPendingId}
                onToggleLike={handleCommentLike}
                onDeleteComment={handleCommentDelete}
                commentPolicy={currentView.commentPolicy}
                policyPending={commentPolicyPending}
                onToggleCommenting={handleCommentPolicyToggle}
                loadMore={{
                  pending: commentLoadMorePending,
                  onLoadMore: handleLoadMoreComments
                }}
              />

              {false ? (
                <>
              {isCommentEmpty ? <p className={styles.demoHint}>{emptyHintText}</p> : null}

              <div className={styles.commentComposer}>
                <textarea
                  className={styles.commentTextarea}
                  disabled={isReadonlyPromptDetail || commentPending}
                  placeholder={composerPlaceholder}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                />

                <div className={styles.composerFooter}>
                  <div className={styles.composerTools}>
                    <button className={styles.composerTool} disabled type="button" aria-label="图片上传预留">
                      <ImageIcon />
                    </button>
                    <button className={styles.composerTool} disabled type="button" aria-label="素材引用预留">
                      <LayersIcon />
                    </button>
                  </div>

                  <button
                    className={styles.composerSubmit}
                    disabled={isReadonlyPromptDetail || commentPending || commentDraft.trim().length === 0}
                    type="button"
                    onClick={handleComposerSubmit}
                  >
                    {isReadonlyPromptDetail ? "预览态" : commentPending ? "发布中..." : "发表评论"}
                  </button>
                </div>

                {commentNotice ? (
                  <p className={`${noticeClassName(commentNotice!)} ${styles.commentNotice}`}>{commentNotice!.text}</p>
                ) : null}
              </div>

              <div className={styles.commentList}>
                {renderedComments.items.length > 0 ? (
                  renderedComments.items.map((comment) => {
                    const likePending = commentLikePendingId === comment.id;

                    return (
                      <article className={styles.commentItem} key={comment.id}>
                        <span className={styles.commentAvatar}>
                          {comment.authorAvatarUrl ? (
                            <span
                              className={styles.commentAvatarImage}
                              style={{ backgroundImage: `url(${comment.authorAvatarUrl})` }}
                            />
                          ) : (
                            <span className={styles.commentAvatarFallback}>{getAvatarFallback(comment.authorName)}</span>
                          )}
                        </span>

                        <div className={styles.commentBody}>
                          <div className={styles.commentMeta}>
                            <strong>{comment.authorName}</strong>
                            <span>{formatRelativeTime(comment.createdAt)}</span>
                          </div>

                          <p className={styles.commentContent}>{comment.content}</p>

                          <div className={styles.commentActions}>
                            <button
                              className={styles.commentAction}
                              disabled={likePending || isReadonlyPromptDetail}
                              type="button"
                              onClick={() => handleCommentLike(comment.id, !comment.viewerLiked)}
                            >
                              赞同 {comment.likeCount}
                            </button>
                            <span className={styles.commentActionStatic}>回复</span>
                            <span className={styles.commentActionStatic}>举报</span>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className={styles.commentEmptyState}>
                    还没有人发言。你可以先补充适用场景、镜头语言、调参建议，或者直接留下第一条评论。
                  </div>
                )}
              </div>
                </>
              ) : null}
            </div>

            <aside className={styles.recommendRail} id="video-related-work">
              <div className={styles.recommendHeader}>
                <span className={`${styles.commentsCount} ${styles.recommendHeaderLabel}`}>{sideSectionLabel}</span>
              </div>

              <div className={styles.recommendGrid}>
                {recommendationVideos.length > 0 ? (
                  recommendationVideos.map((video) => {
                    const relatedAuthor = normalizeText(video.author.displayName) ?? "DramaTV";

                    return (
                      <RelatedVideoCard
                        authorName={relatedAuthor}
                        coverUrl={video.coverUrl}
                        href={appendBackSource(video.href ?? `/videos/${video.id}`, backHref)}
                        key={video.id}
                        posterUrl={video.posterUrl}
                        previewUrl={video.previewUrl}
                        sourceUrl={video.sourceUrl}
                        title={video.title}
                      />
                    );
                  })
                ) : (
                  <div className={styles.secondaryPlaceholder}>相关推荐还没有返回数据。</div>
                )}
              </div>

              {!isPromptResource && workflowHref ? (
                <article className={styles.processCard}>
                  <div className={styles.secondaryHeader}>
                    <span className={styles.secondaryLabel}>工作流入口</span>
                    <span className={styles.secondaryPill}>
                      {currentView.workflow?.allowCopy ? "可复制到画布" : "仅开放查看"}
                    </span>
                  </div>
                  <strong className={styles.secondaryTitle}>{workflowTitle}</strong>
                  <p className={styles.secondaryCopy}>看完结果后，继续回到方法页看它是怎么做出来的。</p>
                  <Link className={styles.secondaryAction} href={workflowHref}>
                    打开工作流详情
                  </Link>
                </article>
              ) : null}
            </aside>
          </div>
        </section>

        <ReportModal
          open={reportOpen}
          submitting={reportPending}
          title={isPromptResource ? "举报提示词" : "举报视频"}
          targetId={currentView.id}
          targetType={isPromptResource ? "prompt" : "video"}
          onClose={() => setReportOpen(false)}
          onSubmit={handleReportSubmit}
        />
      </div>
    </PageShell>
  );
}
