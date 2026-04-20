const fs = require("fs");
const path = require("path");

const root = process.cwd();
const outputDir = path.join(root, "youmind-seedance-extracted", "api-pages");
const videosDir = path.join(root, "youmind-seedance-extracted", "videos");

const startPage = Number(process.argv[2] || 1);
const endPage = Number(process.argv[3] || startPage);
const limit = Number(process.argv[4] || 12);
const locale = process.argv[5] || "zh-CN";
const model = process.argv[6] || "seedance-2.0";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function extractImportedVideoUrl(caption) {
  return typeof caption === "string" ? caption.replace(/^Imported from URL:\s*/, "") : "";
}

function findLocalVideoFile(streamId) {
  if (!fs.existsSync(videosDir)) {
    return null;
  }

  const match = fs
    .readdirSync(videosDir)
    .find((fileName) => fileName.toLowerCase().includes(streamId.toLowerCase()) && fileName.endsWith(".mp4"));

  return match ? path.join(videosDir, match) : null;
}

function normalizePrompt(item, globalRank) {
  const video = item.videos?.[0] || {};
  const importedVideoUrl = extractImportedVideoUrl(video.caption);

  return {
    rank: globalRank,
    id: item.id,
    title: item.title,
    description: item.description,
    featured: Boolean(item.featured),
    content: safeText(item.content),
    contentIsReference: /^\$\d+$/.test(safeText(item.content)),
    contentReference: /^\$\d+$/.test(safeText(item.content)) ? item.content : null,
    language: safeText(item.language),
    translatedContent: safeText(item.translatedContent),
    translatedContentIsReference: /^\$\d+$/.test(safeText(item.translatedContent)),
    translatedContentReference: /^\$\d+$/.test(safeText(item.translatedContent)) ? item.translatedContent : null,
    sourceLink: safeText(item.sourceLink),
    sourcePublishedAt: safeText(item.sourcePublishedAt),
    authorName: safeText(item.author?.name),
    authorLink: safeText(item.author?.link),
    streamId: safeText(video.streamId),
    sourceUrl: safeText(video.sourceUrl),
    thumbnail: safeText(video.thumbnail),
    caption: safeText(video.caption),
    importedVideoUrl,
    localVideoPath: video.streamId ? findLocalVideoFile(video.streamId) : null,
    contentSource: "youmind api",
    translatedContentSource: "youmind api"
  };
}

async function fetchPage(page) {
  const response = await fetch("https://youmind.com/youhome-api/video-prompts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      referer: "https://youmind.com/zh-CN/seedance-2-0-prompts",
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
      locale
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  if (!Number.isInteger(startPage) || !Number.isInteger(endPage) || startPage < 1 || endPage < startPage) {
    throw new Error("Usage: node fetch-youmind-seedance-api.js <startPage> <endPage> [limit] [locale] [model]");
  }

  ensureDir(outputDir);

  const pages = [];
  const normalized = [];
  let rank = (startPage - 1) * limit;

  for (let page = startPage; page <= endPage; page += 1) {
    const data = await fetchPage(page);
    const pagePath = path.join(outputDir, `page-${String(page).padStart(3, "0")}.json`);

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
    root,
    "youmind-seedance-extracted",
    `seedance-items.api.p${String(startPage).padStart(3, "0")}-p${String(endPage).padStart(3, "0")}.json`
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
