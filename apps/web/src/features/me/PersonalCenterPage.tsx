"use client";

import Link from "next/link";
import { useState } from "react";
import { PageShell } from "@/components/shared/PageShell";
import type {
  PersonalCenterItemView,
  PersonalCenterPageView,
  VideoMiniCardView,
  WorkflowMiniCardView
} from "@/lib/contracts/view-models";
import { normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import styles from "./PersonalCenterPage.module.css";

type PersonalCenterPageProps = {
  view: PersonalCenterPageView;
  publishedVideos: VideoMiniCardView[];
  publishedWorkflows: WorkflowMiniCardView[];
};

type PersonalCenterTab = "works" | "discussions" | "favorites";

type GalleryMetric = {
  icon: "heart" | "play" | "clock" | "save";
  label: string;
};

type GalleryCardView = {
  id: string;
  href: string;
  badge: string;
  tone: "prompt" | "work" | "workflow" | "discussion" | "favorite";
  title: string;
  subtitle?: string;
  coverUrl?: string;
  authorName: string;
  authorAvatarUrl?: string;
  metrics: GalleryMetric[];
};

function getAvatarFallback(name: string) {
  return name.trim().charAt(0).toUpperCase() || "D";
}

function formatCompactNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }

  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}w`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toLocaleString("zh-CN");
}

function resolveHeadline(headline?: string) {
  const normalized = normalizeText(headline);

  if (!normalized) {
    return "AI 视觉艺术家 / 提示词工程师";
  }

  return /[\u4e00-\u9fff]/.test(normalized) ? normalized : "AI 视觉艺术家 / 提示词工程师";
}

function resolveBio(bio?: string) {
  const normalized = normalizeText(bio);

  if (!normalized) {
    return "探索 AI 创作的无限边界，专注于电影感视觉叙事、提示词拆解与社区灵感沉淀。";
  }

  return /[\u4e00-\u9fff]/.test(normalized)
    ? normalized
    : "探索 AI 创作的无限边界，专注于电影感视觉叙事、提示词拆解与社区灵感沉淀。";
}

function dedupeItems(items: PersonalCenterItemView[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.itemType}:${item.href}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M8 13.2 2.8 8.3A3.2 3.2 0 1 1 7.4 3.8L8 4.4l.6-.6a3.2 3.2 0 1 1 4.6 4.5L8 13.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M5.2 3.8a.8.8 0 0 1 1.2-.7l5.2 3.1a.8.8 0 0 1 0 1.4L6.4 10.7a.8.8 0 0 1-1.2-.7V3.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="5.7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.8v3.5l2.2 1.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M4.6 2.8h6.8c.6 0 1 .4 1 1v9.4L8 10.4l-4.4 2.8V3.8c0-.6.4-1 1-1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 6.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"
        stroke="currentColor"
        strokeWidth="1.45"
      />
      <path
        d="m10 2.8 1 1.7 2-.1.8 1.8 1.8.8-.1 2 1.7 1-1.7 1 .1 2-1.8.8-.8 1.8-2-.1-1 1.7-1-1.7-2 .1-.8-1.8-1.8-.8.1-2-1.7-1 1.7-1-.1-2 1.8-.8.8-1.8 2 .1 1-1.7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function renderMetricIcon(icon: GalleryMetric["icon"]) {
  switch (icon) {
    case "heart":
      return <HeartIcon />;
    case "play":
      return <PlayIcon />;
    case "clock":
      return <ClockIcon />;
    case "save":
      return <SaveIcon />;
    default:
      return null;
  }
}

function buildPublishedCards(
  videos: VideoMiniCardView[],
  workflows: WorkflowMiniCardView[]
): GalleryCardView[] {
  const videoCards = videos.map(
    (video): GalleryCardView => ({
    id: `video-${video.id}`,
    href: `/videos/${video.id}`,
    badge: video.workflow?.id ? "WORK" : "PROMPT",
    tone: video.workflow?.id ? "work" : "prompt",
    title: normalizeText(video.title) ?? "未命名作品",
    subtitle:
      normalizeText(video.summary) ??
      normalizeText(video.workflow?.title) ??
      "电影感视觉练习与创作片段归档。",
    coverUrl: normalizeAssetUrl(video.coverUrl),
    authorName: normalizeText(video.author.displayName) ?? "DramaTV Creator",
    authorAvatarUrl: normalizeAssetUrl(video.author.avatarUrl),
    metrics: [
      { icon: "heart", label: formatCompactNumber(video.likeCount ?? 0) },
      { icon: "play", label: formatCompactNumber(video.playCount ?? 0) }
    ]
    })
  );

  const workflowCards = workflows.map(
    (workflow): GalleryCardView => ({
    id: `workflow-${workflow.id}`,
    href: `/workflows/${workflow.id}`,
    badge: "WORKFLOW",
    tone: "workflow" as const,
    title: normalizeText(workflow.title) ?? "未命名工作流",
    subtitle: normalizeText(workflow.summary) ?? "流程结构、参数策略与复用方式说明。",
    coverUrl: normalizeAssetUrl(workflow.coverUrl),
    authorName: normalizeText(workflow.author.displayName) ?? "DramaTV Creator",
    authorAvatarUrl: normalizeAssetUrl(workflow.author.avatarUrl),
    metrics: [
      { icon: "heart", label: formatCompactNumber(workflow.likeCount ?? 0) },
      { icon: "save", label: workflow.allowCopy ? "可复制" : "只读" }
    ]
    })
  );

  const mixed: GalleryCardView[] = [];
  const max = Math.max(videoCards.length, workflowCards.length);

  for (let index = 0; index < max; index += 1) {
    if (videoCards[index]) {
      mixed.push(videoCards[index]);
    }

    if (workflowCards[index]) {
      mixed.push(workflowCards[index]);
    }
  }

  return mixed;
}

function buildLibraryCards(
  items: PersonalCenterItemView[],
  mode: "discussion" | "favorite"
): GalleryCardView[] {
  return items.map(
    (item): GalleryCardView => ({
    id: `${mode}-${item.itemType}-${item.targetId}`,
    href: item.href,
    badge: mode === "discussion" ? "DISCUSSION" : "FAVORITE",
    tone: mode,
    title: normalizeText(item.title) ?? "未命名内容",
    subtitle:
      normalizeText(item.summary) ??
      normalizeText(item.workflowTitle) ??
      normalizeText(item.channelTitle) ??
      "社区互动记录与灵感回看入口。",
    coverUrl: normalizeAssetUrl(item.coverUrl),
    authorName: normalizeText(item.author.displayName) ?? "DramaTV Creator",
    authorAvatarUrl: normalizeAssetUrl(item.author.avatarUrl),
    metrics:
      mode === "discussion"
        ? [{ icon: "clock", label: item.actedAtLabel }]
        : [
            { icon: "save", label: "已收藏" },
            { icon: "clock", label: item.actedAtLabel }
          ]
    })
  );
}

function EmptyState({
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

function GalleryCard({ card }: { card: GalleryCardView }) {
  const coverStyle = card.coverUrl ? { backgroundImage: `url(${card.coverUrl})` } : undefined;

  return (
    <Link className={styles.galleryCard} href={card.href}>
      <div className={`${styles.galleryMedia} ${styles[`galleryMedia${card.tone[0].toUpperCase()}${card.tone.slice(1)}`]}`} style={coverStyle}>
        <div className={styles.galleryShade} />
        <span className={`${styles.galleryBadge} ${styles[`galleryBadge${card.tone[0].toUpperCase()}${card.tone.slice(1)}`]}`}>
          {card.badge}
        </span>

        <div className={styles.galleryFooter}>
          <div className={styles.galleryTextBlock}>
            <h3 className={styles.galleryTitle}>{card.title}</h3>
            <p className={styles.gallerySubtitle}>{card.subtitle}</p>
          </div>

          <div className={styles.galleryMetaRow}>
            <span className={styles.galleryAuthor}>
              <span className={styles.galleryAuthorAvatar}>
                {card.authorAvatarUrl ? (
                  <span
                    className={styles.galleryAuthorAvatarImage}
                    style={{ backgroundImage: `url(${card.authorAvatarUrl})` }}
                  />
                ) : (
                  <span className={styles.galleryAuthorAvatarFallback}>
                    {getAvatarFallback(card.authorName)}
                  </span>
                )}
              </span>
              <span className={styles.galleryAuthorName}>{card.authorName}</span>
            </span>

            <span className={styles.galleryMetrics}>
              {card.metrics.map((metric) => (
                <span className={styles.galleryMetric} key={`${card.id}-${metric.icon}-${metric.label}`}>
                  {renderMetricIcon(metric.icon)}
                  <span>{metric.label}</span>
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PersonalCenterPage({
  view,
  publishedVideos,
  publishedWorkflows
}: PersonalCenterPageProps) {
  const [activeTab, setActiveTab] = useState<PersonalCenterTab>("works");

  const displayName = normalizeText(view.profile.displayName) ?? "NeoVisual";
  const headline = resolveHeadline(view.profile.headline);
  const bio = resolveBio(view.profile.bio);

  const publishedCards = buildPublishedCards(publishedVideos, publishedWorkflows);
  const avatarUrl =
    normalizeAssetUrl(view.profile.avatarUrl) ?? publishedCards.find((card) => card.coverUrl)?.coverUrl;
  const likedPostItems = dedupeItems(
    [...view.likedItems, ...view.favoritedItems].filter((item) => item.itemType === "post")
  );
  const discussionCards = buildLibraryCards(
    likedPostItems.length > 0 ? likedPostItems : dedupeItems(view.likedItems),
    "discussion"
  );
  const favoriteCards = buildLibraryCards(dedupeItems(view.favoritedItems), "favorite");

  const totalReceivedLikes =
    publishedVideos.reduce((sum, item) => sum + (item.likeCount ?? 0), 0) +
    publishedWorkflows.reduce((sum, item) => sum + (item.likeCount ?? 0), 0);

  const stats = [
    {
      value: formatCompactNumber(view.profile.stats.followerCount),
      label: "粉丝"
    },
    {
      value: formatCompactNumber(publishedCards.length),
      label: "作品"
    },
    {
      value: formatCompactNumber(totalReceivedLikes),
      label: "获赞"
    }
  ];

  const currentCards =
    activeTab === "works"
      ? publishedCards
      : activeTab === "discussions"
        ? discussionCards
        : favoriteCards;

  return (
    <PageShell
      profileAvatarUrl={avatarUrl}
      profileHref="/me"
      profileName={displayName}
      topNavActive="featured"
      variant="home"
    >
      <div className={styles.page}>
        <div className={styles.backRow}>
          <Link className={styles.backLink} href="/">
            ← 返回首页
          </Link>
        </div>

        <section className={styles.heroSection}>
          <div className={styles.heroGrid}>
            <div className={styles.heroAvatarColumn}>
              <div
                className={styles.heroAvatar}
                style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
              >
                {avatarUrl ? null : (
                  <span className={styles.heroAvatarFallback}>{getAvatarFallback(displayName)}</span>
                )}
              </div>
            </div>

            <div className={styles.heroCopy}>
              <h1 className={styles.title}>{displayName}</h1>
              <p className={styles.headline}>{headline}</p>
              <p className={styles.bio}>{bio}</p>

              <div className={styles.statsRow}>
                {stats.map((item) => (
                  <div className={styles.statBlock} key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.heroActions}>
              <button className={styles.editButton} type="button">
                编辑资料
              </button>
              <button aria-label="个人主页设置" className={styles.iconButton} type="button">
                <SettingsIcon />
              </button>
            </div>
          </div>
        </section>

        <section className={styles.tabSection}>
          <div className={styles.tabBar}>
            <button
              className={activeTab === "works" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => setActiveTab("works")}
            >
              作品
            </button>
            <button
              className={activeTab === "discussions" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => setActiveTab("discussions")}
            >
              讨论
            </button>
            <button
              className={activeTab === "favorites" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => setActiveTab("favorites")}
            >
              收藏
            </button>
          </div>
        </section>

        <section className={styles.contentSection}>
          {currentCards.length > 0 ? (
            <div className={styles.galleryGrid}>
              {currentCards.map((card) => (
                <GalleryCard card={card} key={card.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              description="这里先保留当前标签的占位，等后端补齐更多个人内容数据后再接入。"
              title={
                activeTab === "works"
                  ? "暂时还没有发布内容"
                  : activeTab === "discussions"
                    ? "暂时还没有讨论记录"
                    : "暂时还没有收藏内容"
              }
            />
          )}
        </section>
      </div>
    </PageShell>
  );
}
