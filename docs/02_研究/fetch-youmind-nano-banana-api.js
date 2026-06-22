const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = process.cwd();
const startPage = Number(process.argv[2] || 1);
const endPage = Number(process.argv[3] || startPage);
const limit = Number(process.argv[4] || 18);
const locale = process.argv[5] || "zh-CN";
const model = process.argv[6] || "nano-banana-pro";
const campaign = process.argv[7] || "nano-banana-pro-prompts";
const filterMode = process.argv[8] || "imageCategories";
const categories = typeof process.argv[9] === "string" ? process.argv[9].trim() : "";
const requestTimeoutMs = Number(process.argv[11] || 30000);
const requestRetries = Number(process.argv[12] || 4);
const extraArgs = process.argv.slice(13);
const sortBy = readNamedArg(extraArgs, "--sortBy") || "";
const sortOrder = readNamedArg(extraArgs, "--sortOrder") || "";
const datasetSlug =
  process.argv[10] ||
  (model === "nano-banana-pro" && campaign === "nano-banana-pro-prompts" && !categories
    ? "nano-banana-extracted"
    : `${toSlug(model)}${categories ? `-${toSlug(categories)}` : ""}-extracted`);
const extractedRoot = path.join(root, "youmind-image-assets", datasetSlug);
const outputDir = path.join(extractedRoot, "api-pages");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
}

function readNamedArg(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 && typeof args[index + 1] === "string" ? args[index + 1].trim() : "";
}

function buildReferer() {
  const localePrefix = locale && locale !== "en-US" ? `/${locale}` : "";
  const url = new URL(`https://youmind.com${localePrefix}/${campaign}`);

  if (categories) {
    url.searchParams.set("categories", categories);
  }

  if (sortBy) {
    url.searchParams.set("sortBy", sortBy);
  }

  if (sortOrder) {
    url.searchParams.set("sortOrder", sortOrder);
  }

  return url.toString();
}

function normalizePrompt(item, globalRank) {
  const media = safeArray(item.media);
  const mediaThumbnails = safeArray(item.mediaThumbnails);
  const content = safeText(item.content);
  const translatedContent = safeText(item.translatedContent);

  return {
    rank: globalRank,
    id: item.id,
    model,
    campaign,
    filterMode,
    locale,
    categories,
    sortBy,
    sortOrder,
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
  const referer = buildReferer();
  const requestBody = {
    model,
    page,
    limit,
    locale,
    campaign,
    filterMode
  };

  if (categories) {
    requestBody.categories = categories;
  }

  if (sortBy) {
    requestBody.sortBy = sortBy;
  }

  if (sortOrder) {
    requestBody.sortOrder = sortOrder;
  }

  let lastError = null;

  for (let attempt = 1; attempt <= requestRetries; attempt += 1) {
    try {
      const responseText = execFileSync(
        "curl.exe",
        [
          "-sS",
          "-L",
          "--max-time",
          String(Math.max(30, Math.ceil(requestTimeoutMs / 1000))),
          "-X",
          "POST",
          "-H",
          "content-type: application/json",
          "-H",
          `referer: ${referer}`,
          "-H",
          "accept: application/json, text/plain, */*",
          "-H",
          "accept-language: zh-CN,zh;q=0.9,en;q=0.8",
          "-H",
          "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
          "--data-raw",
          JSON.stringify(requestBody),
          "https://youmind.com/youmarketing-api/prompts"
        ],
        {
          encoding: "utf8",
          maxBuffer: 50 * 1024 * 1024
        }
      );

      return JSON.parse(responseText);
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < requestRetries;

      if (!shouldRetry) {
        break;
      }

      const backoffMs = attempt * 1500;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError || new Error(`Failed to fetch page ${page}`);
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
        categories,
        sortBy,
        sortOrder,
        datasetSlug,
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
