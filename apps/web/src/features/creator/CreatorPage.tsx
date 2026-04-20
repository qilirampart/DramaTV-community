"use client";

import Link from "next/link";
import { useState } from "react";
import { PageShell } from "@/components/shared/PageShell";
import { toggleCreatorFollowAction } from "@/features/community-interactions/actions";
import type {
  CreatorPageView,
  VideoMiniCardView,
  WorkflowMiniCardView
} from "@/lib/contracts/view-models";
import { normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import styles from "./CreatorPage.module.css";

type CreatorPageProps = {
  view: CreatorPageView;
};

type ActionNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

type CreatorTab = "published" | "liked" | "saved";

type ArchiveCardView = {
  id: string;
  href: string;
  kind: "prompt" | "workflow";
  title: string;
  summary?: string;
  coverUrl?: string;
  likeCount: number;
  authorName: string;
  authorAvatarUrl?: string;
};

function formatCompactNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toLocaleString("zh-CN");
}

function getAvatarFallback(name: string) {
  return name.trim().charAt(0).toUpperCase() || "D";
}

function noticeClassName(tone: ActionNotice["tone"]) {
  if (tone === "success") {
    return `${styles.notice} ${styles.noticeSuccess}`;
  }

  if (tone === "error") {
    return `${styles.notice} ${styles.noticeError}`;
  }

  return styles.notice;
}

function toArchiveCard(video: VideoMiniCardView): ArchiveCardView {
  const workflowTitle = normalizeText(video.workflow?.title);
  const workflowId = normalizeText(video.workflow?.id);

  return {
    id: video.id,
    href: `/videos/${video.id}`,
    kind: workflowId ? "workflow" : "prompt",
    title: normalizeText(video.title) ?? "未命名提示词作品",
    summary:
      normalizeText(video.summary) ??
      (workflowTitle ? `关联工作流 · ${workflowTitle}` : "提示词资源，后续可继续进入详情页查看内容。"),
    coverUrl: normalizeAssetUrl(video.coverUrl),
    likeCount: video.likeCount ?? 0,
    authorName: normalizeText(video.author.displayName) ?? "DramaTV Creator",
    authorAvatarUrl: normalizeAssetUrl(video.author.avatarUrl)
  };
}

