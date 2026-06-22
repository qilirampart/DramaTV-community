"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProfileMediaCard, type ProfileMediaCardView } from "@/components/shared/ProfileMediaCard";
import { ContextBackLink } from "@/components/shared/ContextBackLink";
import { PageShell } from "@/components/shared/PageShell";
import { RouteVideoLoading } from "@/components/shared/RouteVideoLoading";
import {
  loadMoreCreatorPostsAction,
  loadMoreCreatorWorksAction,
  loadMoreCreatorWorkflowsAction,
  toggleCreatorFollowAction
} from "@/features/community-interactions/actions";
import { copyText } from "@/lib/browser/copy-text";
import type {
  CreatorPageView,
  DiscussionThreadCardView,
  VideoMiniCardView,
  WorkflowMiniCardView
} from "@/lib/contracts/view-models";
import { formatEntityTypeBadge, normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import {
  buildBackAnchorSource,
  buildCurrentRoute,
  createBackAnchorId
} from "@/lib/routes/back-anchor";
import { useListPageBackRestore } from "@/lib/routes/list-page-back-restore";
import { appendBackSource, normalizeBackTarget } from "@/lib/routes/redirect-utils";
import styles from "./CreatorPage.module.css";

type CreatorPageProps = {
  view: CreatorPageView;
  backHref?: string;
};

type ActionNotice = {
  tone: "neutral" | "success" | "error";
  text: string;
};

type CreatorTab = "works" | "workflows" | "posts";

type CreatorPageSessionSnapshot = {
  routeKey: string;
  view: CreatorPageView;
  storedAt: number;
};

type CreatorPageSessionSnapshotPayload = {
  routeKey: string;
  view: {
    works: CreatorPageView["works"];
    workflows: CreatorPageView["workflows"];
    posts: CreatorPageView["posts"];
    nextWorksCursor?: string;
    nextWorkflowCursor?: string;
    nextPostCursor?: string;
  };
  storedAt: number;
};

const CREATOR_PAGE_SESSION_STORAGE_KEY = "dramatv:creator-page-snapshot:v1";
const CREATOR_PAGE_SESSION_MAX_AGE_MS = 30 * 60 * 1000;
const CREATOR_PAGE_SESSION_MAX_ITEMS_PER_BUCKET = 48;
function normalizeCreatorPageRouteKey(routeKey: string) {
  return normalizeBackTarget(routeKey, routeKey);
}

const creatorPageMemorySnapshots = new Map<string, CreatorPageSessionSnapshot>();

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

function mergeItemsById<T extends { id: string }>(current: T[], incoming: T[]) {
  if (incoming.length === 0) {
    return current;
  }

  const seen = new Set(current.map((item) => item.id));
  const additions = incoming.filter((item) => !seen.has(item.id));

  return additions.length > 0 ? [...current, ...additions] : current;
}

function readCreatorPageSessionSnapshot(routeKey: string): CreatorPageView | null {
  const normalizedRouteKey = normalizeCreatorPageRouteKey(routeKey);
  const memorySnapshot =
    creatorPageMemorySnapshots.get(normalizedRouteKey) ?? creatorPageMemorySnapshots.get(routeKey);
  if (memorySnapshot && Date.now() - memorySnapshot.storedAt <= CREATOR_PAGE_SESSION_MAX_AGE_MS) {
    return memorySnapshot.view;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CREATOR_PAGE_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CreatorPageSessionSnapshotPayload;
    if (!parsed) {
      return null;
    }

    const parsedRouteKey = normalizeCreatorPageRouteKey(parsed.routeKey);
    if (parsedRouteKey !== normalizedRouteKey) {
      return null;
    }

    if (Date.now() - parsed.storedAt > CREATOR_PAGE_SESSION_MAX_AGE_MS) {
      return null;
    }

    return {
      profile: {
        id: "",
        displayName: "",
        followed: false
      },
      stats: {
        videoCount: 0,
        workflowCount: 0,
        followerCount: 0,
        likeReceivedCount: 0
      },
      works: parsed.view.works,
      workflows: parsed.view.workflows,
      posts: parsed.view.posts,
      nextWorksCursor: parsed.view.nextWorksCursor,
      nextWorkflowCursor: parsed.view.nextWorkflowCursor,
      nextPostCursor: parsed.view.nextPostCursor
    };
  } catch {
    return null;
  }
}

function writeCreatorPageSessionSnapshot(routeKey: string, view: CreatorPageView) {
  const normalizedRouteKey = normalizeCreatorPageRouteKey(routeKey);
  creatorPageMemorySnapshots.set(routeKey, {
    routeKey: normalizedRouteKey,
    view,
    storedAt: Date.now()
  });
  creatorPageMemorySnapshots.set(normalizedRouteKey, {
    routeKey: normalizedRouteKey,
    view,
    storedAt: Date.now()
  });

  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: CreatorPageSessionSnapshotPayload = {
      routeKey: normalizedRouteKey,
      view: {
        works: view.works.slice(0, CREATOR_PAGE_SESSION_MAX_ITEMS_PER_BUCKET),
        workflows: view.workflows.slice(0, CREATOR_PAGE_SESSION_MAX_ITEMS_PER_BUCKET),
        posts: view.posts.slice(0, CREATOR_PAGE_SESSION_MAX_ITEMS_PER_BUCKET),
        nextWorksCursor: view.nextWorksCursor,
        nextWorkflowCursor: view.nextWorkflowCursor,
        nextPostCursor: view.nextPostCursor
      },
      storedAt: Date.now()
    };
    window.sessionStorage.setItem(CREATOR_PAGE_SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
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

function toCreatorWorkCard(item: VideoMiniCardView): ProfileMediaCardView {
  const isPrompt = item.itemType === "prompt";
  return {
    id: item.id,
    href: item.href ?? (isPrompt ? `/prompts/${item.id}` : `/videos/${item.id}`),
    badge: formatEntityTypeBadge(isPrompt ? "prompt" : "video"),
    title: normalizeText(item.title) ?? (isPrompt ? "未命名提示词" : "未命名提示词作品"),
    coverUrl: normalizeAssetUrl(item.coverUrl),
    posterUrl: normalizeAssetUrl(item.posterUrl),
    previewUrl: normalizeAssetUrl(item.previewUrl),
    sourceUrl: normalizeAssetUrl(item.sourceUrl),
    promptModality: isPrompt ? item.promptModality : undefined,
    authorName: normalizeText(item.author.displayName) ?? "DramaTV Creator",
    authorAvatarUrl: normalizeAssetUrl(item.author.avatarUrl),
    metrics: [
      { icon: "heart", label: formatCompactNumber(item.likeCount ?? 0) },
      { icon: "play", label: formatCompactNumber(item.playCount ?? 0) }
    ]
  };
}

function toWorkflowCard(workflow: WorkflowMiniCardView): ProfileMediaCardView {
  return {
    id: workflow.id,
    href: `/workflows/${workflow.id}`,
    badge: formatEntityTypeBadge("workflow"),
    title: normalizeText(workflow.title) ?? "未命名工作流",
    subtitle:
      normalizeText(workflow.summary) ?? "工作流资源，后续继续联动画布入口和复制链路。",
    coverUrl: normalizeAssetUrl(workflow.coverUrl),
    authorName: normalizeText(workflow.author.displayName) ?? "DramaTV Creator",
    authorAvatarUrl: normalizeAssetUrl(workflow.author.avatarUrl),
    resourceType: "workflow",
    metrics: [
      { icon: "heart", label: formatCompactNumber(workflow.likeCount ?? 0) },
      { icon: "save", label: workflow.allowCopy ? "可复制" : "只读" }
    ]
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

function PostCard({ item, backSource, anchorId }: { item: DiscussionThreadCardView; backSource: string; anchorId: string }) {
  return (
    <Link className={styles.postCard} href={appendBackSource(item.href, buildBackAnchorSource(backSource, anchorId))} id={anchorId}>
      <div className={styles.postCardTop}>
        <span>{item.channelTitle}</span>
        <span>{item.lastActivityLabel}</span>
      </div>

      <h3>{normalizeText(item.title) ?? "未命名帖子"}</h3>
      <p>{normalizeText(item.excerpt) ?? "这位创作者发布的社区讨论内容。"}</p>

      <div className={styles.postMetaRow}>
        <span>{item.likeCountLabel}</span>
        <span>{item.favoriteCountLabel}</span>
        <span>{item.replyCountLabel}</span>
      </div>

      {item.tags.length > 0 ? (
        <div className={styles.postTags}>
          {item.tags.slice(0, 4).map((tag) => (
            <span key={`${item.id}-${tag}`}>{tag}</span>
          ))}
        </div>
      ) : null}
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

function SectionHint({ text }: { text: string }) {
  return <p className={styles.sectionHint}>{text}</p>;
}

export function CreatorPage({ view, backHref = "/home" }: CreatorPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState(view);
  const [pending, setPending] = useState(false);
  const [loadingMoreTab, setLoadingMoreTab] = useState<CreatorTab | null>(null);
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  useEffect(() => {
    setCurrentView((current) => {
      if (current.profile.id !== view.profile.id) {
        return view;
      }

      const keepCurrentWorks = current.works.length > view.works.length;
      const keepCurrentWorkflows = current.workflows.length > view.workflows.length;
      const keepCurrentPosts = current.posts.length > view.posts.length;

      return {
        ...view,
        works: keepCurrentWorks ? current.works : view.works,
        workflows: keepCurrentWorkflows ? current.workflows : view.workflows,
        posts: keepCurrentPosts ? current.posts : view.posts,
        nextWorksCursor: keepCurrentWorks ? current.nextWorksCursor : view.nextWorksCursor,
        nextWorkflowCursor: keepCurrentWorkflows ? current.nextWorkflowCursor : view.nextWorkflowCursor,
        nextPostCursor: keepCurrentPosts ? current.nextPostCursor : view.nextPostCursor
      };
    });
  }, [view]);

  const displayName = normalizeText(currentView.profile.displayName) ?? "DramaTV Creator";
  const headline = normalizeText(currentView.profile.headline);
  const bio = normalizeText(currentView.profile.bio);
  const intro = headline ?? bio ?? "AI 创作者档案页，先展示作品，再逐步补齐工作流与互动信息。";
  const secondaryCopy = headline && bio && bio !== headline ? bio : undefined;

  const workItems = currentView.works.map(toCreatorWorkCard);
  const workflowItems = currentView.workflows.map(toWorkflowCard);
  const activeTab = parseCreatorTab(searchParams.get("tab"));
  const currentRoute = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (activeTab === "works") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", activeTab);
    }

    return buildCurrentRoute(pathname, nextParams);
  }, [activeTab, pathname, searchParams]);
  const currentRouteKey = useMemo(
    () => normalizeCreatorPageRouteKey(currentRoute),
    [currentRoute]
  );

  const publishedCount = currentView.stats.videoCount;
  const workflowCount = currentView.stats.workflowCount;
  const postCount = currentView.posts.length;
  const avatarUrl = normalizeAssetUrl(currentView.profile.avatarUrl);
  const hasMoreWorks = Boolean(currentView.nextWorksCursor);
  const hasMoreWorkflows = Boolean(currentView.nextWorkflowCursor);
  const hasMorePosts = Boolean(currentView.nextPostCursor);

  useEffect(() => {
    const restoredView = readCreatorPageSessionSnapshot(currentRouteKey);
    if (!restoredView) {
      return;
    }

    setCurrentView((current) => {
      if (
        restoredView.works.length <= current.works.length &&
        restoredView.workflows.length <= current.workflows.length &&
        restoredView.posts.length <= current.posts.length
      ) {
        return current;
      }

      return {
        ...current,
        works: restoredView.works.length > current.works.length ? restoredView.works : current.works,
        workflows:
          restoredView.workflows.length > current.workflows.length ? restoredView.workflows : current.workflows,
        posts: restoredView.posts.length > current.posts.length ? restoredView.posts : current.posts,
        nextWorksCursor:
          restoredView.works.length > current.works.length
            ? restoredView.nextWorksCursor
            : current.nextWorksCursor,
        nextWorkflowCursor:
          restoredView.workflows.length > current.workflows.length
            ? restoredView.nextWorkflowCursor
            : current.nextWorkflowCursor,
        nextPostCursor:
          restoredView.posts.length > current.posts.length
            ? restoredView.nextPostCursor
            : current.nextPostCursor
      };
    });
  }, [currentRouteKey]);

  useEffect(() => {
    writeCreatorPageSessionSnapshot(currentRouteKey, currentView);
  }, [currentRouteKey, currentView]);

  const { isBackAnchorRestoring } = useListPageBackRestore({
    currentRoute,
    dependencies: [activeTab, workItems.length, workflowItems.length, currentView.posts.length]
  });

  function handleTabChange(nextTab: CreatorTab) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextTab === "works") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", nextTab);
    }

    const nextRoute = buildCurrentRoute(pathname, nextParams);
    const currentSearch = searchParams.toString();
    const currentRouteFromUrl = buildCurrentRoute(pathname, currentSearch);

    if (nextRoute !== currentRouteFromUrl) {
      router.replace(nextRoute, { scroll: false });
    }
  }

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
      await copyText(window.location.href);
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

  async function handleLoadMoreWorks() {
    if (!hasMoreWorks || loadingMoreTab) {
      return;
    }

    setLoadingMoreTab("works");
    setNotice(null);

    try {
      const result = await loadMoreCreatorWorksAction({
        creatorId: currentView.profile.id,
        cursor: currentView.nextWorksCursor ?? ""
      });

      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.message
        });
        return;
      }

      const { patch } = result;
      if (patch.kind !== "works") {
        setNotice({
          tone: "error",
          text: "加载更多作品失败。"
        });
        return;
      }

      setCurrentView((current) => ({
        ...current,
        works: mergeItemsById(current.works, patch.works),
        nextWorksCursor: patch.nextWorksCursor
      }));
    } finally {
      setLoadingMoreTab(null);
    }
  }

  async function handleLoadMoreWorkflows() {
    if (!currentView.nextWorkflowCursor || loadingMoreTab) {
      return;
    }

    setLoadingMoreTab("workflows");
    setNotice(null);

    try {
      const result = await loadMoreCreatorWorkflowsAction({
        creatorId: currentView.profile.id,
        cursor: currentView.nextWorkflowCursor
      });

      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.message
        });
        return;
      }

      const { patch } = result;
      if (patch.kind !== "workflows") {
        setNotice({
          tone: "error",
          text: "加载更多工作流失败。"
        });
        return;
      }

      setCurrentView((current) => ({
        ...current,
        workflows: mergeItemsById(current.workflows, patch.workflows),
        nextWorkflowCursor: patch.nextWorkflowCursor
      }));
    } finally {
      setLoadingMoreTab(null);
    }
  }

  async function handleLoadMorePosts() {
    if (!currentView.nextPostCursor || loadingMoreTab) {
      return;
    }

    setLoadingMoreTab("posts");
    setNotice(null);

    try {
      const result = await loadMoreCreatorPostsAction({
        creatorId: currentView.profile.id,
        cursor: currentView.nextPostCursor
      });

      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.message
        });
        return;
      }

      const { patch } = result;
      if (patch.kind !== "posts") {
        setNotice({
          tone: "error",
          text: "加载更多帖子失败。"
        });
        return;
      }

      setCurrentView((current) => ({
        ...current,
        posts: mergeItemsById(current.posts, patch.posts),
        nextPostCursor: patch.nextPostCursor
      }));
    } finally {
      setLoadingMoreTab(null);
    }
  }

  return (
    <PageShell variant="home" topNavActive="home">
      <div
        aria-hidden={isBackAnchorRestoring}
        className={`${styles.page}${isBackAnchorRestoring ? ` ${styles.pageRestoring}` : ""}`}
      >
        <div aria-hidden="true" className={styles.backdrop}>
          <div className={styles.backdropImage} />
          <div className={styles.backdropGlow} />
          <div className={styles.backdropNoise} />
        </div>

        <div className={styles.backRow}>
          <ContextBackLink className={styles.backLink} href={backHref}>
            ← 返回上一页
          </ContextBackLink>
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
                <strong>{formatCompactNumber(currentView.stats.likeReceivedCount)}</strong>
                <span>获赞</span>
              </div>
              <div className={styles.statBlock}>
                <strong>{formatCompactNumber(publishedCount)}</strong>
                <span>作品</span>
              </div>
              <div className={styles.statBlock}>
                <strong>{formatCompactNumber(workflowCount)}</strong>
                <span>工作流</span>
              </div>
              <div className={styles.statBlock}>
                <strong>{formatCompactNumber(postCount)}</strong>
                <span>帖子</span>
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
              className={activeTab === "works" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => handleTabChange("works")}
            >
              作品
            </button>
            <button
              className={activeTab === "workflows" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => handleTabChange("workflows")}
            >
              工作流
            </button>
            <button
              className={activeTab === "posts" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => handleTabChange("posts")}
            >
              帖子
            </button>
          </div>
        </section>

        <section className={styles.contentSection}>
          {activeTab === "works" ? (
            <>
              {hasMoreWorks ? <SectionHint text="当前先展示最近公开的作品与提示词，点击下方查看更多可继续加载。" /> : null}
              {workItems.length > 0 ? (
                <>
                  <div className={styles.archiveGrid}>
                    {workItems.map((item) => (
                      <ProfileMediaCard
                        anchorId={createBackAnchorId("creator-work", item.id)}
                        key={item.id}
                        item={item}
                        backSource={currentRoute}
                        hideTextBlock
                        previewGroup="creator-works"
                      />
                    ))}
                  </div>
                  {hasMoreWorks ? (
                    <div className={styles.loadMoreRow}>
                      <button
                        className={styles.loadMoreButton}
                        disabled={loadingMoreTab === "works"}
                        type="button"
                        onClick={handleLoadMoreWorks}
                      >
                        {loadingMoreTab === "works" ? "加载中..." : "查看更多"}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyTabState
                  title="还没有发布内容"
                  description="当前创作者暂无公开作品，后续这里会继续展示视频作品和提示词资源。"
                />
              )}
            </>
          ) : null}

          {activeTab === "workflows" ? (
            <>
              {hasMoreWorkflows ? <SectionHint text="当前先展示最近公开的工作流，点击下方查看更多可继续加载。" /> : null}
              {workflowItems.length > 0 ? (
                <>
                  <div className={styles.archiveGrid}>
                    {workflowItems.map((item) => (
                      <ProfileMediaCard
                        anchorId={createBackAnchorId("creator-workflow", item.id)}
                        key={item.id}
                        item={item}
                        backSource={currentRoute}
                        hideTextBlock
                        previewGroup="creator-workflows"
                      />
                    ))}
                  </div>
                  {hasMoreWorkflows ? (
                    <div className={styles.loadMoreRow}>
                      <button
                        className={styles.loadMoreButton}
                        disabled={loadingMoreTab === "workflows"}
                        type="button"
                        onClick={handleLoadMoreWorkflows}
                      >
                        {loadingMoreTab === "workflows" ? "加载中..." : "查看更多"}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyTabState
                  title="还没有发布工作流"
                  description="当前创作者暂无公开工作流，后续这里会继续沉淀流程模板与方法论。"
                />
              )}
            </>
          ) : null}

          {activeTab === "posts" ? (
            <>
              {hasMorePosts ? <SectionHint text="当前先展示最近公开的帖子，点击下方查看更多可继续加载。" /> : null}
              {currentView.posts.length > 0 ? (
                <>
                  <div className={styles.postGrid}>
                    {currentView.posts.map((item) => (
                      <PostCard
                        anchorId={createBackAnchorId("creator-post", item.id)}
                        key={item.id}
                        item={item}
                        backSource={currentRoute}
                      />
                    ))}
                  </div>
                  {hasMorePosts ? (
                    <div className={styles.loadMoreRow}>
                      <button
                        className={styles.loadMoreButton}
                        disabled={loadingMoreTab === "posts"}
                        type="button"
                        onClick={handleLoadMorePosts}
                      >
                        {loadingMoreTab === "posts" ? "加载中..." : "查看更多"}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyTabState
                  title="还没有发布帖子"
                  description="这位创作者暂时还没有公开讨论帖，后续发布的帖子会沉淀在这里。"
                />
              )}
            </>
          ) : null}
        </section>
      </div>
      {isBackAnchorRestoring ? (
        <div className={styles.backAnchorRestoreOverlay}>
          <RouteVideoLoading
            activeNav="home"
            label="Restoring creator position"
            useVideo={false}
            videoActive={false}
          />
        </div>
      ) : null}
    </PageShell>
  );
}
function parseCreatorTab(value: string | null): CreatorTab {
  if (value === "posts" || value === "workflows") {
    return value;
  }

  return "works";
}
