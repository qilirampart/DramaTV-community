"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { PageShell } from "@/components/shared/PageShell";
import type { ApiPromptSummary } from "@/lib/contracts/community-api";
import type { CreatorMiniCardView, HomePageView, WorkflowMiniCardView } from "@/lib/contracts/view-models";
import { homeDemoCatalog, type HomeDemoCard } from "@/lib/prefill/home-resource-catalog";
import { isVideoAssetUrl, normalizeAssetUrl, normalizeText } from "@/lib/presentation";
import styles from "./HomePage.module.css";

type HomePageProps = {
  isAuthenticated: boolean;
  prompts: ApiPromptSummary[];
  view: HomePageView;
};

function resolveActionHref(isAuthenticated: boolean, href: string) {
  return isAuthenticated ? href : `/login?redirectTo=${encodeURIComponent(href)}`;
}

const REFERENCE_HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4";

const REFERENCE_HERO_AVATARS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB8aBDF6bhj14S9ohL_d848Wvlx-vOqzXAUWOWrp-oPh4Bnw7U22XGX32B4IF3OqElRFqsSZ7qdbO1QfxF3VIu7Qkd_pu_jjEKewJ6_0grqiBfJ1iyQyhbPL5vviMO3LQ1piq_rJ_cWE0OHy1IhrJeCbmLOWv2IqDs7uW2ViGR4gL01_7aB-e3fXrptzQsSdlxNJminrMoWJs0NhaezAPI7gqXew8Zh6fFcleTntHxudRo1pKM3vH5EtktFTQDsp8kFzbbwSoRLmy7_",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBret60CDBEykekJs5Rbq93q0IMXbtFyV6YQsmD-vT0OD2OfMivDXASA9lFtTyqbUiKQbfSHSld_su1beOasq1CM-PHV9LXj_VGTUx5L-wJRnbIzJaNwhKKfalhB21Uea38JWrbqjS78BU8Q8cT-gstLC0u9n1ax4IJm60d4RMapTtzICcktdZU5LAcgGT_9lGuMTNj2oqOBYJd5-NmGq4zz-k7rzGk-RlQ7gXwNGNgkZeEH8Bmvn_eiKgOUTL6Q0_70mHqsIM7BJY0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuADQAniqhZ9TkLog3HUrK4sImr3EafVA_UTsf3YgN1mNCNLwpTM6P81bTVNpKxGq_Z8IX6Qm27iWxdAi_qc41_nTePiBmybpOtIO12EXfUq46eyNBD8Y8smNdZy3pqx-Ynoo_GUEjO2U_73jVO8r_r4frDEW3n2QfWkmknWL9Y5QY5gzqaUo7cSIO_wH2Cp6AmDfZpIBoobChVeht4ml7ZKShkruQJmAw92JDNcGy7gGKkaaIxX_8a071qpz5JglMWHBjzhnF_NPZJD"
];

function GlobeIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.9 10h14.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <path
        d="M10 2.9c2.1 2.2 3.2 4.7 3.2 7.1S12.1 14.9 10 17.1C7.9 14.9 6.8 12.4 6.8 10S7.9 5.1 10 2.9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function UserCircleIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="7.7" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.9 14.1A4.8 4.8 0 0 1 10 11.9a4.8 4.8 0 0 1 4.1 2.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function DramaTvMark() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 64 64">
      <path
        d="M18 12H34.5C45.8 12 52 20.2 52 31.6C52 43 45.8 52 34.5 52H18V12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4.5"
      />
      <path
        d="M28 22.5H34C39.3 22.5 42 26.4 42 31.5C42 36.6 39.3 40.5 34 40.5H28V22.5Z"
        opacity="0.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path d="M10 51 33.5 31.5" opacity="0.85" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function getAvatarFallback(name?: string) {
  return normalizeText(name)?.charAt(0)?.toUpperCase() ?? "D";
}

function formatCompactNumber(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toLocaleString("zh-CN");
}

function getBadgeLabel(type: HomeDemoCard["resourceType"]) {
  return type === "workflow" ? "WORKFLOW" : "PROMPT";
}

function getHeroMediaStyle(card: HomeDemoCard) {
  const imageUrl = normalizeAssetUrl(card.coverUrl);
  return imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined;
}

function formatCardMetric(card: HomeDemoCard) {
  return `${formatCompactNumber(card.primaryMetric)}${card.resourceType === "workflow" ? "热度" : "浏览"}`;
}

