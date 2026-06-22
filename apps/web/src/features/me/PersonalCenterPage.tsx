"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ProfileMediaCard, type ProfileMediaCardView } from "@/components/shared/ProfileMediaCard";
import { ContextBackLink } from "@/components/shared/ContextBackLink";
import { PageShell } from "@/components/shared/PageShell";
import { RouteVideoLoading } from "@/components/shared/RouteVideoLoading";
import { uploadAssetFromClient } from "@/lib/api/upload-client";
import type {
  DiscussionThreadCardView,
  PersonalCenterDraftItemView,
  PersonalCenterItemView,
  PersonalCenterPageView,
  VideoMiniCardView,
  WorkflowMiniCardView
} from "@/lib/contracts/view-models";
import { formatContentKindBadge, formatEntityTypeBadge, normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import {
  buildBackAnchorSource,
  buildCurrentRoute,
  createBackAnchorId
} from "@/lib/routes/back-anchor";
import { useListPageBackRestore } from "@/lib/routes/list-page-back-restore";
import { appendBackSource } from "@/lib/routes/redirect-utils";
import { deleteMeDraftAction, updateMeProfileAction } from "./actions";
import styles from "./PersonalCenterPage.module.css";

type PersonalCenterPageProps = {
  view: PersonalCenterPageView;
  publishedVideos: VideoMiniCardView[];
  publishedPrompts: VideoMiniCardView[];
  publishedWorkflows: WorkflowMiniCardView[];
  backHref?: string;
};

type PersonalCenterTab = "works" | "workflows" | "posts" | "drafts" | "likes" | "favorites";

type ProfileFormState = {
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  avatarFile?: File;
  avatarPreviewUrl?: string;
};

type ActionNotice = {
  tone: "success" | "error";
  text: string;
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

  return normalized;
}

function resolveBio(bio?: string) {
  const normalized = normalizeText(bio);

  if (!normalized) {
    return "探索 AI 创作的无限边界，专注于电影感视觉叙事、提示词拆解与社区灵感沉淀。";
  }

  return normalized;
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

function buildPublishedCards(
  videos: VideoMiniCardView[],
  prompts: VideoMiniCardView[],
  workflows: WorkflowMiniCardView[]
): {
  workCards: ProfileMediaCardView[];
  workflowCards: ProfileMediaCardView[];
} {
  const workCards = [
    ...videos.map((video): ProfileMediaCardView => ({
      id: `video-${video.id}`,
      href: `/videos/${video.id}`,
      badge: formatEntityTypeBadge("video"),
      title: normalizeText(video.title) ?? "未命名作品",
      coverUrl: normalizeAssetUrl(video.coverUrl),
      posterUrl: normalizeAssetUrl(video.posterUrl),
      previewUrl: normalizeAssetUrl(video.previewUrl),
      sourceUrl: normalizeAssetUrl(video.sourceUrl),
      authorName: normalizeText(video.author.displayName) ?? "DramaTV Creator",
      authorAvatarUrl: normalizeAssetUrl(video.author.avatarUrl),
      metrics: [
        { icon: "heart", label: formatCompactNumber(video.likeCount ?? 0) },
        { icon: "play", label: formatCompactNumber(video.playCount ?? 0) }
      ]
    })),
    ...prompts.map((prompt): ProfileMediaCardView => ({
      id: `prompt-${prompt.id}`,
      href: `/prompts/${prompt.id}`,
      badge: formatEntityTypeBadge("prompt"),
      title: normalizeText(prompt.title) ?? "未命名提示词",
      coverUrl: normalizeAssetUrl(prompt.coverUrl),
      posterUrl: normalizeAssetUrl(prompt.posterUrl),
      previewUrl: normalizeAssetUrl(prompt.previewUrl),
      sourceUrl: normalizeAssetUrl(prompt.sourceUrl),
      promptModality: prompt.sourceUrl || prompt.previewUrl ? "video" : "image",
      authorName: normalizeText(prompt.author.displayName) ?? "DramaTV Creator",
      authorAvatarUrl: normalizeAssetUrl(prompt.author.avatarUrl),
      metrics: [
        { icon: "heart", label: formatCompactNumber(prompt.likeCount ?? 0) },
        { icon: "play", label: formatCompactNumber(prompt.playCount ?? 0) }
      ]
    }))
  ];

  const workflowCards = workflows.map((workflow): ProfileMediaCardView => ({
    id: `workflow-${workflow.id}`,
    href: `/workflows/${workflow.id}`,
    badge: formatEntityTypeBadge("workflow"),
    title: normalizeText(workflow.title) ?? "未命名工作流",
    coverUrl: normalizeAssetUrl(workflow.coverUrl),
    authorName: normalizeText(workflow.author.displayName) ?? "DramaTV Creator",
    authorAvatarUrl: normalizeAssetUrl(workflow.author.avatarUrl),
    resourceType: "workflow",
    metrics: [
      { icon: "heart", label: formatCompactNumber(workflow.likeCount ?? 0) },
      { icon: "save", label: workflow.allowCopy ? "可复制" : "只读" }
    ]
  }));

  return { workCards, workflowCards };
}

function buildLibraryCards(
  items: PersonalCenterItemView[],
  mode: "like" | "favorite"
): ProfileMediaCardView[] {
  return items.map(
    (item): ProfileMediaCardView => ({
      id: `${mode}-${item.itemType}-${item.targetId}`,
      href: item.href,
      badge:
        item.itemType === "workflow"
          ? formatEntityTypeBadge("workflow")
          : item.itemType === "prompt"
            ? formatEntityTypeBadge("prompt")
            : item.itemType === "post"
              ? formatContentKindBadge("post")
              : formatContentKindBadge("workflow_work"),
      title: normalizeText(item.title) ?? "未命名内容",
      coverUrl: normalizeAssetUrl(item.coverUrl),
      authorName: normalizeText(item.author.displayName) ?? "DramaTV Creator",
      authorAvatarUrl: normalizeAssetUrl(item.author.avatarUrl),
      metrics:
        mode === "like"
          ? [
              { icon: "heart", label: "已点赞" },
              { icon: "clock", label: item.actedAtLabel }
            ]
          : [
              { icon: "save", label: "已收藏" },
              { icon: "clock", label: item.actedAtLabel }
            ]
    })
  );
}

function buildPostCards(items: DiscussionThreadCardView[]): ProfileMediaCardView[] {
  return items.map(
    (item): ProfileMediaCardView => ({
      id: `post-${item.id}`,
      href: item.href,
      badge: formatContentKindBadge("post"),
      title: normalizeText(item.title) ?? "未命名帖子",
      coverUrl: undefined,
      authorName: "我",
      authorAvatarUrl: undefined,
      metrics: [
        { icon: "heart", label: formatCompactNumber(item.likeCount ?? 0) },
        { icon: "save", label: formatCompactNumber(item.favoriteCount ?? 0) },
        { icon: "clock", label: item.lastActivityLabel }
      ]
    })
  );
}

function formatDraftTypeLabel(value: PersonalCenterDraftItemView["draftType"]) {
  switch (value) {
    case "video":
      return "视频创作";
    case "post":
      return "帖子创作";
    case "workflow":
      return "工作流创作";
    default:
      return "创作记录";
  }
}

function DraftCard({
  draft,
  pending,
  onDelete
}: {
  draft: PersonalCenterDraftItemView;
  pending: boolean;
  onDelete: (draft: PersonalCenterDraftItemView) => void;
}) {
  const coverStyle = draft.coverUrl ? { backgroundImage: `url(${normalizeAssetUrl(draft.coverUrl)})` } : undefined;
  const className = `${styles.draftCard} ${styles[`draftCard${draft.draftType[0].toUpperCase()}${draft.draftType.slice(1)}`]}`;
  const canDelete = draft.editable && draft.continueHref;
  const actionLabel = draft.processingStatusLabel && draft.statusLabel === "已提交" ? "查看状态" : draft.editable ? "继续编辑" : "编辑器未开放";
  const content = (
    <>
      <div className={styles.draftMedia} style={coverStyle}>
        <span>{formatDraftTypeLabel(draft.draftType)}</span>
      </div>

      <div className={styles.draftContent}>
        <div className={styles.draftMetaRow}>
          <span className={styles.privateBadge}>仅自己可见</span>
          <span>{draft.updatedAtLabel}</span>
        </div>

        <h3>{draft.title}</h3>
        <p>{draft.summary ?? "这条创作记录还没有摘要，继续编辑后会自动沉淀为可发布内容。"}</p>

        <div className={styles.draftFooter}>
          <span>{draft.statusLabel} / {draft.currentStepLabel}</span>
          <strong>{actionLabel}</strong>
        </div>

        {draft.processingStatusLabel ? (
          <div className={styles.draftStatusStack}>
            <span className={styles.draftStatusChip}>{draft.processingStatusLabel}</span>
            {draft.processingMessage ? (
              <p className={styles.draftStatusMessage}>{draft.processingMessage}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <article className={`${className} ${!draft.continueHref ? styles.draftCardDisabled : ""}`}>
      {draft.continueHref ? (
        <Link className={styles.draftLink} href={draft.continueHref}>
          {content}
        </Link>
      ) : (
        content
      )}

      {canDelete ? (
        <button
          className={styles.draftDeleteButton}
          disabled={pending}
          type="button"
          onClick={() => onDelete(draft)}
        >
          {pending ? "处理中" : "删除记录"}
        </button>
      ) : null}
    </article>
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

function ProfileEditModal({
  form,
  notice,
  pending,
  onAvatarChange,
  onChange,
  onClose,
  onSubmit
}: {
  form: ProfileFormState;
  notice: ActionNotice | null;
  pending: boolean;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onChange: (patch: Partial<ProfileFormState>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const previewUrl = form.avatarPreviewUrl || form.avatarUrl;

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="profile-edit-title"
        aria-modal="true"
        className={styles.profileModal}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.modalEyebrow}>Profile</span>
            <h2 id="profile-edit-title">编辑资料</h2>
          </div>
          <button aria-label="关闭编辑资料弹窗" className={styles.modalCloseButton} type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <form className={styles.profileForm} onSubmit={onSubmit}>
          <div className={styles.avatarEditRow}>
            <div
              className={styles.modalAvatarPreview}
              style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
            >
              {previewUrl ? null : getAvatarFallback(form.displayName)}
            </div>

            <div className={styles.avatarCopy}>
              <strong>头像</strong>
              <span>支持上传图片，保存后会同步到个人中心和作者页。</span>
              <label className={styles.avatarUploadButton}>
                更换头像
                <input accept="image/*" type="file" onChange={onAvatarChange} />
              </label>
            </div>
          </div>

          <label className={styles.profileField}>
            <span>昵称</span>
            <input
              maxLength={64}
              name="displayName"
              placeholder="输入社区昵称"
              type="text"
              value={form.displayName}
              onChange={(event) => onChange({ displayName: event.target.value })}
            />
          </label>

          <label className={styles.profileField}>
            <span>身份说明</span>
            <input
              maxLength={128}
              name="headline"
              placeholder="例如：AI 视觉艺术家 / 提示词工程师"
              type="text"
              value={form.headline}
              onChange={(event) => onChange({ headline: event.target.value })}
            />
          </label>

          <label className={styles.profileField}>
            <span>个人简介</span>
            <textarea
              maxLength={512}
              name="bio"
              placeholder="介绍你的创作方向、作品风格或工作流能力"
              value={form.bio}
              onChange={(event) => onChange({ bio: event.target.value })}
            />
          </label>

          {notice ? (
            <div className={`${styles.formNotice} ${notice.tone === "error" ? styles.formNoticeError : ""}`}>
              {notice.text}
            </div>
          ) : null}

          <div className={styles.modalFooter}>
            <button className={styles.modalGhostButton} disabled={pending} type="button" onClick={onClose}>
              取消
            </button>
            <button className={styles.modalPrimaryButton} disabled={pending} type="submit">
              {pending ? "保存中" : "保存资料"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function PersonalCenterPage({
  view,
  publishedVideos,
  publishedPrompts,
  publishedWorkflows,
  backHref = "/"
}: PersonalCenterPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageView, setPageView] = useState(view);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    displayName: normalizeText(view.profile.displayName) ?? "",
    headline: normalizeText(view.profile.headline) ?? "",
    bio: normalizeText(view.profile.bio) ?? "",
    avatarUrl: normalizeAssetUrl(view.profile.avatarUrl) ?? ""
  });
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [pendingDraftKey, setPendingDraftKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPageView(view);
    setProfileForm({
      displayName: normalizeText(view.profile.displayName) ?? "",
      headline: normalizeText(view.profile.headline) ?? "",
      bio: normalizeText(view.profile.bio) ?? "",
      avatarUrl: normalizeAssetUrl(view.profile.avatarUrl) ?? ""
    });
  }, [view]);

  const displayName = normalizeText(pageView.profile.displayName) ?? "NeoVisual";
  const headline = resolveHeadline(pageView.profile.headline);
  const bio = resolveBio(pageView.profile.bio);

  const { workCards, workflowCards } = buildPublishedCards(publishedVideos, publishedPrompts, publishedWorkflows);
  const avatarUrl =
    normalizeAssetUrl(pageView.profile.avatarUrl) ?? workCards.find((card) => card.coverUrl)?.coverUrl;
  const likedCards = buildLibraryCards(dedupeItems(pageView.likedItems), "like");
  const favoriteCards = buildLibraryCards(dedupeItems(pageView.favoritedItems), "favorite");
  const postCards = buildPostCards(pageView.posts);
  const activeTab = parsePersonalCenterTab(searchParams.get("tab"));
  const currentRoute = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (activeTab === "works") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", activeTab);
    }

    return buildCurrentRoute(pathname, nextParams);
  }, [activeTab, pathname, searchParams]);

  const stats = [
    {
      value: formatCompactNumber(pageView.profile.stats.followerCount),
      label: "粉丝"
    },
    {
      value: formatCompactNumber(workCards.length),
      label: "作品"
    },
    {
      value: formatCompactNumber(workflowCards.length),
      label: "工作流"
    },
    {
      value: formatCompactNumber(pageView.profile.stats.likeReceivedCount),
      label: "获赞"
    },
    {
      value: formatCompactNumber(pageView.posts.length),
      label: "帖子"
    },
    {
      value: formatCompactNumber(pageView.draftItems.length),
      label: "创作中"
    }
  ];

  const currentCards =
    activeTab === "works"
      ? workCards
      : activeTab === "workflows"
        ? workflowCards
      : activeTab === "posts"
        ? postCards
      : activeTab === "likes"
        ? likedCards
        : favoriteCards;

  const { isBackAnchorRestoring } = useListPageBackRestore({
    currentRoute,
    dependencies: [activeTab, currentCards.length, pageView.draftItems.length]
  });

  function handleTabChange(nextTab: PersonalCenterTab) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextTab === "works") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", nextTab);
    }

    const nextRoute = buildCurrentRoute(pathname, nextParams);
    const currentRouteFromUrl = buildCurrentRoute(pathname, searchParams.toString());

    if (nextRoute !== currentRouteFromUrl) {
      router.replace(nextRoute, { scroll: false });
    }
  }

  function handleOpenProfileModal() {
    setProfileForm({
      displayName,
      headline: normalizeText(pageView.profile.headline) ?? "",
      bio: normalizeText(pageView.profile.bio) ?? "",
      avatarUrl: normalizeAssetUrl(pageView.profile.avatarUrl) ?? "",
      avatarFile: undefined,
      avatarPreviewUrl: undefined
    });
    setNotice(null);
    setProfileModalOpen(true);
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProfileForm((current) => ({
      ...current,
      avatarFile: file,
      avatarPreviewUrl: URL.createObjectURL(file)
    }));
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      let avatarAssetId: string | undefined;
      let avatarUrl = profileForm.avatarUrl;

      try {
        if (profileForm.avatarFile) {
          const uploadedAvatar = await uploadAssetFromClient({
            kind: "image",
            assetRole: "avatar",
            file: profileForm.avatarFile
          });
          avatarAssetId = uploadedAvatar.assetId;
          avatarUrl = "";
        }
      } catch (error) {
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "头像上传失败。"
        });
        return;
      }

      const result = await updateMeProfileAction({
        displayName: profileForm.displayName,
        headline: profileForm.headline,
        bio: profileForm.bio,
        avatarUrl,
        avatarAssetId
      });

      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.message
        });
        return;
      }

      setPageView((current) => ({
        ...current,
        profile: result.profile
      }));
      setProfileForm((current) => ({
        ...current,
        displayName: result.profile.displayName,
        headline: result.profile.headline ?? "",
        bio: result.profile.bio ?? "",
        avatarUrl: normalizeAssetUrl(result.profile.avatarUrl) ?? "",
        avatarFile: undefined,
        avatarPreviewUrl: undefined
      }));
      setNotice({
        tone: "success",
        text: result.message
      });
      setProfileModalOpen(false);
    });
  }

  function handleDeleteDraft(draft: PersonalCenterDraftItemView) {
    const confirmed = window.confirm(`确定删除「${draft.title}」吗？删除后不会显示在创作记录中。`);

    if (!confirmed) {
      return;
    }

    const draftKey = `${draft.draftType}-${draft.draftId}`;
    setPendingDraftKey(draftKey);

    startTransition(async () => {
      const result = await deleteMeDraftAction({
        draftType: draft.draftType,
        draftId: draft.draftId
      });

      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.message
        });
        setPendingDraftKey(null);
        return;
      }

      setPageView((current) => ({
        ...current,
        draftItems: current.draftItems.filter((item) => item.draftId !== draft.draftId)
      }));
      setNotice({
        tone: "success",
        text: result.message
      });
      setPendingDraftKey(null);
    });
  }

  return (
    <PageShell
      profileAvatarUrl={avatarUrl}
      profileHref="/me"
      profileName={displayName}
      topNavActive="featured"
      variant="home"
    >
      <div
        aria-hidden={isBackAnchorRestoring}
        className={`${styles.page}${isBackAnchorRestoring ? ` ${styles.pageRestoring}` : ""}`}
      >
        <div className={styles.backRow}>
          <ContextBackLink className={styles.backLink} href={backHref}>
            ← 返回首页
          </ContextBackLink>
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
              <button className={styles.editButton} type="button" onClick={handleOpenProfileModal}>
                编辑资料
              </button>
              <button aria-label="个人主页设置" className={styles.iconButton} type="button" onClick={handleOpenProfileModal}>
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
            <button
              className={activeTab === "drafts" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => handleTabChange("drafts")}
            >
              创作记录
            </button>
            <button
              className={activeTab === "likes" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => handleTabChange("likes")}
            >
              点赞
            </button>
            <button
              className={activeTab === "favorites" ? styles.tabActive : styles.tab}
              type="button"
              onClick={() => handleTabChange("favorites")}
            >
              收藏
            </button>
          </div>
        </section>

        <section className={styles.contentSection}>
          {activeTab === "drafts" ? (
            pageView.draftItems.length > 0 ? (
              <div className={styles.draftGrid}>
                {pageView.draftItems.map((draft) => (
                  <DraftCard
                    draft={draft}
                    key={`${draft.draftType}-${draft.draftId}`}
                    pending={pendingDraftKey === `${draft.draftType}-${draft.draftId}`}
                    onDelete={handleDeleteDraft}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                description="未提交内容，以及已提交但仍在审核或媒体处理中的创作记录，会先沉淀在这里，仅当前登录用户可见。"
                title="创作记录为空"
              />
            )
          ) : currentCards.length > 0 ? (
              <div className={styles.galleryGrid}>
                {currentCards.map((card, index) => (
                  <ProfileMediaCard
                    anchorId={createBackAnchorId(`me-${activeTab}`, `${index}-${card.id}`)}
                    backSource={currentRoute}
                    item={card}
                    key={card.id}
                    previewGroup={`me-${activeTab}`}
                  />
                ))}
              </div>
          ) : (
            <EmptyState
              description="这里先保留当前标签的占位，等后端补齐更多个人内容数据后再接入。"
              title={
                activeTab === "works"
                  ? "暂时还没有发布内容"
                  : activeTab === "workflows"
                    ? "暂时还没有发布工作流"
                  : activeTab === "posts"
                    ? "暂时还没有发布帖子"
                  : activeTab === "likes"
                    ? "暂时还没有点赞内容"
                    : "暂时还没有收藏内容"
              }
            />
          )}
        </section>
      </div>

      {notice && !profileModalOpen ? (
        <div className={`${styles.pageNotice} ${notice.tone === "error" ? styles.pageNoticeError : ""}`}>
          {notice.text}
        </div>
      ) : null}

      {profileModalOpen ? (
        <ProfileEditModal
          form={profileForm}
          notice={notice}
          pending={pending}
          onAvatarChange={handleAvatarChange}
          onChange={(patch) => setProfileForm((current) => ({ ...current, ...patch }))}
          onClose={() => setProfileModalOpen(false)}
          onSubmit={handleProfileSubmit}
        />
      ) : null}
      {isBackAnchorRestoring ? (
        <div className={styles.backAnchorRestoreOverlay}>
          <RouteVideoLoading
            activeNav="home"
            label="Restoring personal position"
            useVideo={false}
            videoActive={false}
          />
        </div>
      ) : null}
    </PageShell>
  );
}
function parsePersonalCenterTab(value: string | null): PersonalCenterTab {
  switch (value) {
    case "workflows":
    case "posts":
    case "drafts":
    case "likes":
    case "favorites":
      return value;
    default:
      return "works";
  }
}
