"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import styles from "./NanoBananaReplicaPage.module.css";

type ToastState = {
  id: number;
  message: string;
};

type NanoBananaReplicaItem = {
  id: string;
  rank: number;
  youmindId: number;
  title: string;
  description: string;
  summary: string;
  authorName: string;
  authorLink?: string;
  sourceLink: string;
  arenaLink: string;
  publishedAt: string;
  featured: boolean;
  grade: "A" | "B" | "C";
  needReferenceImages: boolean;
  resultsCount: number;
  imageCount: number;
  images: string[];
  promptLabel: string;
  promptText: string;
  rawPromptText: string;
  translatedPromptText?: string;
};

type NanoBananaReplicaStats = {
  totalLibraryItems: number;
  renderedItems: number;
  sourceLibrary: string;
  lastSyncedAt: string;
};

export type { NanoBananaReplicaItem, NanoBananaReplicaStats };

const categoryChips = ["全部", "精选", "需要参考图", "单图案例", "长提示词", "最新"];
const sortChips = ["默认", "按排名", "按结果数"];
const filterChips = ["全部", "仅精选", "仅需参考图"];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6.8" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function safeText(value: string | number | undefined | null) {
  return String(value ?? "");
}

function getPromptText(item: NanoBananaReplicaItem) {
  return safeText(item.translatedPromptText || item.promptText || item.rawPromptText).trim();
}

function getPromptTag(item: NanoBananaReplicaItem) {
  if (item.translatedPromptText) {
    return "翻译版";
  }

  if (item.rawPromptText) {
    return "原文";
  }

  return item.promptLabel || "提示词";
}

function getPrimaryImage(item: NanoBananaReplicaItem) {
  return item.images[0] || "";
}