function ArchiveCard({ card, isAuthenticated }: { card: HomeDemoCard; isAuthenticated: boolean }) {
  const authorName = normalizeText(card.author.displayName) ?? "DramaTV Creator";
  const authorAvatarUrl = normalizeAssetUrl(card.author.avatarUrl);
  const mediaUrl = normalizeAssetUrl(card.coverUrl);
  const isVideoMedia = isVideoAssetUrl(mediaUrl);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  async function handlePreviewStart() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    try {
      await video.play();
    } catch {}
  }

  function handlePreviewStop() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.pause();

    try {
      video.currentTime = 0;
    } catch {}
  }

  return (
    <Link
      className={styles.archiveCard}
      href={resolveActionHref(isAuthenticated, card.href)}
      onBlur={handlePreviewStop}
      onFocus={handlePreviewStart}
      onMouseEnter={handlePreviewStart}
      onMouseLeave={handlePreviewStop}
    >
      {isVideoMedia && mediaUrl ? (
        <video
          ref={videoRef}
          className={`${styles.archiveCardMedia}${styles.archiveCardMediaVideo}`}
          loop
          muted
          playsInline
          preload="metadata"
          src={mediaUrl}
        />
      ) : (
        <span
          className={`${styles.archiveCardMedia}${card.coverUrl ? ` ${styles.archiveCardMediaHasImage}` : ""}`}
          style={mediaUrl ? { backgroundImage: `url(${mediaUrl})` } : undefined}
        />
      )}
      <span className={styles.archiveCardShade} />
      <span className={styles.archiveCardHeader}>
        <span className={styles.archiveCardBadge}>{getBadgeLabel(card.resourceType)}</span>
      </span>
      <span className={styles.archiveCardFooter}>
        <strong className={styles.archiveCardTitle}>{card.title}</strong>
        <span className={styles.archiveCardMeta}>
          <span className={styles.archiveCardAuthor}>
            <span className={styles.archiveCardAuthorAvatar}>
              {authorAvatarUrl ? (
                <span className={styles.archiveCardAuthorAvatarImage} style={{ backgroundImage: `url(${authorAvatarUrl})` }} />
              ) : (
                <span className={styles.archiveCardAuthorAvatarFallback}>{getAvatarFallback(authorName)}</span>
              )}
            </span>
            <span className={styles.archiveCardAuthorName}>{authorName}</span>
          </span>
          <span className={styles.archiveCardMetric}>{formatCardMetric(card)}</span>
        </span>
      </span>
    </Link>
  );
}

function toPromptArchiveCard(prompt: ApiPromptSummary): HomeDemoCard {
  return {
    id: prompt.id,
    title: normalizeText(prompt.title) ?? "未命名提示词",
    summary: normalizeText(prompt.summary) ?? "进入详情页继续查看提示词和示例内容。",
    href: `/prompts/${prompt.id}`,
    coverUrl: prompt.coverUrl,
    author: {
      id: prompt.author.id,
      displayName: normalizeText(prompt.author.displayName) ?? "DramaTV Creator",
      avatarUrl: prompt.author.avatarUrl
    },
    resourceType: "prompt",
    primaryMetric: prompt.stats.exampleCount,
    secondaryMetric: prompt.stats.likeCount
  };
}

function toWorkflowArchiveCard(workflow: WorkflowMiniCardView): HomeDemoCard {
  return {
    id: workflow.id,
    title: normalizeText(workflow.title) ?? "未命名工作流",
    summary: normalizeText(workflow.summary) ?? "进入详情页继续查看工作流说明与互动状态。",
    href: `/workflows/${workflow.id}`,
    coverUrl: workflow.coverUrl,
    author: {
      id: workflow.author.id,
      displayName: normalizeText(workflow.author.displayName) ?? "DramaTV Creator",
      avatarUrl: workflow.author.avatarUrl
    },
    resourceType: "workflow",
    primaryMetric: workflow.likeCount ?? 0,
    secondaryMetric: workflow.likeCount ?? 0
  };
}