function toArchiveCardFromWorkflow(workflow: WorkflowMiniCardView): ArchiveCardView {
  return {
    id: workflow.id,
    href: `/workflows/${workflow.id}`,
    kind: "workflow",
    title: normalizeText(workflow.title) ?? "未命名工作流",
    summary:
      normalizeText(workflow.summary) ?? "工作流资源，后续继续联动画布入口和复制链路。",
    coverUrl: normalizeAssetUrl(workflow.coverUrl),
    likeCount: workflow.likeCount ?? 0,
    authorName: normalizeText(workflow.author.displayName) ?? "DramaTV Creator",
    authorAvatarUrl: normalizeAssetUrl(workflow.author.avatarUrl)
  };
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M15.5 8.5 8.8 11.9M15.5 15.5 8.8 12.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <circle cx="17.2" cy="7.3" r="2.3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="6.8" cy="12" r="2.3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="16.7" r="2.3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="m13.7 3.8-4.8 6.6h4l-2.6 9.8 6.8-9.3h-4.1l.7-7.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M8 13.2 2.8 8.3A3.2 3.2 0 1 1 7.4 3.8L8 4.4l.6-.6a3.2 3.2 0 1 1 4.6 4.5L8 13.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ArchiveCard({ item }: { item: ArchiveCardView }) {
  const cardStyle = item.coverUrl ? { backgroundImage: `url(${item.coverUrl})` } : undefined;

  return (
    <Link className={styles.archiveCard} href={item.href}>
      <div className={styles.archiveMedia} style={cardStyle}>
        <div className={styles.archiveShade} />
        <span className={styles.archiveBadge}>{item.kind === "workflow" ? "WORKFLOW" : "PROMPT"}</span>

        <div className={styles.archiveFooter}>
          <h3 className={styles.archiveTitle}>{item.title}</h3>

          <div className={styles.archiveMeta}>
            <span className={styles.archiveAuthor}>
              <span className={styles.archiveAvatar}>
                {item.authorAvatarUrl ? (
                  <span
                    className={styles.archiveAvatarImage}
                    style={{ backgroundImage: `url(${item.authorAvatarUrl})` }}
                  />
                ) : (
                  <span className={styles.archiveAvatarFallback}>
                    {getAvatarFallback(item.authorName)}
                  </span>
                )}
              </span>
              <span className={styles.archiveAuthorName}>{item.authorName}</span>
            </span>

            <span className={styles.archiveMetric}>
              <HeartIcon />
              {formatCompactNumber(item.likeCount)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyTabState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function CreatorPage({ view }: CreatorPageProps) {
  const [currentView, setCurrentView] = useState(view);
  const [activeTab, setActiveTab] = useState<CreatorTab>("published");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  const displayName = normalizeText(currentView.profile.displayName) ?? "DramaTV Creator";
  const headline = normalizeText(currentView.profile.headline);
  const bio = normalizeText(currentView.profile.bio);
  const intro = headline ?? bio ?? "AI 创作者档案页，先展示作品，再逐步补齐工作流与互动信息。";
  const secondaryCopy = headline && bio && bio !== headline ? bio : undefined;

  const archiveItems = [
    ...currentView.videos.map(toArchiveCard),
    ...currentView.workflows.map(toArchiveCardFromWorkflow)
  ];

  const coverFallbackUrl = archiveItems.find((item) => item.coverUrl)?.coverUrl;
  const backdropUrl = coverFallbackUrl ?? normalizeAssetUrl(currentView.profile.avatarUrl);

  const totalLikes = archiveItems.reduce((sum, item) => sum + item.likeCount, 0);
  const publishedCount = currentView.stats.videoCount + currentView.stats.workflowCount;
  const avatarUrl = normalizeAssetUrl(currentView.profile.avatarUrl) ?? coverFallbackUrl;

  async function handleFollowToggle() {
    setPending(true);
    setNotice({
      tone: "neutral",
      text: "正在更新关注状态..."
    });

    try {
      const result = await toggleCreatorFollowAction({
        creatorId: currentView.profile.id,
        active: !currentView.profile.followed
      });

      if (result.ok) {
        setCurrentView(result.view);
        setNotice({
          tone: "success",
          text: result.message
        });
        return;
      }

      setNotice({
        tone: "error",
        text: result.message
      });
    } finally {
      setPending(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice({
        tone: "success",
        text: "创作者主页链接已复制。"
      });
    } catch {
      setNotice({
        tone: "error",
        text: "复制失败，稍后再试。"
      });
    }
  }

  return (
    <PageShell variant="home" topNavActive="home">
      <div className={styles.page}>
        <div aria-hidden="true" className={styles.backdrop}>
          <div
            className={styles.backdropImage}
            style={backdropUrl ? { backgroundImage: `url(${backdropUrl})` } : undefined}
          />
          <div className={styles.backdropGlow} />
          <div className={styles.backdropNoise} />
        </div>

        <section className={styles.hero}>
          <div className={styles.avatarWrap}>
            <span
              className={styles.avatar}
              style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
            >
              {avatarUrl ? null : (
                <span className={styles.avatarFallback}>{getAvatarFallback(displayName)}</span>
              )}
            </span>
            <span className={styles.avatarBadge}>
              <SparkIcon />
            </span>
          </div>

          <div className={styles.heroCopy}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{displayName}</h1>
              <span className={styles.creatorPill}>认证创作者</span>
            </div>

            <p className={styles.intro}>{intro}</p>
            {secondaryCopy ? <p className={styles.bio}>{secondaryCopy}</p> : null}

            <div className={styles.statsRow}>
              <div className={styles.statBlock}>
                <strong>{formatCompactNumber(currentView.stats.followerCount)}</strong>
                <span>关注者</span>
              </div>
              <div className={styles.statBlock}>
                <strong>{formatCompactNumber(totalLikes)}</strong>
                <span>获赞</span>
              </div>
              <div className={styles.statBlock}>
                <strong>{formatCompactNumber(publishedCount)}</strong>
                <span>发布</span>
              </div>
            </div>
          </div>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={currentView.profile.followed ? styles.followButtonActive : styles.followButton}
              disabled={pending}
              onClick={handleFollowToggle}
            >
              {pending ? "处理中" : currentView.profile.followed ? "已关注" : "关注"}
            </button>

            <button
              aria-label="分享创作者主页"
              className={styles.iconButton}
              type="button"
              onClick={handleShare}
            >
              <ShareIcon />
            </button>

            {notice ? (
              <p className={noticeClassName(notice.tone)}>{notice.text}</p>
            ) : null}
          </div>
        </section>

        <section className={styles.tabSection}>
          <div className={styles.tabBar}>
            <button
              className={activeTab === "published" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => setActiveTab("published")}
            >
              发布档案
            </button>
            <button
              className={activeTab === "liked" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => setActiveTab("liked")}
            >
              赞过
            </button>
            <button
              className={activeTab === "saved" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => setActiveTab("saved")}
            >
              我的收藏
            </button>
          </div>
        </section>

        <section className={styles.contentSection}>
          {activeTab === "published" ? (
            archiveItems.length > 0 ? (
              <div className={styles.archiveGrid}>
                {archiveItems.map((item) => (
                  <ArchiveCard key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </div>
            ) : (
              <EmptyTabState
                title="还没有发布内容"
                description="当前创作者暂无公开档案，后续这里会继续展示提示词和工作流资源。"
              />
            )
          ) : null}

          {activeTab === "liked" ? (
            <EmptyTabState
              title="赞过内容"
              description="前端占位，后续接入创作者赞过资源列表。"
            />
          ) : null}

          {activeTab === "saved" ? (
            <EmptyTabState
              title="我的收藏"
              description="前端占位，后续接入创作者收藏资源列表。"
            />
          ) : null}
        </section>
      </div>
    </PageShell>
  );
}