function truncate(text: string, maxLength = 600) {
  const value = safeText(text).trim();
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

function parsePublishedAt(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function ChipButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? styles.chipActive : styles.chip} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function NanoBananaCard({
  item,
  onOpenDetail,
  onUsePrompt,
  onCopyPrompt
}: {
  item: NanoBananaReplicaItem;
  onOpenDetail: (item: NanoBananaReplicaItem) => void;
  onUsePrompt: (item: NanoBananaReplicaItem) => void;
  onCopyPrompt: (item: NanoBananaReplicaItem) => void;
}) {
  const promptText = getPromptText(item);
  const primaryImage = getPrimaryImage(item);

  return (
    <article className={styles.card}>
      <div className={styles.cardMeta}>
        <div className={styles.cardMetaRow}>
          <div className={styles.cardMetaLeft}>
            {item.featured ? <span className={styles.badge}>精选</span> : null}
            <a className={styles.textLink} href={item.authorLink || item.sourceLink} target="_blank" rel="noreferrer">
              <span className={styles.cardAuthor}>{item.authorName}</span>
            </a>
          </div>
          <div className={styles.cardMetaRight}>
            <span>#{item.rank}</span>
            <span>·</span>
          </div>
        </div>

        <div className={styles.cardMetaRow}>
          <div className={`${styles.cardMetaLeft} ${styles.cardMetaLeftSecondary}`}>
            <span>{item.publishedAt}</span>
          </div>
          <div className={styles.cardMetaRight}>
            <span>{item.resultsCount.toLocaleString("zh-CN")} 个结果</span>
          </div>
        </div>
      </div>

      <h2 className={styles.cardTitle}>{item.title}</h2>

      <button className={styles.previewFrame} type="button" aria-label={`查看 ${item.title} 详情`} onClick={() => onOpenDetail(item)}>
        {primaryImage ? <img src={primaryImage} alt={item.title} /> : <div className={styles.previewFallback}>暂无图片</div>}
        <span className={styles.previewButton} aria-hidden="true">
          <span className={styles.previewIcon} />
        </span>
        <span className={styles.previewOverlay}>
          <span className={styles.previewDots}>
            <span className={`${styles.previewDot} ${styles.previewDotActive}`} />
          </span>
          <span className={styles.previewLink}>查看其它模型的结果</span>
        </span>
      </button>

      <p className={styles.cardSummary}>{item.summary || item.description}</p>

      <div className={styles.promptCard}>
        <div className={styles.promptCardHead}>
          <div className={styles.promptCardHeadActions}>
            <span className={styles.promptCardTitle}>提示词</span>
            <span className={styles.promptCardTag}>{getPromptTag(item)}</span>
          </div>
        </div>
        <div className={styles.promptCardBody}>
          <pre>{truncate(promptText)}</pre>
          <button className={styles.promptCardCopy} type="button" aria-label="复制提示词" onClick={() => onCopyPrompt(item)} />
        </div>
      </div>

      <div className={styles.cardFooter}>
        <button className={styles.primaryButton} type="button" onClick={() => onUsePrompt(item)}>
          立刻尝试
        </button>
      </div>
    </article>
  );
}

export function NanoBananaReplicaPage({
  initialItems,
  initialStats
}: {
  initialItems: NanoBananaReplicaItem[];
  initialStats: NanoBananaReplicaStats;
}) {
  const [items] = useState<NanoBananaReplicaItem[]>(initialItems);
  const [stats] = useState<NanoBananaReplicaStats>(initialStats);
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);
  const [composerValue, setComposerValue] = useState("");
  const [selectedItem, setSelectedItem] = useState<NanoBananaReplicaItem | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [activeSort, setActiveSort] = useState("默认");
  const [activeFilter, setActiveFilter] = useState("全部");

  useEffect(() => {
    if (!selectedItem) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedItem(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredItems = useMemo(() => {
    const keyword = deferredSearchValue.trim().toLowerCase();
    let nextItems = [...items];

    if (activeFilter === "仅精选") {
      nextItems = nextItems.filter((item) => item.featured);
    }

    if (activeFilter === "仅需参考图") {
      nextItems = nextItems.filter((item) => item.needReferenceImages);
    }

    if (activeCategory === "精选") {
      nextItems = nextItems.filter((item) => item.featured);
    }

    if (activeCategory === "需要参考图") {
      nextItems = nextItems.filter((item) => item.needReferenceImages);
    }

    if (activeCategory === "单图案例") {
      nextItems = nextItems.filter((item) => (item.imageCount || item.images.length) === 1);
    }

    if (activeCategory === "长提示词") {
      nextItems = nextItems.filter((item) => getPromptText(item).length >= 400);
    }

    if (keyword) {
      nextItems = nextItems.filter((item) =>
        `${item.title} ${item.description} ${item.summary} ${item.authorName} ${getPromptText(item)}`
          .toLowerCase()
          .includes(keyword)
      );
    }

    if (activeSort === "按排名") {
      nextItems.sort((left, right) => left.rank - right.rank);
    }

    if (activeSort === "按结果数") {
      nextItems.sort((left, right) => right.resultsCount - left.resultsCount);
    }

    if (activeCategory === "最新") {
      nextItems.sort((left, right) => parsePublishedAt(right.publishedAt) - parsePublishedAt(left.publishedAt));
    }

    return nextItems;
  }, [activeCategory, activeFilter, activeSort, deferredSearchValue, items]);

  function pushToast(message: string) {
    setToast({ id: Date.now(), message });
  }

  async function handleCopy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      pushToast(message);
    } catch {
      pushToast("复制失败，请手动复制。");
    }
  }

  function handleUsePrompt(item: NanoBananaReplicaItem) {
    setComposerValue(getPromptText(item));
    setSelectedItem(null);
    document.getElementById("nano-banana-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    pushToast("提示词已填入上方输入区。");
  }

  function handlePickRandom() {
    if (items.length === 0) {
      pushToast("当前没有可用样本。");
      return;
    }

    const randomItem = items[Math.floor(Math.random() * items.length)];
    setSelectedItem(randomItem);
  }

  const detailPrompt = selectedItem ? getPromptText(selectedItem) : "";
  const detailImage = selectedItem ? getPrimaryImage(selectedItem) : "";

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderMain}>
          <div className={styles.brand}>YouMind</div>
          <h1 className={styles.pageTitle}>
            <span>Nano Banana Pro</span>
            <span>提示词</span>
          </h1>
          <p className={styles.pageIntro}>
            收集 Nano Banana 相关优质案例、配图与提示词，正式页现在直接读取社区同步产物，同时沿用最新预览稿的界面结构。
          </p>
          <div className={styles.headerActions}>
            <button className={styles.headerAction} type="button" onClick={() => pushToast(`当前已同步 ${stats.renderedItems} 条精选样本。`)}>
              每日更新
            </button>
            <button className={styles.headerAction} type="button" onClick={() => pushToast("当前页面展示的是自动同步后的精选样本。")}>
              自动
            </button>
            <button className={styles.headerAction} type="button" onClick={handlePickRandom}>
              随机
            </button>
            <button
              className={`${styles.headerAction} ${styles.headerActionPrimary}`}
              type="button"
              onClick={() => document.getElementById("nano-banana-composer")?.scrollIntoView({ behavior: "smooth", block: "center" })}
            >
              生成
            </button>
          </div>
        </div>

        <div className={styles.pageHeaderStats}>
          <strong>{stats.totalLibraryItems.toLocaleString("zh-CN")}</strong>
          <span>提示词总数</span>
        </div>
      </header>

      <section className={styles.promptPanel} id="nano-banana-composer">
        <div className={styles.promptPanelHead}>
          <span>提示词</span>
          <span>{composerValue ? `${composerValue.length} 字` : "待填充"}</span>
        </div>
        <textarea
          className={styles.promptBox}
          value={composerValue}
          onChange={(event) => setComposerValue(event.target.value)}
          placeholder="点击下方卡片中的“立刻尝试”即可把对应提示词带到这里。"
        />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.toolbarSummary}>
          <span className={styles.toolbarSummaryLabel}>总计:</span>
          <strong>{stats.totalLibraryItems.toLocaleString("zh-CN")}</strong>
        </div>

        <div className={styles.toolbarGroup}>
          {categoryChips.map((chip) => (
            <ChipButton key={chip} active={chip === activeCategory} label={chip} onClick={() => setActiveCategory(chip)} />
          ))}
        </div>

        <div className={styles.toolbarRow}>
          <label className={styles.search}>
            <SearchIcon />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="搜索标题、作者、摘要或提示词"
            />
          </label>

          <div className={styles.toolbarControls}>
            <div className={styles.controlInline}>
              <span className={styles.controlInlineLabel}>排序</span>
              <div className={styles.toolbarGroup}>
                {sortChips.map((chip) => (
                  <ChipButton key={chip} active={chip === activeSort} label={chip} onClick={() => setActiveSort(chip)} />
                ))}
              </div>
            </div>

            <div className={styles.controlInline}>
              <span className={styles.controlInlineLabel}>筛选</span>
              <div className={styles.toolbarGroup}>
                {filterChips.map((chip) => (
                  <ChipButton key={chip} active={chip === activeFilter} label={chip} onClick={() => setActiveFilter(chip)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.toolbarMeta}>
          <span>{filteredItems.length.toLocaleString("zh-CN")} 条结果</span>
          <span>资源库：{stats.sourceLibrary}</span>
        </div>
      </section>

      <main className={styles.feed}>
        {filteredItems.length === 0 ? <div className={styles.emptyState}>没有找到匹配内容。</div> : null}
        {filteredItems.map((item) => (
          <NanoBananaCard
            key={item.id}
            item={item}
            onOpenDetail={setSelectedItem}
            onUsePrompt={handleUsePrompt}
            onCopyPrompt={(currentItem) => handleCopy(getPromptText(currentItem), "提示词已复制。")}
          />
        ))}
      </main>

      {selectedItem ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setSelectedItem(null)}>
          <section
            className={styles.detailDialog}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedItem.title} 详情`}
            onClick={(event) => event.stopPropagation()}
          >
            <button className={styles.detailDialogClose} type="button" aria-label="关闭" onClick={() => setSelectedItem(null)}>
              <CloseIcon />
            </button>

            <div className={styles.detailContent}>
              <div className={styles.detailMeta}>
                <span className={styles.badge}>{selectedItem.featured ? "精选" : "案例"}</span>
                <span>{selectedItem.authorName}</span>
                <span>·</span>
                <span>{selectedItem.publishedAt}</span>
              </div>

              <h2 className={styles.detailTitle}>{selectedItem.title}</h2>

              <div className={styles.detailImage}>
                {detailImage ? <img src={detailImage} alt={selectedItem.title} /> : <div className={styles.previewFallback}>暂无图片</div>}
              </div>

              <div className={styles.detailLinks}>
                <a className={styles.textLink} href={selectedItem.arenaLink} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon />
                  <span>查看模型竞技场</span>
                </a>
                <a className={styles.textLink} href={selectedItem.sourceLink} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon />
                  <span>查看原始来源</span>
                </a>
              </div>

              <p className={styles.detailSummary}>{selectedItem.summary || selectedItem.description}</p>

              <div className={styles.detailPrompt}>
                <div className={styles.promptCardHead}>
                  <div className={styles.promptCardHeadActions}>
                    <span className={styles.promptCardTitle}>提示词</span>
                    <span className={styles.promptCardTag}>{getPromptTag(selectedItem)}</span>
                  </div>
                </div>
                <div className={styles.detailPromptBody}>
                  <pre>{detailPrompt}</pre>
                </div>
              </div>

              <div className={styles.detailActions}>
                <button className={styles.secondaryButton} type="button" onClick={() => handleCopy(detailPrompt, "提示词已复制。")}>
                  复制提示词
                </button>
                <button className={styles.primaryButton} type="button" onClick={() => handleUsePrompt(selectedItem)}>
                  立刻尝试
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {toast ? <div className={styles.toast}>{toast.message}</div> : null}
    </div>
  );
}
