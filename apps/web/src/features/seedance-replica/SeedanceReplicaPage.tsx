"use client";

import { useEffect, useMemo, useState } from "react";
import { copyText } from "@/lib/browser/copy-text";
import styles from "./SeedanceReplicaPage.module.css";
import { COMMUNITY_INTERNAL_ROUTES } from "@/lib/routes/community-routes";

type ToastState = {
  id: number;
  message: string;
};

export type SeedanceReplicaItem = {
  id: string;
  title: string;
  summary: string;
  promptText: string;
  promptLanguage: "en" | "zh";
  authorName: string;
  publishedAt: string;
  featured: boolean;
  streamId: string;
  sourceLink: string;
  authorLink?: string;
  videoSrc: string;
  importedVideoUrl: string;
  thumbnailSrc: string;
};

export type SeedanceReplicaStats = {
  totalLibraryItems: number;
  renderedItems: number;
  sourceLibrary: string;
  lastSyncedAt: string;
};

const seedanceFaqItems = [
  {
    question: "为什么有些卡片走本地视频，有些走外部视频？",
    answer:
      "当前页面优先使用已经同步到社区 `public` 目录的本地视频；其余条目先回退到已抓取的真实视频地址，避免为了扩样本一次性把大量视频全部拷进仓库。"
  },
  {
    question: "这个页面现在展示的是完整主库吗？",
    answer:
      "还不是完整主库。页面已经改成读取最新资源库索引，但前端当前只渲染一批精选样本，主库总量会通过顶部统计直接显示。"
  },
  {
    question: "提示词还是手写样本吗？",
    answer:
      "不是。现在的提示词优先来自本地整理后的资源库文件，页面不再依赖旧的手写 `seedance-samples.ts` 作为主数据源。"
  }
] as const;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 3v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.2a2.7 2.7 0 1 1 4.6 2c-.8.8-1.8 1.3-1.8 2.4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M12 3c2.7 2.8 4.1 5.8 4.1 9s-1.4 6.2-4.1 9c-2.7-2.8-4.1-5.8-4.1-9S9.3 5.8 12 3Z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m19 3 .8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8L19 3Z" />
      <path d="m5 14 .9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M8.4 12h9.6" />
      <path d="M6 9.6V4" />
      <path d="M18 8.4V20" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
      <circle cx="9" cy="10" r="1.3" />
      <path d="m20 16-4.5-4.5L8 19" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.75">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5 15.4 17.5" />
      <path d="M15.4 6.5 8.6 10.5" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.75">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="9" y="9" width="10" height="10" rx="1.8" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function SeedanceWordmark() {
  return (
    <div className={styles.wordmarkBox}>
      <div className={styles.wordmarkEmblem}>
        <span>U</span>
        <span>M</span>
      </div>
      <span className={styles.wordmarkText}>YouMind</span>
    </div>
  );
}

type CardProps = {
  item: SeedanceReplicaItem;
  onInspect: (item: SeedanceReplicaItem) => void;
  onTheater: (item: SeedanceReplicaItem) => void;
  onShare: (item: SeedanceReplicaItem) => void;
  onUsePrompt: (item: SeedanceReplicaItem) => void;
};

