"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CommentThread } from "@/components/comments/CommentThread";
import { ReportModal } from "@/components/report/ReportModal";
import { Tag } from "@/components/shared/Tag";
import { PageShell } from "@/components/shared/PageShell";
import { stripDiscussionContentToPlainText } from "@/lib/discussion-content";
import {
  deleteDiscussionCommentAction,
  type DiscussionCommentActionResult,
  loadMoreDiscussionCommentsAction,
  submitDiscussionReportAction,
  submitDiscussionCommentAction,
  toggleDiscussionCommentLikeAction,
  toggleDiscussionFavoriteAction,
  toggleDiscussionLikeAction,
  updateDiscussionCommentSettingsAction
} from "@/features/discussions/actions";
import type { DiscussionDetailPageView } from "@/lib/contracts/view-models";
import { normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import { appendBackSource } from "@/lib/routes/redirect-utils";
import { DiscussionMarkdown, extractDiscussionHeadings } from "./discussion-markdown";
import styles from "./DiscussionDetailPage.module.css";

type DiscussionDetailPageProps = {
  view: DiscussionDetailPageView;
  backHref?: string;
};

type ActionNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

function applyCommentPatch(
  view: DiscussionDetailPageView,
  result: DiscussionCommentActionResult,
  mode: "replace" | "append" = "replace"
): DiscussionDetailPageView {
  if (!result.ok) {
    return view;
  }

  return {
    ...view,
    commentPolicy: result.patch.commentPolicy ?? view.commentPolicy,
    stats: {
      ...view.stats,
      replyCount: mode === "replace" ? result.patch.replyCount : view.stats.replyCount
    },
    replyCountLabel: `${(mode === "replace" ? result.patch.replyCount : view.stats.replyCount).toLocaleString("zh-CN")} replies`,
    comments: {
      items: mode === "append" ? [...view.comments.items, ...result.patch.comments] : result.patch.comments,
      nextCursor: result.patch.nextCursor,
      hasMore: result.patch.hasMore
    }
  };
}

const TEXT = {
  breadcrumbHome: "社区",
  breadcrumbCurrent: "帖子详情",
  detailLabel: "DISCUSSION THREAD",
  authorLabel: "发起人",
  likePending: "更新点赞中...",
  favoritePending: "更新收藏中...",
  like: "点赞",
  liked: "已点赞",
  favorite: "收藏",
  favorited: "已收藏",
  reply: "回复",
  publishInfo: "发布信息",
  channel: "所属板块",
  publishedAt: "发布时间",
  lastActivity: "最近活跃",
  bodyTitle: "正文",
  bodyKicker: "POST BODY",
  contextTitle: "讨论上下文",
  contextCopy:
    "帖子用于沉淀问题、复盘、方法论和社区讨论。视频、图片和工作流仍保留自己的详情页，帖子负责把结论和讨论过程组织起来。",
  outlineTitle: "文章目录",
  outlineFallback: "这篇帖子暂时没有分节标题，当前按完整正文阅读。",
  summaryTitle: "摘要",
  authorCardTitle: "作者",
  authorNoteTitle: "作者说明",
  authorNoteFallback: "作者简介、代表作品与关注关系后续接入，这里先保留创作者名片位。",
  interactionTitle: "互动概览",
  threadTypeStandalone: "独立讨论帖",
  threadTypeBound: "绑定讨论帖",
  tagsTitle: "标签",
  relatedTitle: "延伸阅读",
  relatedEyebrow: "占位推荐",
  relatedFallback: "推荐帖子接口后续接入，这里先保留阅读延展位。",
  commentsTitle: "回复讨论",
  commentsEmpty: "还没有回复。可以先补充你的问题、结论或复盘意见。",
  commentPlaceholder: "写一条回复，内容会进入真实帖子评论区。",
  commentSubmit: "发布回复",
  commentPending: "发布中...",
  commentLikePending: "更新中...",
  commentLike: "点赞",
  commentLiked: "已点赞",
  replyCount: "回复",
  noSummary: "这篇帖子还没有摘要，正文内容会作为讨论上下文继续展示。"
} as const;

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
  return normalizeText(name)?.charAt(0).toUpperCase() ?? "D";
}

