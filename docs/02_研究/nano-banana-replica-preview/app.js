const categoryChips = ["全部", "精选", "需要参考图", "单图案例", "长提示词", "最新"];
const sortChips = ["默认", "按排名", "按结果数"];
const filterChips = ["全部", "仅精选", "仅需参考图"];

const state = {
  items: [],
  stats: null,
  search: "",
  category: "全部",
  sort: "默认",
  filter: "全部"
};

const feed = document.getElementById("feed");
const totalCount = document.getElementById("total-count");
const summaryTotal = document.getElementById("summary-total");
const sourceLibrary = document.getElementById("source-library");
const resultsCount = document.getElementById("results-count");
const promptBox = document.getElementById("prompt-box");
const promptCount = document.getElementById("prompt-count");
const dialog = document.getElementById("detail-dialog");
const detailContent = document.getElementById("detail-content");
const toast = document.getElementById("toast");

function safeText(value) {
  return String(value || "");
}

function truncate(text, maxLength = 600) {
  const value = safeText(text).trim();
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function formatImageSrc(src) {
  const value = safeText(src);
  if (!value) return "";
  if (/^https?:\/\//.test(value)) return value;
  return value;
}

function getPrimaryImage(item) {
  return formatImageSrc(item.images?.[0] || "");
}

function getPromptText(item) {
  return safeText(item.translatedPromptText || item.promptText || item.rawPromptText);
}

function getPromptTag(item) {
  if (item.translatedPromptText) return "翻译版";
  if (item.rawPromptText) return "原文";
  return "提示词";
}

function createChip(label, currentValue, onClick) {
  const button = document.createElement("button");
  button.className = label === currentValue ? "chip is-active" : "chip";
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function mountChips(containerId, labels, currentValue, setter) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  labels.forEach((label) => {
    container.appendChild(
      createChip(label, currentValue, () => {
        setter(label);
        render();
      })
    );
  });
}

function filteredItems() {
  let next = [...state.items];
  const keyword = state.search.trim().toLowerCase();

  if (state.filter === "仅精选") {
    next = next.filter((item) => item.featured);
  }

  if (state.filter === "仅需参考图") {
    next = next.filter((item) => item.needReferenceImages);
  }

  if (state.category === "精选") {
    next = next.filter((item) => item.featured);
  }

  if (state.category === "需要参考图") {
    next = next.filter((item) => item.needReferenceImages);
  }

  if (state.category === "单图案例") {
    next = next.filter((item) => (item.imageCount || item.images?.length || 0) === 1);
  }

  if (state.category === "长提示词") {
    next = next.filter((item) => getPromptText(item).length >= 400);
  }

  if (keyword) {
    next = next.filter((item) =>
      `${item.title} ${item.description} ${item.summary} ${item.authorName} ${getPromptText(item)}`
        .toLowerCase()
        .includes(keyword)
    );
  }

  if (state.sort === "按排名") {
    next.sort((a, b) => a.rank - b.rank);
  }

  if (state.sort === "按结果数") {
    next.sort((a, b) => (b.resultsCount || 0) - (a.resultsCount || 0));
  }

  if (state.category === "最新") {
    next.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  return next;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    showToast("复制失败，请手动复制");
  }
}

function updatePromptCount() {
  promptCount.textContent = promptBox.value ? `${promptBox.value.length} 字` : "待填充";
}

function fillPrompt(text) {
  promptBox.value = safeText(text);
  updatePromptCount();
  promptBox.scrollIntoView({ behavior: "smooth", block: "center" });
  showToast("提示词已填入上方输入区");
}

function openDetail(item) {
  const promptText = getPromptText(item);
  const imageSrc = getPrimaryImage(item);

  detailContent.innerHTML = `
    <div class="detail-content">
      <div class="detail-meta">
        <span class="badge">${item.featured ? "精选" : "案例"}</span>
        <span>${safeText(item.authorName)}</span>
        <span>·</span>
        <span>${safeText(item.publishedAt)}</span>
      </div>
      <h2 class="detail-title">${safeText(item.title)}</h2>
      <div class="detail-image">
        <img src="${imageSrc}" alt="${safeText(item.title)}" />
      </div>
      <div class="detail-links">
        <a class="text-link" href="${safeText(item.arenaLink)}" target="_blank" rel="noreferrer">查看模型竞技场</a>
        <a class="text-link" href="${safeText(item.sourceLink)}" target="_blank" rel="noreferrer">查看原始来源</a>
      </div>
      <p>${safeText(item.summary || item.description)}</p>
      <div class="detail-prompt">
        <div class="prompt-card__head">
          <span class="prompt-card__title">提示词</span>
          <span class="prompt-card__tag">${getPromptTag(item)}</span>
        </div>
        <div class="detail-prompt__body">
          <pre>${promptText}</pre>
        </div>
      </div>
      <div class="detail-actions">
        <button class="button--ghost" type="button" id="copy-detail-prompt">复制提示词</button>
        <button class="button" type="button" id="use-detail-prompt">立刻尝试</button>
      </div>
    </div>
  `;

  detailContent.querySelector("#copy-detail-prompt").addEventListener("click", () => {
    copyText(promptText, "提示词已复制");
  });

  detailContent.querySelector("#use-detail-prompt").addEventListener("click", () => {
    dialog.close();
    fillPrompt(promptText);
  });

  dialog.showModal();
}

function renderCard(item) {
  const article = document.createElement("article");
  article.className = "card";

  const promptText = getPromptText(item);
  const imageSrc = getPrimaryImage(item);
  const tag = getPromptTag(item);

  article.innerHTML = `
    <div class="card__meta">
      <div class="card__meta-row">
        <div class="card__meta-left">
          ${item.featured ? '<span class="badge">精选</span>' : ""}
          <a class="text-link card__author" href="${safeText(item.authorLink || item.sourceLink)}" target="_blank" rel="noreferrer">${safeText(item.authorName)}</a>
        </div>
        <div class="card__meta-right">
          <span>#${safeText(item.rank)}</span>
          <span>·</span>
        </div>
      </div>
      <div class="card__meta-row">
        <div class="card__meta-left card__meta-left--secondary">
          <span>${safeText(item.publishedAt)}</span>
        </div>
        <div class="card__meta-right">
          <span>${safeText(item.resultsCount)} 个结果</span>
        </div>
      </div>
    </div>
    <h2>${safeText(item.title)}</h2>
    <button class="preview-frame" type="button" data-open-detail="1" aria-label="查看大图">
      <img src="${imageSrc}" alt="${safeText(item.title)}" />
      <span class="preview-frame__button" aria-hidden="true">
        <span class="preview-frame__icon"></span>
      </span>
      <span class="preview-frame__overlay">
        <span class="preview-frame__dots">
          <span class="preview-frame__dot is-active"></span>
        </span>
        <span class="preview-frame__link">查看其它模型的结果</span>
      </span>
    </button>
    <p>${safeText(item.summary || item.description)}</p>
    <div class="prompt-card">
      <div class="prompt-card__head">
        <div class="prompt-card__head-actions">
          <span class="prompt-card__title">提示词</span>
          <span class="prompt-card__tag">${tag}</span>
        </div>
      </div>
      <div class="prompt-card__body">
        <pre>${truncate(promptText)}</pre>
        <button class="prompt-card__copy" type="button" data-copy-prompt="1" aria-label="复制提示词"></button>
      </div>
    </div>
    <div class="card__footer">
      <button class="button" type="button" data-use-prompt="1">立刻尝试</button>
    </div>
  `;

  article.querySelector("[data-open-detail]").addEventListener("click", () => openDetail(item));

  article.querySelector("[data-copy-prompt]").addEventListener("click", () => {
    copyText(promptText, "提示词已复制");
  });

  article.querySelector("[data-use-prompt]").addEventListener("click", () => {
    fillPrompt(promptText);
  });

  return article;
}

function render() {
  mountChips("category-group", categoryChips, state.category, (value) => {
    state.category = value;
  });
  mountChips("sort-group", sortChips, state.sort, (value) => {
    state.sort = value;
  });
  mountChips("filter-group", filterChips, state.filter, (value) => {
    state.filter = value;
  });

  totalCount.textContent = String(state.stats?.totalLibraryItems || 0);
  summaryTotal.textContent = String(state.stats?.totalLibraryItems || 0);
  sourceLibrary.textContent = state.stats?.sourceLibrary ? `资源库：${state.stats.sourceLibrary}` : "";

  const items = filteredItems();
  resultsCount.textContent = `${items.length} 条结果`;
  feed.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "没有找到匹配内容。";
    feed.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    feed.appendChild(renderCard(item));
  });
}

document.getElementById("search-input").addEventListener("input", (event) => {
  state.search = event.target.value;
  render();
});

promptBox.addEventListener("input", updatePromptCount);

document.getElementById("close-dialog").addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  const isInDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!isInDialog) {
    dialog.close();
  }
});

fetch("./nano-banana-data.json")
  .then((response) => response.json())
  .then((payload) => {
    state.items = payload.items.slice(0, 10);
    state.stats = payload.stats;
    render();
  })
  .catch(() => {
    feed.innerHTML = '<div class="empty-state">数据加载失败，请检查本地 JSON 文件。</div>';
  });
