"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CommentThread } from "@/components/comments/CommentThread";
import { ReportModal } from "@/components/report/ReportModal";
import { ContextBackLink } from "@/components/shared/ContextBackLink";
import { PageShell } from "@/components/shared/PageShell";
import {
  type CommentActionResult,
  copyWorkflowToCanvasAction,
  deleteWorkflowCommentAction,
  loadMoreWorkflowCommentsAction,
  submitReportAction,
  submitWorkflowCommentAction,
  toggleWorkflowCommentLikeAction,
  toggleWorkflowFavoriteAction,
  toggleWorkflowLikeAction,
  updateWorkflowCommentSettingsAction
} from "@/features/community-interactions/actions";
import type { WorkflowDetailPageView } from "@/lib/contracts/view-models";
import { normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import { buildCurrentRoute } from "@/lib/routes/back-anchor";
import { appendBackSource } from "@/lib/routes/redirect-utils";
import styles from "./WorkflowDetailPage.module.css";

type WorkflowDetailPageProps = {
  view: WorkflowDetailPageView;
  backHref?: string;
};

type ActionNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

function applyCommentPatch(
  view: WorkflowDetailPageView,
  result: CommentActionResult,
  mode: "replace" | "append" = "replace"
): WorkflowDetailPageView {
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
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
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
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
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
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
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
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
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
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
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
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
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
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
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
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <ellipse cx="10" cy="5.1" rx="5.6" ry="2.2" stroke="currentColor" strokeWidth="1.45" />
      <path d="M4.4 5.1v4.4c0 1.2 2.5 2.2 5.6 2.2s5.6-1 5.6-2.2V5.1" stroke="currentColor" strokeWidth="1.45" />
      <path d="M4.4 9.5v4.4c0 1.2 2.5 2.2 5.6 2.2s5.6-1 5.6-2.2V9.5" stroke="currentColor" strokeWidth="1.45" />
    </svg>
  );
}

function noticeClassName(notice: ActionNotice) {
  if (notice.tone === "success") {
    return `${styles.notice} ${styles.noticeSuccess}`;
  }

  if (notice.tone === "error") {
    return `${styles.notice} ${styles.noticeError}`;
  }

  return styles.notice;
}

function getAvatarFallback(name: string) {
  return name.trim().charAt(0).toUpperCase() || "D";
}

function formatCount(value: number) {
  return value.toLocaleString("zh-CN");
}

function formatCommentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "待同步";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