function SeedanceCard({ item, onInspect, onTheater, onShare, onUsePrompt }: CardProps) {
  return (
    <article className={styles.card} id={item.id}>
      <div className={styles.cardShadow} />
      {item.featured ? (
        <div className={styles.cardTapeWrap}>
          <div className={styles.cardTape}>精选</div>
        </div>
      ) : null}
      <div className={styles.cardSurface}>
        <div className={styles.cardStripe} />
        <div className={styles.cardMedia}>
          <div className={styles.cardBackdrop} style={{ backgroundImage: `url(${item.thumbnailSrc})` }} />
          <div className={styles.cardShade} />
          <div className={styles.cardFrame}>
            {item.videoSrc ? (
              <video
                className={styles.cardPoster}
                src={item.videoSrc}
                poster={item.thumbnailSrc}
                muted
                loop
                playsInline
                preload="metadata"
                autoPlay
              />
            ) : (
              <img className={styles.cardPoster} src={item.thumbnailSrc} alt={item.title} />
            )}
          </div>
          <div className={styles.cardActionTop}>
            <button
              className={styles.mediaIconButton}
              type="button"
              title="分享"
              aria-label={`分享 ${item.title}`}
              onClick={() => onShare(item)}
            >
              <ShareIcon />
            </button>
          </div>
          <div className={styles.cardActionBottom}>
            <button
              className={styles.mediaIconButton}
              type="button"
              title="全屏"
              aria-label={`全屏预览 ${item.title}`}
              onClick={() => onTheater(item)}
            >
              <FullscreenIcon />
            </button>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <button
              className={styles.infoButton}
              type="button"
              title="查看详情"
              aria-label={`查看 ${item.title} 详情`}
              onClick={() => onInspect(item)}
            >
              <InfoIcon />
            </button>
          </div>
          <p className={styles.cardSummary}>{item.summary}</p>
          <div className={styles.cardMeta}>
            <span>{item.authorName}</span>
            <span>{item.publishedAt}</span>
          </div>
          <button className={styles.ctaButton} type="button" onClick={() => onUsePrompt(item)}>
            立即体验
          </button>
        </div>
      </div>
    </article>
  );
}