export function HomePage({ view, prompts, isAuthenticated }: HomePageProps) {
  const featuredCreators = useMemo(
    () => (view.featuredCreators.length > 0 ? view.featuredCreators.slice(0, 3) : homeDemoCatalog.creators.slice(0, 3)),
    [view.featuredCreators]
  );

  const archiveCards = useMemo<HomeDemoCard[]>(() => {
    const promptCards = prompts.map(toPromptArchiveCard);
    const workflows =
      view.hotWorkflows.length > 0 ? view.hotWorkflows.map(toWorkflowArchiveCard) : homeDemoCatalog.workflowSection;

    return [
      promptCards[0],
      promptCards[1],
      workflows[1],
      workflows[0],
      promptCards[2],
      promptCards[3],
      workflows[3],
      promptCards[4],
      workflows[2],
      promptCards[5],
      promptCards[6],
      promptCards[7]
    ].filter((card): card is HomeDemoCard => Boolean(card));
  }, [prompts]);

  const heroCard = archiveCards[0];
  const heroVideoUrl = REFERENCE_HERO_VIDEO_URL;
  const featuredArchiveHref = resolveActionHref(isAuthenticated, "/featured");
  const meHref = resolveActionHref(isAuthenticated, "/me");
  const unlockHref = isAuthenticated ? "/home" : "/login?redirectTo=%2Fhome";

  return (
    <PageShell
      gateActionsToLogin={!isAuthenticated}
      showHomeFloatingDock
      variant="home"
      topNavActive="landing"
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <span
            className={`${styles.heroMedia}${heroCard?.coverUrl ? ` ${styles.heroMediaHasImage}` : ""}`}
            style={heroCard ? getHeroMediaStyle(heroCard) : undefined}
          />
          {heroVideoUrl ? (
            <video autoPlay className={styles.heroVideo} loop muted playsInline preload="metadata">
              <source src={heroVideoUrl} type="video/mp4" />
            </video>
          ) : null}
          <span className={styles.heroShade} />

          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <div className={styles.socialProof}>
                <span className={styles.avatarStack}>
                  {featuredCreators.map((creator: CreatorMiniCardView, index) => {
                    const avatarUrl = normalizeAssetUrl(creator.avatarUrl) ?? REFERENCE_HERO_AVATARS[index];
                    const creatorName = normalizeText(creator.displayName) ?? "D";

                    return (
                      <span className={styles.avatar} key={creator.id}>
                        {avatarUrl ? (
                          <span className={styles.avatarImage} style={{ backgroundImage: `url(${avatarUrl})` }} />
                        ) : (
                          <span className={styles.avatarFallback}>{getAvatarFallback(creatorName)}</span>
                        )}
                      </span>
                    );
                  })}
                </span>
                <span>已有 7,000+ 人订阅</span>
              </div>

              <h1 className={styles.heroTitle}>
                Get <em>Inspired</em> with Us.
              </h1>
              <p className={styles.heroSummary}>
                围绕 AI 视频生成灵感、提示词结构与工作流档案，先把社区首页的视觉骨架复刻出来。
              </p>

              <div className={styles.searchPanel}>
                <span className={styles.searchHint}>Brand naming / AI tools / Video workflow</span>
                <Link className={styles.searchButton} href={featuredArchiveHref}>
                  浏览档案
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.archiveSection} id="home-curation">
          <div className={styles.archiveInner}>
            <div className={styles.archiveHeader}>
              <div className={styles.archiveCopy}>
                <span className={styles.archiveEyebrow}>精选档案</span>
                <h2 className={styles.archiveTitle}>本周最受关注的创意灵感与技术方案。</h2>
              </div>

              <Link className={styles.archiveLink} href={featuredArchiveHref}>
                查看全部
              </Link>
            </div>

            <div className={styles.archiveGrid}>
              {archiveCards.map((card) => (
                <ArchiveCard card={card} isAuthenticated={isAuthenticated} key={card.id} />
              ))}
            </div>

            <Link className={styles.unlockButton} href={unlockHref}>
              {isAuthenticated ? "进入社区主页" : "立即登录解锁全部内容"}
            </Link>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              <span className={styles.footerMark}>
                <DramaTvMark />
              </span>
              <div className={styles.footerBrandCopy}>
                <strong>Drama TV</strong>
                <span>© 2026 DRAMA TV. 全球档案。</span>
              </div>
            </div>

            <div className={styles.footerLinks}>
              <Link href="#">隐私政策</Link>
              <Link href="#">服务条款</Link>
              <Link href="#">周刊</Link>
              <Link href="#">联系我们</Link>
            </div>

            <div className={styles.footerIcons}>
              <span className={styles.footerIcon}>
                <GlobeIcon />
              </span>
              <Link aria-label="进入个人主页" className={styles.footerIcon} href={meHref}>
                <UserCircleIcon />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </PageShell>
  );
}