function buildWorkflowArchiveText(
  workflowTitle: string,
  summary?: string,
  scenarioText?: string,
  hasExamplePreview?: boolean,
  canOpen?: boolean,
  allowCopy?: boolean
) {
  const statusText = canOpen
    ? allowCopy
      ? "当前状态：支持继续查看工作流，后续接入复制到画布。"
      : "当前状态：当前可查看工作流详情，复制能力暂未开放。"
    : hasExamplePreview
      ? "当前状态：工作流说明与成果视频已可展示，画布入口后续接入。"
      : "当前状态：工作流入口待接入，当前先保留统一详情排版。";

  return [
    `工作流名称：${workflowTitle}`,
    summary ?? "这条内容当前归类为工作流资源，详情页这里不再展示提示词文本，只保留工作流入口与后续画布联动位。",
    scenarioText ? `适用场景：${scenarioText}` : undefined,
    statusText
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function WorkflowDetailPage({ view, backHref = "/featured" }: WorkflowDetailPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [isStageVideoReady, setIsStageVideoReady] = useState(false);
  const stageVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setCurrentView(view);
  }, [view]);

  const authorId = normalizeText(currentView.author.id);
  const authorName = normalizeText(currentView.author.displayName) ?? "DramaTV Creator";
  const authorAvatarUrl = normalizeAssetUrl(currentView.author.avatarUrl);
  const currentRoute = buildCurrentRoute(pathname, searchParams);
  const authorHref = authorId ? appendBackSource(`/creators/${authorId}`, currentRoute) : undefined;
  const openUrl = normalizeText(currentView.canvasBinding?.openUrl);
  const summary =
    normalizeText(currentView.summary) ?? "这个工作流详情页会承接方法说明、画布入口和复制链路。";
  const scenarioText =
    normalizeText(currentView.scenarioText) ?? "适用于需要把结果页和方法页串起来展示的社区资源。";
  const detailTags = currentView.tagNames.slice(0, 4);
  const demoVideoUrl =
    currentView.exampleMedia?.assetKind === "video" ? normalizeAssetUrl(currentView.exampleMedia.url) : undefined;
  const coverUrl =
    normalizeAssetUrl(currentView.coverUrl) ??
    (currentView.exampleMedia?.assetKind === "image" ? normalizeAssetUrl(currentView.exampleMedia.url) : undefined) ??
    normalizeAssetUrl(currentView.relatedVideos[0]?.coverUrl);
  const relatedVideos = currentView.relatedVideos.slice(0, 2);
  const workflowPanelText = buildWorkflowArchiveText(
    currentView.title,
    summary,
    scenarioText,
    Boolean(demoVideoUrl),
    Boolean(openUrl),
    currentView.permissions.allowCopy
  );
  const isReadonlyPreview = currentView.isReadonlyPreview ?? false;

  useEffect(() => {
    setIsStageVideoReady(false);
  }, [currentView.id, demoVideoUrl]);

  useEffect(() => {
    const video = stageVideoRef.current;
    if (!video) {
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setIsStageVideoReady(true);
    }
  }, [currentView.id, demoVideoUrl]);

  useEffect(() => {
    if (reportNotice?.tone !== "success") {
      return;
    }

    const timer = window.setTimeout(() => {
      setReportNotice(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [reportNotice]);

  const handleStageVideoRef = useCallback((node: HTMLVideoElement | null) => {
    stageVideoRef.current = node;
    if (node && node.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setIsStageVideoReady((current) => current || true);
    }
  }, []);

  async function runInteraction(
    pendingKey: string,
    runner: () => Promise<{ ok: boolean; view?: WorkflowDetailPageView; message: string }>
  ) {
    setInteractionPendingKey(pendingKey);
    setInteractionNotice({
      tone: "neutral",
      text: "正在更新当前工作流状态..."
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

  async function handleCopyWorkflow() {
    if (isReadonlyPreview) {
      setInteractionNotice({
        tone: "error",
        text: "当前是预览态工作流，复制到画布还没有接真实后端。"
      });
      return;
    }

    setInteractionPendingKey("workflow-copy");
    setInteractionNotice({
      tone: "neutral",
      text: "正在复制工作流到你的空间..."
    });

    try {
      const result = await copyWorkflowToCanvasAction({
        workflowId: currentView.id
      });

      if (!result.ok) {
        setInteractionNotice({
          tone: "error",
          text: result.message
        });
        return;
      }

      setInteractionNotice({
        tone: "success",
        text: result.message
      });

      router.push(result.openUrl);
    } finally {
      setInteractionPendingKey(null);
    }
  }

  async function handleCommentSubmit(input: { content: string; parentId?: string }) {
    if (isReadonlyPreview) {
      setCommentNotice({
        tone: "error",
        text: "当前是预览态工作流，评论不会写入真实后端。"
      });
      return false;
    }

    setCommentPending(true);
    setCommentNotice({
      tone: "neutral",
      text: "正在发布备注..."
    });

    try {
      const result = await submitWorkflowCommentAction({
        workflowId: currentView.id,
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
    if (isReadonlyPreview) {
      setCommentNotice({
        tone: "error",
        text: "当前是预览态工作流，评论互动暂不写入真实后端。"
      });
      return;
    }

    setCommentLikePendingId(commentId);
    setCommentNotice({
      tone: "neutral",
      text: "正在更新备注点赞..."
    });

    try {
      const result = await toggleWorkflowCommentLikeAction({
        workflowId: currentView.id,
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
    if (isReadonlyPreview) {
      setCommentNotice({
        tone: "error",
        text: "当前是预览态工作流，评论管理暂不写入真实后端。"
      });
      return;
    }

    setCommentManagementPendingId(commentId);
    setCommentNotice({
      tone: "neutral",
      text: "正在删除评论..."
    });

    try {
      const result = await deleteWorkflowCommentAction({
        workflowId: currentView.id,
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
    if (isReadonlyPreview) {
      setCommentNotice({
        tone: "error",
        text: "当前是预览态工作流，评论区设置暂不写入真实后端。"
      });
      return;
    }

    setCommentPolicyPending(true);
    setCommentNotice({
      tone: "neutral",
      text: nextEnabled ? "正在开启评论区..." : "正在关闭评论区..."
    });

    try {
      const result = await updateWorkflowCommentSettingsAction({
        workflowId: currentView.id,
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
      text: "正在加载更多评论..."
    });

    try {
      const result = await loadMoreWorkflowCommentsAction({
        workflowId: currentView.id,
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

  return (
    <PageShell variant="home" topNavActive="featured">
      <div className={styles.page}>
        <section className={styles.heroSection} id="canvas-entry">
          <ContextBackLink className={styles.backLink} href={backHref}>
            ← 返回列表
          </ContextBackLink>

          <div className={styles.heroGrid}>
            <div className={styles.stageColumn}>
              <div className={styles.stageFrame}>
                <div
                  className={styles.stageBackdrop}
                  style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
                />
                <div className={styles.stageShade} />

                {demoVideoUrl ? (
                  <video
                    autoPlay
                    className={`${styles.stageVideo} ${isStageVideoReady ? styles.stageVideoReady : ""}`}
                    controls
                    loop
                    muted
                    ref={handleStageVideoRef}
                    onCanPlay={() => setIsStageVideoReady(true)}
                    onEmptied={() => setIsStageVideoReady(false)}
                    onLoadedData={() => setIsStageVideoReady(true)}
                    playsInline
                    poster={coverUrl}
                    src={demoVideoUrl}
                    style={{ opacity: isStageVideoReady ? 1 : 0 }}
                  />
                ) : null}

                {!coverUrl && !demoVideoUrl ? (
                  <div className={styles.stagePlaceholder}>
                    <span className={styles.stagePlaceholderLabel}>工作流预览</span>
                    <strong>当前工作流暂无独立视频预览</strong>
                    <span>先保留和视频详情页一致的展示区域，后续再接真实预览素材。</span>
                  </div>
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
                    <span>{`社区工作流 · 已关联 ${formatCount(currentView.stats.videoBindCount)} 个作品`}</span>
                  </span>
                </div>

                <div className={styles.authorActions}>
                  {authorHref ? (
                    <Link className={styles.authorLink} href={authorHref}>
                      进入主页
                    </Link>
                  ) : null}
                </div>
              </article>
            </div>

            <div className={styles.contentColumn}>
              <div className={styles.metaRow}>
                <span className={styles.typeBadge}>工作流方法</span>
                {detailTags.map((tag) => (
                  <span className={styles.keywordTag} key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>

              <h1 className={styles.title}>{currentView.title}</h1>
              <p className={styles.summary}>{summary}</p>

              <div className={styles.panelHeader}>
                <span className={styles.panelLabel}>核心内容</span>
                <div className={styles.panelLinks}>
                  {openUrl ? (
                    <Link className={styles.panelLink} href={openUrl}>
                      <ExternalLinkIcon />
                      查看工作流
                    </Link>
                  ) : (
                    <span className={styles.panelPlaceholder}>暂未接入画布入口</span>
                  )}
                </div>
              </div>

              <div className={styles.promptPanel}>
                <pre>{workflowPanelText}</pre>
              </div>

              <div className={styles.metricRow}>
                <button
                  className={`${styles.metricButton} ${currentView.viewerActions.liked ? styles.metricButtonActive : ""}`}
                  disabled={isReadonlyPreview || interactionPendingKey !== null}
                  type="button"
                  onClick={() =>
                    runInteraction("workflow-like", () =>
                      toggleWorkflowLikeAction({
                        workflowId: currentView.id,
                        active: !currentView.viewerActions.liked
                      })
                    )
                  }
                >
                  <HeartIcon />
                  <span>{interactionPendingKey === "workflow-like" ? "处理中" : `点赞 ${formatCount(currentView.stats.likeCount)}`}</span>
                </button>

                <button
                  className={`${styles.metricButton} ${currentView.viewerActions.favorited ? styles.metricButtonActive : ""}`}
                  disabled={isReadonlyPreview || interactionPendingKey !== null}
                  type="button"
                  onClick={() =>
                    runInteraction("workflow-favorite", () =>
                      toggleWorkflowFavoriteAction({
                        workflowId: currentView.id,
                        active: !currentView.viewerActions.favorited
                      })
                    )
                  }
                >
                  <BookmarkIcon />
                  <span>
                    {interactionPendingKey === "workflow-favorite" ? "处理中" : `收藏 ${formatCount(currentView.stats.favoriteCount)}`}
                  </span>
                </button>

                <Link className={styles.metricButton} href="#workflow-comments">
                  <CommentIcon />
                  <span>评论 {formatCount(currentView.stats.commentCount)}</span>
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
              {isReadonlyPreview ? (
                <p className={styles.notice}>当前页面是工作流样式预览页，点赞、收藏、评论和复制入口均不写入真实后端。</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className={styles.communitySection} id="workflow-comments">
          <div className={styles.communityGrid}>
            <div className={styles.commentsColumn}>
              <div className={styles.commentsHeader}>
                <div className={styles.commentsTitleRow}>
                  <CommentIcon />
                  <h2>评论区</h2>
                </div>
                <span className={styles.commentsCount}>{formatCount(currentView.stats.commentCount)} 条评论</span>
              </div>

              <CommentThread
                comments={currentView.comments}
                emptyText="当前还没有流程备注，后续这里会继续承接真实评论数据。"
                helperText="这里继续保留最小评论闭环，后续再接更完整的讨论区结构。"
                hideHeader
                variant="workflow"
                disabled={isReadonlyPreview}
                composer={{
                  placeholder: "加入讨论，补充这个工作流的适用题材、节点重点或复用建议...",
                  submitLabel: "发表评论",
                  notice: commentNotice,
                  pending: commentPending,
                  disabled: isReadonlyPreview,
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
            </div>

            <aside className={styles.recommendRail}>
              <div className={styles.recommendHeader}>
                <span className={styles.secondaryLabel}>相关推荐</span>
              </div>

              <div className={styles.recommendGrid}>
                {relatedVideos.length > 0 ? (
                  relatedVideos.map((video) => {
                    const relatedCover = normalizeAssetUrl(video.coverUrl);
                    const relatedAuthor = normalizeText(video.author.displayName) ?? "DramaTV";

                    return (
                      <Link
                        className={styles.recommendCard}
                        href={appendBackSource(`/videos/${video.id}`, currentRoute)}
                        key={video.id}
                      >
                        <span
                          className={styles.recommendCardMedia}
                          style={relatedCover ? { backgroundImage: `url(${relatedCover})` } : undefined}
                        />
                        <span className={styles.recommendCardShade} />
                        <span className={styles.recommendCardCopy}>
                          <strong>{video.title}</strong>
                          <span>{relatedAuthor}</span>
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div className={styles.secondaryPlaceholder}>后续这里会承接由这个流程产出的作品。</div>
                )}
              </div>

              <article className={styles.processCard}>
                <div className={styles.secondaryHeader}>
                  <span className={styles.secondaryLabel}>工作流入口</span>
                  <span className={styles.secondaryPill}>
                    {currentView.permissions.allowCopy
                      ? "允许复制"
                      : openUrl
                        ? "可查看"
                        : "待接入"}
                  </span>
                </div>
                <strong className={styles.secondaryTitle}>{currentView.title}</strong>
                <p className={styles.secondaryCopy}>
                  {openUrl
                    ? "从这个详情页继续进入工作流空间，后续再接画布联动和复制链路。"
                    : "当前还没有接入可跳转的工作流空间，先保留统一详情排版。"}
                </p>
                <div className={styles.secondaryActionGroup}>
                  {openUrl ? (
                    <Link className={styles.secondaryAction} href={openUrl}>
                      查看工作流
                    </Link>
                  ) : null}
                  {currentView.permissions.allowCopy ? (
                    <button
                      className={styles.secondaryButton}
                      disabled={isReadonlyPreview || interactionPendingKey === "workflow-copy"}
                      type="button"
                      onClick={handleCopyWorkflow}
                    >
                      {isReadonlyPreview
                        ? "预览态"
                        : interactionPendingKey === "workflow-copy"
                          ? "复制中..."
                          : "复制到我的空间"}
                    </button>
                  ) : null}
                </div>
              </article>
            </aside>
          </div>
        </section>

        <ReportModal
          open={reportOpen}
          submitting={reportPending}
          title="举报工作流"
          targetId={currentView.id}
          targetType="workflow"
          onClose={() => setReportOpen(false)}
          onSubmit={handleReportSubmit}
        />
      </div>
    </PageShell>
  );
}