export function SeedanceReplicaPage({
  initialItems,
  initialStats
}: {
  initialItems: SeedanceReplicaItem[];
  initialStats: SeedanceReplicaStats;
}) {
  const [items] = useState<SeedanceReplicaItem[]>(initialItems);
  const [stats] = useState<SeedanceReplicaStats>(initialStats);
  const [composerValue, setComposerValue] = useState("");
  const [detailItem, setDetailItem] = useState<SeedanceReplicaItem | null>(null);
  const [theaterItem, setTheaterItem] = useState<SeedanceReplicaItem | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeFaq, setActiveFaq] = useState(0);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredItems = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) {
      return items;
    }

    return items.filter((item) =>
      `${item.title} ${item.summary} ${item.authorName}`.toLowerCase().includes(keyword)
    );
  }, [items, searchValue]);

  function pushToast(message: string) {
    setToast({ id: Date.now(), message });
  }

  async function handleCopy(text: string, message: string) {
    try {
      await copyText(text);
      pushToast(message);
    } catch {
      pushToast("复制失败，请检查浏览器剪贴板权限。");
    }
  }

  async function handleShare(item: SeedanceReplicaItem) {
    const shareUrl = `${window.location.origin}${COMMUNITY_INTERNAL_ROUTES.seedance}#${item.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.summary,
          url: shareUrl
        });
        pushToast("已调起系统分享面板。");
        return;
      }
    } catch {
      // Ignore and fall back to clipboard.
    }

    await handleCopy(`${item.title}\n${shareUrl}`, "卡片链接已复制。");
  }

  function handleUsePrompt(item: SeedanceReplicaItem) {
    setComposerValue(item.promptText);
    setDetailItem(null);
    const composer = document.getElementById("seedance-composer");
    composer?.scrollIntoView({ behavior: "smooth", block: "center" });
    pushToast("提示词已预填到顶部输入框。");
  }

  function handleDownloadManifest() {
    const manifest = items.map((item) => ({
      id: item.id,
      title: item.title,
      authorName: item.authorName,
      publishedAt: item.publishedAt,
      featured: item.featured,
      streamId: item.streamId,
      sourceLink: item.sourceLink
    }));

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `seedance-preview-${stats.renderedItems}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast("当前页面样本清单已下载。");
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroDecorLarge} />
        <div className={styles.heroDecorSmall} />
        <div className={styles.heroDecorRing} />
        <div className={styles.heroInner}>
          <header className={styles.heroHeader}>
            <a className={styles.logoLink} href="#seedance-composer" aria-label="前往 Seedance 顶部输入框">
              <SeedanceWordmark />
            </a>
            <div className={styles.heroHeaderActions}>
              <button className={styles.iconSquare} type="button" title="GitHub" onClick={() => pushToast("下一步会补 GitHub 跳转与真实数据同步。")}>
                <ShareIcon />
              </button>
              <button className={styles.iconSquare} type="button" title="提交提示词" onClick={() => pushToast("当前先聚焦复刻结构，提交链路后续再补。")}>
                <PlusIcon />
              </button>
              <button className={styles.iconSquare} type="button" title="页面说明" onClick={() => setActiveFaq(1)}>
                <HelpIcon />
              </button>
              <button className={styles.localeChip} type="button" title="当前语言">
                <GlobeIcon />
                <span>简体中文</span>
              </button>
            </div>
          </header>

          <div className={styles.heroContent}>
            <div className={styles.heroTitleWrap}>
              <h1 className={styles.heroTitle}>SEEDANCE 2.0</h1>
              <div className={styles.heroTitleBadge}>提示词</div>
              <p className={styles.heroSubtitle}>每日持续更新中</p>
            </div>

            <div className={styles.generateShell} id="seedance-composer">
              <div className={styles.generateComposer}>
                <textarea
                  className={styles.generateArea}
                  aria-label="描述你想要生成的视频"
                  value={composerValue}
                  onChange={(event) => setComposerValue(event.target.value)}
                  placeholder="描述你想要生成的视频...（例如：一只猫在日落的沙滩上漫步）"
                />
                <div className={styles.generateActionsRow}>
                  <button className={styles.secondaryRect} type="button" onClick={() => pushToast("这一版先保留样式与入口，不接真实设置面板。")}>
                    <SettingsIcon />
                    <span>设置</span>
                  </button>
                  <button className={styles.secondaryRect} type="button" onClick={() => pushToast("图片上传入口已预留，下一步再接真实素材流。")}>
                    <ImageIcon />
                    <span>图片</span>
                  </button>
                </div>
              </div>
              <button className={styles.generateButton} type="button" onClick={() => pushToast("当前为高保真前端复刻，生成按钮暂不接后端。")}>
                <SparklesIcon />
                <span>生成</span>
              </button>
            </div>

            <a className={styles.promoPill} href={COMMUNITY_INTERNAL_ROUTES.nanoBanana}>
              探索 Nano Banana Pro 提示词库
            </a>
          </div>
        </div>
      </section>

      <section className={styles.wall} id="seedance-wall">
        <div className={styles.wallHeader}>
          <div className={styles.wallHeaderMain}>
            <h2 className={styles.wallTitle}>提示词</h2>
            <div className={styles.wallBrandMini}>
              <SeedanceWordmark />
            </div>
          </div>
          <div className={styles.wallHeaderActions}>
            <button className={styles.iconSquare} type="button" title="搜索提示词" onClick={() => setSearchOpen((value) => !value)}>
              <SearchIcon />
            </button>
            <button className={styles.iconSquare} type="button" title="下载提示词" onClick={handleDownloadManifest}>
              <DownloadIcon />
            </button>
            <div className={styles.totalBadge}>
              <span>主库：</span>
              <strong>{stats.totalLibraryItems.toLocaleString("zh-CN")}</strong>
            </div>
          </div>
        </div>

        {searchOpen ? (
          <div className={styles.searchPanel}>
            <input
              className={styles.searchInput}
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={`按标题、作者或摘要筛选当前 ${stats.renderedItems} 条样本`}
            />
          </div>
        ) : null}

        <main className={styles.grid}>
          {filteredItems.map((item) => (
            <SeedanceCard
              key={item.id}
              item={item}
              onInspect={setDetailItem}
              onShare={handleShare}
              onTheater={setTheaterItem}
              onUsePrompt={handleUsePrompt}
            />
          ))}
        </main>

        <div className={styles.loadingHint}>
          当前展示 {filteredItems.length} / {stats.renderedItems} 条已同步样本，Seedance 主库共{" "}
          {stats.totalLibraryItems.toLocaleString("zh-CN")} 条。
        </div>
      </section>

      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>常见问题</h2>
        <div className={styles.faqList}>
          {seedanceFaqItems.map((item, index) => {
            const opened = activeFaq === index;
            return (
              <div key={item.question} className={styles.faqItem}>
                <button
                  className={styles.faqButton}
                  type="button"
                  onClick={() => setActiveFaq(opened ? -1 : index)}
                  aria-expanded={opened}
                >
                  <span>{item.question}</span>
                  <span className={styles.faqMark}>{opened ? "−" : "+"}</span>
                </button>
                {opened ? <p className={styles.faqAnswer}>{item.answer}</p> : null}
              </div>
            );
          })}
        </div>
      </section>

      <footer className={styles.footer}>
        <SeedanceWordmark />
        <p>© 2026 DramaTV 社区复刻实验页</p>
      </footer>

      {detailItem ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setDetailItem(null)}>
          <section
            className={styles.detailDialog}
            role="dialog"
            aria-modal="true"
            aria-label={`${detailItem.title} 详情`}
            onClick={(event) => event.stopPropagation()}
          >
            <button className={styles.closeButton} type="button" aria-label="关闭弹层" onClick={() => setDetailItem(null)}>
              <CloseIcon />
            </button>

            <div className={styles.dialogMeta}>
              <div className={styles.metaBadge}>{detailItem.authorName}</div>
              <div className={styles.metaBadge}>{detailItem.publishedAt}</div>
            </div>

            <div className={styles.dialogPromptHeader}>
              <div>
                <div className={styles.dialogEyebrow}>提示词</div>
                <h3 className={styles.dialogTitle}>{detailItem.title}</h3>
              </div>
              <button
                className={styles.copyButton}
                type="button"
                onClick={() => handleCopy(detailItem.promptText, "完整提示词已复制。")}
              >
                <CopyIcon />
                <span>复制提示词</span>
              </button>
            </div>

            <pre className={styles.promptBlock}>{detailItem.promptText}</pre>

            <div className={styles.dialogLinks}>
              {detailItem.authorLink ? (
                <a className={styles.linkButton} href={detailItem.authorLink} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon />
                  <span>作者主页</span>
                </a>
              ) : null}
              <a className={styles.linkButton} href={detailItem.sourceLink} target="_blank" rel="noreferrer">
                <ExternalLinkIcon />
                <span>来源</span>
              </a>
              <button className={styles.primaryDialogButton} type="button" onClick={() => handleUsePrompt(detailItem)}>
                用这条立即体验
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {theaterItem ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setTheaterItem(null)}>
          <section
            className={styles.theaterDialog}
            role="dialog"
            aria-modal="true"
            aria-label={`${theaterItem.title} 全屏预览`}
            onClick={(event) => event.stopPropagation()}
          >
            <button className={styles.closeButton} type="button" aria-label="关闭全屏预览" onClick={() => setTheaterItem(null)}>
              <CloseIcon />
            </button>
            {theaterItem.videoSrc ? (
              <video
                className={styles.theaterFrame}
                src={theaterItem.videoSrc}
                poster={theaterItem.thumbnailSrc}
                controls
                autoPlay
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img className={styles.theaterFrame} src={theaterItem.thumbnailSrc} alt={theaterItem.title} />
            )}
            <div className={styles.theaterFooter}>
              <div>
                <div className={styles.dialogEyebrow}>全屏预览</div>
                <h3 className={styles.theaterTitle}>{theaterItem.title}</h3>
              </div>
              <button className={styles.copyButton} type="button" onClick={() => handleShare(theaterItem)}>
                <ShareIcon />
                <span>分享卡片</span>
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {toast ? <div className={styles.toast}>{toast.message}</div> : null}
    </div>
  );
}
