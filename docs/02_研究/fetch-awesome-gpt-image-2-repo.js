const fs = require("fs");
const path = require("path");

const root = process.cwd();
const repo = process.argv[2] || "EvoLinkAI/awesome-gpt-image-2-prompts";
const branch = process.argv[3] || "main";
const datasetSlug = process.argv[4] || "awesome-gpt-image-2-prompts-extracted";
const extractedRoot = path.join(root, "github-image-assets", datasetSlug);
const outputPath = path.join(extractedRoot, "awesome-gpt-image-2-prompts.items.json");
const readmeUrl = `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/README.md`;
const promptIndexUrl = `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/gpt_image2_prompts.json`;
const repoRawBase = `https://raw.githubusercontent.com/${repo}/refs/heads/${branch}`;
const repoWebUrl = `https://github.com/${repo}`;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function slugify(value) {
  return safeText(value)
    .trim()
    .toLowerCase()
    .replace(/\bcases?\b/g, "")
    .replace(/\bexamples?\b/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSectionTitle(title) {
  return safeText(title).trim();
}

function createDescription(sectionTitle, title, authorName) {
  const section = normalizeSectionTitle(sectionTitle);
  const author = safeText(authorName).trim();
  const name = safeText(title).trim();
  return `${section} curated case: ${name}${author ? `, source author ${author}` : ""}.`;
}

function parseCaseHeading(line) {
  const match = line.match(
    /^### Case\s+(\d+):\s+\[(.+?)\]\((https?:\/\/[^)]+)\)\s+\(by\s+\[@([^\]]+)\]\((https?:\/\/[^)]+)\)\)/
  );

  if (!match) {
    return null;
  }

  return {
    caseNumber: Number(match[1]),
    title: match[2].trim(),
    sourceLink: match[3].trim(),
    authorName: match[4].trim(),
    authorLink: match[5].trim()
  };
}

function parseOutputImages(blockText) {
  const matches = [...blockText.matchAll(/<img\s+src="([^"]+)"/g)];
  return matches.map((match) => match[1]).filter(Boolean);
}

function toAbsoluteImageUrl(relativeOrAbsoluteUrl) {
  if (/^https?:\/\//i.test(relativeOrAbsoluteUrl)) {
    return relativeOrAbsoluteUrl;
  }

  if (relativeOrAbsoluteUrl.startsWith("./")) {
    return `${repoRawBase}/${relativeOrAbsoluteUrl.slice(2)}`;
  }

  return `${repoRawBase}/${relativeOrAbsoluteUrl.replace(/^\/+/, "")}`;
}

function parsePrompt(blockText) {
  const promptMarker = blockText.indexOf("**Prompt:**");

  if (promptMarker === -1) {
    return "";
  }

  const promptSlice = blockText.slice(promptMarker);
  const codeBlockMatch = promptSlice.match(/```[\r\n]+([\s\S]*?)```/);

  if (!codeBlockMatch) {
    return "";
  }

  return codeBlockMatch[1].trim();
}

function buildJsonIndexMap(items) {
  const map = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const sourceUrl = safeText(item.url).trim();

    if (sourceUrl) {
      map.set(sourceUrl, item);
    }
  }

  return map;
}

function buildSourceMedia(jsonItem) {
  return Array.isArray(jsonItem?.media)
    ? jsonItem.media
        .map((entry) => ({
          type: safeText(entry?.type),
          url: safeText(entry?.url),
          width: typeof entry?.width === "number" ? entry.width : null,
          height: typeof entry?.height === "number" ? entry.height : null
        }))
        .filter((entry) => entry.url)
    : [];
}

function extractItemId(sourceLink, fallbackRank) {
  const match = safeText(sourceLink).match(/status\/(\d+)/);
  return match ? match[1] : `case-${String(fallbackRank).padStart(4, "0")}`;
}

function parseReadmeCases(readmeText, jsonIndex) {
  const lines = readmeText.split(/\r?\n/);
  const cases = [];
  let currentSectionTitle = "";
  let rank = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^##\s+/.test(line) && !/^###\s+/.test(line)) {
      currentSectionTitle = line.replace(/^##\s+/, "").trim();
      continue;
    }

    if (!/^### Case\s+/.test(line)) {
      continue;
    }

    const heading = parseCaseHeading(line.trim());

    if (!heading) {
      continue;
    }

    const blockLines = [];
    let innerIndex = index + 1;

    while (innerIndex < lines.length && !/^### Case\s+/.test(lines[innerIndex]) && !/^##\s+/.test(lines[innerIndex])) {
      blockLines.push(lines[innerIndex]);
      innerIndex += 1;
    }

    const blockText = blockLines.join("\n");
    const imagePaths = parseOutputImages(blockText);
    const media = imagePaths.map((imagePath) => toAbsoluteImageUrl(imagePath));
    const prompt = parsePrompt(blockText);
    const sourceStats = jsonIndex.get(heading.sourceLink);

    rank += 1;
    cases.push({
      rank,
      id: extractItemId(heading.sourceLink, rank),
      sourceRepo: repo,
      repoUrl: repoWebUrl,
      readmeUrl,
      model: "gpt-image-2",
      campaign: "awesome-gpt-image-2-prompts",
      filterMode: "github-curated-cases",
      locale: "",
      categories: slugify(currentSectionTitle),
      sectionTitle: normalizeSectionTitle(currentSectionTitle),
      caseNumber: heading.caseNumber,
      title: heading.title,
      description: createDescription(currentSectionTitle, heading.title, heading.authorName),
      content: prompt,
      contentIsReference: false,
      contentReference: null,
      language: safeText(sourceStats?.lang),
      translatedContent: "",
      translatedContentIsReference: false,
      translatedContentReference: null,
      sourceLink: heading.sourceLink,
      sourcePublishedAt: safeText(sourceStats?.createdAt),
      sourcePlatform: "twitter",
      authorName: heading.authorName,
      authorLink: heading.authorLink,
      followers: typeof sourceStats?.followers === "number" ? sourceStats.followers : null,
      likes: typeof sourceStats?.likeCount === "number" ? sourceStats.likeCount : null,
      retweetCount: typeof sourceStats?.retweetCount === "number" ? sourceStats.retweetCount : null,
      viewCount: typeof sourceStats?.viewCount === "number" ? sourceStats.viewCount : null,
      media,
      mediaRelativePaths: imagePaths,
      mediaCount: media.length,
      sourceMedia: buildSourceMedia(sourceStats),
      sourceMediaCount: buildSourceMedia(sourceStats).length,
      localMediaFiles: [],
      localThumbnailFiles: [],
      contentSource: "github readme",
      translatedContentSource: "",
      repoPromptIndexMatched: Boolean(sourceStats)
    });

    index = innerIndex - 1;
  }

  return cases;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${response.status} ${response.statusText} for ${url}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch text: ${response.status} ${response.statusText} for ${url}`);
  }

  return response.text();
}

async function main() {
  ensureDir(extractedRoot);

  const [readmeText, promptIndex] = await Promise.all([fetchText(readmeUrl), fetchJson(promptIndexUrl)]);
  const cases = parseReadmeCases(readmeText, buildJsonIndexMap(promptIndex));

  fs.writeFileSync(outputPath, `${JSON.stringify(cases, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        repo,
        branch,
        readmeUrl,
        promptIndexUrl,
        extractedRoot,
        outputPath,
        caseCount: cases.length,
        categories: [...new Set(cases.map((item) => item.categories))].sort(),
        matchedPromptIndexCount: cases.filter((item) => item.repoPromptIndexMatched).length
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