function formatCount(value: number) {
  return value.toLocaleString("zh-CN");
}

function buildRelatedThreadMeta(thread: {
  channelTitle: string;
  lastActivityLabel: string;
  binding?: {
    targetTitle?: string;
  };
}) {
  const parts = [thread.channelTitle];
  if (thread.binding?.targetTitle) {
    parts.push(thread.binding.targetTitle);
  }
  parts.push(thread.lastActivityLabel);
  return parts.join(" · ");
}

function formatCommentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "刚刚";
  }

  return date.toLocaleDateString("zh-CN");
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

export function DiscussionDetailPage({ view, backHref = "/discussions" }: DiscussionDetailPageProps) {
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

  useEffect(() => {
    setCurrentView(view);
  }, [view]);

  useEffect(() => {
    if (reportNotice?.tone !== "success") {
      return;
    }

    const timer = window.setTimeout(() => {
      setReportNotice(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [reportNotice]);

  const authorAvatarUrl = normalizeAssetUrl(currentView.author.avatarUrl);
  const authorName = normalizeText(currentView.author.displayName) ?? "匿名创作者";
  const summary =
    normalizeText(stripDiscussionContentToPlainText(currentView.excerpt ?? "")) ??
    normalizeText(stripDiscussionContentToPlainText(currentView.content)) ??
    TEXT.noSummary;
  const displayedTags = currentView.tagNames.slice(0, 6);
  const headings = useMemo(() => extractDiscussionHeadings(currentView.content), [currentView.content]);
  const summaryPreview =
    summary.length > 168
      ? `${summary.slice(0, 168).trimEnd()}...`
      : summary;
  const threadTypeLabel = currentView.binding ? TEXT.threadTypeBound : TEXT.threadTypeStandalone;
  const readingMinutes = Math.max(1, Math.round(stripDiscussionContentToPlainText(currentView.content).length / 260));
  const readingTimeLabel = `约 ${readingMinutes} 分钟阅读`;
  const relatedThreads = currentView.relatedThreads.slice(0, 3).map((thread) => ({
    title: thread.title,
    meta: buildRelatedThreadMeta(thread),
    href: appendBackSource(thread.href, `/discussions/${currentView.slug}`)
  }));

  async function handleDiscussionLike() {
    setInteractionPendingKey("discussion-like");
    setInteractionNotice({
      tone: "neutral",
      text: currentView.viewerActions.liked ? "正在取消点赞..." : "正在点赞..."
    });

    try {
      const result = await toggleDiscussionLikeAction({
        slug: currentView.slug,
        threadId: currentView.id,
        active: !currentView.viewerActions.liked
      });

      if (result.ok) {
        setCurrentView(result.view);
        setInteractionNotice({ tone: "success", text: result.message });
        return;
      }

      setInteractionNotice({ tone: "error", text: result.message });
    } finally {
      setInteractionPendingKey(null);
    }
  }

  async function handleDiscussionFavorite() {
    setInteractionPendingKey("discussion-favorite");
    setInteractionNotice({
      tone: "neutral",
      text: currentView.viewerActions.favorited ? "正在取消收藏..." : "正在收藏..."
    });

    try {
      const result = await toggleDiscussionFavoriteAction({
        slug: currentView.slug,
        threadId: currentView.id,
        active: !currentView.viewerActions.favorited
      });

      if (result.ok) {
        setCurrentView(result.view);
        setInteractionNotice({ tone: "success", text: result.message });
        return;
      }

      setInteractionNotice({ tone: "error", text: result.message });
    } finally {
      setInteractionPendingKey(null);
    }
  }

  async function handleCommentSubmit(input: { content: string; parentId?: string }) {
    setCommentPending(true);
    setCommentNotice({ tone: "neutral", text: "正在发布回复..." });

    try {
      const result = await submitDiscussionCommentAction({
        slug: currentView.slug,
        threadId: currentView.id,
        content: input.content,
        parentId: input.parentId
      });

      if (result.ok) {
        setCurrentView((current) => applyCommentPatch(current, result, "replace"));
        setCommentNotice({ tone: "success", text: result.message });
        return true;
      }

      setCommentNotice({ tone: "error", text: result.message });
      return false;
    } finally {
      setCommentPending(false);
    }
  }

  async function handleCommentLike(commentId: string, active: boolean) {
    setCommentLikePendingId(commentId);
    setCommentNotice({ tone: "neutral", text: "正在更新评论点赞..." });

    try {
      const result = await toggleDiscussionCommentLikeAction({
        slug: currentView.slug,
        commentId,
        active
      });

      if (result.ok) {
        setCurrentView((current) => applyCommentPatch(current, result, "replace"));
        setCommentNotice({ tone: "success", text: result.message });
        return;
      }

      setCommentNotice({ tone: "error", text: result.message });
    } finally {
      setCommentLikePendingId(null);
    }
  }

  async function handleCommentDelete(commentId: string) {
    setCommentManagementPendingId(commentId);
    setCommentNotice({ tone: "neutral", text: "正在删除回复..." });

    try {
      const result = await deleteDiscussionCommentAction({
        slug: currentView.slug,
        commentId
      });

      if (result.ok) {
        setCurrentView((current) => applyCommentPatch(current, result, "replace"));
        setCommentNotice({ tone: "success", text: result.message });
        return;
      }

      setCommentNotice({ tone: "error", text: result.message });
    } finally {
      setCommentManagementPendingId(null);
    }
  }

  async function handleCommentPolicyToggle(nextEnabled: boolean) {
    setCommentPolicyPending(true);
    setCommentNotice({
      tone: "neutral",
      text: nextEnabled ? "正在开启回复区..." : "正在关闭回复区..."
    });

    try {
      const result = await updateDiscussionCommentSettingsAction({
        slug: currentView.slug,
        threadId: currentView.id,
        commentsEnabled: nextEnabled
      });

      if (result.ok) {
        setCurrentView((current) => applyCommentPatch(current, result, "replace"));
        setCommentNotice({ tone: "success", text: result.message });
        return;
      }

      setCommentNotice({ tone: "error", text: result.message });
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
    setCommentNotice({ tone: "neutral", text: "正在加载更多回复..." });

    try {
      const result = await loadMoreDiscussionCommentsAction({
        threadId: currentView.id,
        cursor
      });

      if (result.ok) {
        setCurrentView((current) => applyCommentPatch(current, result, "append"));
        setCommentNotice({ tone: "success", text: result.message });
        return;
      }

      setCommentNotice({ tone: "error", text: result.message });
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
    setReportNotice({ tone: "neutral", text: "正在提交举报..." });

    try {
      const result = await submitDiscussionReportAction({
        targetId: input.targetId,
        reasonCode: input.reasonCode,
        descriptionText: input.descriptionText
      });

      if (result.ok) {
        setReportNotice({ tone: "success", text: "举报已提交。" });
        setReportOpen(false);
        return;
      }

      setReportNotice({ tone: "error", text: result.message });
    } finally {
      setReportPending(false);
    }
  }

  return (
    <PageShell variant="home" topNavActive="community">
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.pageGrid}>
            <aside className={styles.outlineRail}>
              <div className={styles.outlineCard}>
                <span className={styles.sideLabel}>{TEXT.outlineTitle}</span>
                {headings.length > 0 ? (
                  <nav className={styles.outlineList} aria-label={TEXT.outlineTitle}>
                    {headings.map((heading) => (
                      <a
                        className={styles.outlineItem}
                        data-depth={heading.depth}
                        href={`#${heading.id}`}
                        key={heading.id}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                ) : (
                  <p className={styles.outlineFallback}>{TEXT.outlineFallback}</p>
                )}
              </div>
            </aside>

            <div className={styles.mainColumn}>
              <nav aria-label="帖子路径" className={styles.breadcrumb}>
                <Link href="/discussions">{TEXT.breadcrumbHome}</Link>
                <span className={styles.breadcrumbSeparator}>›</span>
                <Link href={currentView.channel.href}>{currentView.channel.title}</Link>
                <span className={styles.breadcrumbSeparator}>›</span>
                <span>{TEXT.breadcrumbCurrent}</span>
              </nav>

              <section className={styles.hero}>
                <div className={styles.heroContent}>
                  <div className={styles.kickerRow}>
                    <span className={styles.kicker}>{TEXT.detailLabel}</span>
                    <Link className={styles.channelPill} href={currentView.channel.href}>
                      {currentView.channel.title}
                    </Link>
                  </div>
                  <h1 className={styles.heroTitle}>{currentView.title}</h1>
                  <div className={styles.heroMeta}>
                    <Link className={styles.heroAuthor} href={appendBackSource(currentView.author.href, backHref)}>
                      <span className={styles.authorAvatar}>
                        {authorAvatarUrl ? (
                          <span className={styles.avatarImage} style={{ backgroundImage: `url(${authorAvatarUrl})` }} />
                        ) : (
                          <span className={styles.avatarFallback}>{getAvatarFallback(authorName)}</span>
                        )}
                      </span>
                      <span className={styles.heroAuthorCopy}>
                        <strong>{authorName}</strong>
                        <span>{TEXT.authorLabel}</span>
                      </span>
                    </Link>
                    <div className={styles.heroFacts}>
                      <span>{currentView.publishedAtLabel}</span>
                      <span>{currentView.lastActivityLabel}</span>
                      <span>{readingTimeLabel}</span>
                    </div>
                  </div>
                  <p className={styles.heroSummary}>{summaryPreview}</p>
                </div>
              </section>

              <article className={styles.articleCard}>
                {displayedTags.length > 0 ? (
                  <header className={styles.articleIntro}>
                    <div className={styles.tagRow}>
                      {displayedTags.map((tag) => (
                        <Tag key={tag} label={tag} />
                      ))}
                    </div>
                  </header>
                ) : null}

                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderCopy}>
                    <span className={styles.sectionEyebrow}>{TEXT.bodyKicker}</span>
                    <h2>{TEXT.bodyTitle}</h2>
                  </div>
                </div>
                <DiscussionMarkdown className={styles.markdown} content={currentView.content} />
                <section className={styles.metricsPanel}>
                  <button
                    className={currentView.viewerActions.liked ? styles.metricButtonActive : styles.metricButton}
                    disabled={interactionPendingKey !== null}
                    type="button"
                    onClick={handleDiscussionLike}
                  >
                    <HeartIcon />
                    <span>
                      {interactionPendingKey === "discussion-like"
                        ? TEXT.likePending
                        : `${currentView.viewerActions.liked ? TEXT.liked : TEXT.like} ${formatCount(currentView.stats.likeCount)}`}
                    </span>
                  </button>
                  <button
                    className={currentView.viewerActions.favorited ? styles.metricButtonActive : styles.metricButton}
                    disabled={interactionPendingKey !== null}
                    type="button"
                    onClick={handleDiscussionFavorite}
                  >
                    <BookmarkIcon />
                    <span>
                      {interactionPendingKey === "discussion-favorite"
                        ? TEXT.favoritePending
                        : `${currentView.viewerActions.favorited ? TEXT.favorited : TEXT.favorite} ${formatCount(currentView.stats.favoriteCount)}`}
                    </span>
                  </button>
                  <a className={styles.metricButton} href="#discussion-comments">
                    <CommentIcon />
                    <span>{TEXT.reply} {formatCount(currentView.stats.replyCount)}</span>
                  </a>
                  <button className={styles.metricButton} type="button" onClick={() => setReportOpen(true)}>
                    <ReportIcon />
                    <span>举报</span>
                  </button>
                </section>
                {interactionNotice ? <p className={noticeClassName(interactionNotice)}>{interactionNotice.text}</p> : null}
                {reportNotice ? <p className={noticeClassName(reportNotice)}>{reportNotice.text}</p> : null}
              </article>

              <section className={styles.commentsSection} id="discussion-comments">
                <div className={styles.commentsHeader}>
                  <h2>{TEXT.commentsTitle}</h2>
                  <strong>{formatCount(currentView.stats.replyCount)}</strong>
                </div>

                <CommentThread
                  comments={currentView.comments}
                  emptyText={TEXT.commentsEmpty}
                  hideHeader
                  variant="discussion"
                  composer={{
                    placeholder: TEXT.commentPlaceholder,
                    submitLabel: TEXT.commentSubmit,
                    notice: commentNotice,
                    pending: commentPending,
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
              </section>
            </div>

            <aside className={styles.sideRail}>
              <section className={styles.sideCard}>
                <span className={styles.sideLabel}>{TEXT.publishInfo}</span>
                <div className={styles.infoList}>
                  <div>
                    <span>{TEXT.channel}</span>
                    <strong>{currentView.channel.title}</strong>
                  </div>
                  <div>
                    <span>{TEXT.publishedAt}</span>
                    <strong>{currentView.publishedAtLabel}</strong>
                  </div>
                  <div>
                    <span>最后编辑</span>
                    <strong>{currentView.lastActivityLabel}</strong>
                  </div>
                  <div>
                    <span>阅读时间</span>
                    <strong>{readingTimeLabel}</strong>
                  </div>
                </div>
                <div className={styles.sideStatGrid}>
                  <div className={styles.sideStatItem}>
                    <strong>{formatCount(currentView.stats.likeCount)}</strong>
                    <span>点赞</span>
                  </div>
                  <div className={styles.sideStatItem}>
                    <strong>{formatCount(currentView.stats.replyCount)}</strong>
                    <span>评论</span>
                  </div>
                  <div className={styles.sideStatItem}>
                    <strong>{formatCount(currentView.stats.favoriteCount)}</strong>
                    <span>收藏</span>
                  </div>
                </div>
              </section>

              <section className={styles.sideCard}>
                <span className={styles.sideLabel}>关于作者</span>
                <Link className={styles.sideAuthor} href={appendBackSource(currentView.author.href, backHref)}>
                  <span className={styles.authorAvatar}>
                    {authorAvatarUrl ? (
                      <span className={styles.avatarImage} style={{ backgroundImage: `url(${authorAvatarUrl})` }} />
                    ) : (
                      <span className={styles.avatarFallback}>{getAvatarFallback(authorName)}</span>
                    )}
                  </span>
                  <span className={styles.sideAuthorCopy}>
                    <strong>{authorName}</strong>
                    <span>{TEXT.authorLabel}</span>
                  </span>
                </Link>
                <p className={styles.sideAuthorMeta}>
                  {threadTypeLabel} · {currentView.channel.title}
                </p>
                <p className={styles.sideCopy}>{TEXT.authorNoteFallback}</p>
              </section>

              {displayedTags.length > 0 ? (
                <section className={styles.sideCard}>
                  <span className={styles.sideLabel}>{TEXT.tagsTitle}</span>
                  <div className={styles.sideTagList}>
                    {displayedTags.map((tag) => (
                      <Tag key={`side-${tag}`} label={tag} />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className={styles.sideCard}>
                <span className={styles.sideLabel}>{TEXT.relatedTitle}</span>
                <div className={styles.relatedList}>
                  {relatedThreads.length > 0 ? (
                    relatedThreads.map((thread) => (
                      <Link className={styles.relatedItem} href={thread.href} key={thread.href}>
                        <span className={styles.relatedThumb} aria-hidden="true" />
                        <span className={styles.relatedCopy}>
                          <strong>{thread.title}</strong>
                          <span>{thread.meta}</span>
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className={styles.secondaryPlaceholder}>{TEXT.relatedFallback}</div>
                  )}
                </div>
              </section>
            </aside>
          </div>

          <ReportModal
            open={reportOpen}
            submitting={reportPending}
            title="举报帖子"
            targetId={currentView.id}
            targetType="post"
            onClose={() => setReportOpen(false)}
            onSubmit={handleReportSubmit}
          />
        </div>
      </main>
    </PageShell>
  );
}
