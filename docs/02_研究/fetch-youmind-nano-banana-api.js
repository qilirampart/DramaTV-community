const fs = require("fs");
const path = require("path");

const root = process.cwd();
const extractedRoot = path.join(root, "youmind-image-assets", "nano-banana-extracted");
const outputDir = path.join(extractedRoot, "api-pages");

const startPage = Number(process.argv[2] || 1);
const endPage = Number(process.argv[3] || startPage);
const limit = Number(process.argv[4] || 18);
const locale = process.argv[5] || "zh-CN";
const model = process.argv[6] || "nano-banana-pro";
const campaign = process.argv[7] || "nano-banana-pro-prompts";
const filterMode = process.argv[8] || "imageCategories";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
}

function normalizePrompt(item, globalRank) {
  const media = safeArray(item.media);
  const mediaThumbnails = safeArray(item.mediaThumbnails);
  const content = safeText(item.content);
  const translatedContent = safeText(item.translatedContent);

  return {
    rank: globalRank,
    id: item.id,
    title: safeText(item.title),
    description: safeText(item.description),
    featured: Boolean(item.featured),
    content,
    contentIsReference: /^\$\d+$/.test(content),
    contentReference: /^\$\d+$/.test(content) ? content : null,
    language: safeText(item.language),
    translatedContent,
    translatedContentIsReference: /^\$\d+$/.test(translatedContent),
    translatedContentReference: /^\$\d+$/.test(translatedContent) ? translatedContent : null,
    sourceLink: safeText(item.sourceLink),
    sourcePublishedAt: safeText(item.sourcePublishedAt),
    sourcePlatform: safeText(item.sourcePlatform),
    authorName: safeText(item.author?.name),
    authorLink: safeText(item.author?.link),
    sort: typeof item.sort === "number" ? item.sort : null,
    likes: typeof item.likes === "number" ? item.likes : null,
    resultsCount: typeof item.resultsCount === "number" ? item.resultsCount : media.length,
    needReferenceImages: Boolean(item.needReferenceImages),
    promptCategories: Array.isArray(item.promptCategories) ? item.promptCategories : [],
    media,
    mediaThumbnails,
    mediaCount: media.length,
    mediaThumbnailCount: mediaThumbnails.length,
    localMediaFiles: [],
    localThumbnailFiles: [],
    contentSource: "youmind api",
    translatedContentSource: "youmind api"
  };
}

async function fetchPage(page) {
  const response = await fetch("https://youmind.com/youhome-api/prompts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      referer: "https://youmind.com/zh-CN/nano-banana-pro-prompts",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\""
    },
    body: JSON.stringify({
      model,
      page,
      limit,
      locale,
      campaign,
      filterMode
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  if (!Number.isInteger(startPage) || !Number.isInteger(endPage) || startPage < 1 || endPage < startPage) {
    throw new Error(
      "Usage: node fetch-youmind-nano-banana-api.js <startPage> <endPage> [limit] [locale] [model] [campaign] [filterMode]"
    );
  }

  ensureDir(extractedRoot);
  ensureDir(outputDir);

  const pages = [];
  const normalized = [];
  let rank = (startPage - 1) * limit;

  for (let page = startPage; page <= endPage; page += 1) {
    const data = await fetchPage(page);
    const pagePath = path.join(outputDir, `page-${String(page).padStart(4, "0")}.json`);

    fs.writeFileSync(pagePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    pages.push({
      page,
      pagePath,
      count: Array.isArray(data.prompts) ? data.prompts.length : 0,
      total: data.total,
      totalPages: data.totalPages,
      hasMore: data.hasMore
    });

    for (const item of data.prompts || []) {
      rank += 1;
      normalized.push(normalizePrompt(item, rank));
    }
  }

  const mergedPath = path.join(
    extractedRoot,
    `nano-banana-items.api.p${String(startPage).padStart(3, "0")}-p${String(endPage).padStart(3, "0")}.json`
  );

  fs.writeFileSync(mergedPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        startPage,
        endPage,
        limit,
        locale,
        model,
        campaign,
        filterMode,
        mergedPath,
        pageCount: pages.length,
        extractedCount: normalized.length,
        pages
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
