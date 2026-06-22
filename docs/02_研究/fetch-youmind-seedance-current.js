const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";

const SCRIPT_DIR = __dirname;
const ASSET_ROOT = path.join(SCRIPT_DIR, "youmind-video-assets");
const EXTRACTED_ROOT = path.join(ASSET_ROOT, "youmind-seedance-extracted");
const CACHE_ROOT = path.join(EXTRACTED_ROOT, "live-pages");

const DEFAULT_LOCALE = "zh-CN";
const DEFAULT_SORT_BY = "time";
const DEFAULT_SORT_ORDER = "desc";
const DEFAULT_COUNT = 12;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function parseArgs(argv) {
  const options = {
    locale: DEFAULT_LOCALE,
    sortBy: DEFAULT_SORT_BY,
    sortOrder: DEFAULT_SORT_ORDER,
    count: DEFAULT_COUNT,
    outputName: "seedance-items.current.sample.json",
    start: 0,
    savePages: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--locale" && next) {
      options.locale = next;
      index += 1;
      continue;
    }

    if (arg === "--sortBy" && next) {
      options.sortBy = next;
      index += 1;
      continue;
    }

    if (arg === "--sortOrder" && next) {
      options.sortOrder = next;
      index += 1;
      continue;
    }

    if (arg === "--count" && next) {
      options.count = Number(next);
      index += 1;
      continue;
    }

    if (arg === "--start" && next) {
      options.start = Number(next);
      index += 1;
      continue;
    }

    if (arg === "--output" && next) {
      options.outputName = next;
      index += 1;
      continue;
    }

    if (arg === "--no-save-pages") {
      options.savePages = false;
    }
  }

  if (!Number.isInteger(options.count) || options.count <= 0) {
    throw new Error("--count must be a positive integer");
  }

  if (!Number.isInteger(options.start) || options.start < 0) {
    throw new Error("--start must be a non-negative integer");
  }

  return options;
}

async function fetchText(url, refererUrl) {
  const args = [
    "-L",
    "--max-time",
    "45",
    "-H",
    `User-Agent: ${USER_AGENT}`,
    "-H",
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "-H",
    "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8",
    "-H",
    "Cache-Control: no-cache",
    "-H",
    "Pragma: no-cache"
  ];

  if (refererUrl) {
    args.push("-e", refererUrl);
  }

  args.push(url);

  try {
    return execFileSync("curl.exe", args, {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024
    });
  } catch (error) {
    const stderr = safeText(error.stderr);
    const stdout = safeText(error.stdout);
    throw new Error(
      `Failed to fetch ${url} via curl.exe${stderr ? `: ${stderr}` : stdout ? `: ${stdout}` : ""}`
    );
  }
}

async function postJson(url, payload, refererUrl) {
  const args = [
    "-L",
    "--max-time",
    "45",
    "-H",
    `User-Agent: ${USER_AGENT}`,
    "-H",
    "Accept: application/json,text/plain,*/*",
    "-H",
    "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8",
    "-H",
    "Cache-Control: no-cache",
    "-H",
    "Pragma: no-cache",
    "-H",
    "Content-Type: application/json",
    "-X",
    "POST",
    "--data-raw",
    JSON.stringify(payload)
  ];

  if (refererUrl) {
    args.push("-e", refererUrl);
  }

  args.push(url);

  try {
    return execFileSync("curl.exe", args, {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024
    });
  } catch (error) {
    const stderr = safeText(error.stderr);
    const stdout = safeText(error.stdout);
    throw new Error(
      `Failed to post ${url} via curl.exe${stderr ? `: ${stderr}` : stdout ? `: ${stdout}` : ""}`
    );
  }
}

function slugifyFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function writeTextIfEnabled(filePath, content, enabled) {
  if (!enabled) {
    return;
  }

  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function decodeJsStringLiteral(raw) {
  return JSON.parse(`"${raw}"`);
}

function decodeEscapedField(raw) {
  if (typeof raw !== "string") {
    return "";
  }

  return JSON.parse(
    `"${raw
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t")}"`
  );
}

function decodeHtmlEntities(raw) {
  if (typeof raw !== "string" || raw.length === 0) {
    return "";
  }

  return raw
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number.parseInt(value, 10)));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeMaybeUndefined(value) {
  if (value === "$undefined" || value === "undefined" || value == null) {
    return "";
  }

  return value;
}

function normalizePromptText(value) {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .trim();
}

function collectFlightPayload(html) {
  const regex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  const chunks = [];
  let match;

  while ((match = regex.exec(html))) {
    chunks.push(decodeJsStringLiteral(match[1]));
  }

  return chunks.join("");
}

function isFlightReferenceToken(value) {
  return typeof value === "string" && /^\$[0-9a-z]+$/i.test(value);
}

function resolveFlightReference(payload, referenceToken) {
  if (!isFlightReferenceToken(referenceToken)) {
    return referenceToken;
  }

  const referenceId = referenceToken.slice(1);
  const regex = new RegExp(
    String.raw`(?<![0-9a-z])${escapeRegExp(referenceId)}:T([0-9a-z]+),`,
    "i"
  );
  const match = regex.exec(payload);

  if (!match) {
    return "";
  }

  const recordLength = Number.parseInt(match[1], 16);
  if (!Number.isFinite(recordLength) || recordLength < 0) {
    return "";
  }

  const contentStart = match.index + match[0].length;
  const payloadTailBytes = Buffer.from(payload.slice(contentStart), "utf8");
  return payloadTailBytes.subarray(0, recordLength).toString("utf8");
}

function extractMetaContent(html, attributeName, attributeValue) {
  const escapedAttributeValue = escapeRegExp(attributeValue);
  const regex = new RegExp(
    `<meta[^>]+(?:${attributeName}="${escapedAttributeValue}"[^>]+content="([^"]*)"|content="([^"]*)"[^>]+${attributeName}="${escapedAttributeValue}")`,
    "i"
  );
  const match = html.match(regex);

  return decodeHtmlEntities(match ? match[1] || match[2] || "" : "");
}

function extractLinkHref(html, relValue) {
  const escapedRelValue = escapeRegExp(relValue);
  const regex = new RegExp(
    `<link[^>]+(?:rel="${escapedRelValue}"[^>]+href="([^"]*)"|href="([^"]*)"[^>]+rel="${escapedRelValue}")`,
    "i"
  );
  const match = html.match(regex);

  return decodeHtmlEntities(match ? match[1] || match[2] || "" : "");
}

function extractTitleTag(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return decodeHtmlEntities(match ? match[1].trim() : "");
}

function extractHtmlDataValue(html, label) {
  const regex = new RegExp(`${escapeRegExp(label)}<\\/dt><dd[^>]*>([^<]+)<\\/dd>`, "i");
  const match = html.match(regex);
  return decodeHtmlEntities(match ? match[1].trim() : "");
}

function extractDetailHtmlData(html) {
  const authorAndSourceMatch = html.match(
    /<a href="([^"]+)"[^>]*>(@?[^<]+)<\/a><a href="([^"]+)"[^>]*>查看原始来源/i
  );
  const categoryRegex = /seedance-2-0-prompts\?categories=[^"]+"[^>]*>([^<]+)<\/a>/g;
  const categories = [];
  let categoryMatch;

  while ((categoryMatch = categoryRegex.exec(html))) {
    categories.push(decodeHtmlEntities(categoryMatch[1].trim()));
  }

  return {
    titleFromTag: extractTitleTag(html),
    description: extractMetaContent(html, "name", "description"),
    canonicalUrl: extractLinkHref(html, "canonical"),
    ogTitle: extractMetaContent(html, "property", "og:title"),
    ogImage: extractMetaContent(html, "property", "og:image"),
    ogImageAlt: extractMetaContent(html, "property", "og:image:alt"),
    authorLink: authorAndSourceMatch ? decodeHtmlEntities(authorAndSourceMatch[1]) : "",
    authorName: authorAndSourceMatch ? decodeHtmlEntities(authorAndSourceMatch[2]) : "",
    sourceLink: authorAndSourceMatch ? decodeHtmlEntities(authorAndSourceMatch[3]) : "",
    sourcePublishedAt: extractHtmlDataValue(html, "发布时间"),
    originalLanguage: extractHtmlDataValue(html, "原始语言"),
    categoryLabels: unique(categories)
  };
}

function extractPromptDetailData(payload, promptId) {
  const stringLiteral = String.raw`((?:[^"\\]|\\.)*)`;
  const promptRegex = new RegExp(
    String.raw`"content":"${stringLiteral}","promptId":${promptId},"collection":"video-prompts","translatedContent":"${stringLiteral}","locale":"${stringLiteral}","originalLanguage":"${stringLiteral}"`,
    "m"
  );
  const promptMatch = payload.match(promptRegex);

  if (!promptMatch) {
    throw new Error(`Prompt detail block not found for id ${promptId}`);
  }

  const headerRegex = new RegExp(
    String.raw`"headerAction":\["\$","\$L\d+",null,\{"promptId":${promptId},"promptContent":"${stringLiteral}","promptType":"${stringLiteral}","modelSlug":"${stringLiteral}"`,
    "m"
  );
  const headerMatch = payload.match(headerRegex);
  const rawContent = decodeEscapedField(promptMatch[1]);
  const rawTranslatedContent = decodeEscapedField(promptMatch[2]);
  const resolvedContent = normalizeMaybeUndefined(resolveFlightReference(payload, rawContent));
  const resolvedTranslatedContent = normalizeMaybeUndefined(
    resolveFlightReference(payload, rawTranslatedContent)
  );

  return {
    content: safeText(resolvedContent || rawContent).trim(),
    translatedContent: safeText(resolvedTranslatedContent || rawTranslatedContent).trim(),
    contentReference: isFlightReferenceToken(rawContent) ? rawContent : "",
    translatedContentReference: isFlightReferenceToken(rawTranslatedContent)
      ? rawTranslatedContent
      : "",
    locale: decodeEscapedField(promptMatch[3]),
    originalLanguage: decodeEscapedField(promptMatch[4]),
    promptContent: decodeEscapedField(headerMatch ? headerMatch[1] : ""),
    promptType: decodeEscapedField(headerMatch ? headerMatch[2] : "video"),
    modelSlug: decodeEscapedField(headerMatch ? headerMatch[3] : "seedance-2.0")
  };
}

function extractPrimaryVideoData(payload) {
  const stringLiteral = String.raw`((?:[^"\\]|\\.)*)`;
  const videoRegex = new RegExp(
    String.raw`"videos":\[\{"streamId":"${stringLiteral}","sourceUrl":"${stringLiteral}","thumbnail":"${stringLiteral}","caption":"${stringLiteral}"\}\]`,
    "m"
  );
  const videoMatch = payload.match(videoRegex);

  if (!videoMatch) {
    throw new Error("Prompt detail media block not found.");
  }

  return {
    streamId: decodeEscapedField(videoMatch[1]),
    sourceUrl: normalizeMaybeUndefined(decodeEscapedField(videoMatch[2])),
    thumbnail: normalizeMaybeUndefined(decodeEscapedField(videoMatch[3])),
    caption: decodeEscapedField(videoMatch[4])
  };
}

function unique(values) {
  return Array.from(new Set(values));
}

function extractDetailUrlsFromHtml(html, locale) {
  const localePattern = locale.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`/${localePattern}/video-prompts/[a-z0-9-]+-\\d+`, "gi");
  const matches = html.match(regex) || [];

  if (matches.length > 0) {
    return unique(matches).map((href) => `https://youmind.com${href}`);
  }

  const payload = collectFlightPayload(html);
  return extractDetailUrlsFromExplorePayload(payload, locale);
}

function extractDetailUrlsFromExplorePayload(payload, locale) {
  const promptsMarker = '"prompts":[';
  const markerIndex = payload.indexOf(promptsMarker);

  if (markerIndex === -1) {
    return [];
  }

  const arrayStart = markerIndex + promptsMarker.length - 1;
  const promptsJson = extractBalancedJsonArray(payload, arrayStart);

  if (!promptsJson) {
    return [];
  }

  let prompts;

  try {
    prompts = JSON.parse(promptsJson);
  } catch (error) {
    return [];
  }

  return prompts
    .map((prompt) => {
      const id = Number(prompt && prompt.id);
      const slug = safeText(prompt && prompt.slug);

      if (!Number.isInteger(id) || id <= 0 || !slug) {
        return "";
      }

      return `https://youmind.com/${locale}/video-prompts/${slug}-${id}`;
    })
    .filter(Boolean);
}

function extractBalancedJsonArray(source, startIndex) {
  if (source[startIndex] !== "[") {
    return "";
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return "";
}

function extractPromptIdFromUrl(url) {
  const match = url.match(/-(\d+)(?:\?|$)/);
  if (!match) {
    throw new Error(`Unable to infer prompt id from url: ${url}`);
  }

  return Number(match[1]);
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function parseJson(text, description) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse ${description}: ${error.message}`);
  }
}

function normalizeVideoPromptApiItem(prompt, rank, sourcePageUrl, locale) {
  const videos = Array.isArray(prompt && prompt.videos) ? prompt.videos : [];
  const primaryVideo = videos[0] && typeof videos[0] === "object" ? videos[0] : {};
  const author = prompt && typeof prompt.author === "object" ? prompt.author : {};
  const promptId = Number(prompt && prompt.id);
  const slug = safeText(prompt && prompt.slug);
  const detailUrl =
    Number.isInteger(promptId) && promptId > 0 && slug
      ? `https://youmind.com/${locale}/video-prompts/${slug}-${promptId}`
      : "";

  return {
    rank,
    id: promptId,
    title: safeText(prompt && prompt.title),
    description: safeText(prompt && prompt.description),
    featured: Boolean(prompt && prompt.featured),
    content: normalizePromptText(safeText(prompt && prompt.content)),
    contentIsReference: false,
    contentReference: null,
    language: safeText(prompt && prompt.language).toUpperCase(),
    translatedContent: normalizePromptText(safeText(prompt && prompt.translatedContent)),
    translatedContentIsReference: false,
    translatedContentReference: null,
    sourceLink: safeText(prompt && prompt.sourceLink),
    sourcePublishedAt: safeText(prompt && prompt.sourcePublishedAt),
    authorName: safeText(author && author.name),
    authorLink: safeText(author && author.link),
    streamId: safeText(primaryVideo && primaryVideo.streamId),
    sourceUrl: safeText(primaryVideo && primaryVideo.sourceUrl),
    thumbnail: safeText(primaryVideo && primaryVideo.thumbnail),
    caption: safeText(primaryVideo && primaryVideo.caption),
    importedVideoUrl: extractImportedVideoUrl(safeText(primaryVideo && primaryVideo.caption)),
    localVideoPath: null,
    contentSource: "youmind marketing api",
    translatedContentSource: "youmind marketing api",
    model: DEFAULT_SORT_BY ? "seedance-2.0" : "seedance-2.0",
    type: "video",
    slug,
    href: detailUrl,
    detailUrl,
    sourcePageUrl,
    copiedCount: 0,
    views: 0,
    clicks: 0,
    rawMetrics: {},
    categories: {
      useCases: [],
      styles: [],
      subjects: []
    }
  };
}

async function fetchVideoPromptPage(options, sourcePageUrl, page) {
  const requestPayload = {
    model: "seedance-2.0",
    page,
    limit: DEFAULT_COUNT,
    locale: options.locale,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder
  };
  const responseText = await postJson(
    "https://youmind.com/youmarketing-api/video-prompts",
    requestPayload,
    sourcePageUrl
  );
  const response = parseJson(responseText, `video prompt page ${page} response`);

  if (!response || !Array.isArray(response.prompts)) {
    throw new Error(`Unexpected video prompt page ${page} response shape.`);
  }

  return {
    requestPayload,
    response
  };
}

function extractImportedVideoUrl(caption) {
  return typeof caption === "string" ? caption.replace(/^Imported from URL:\s*/, "") : "";
}

function normalizePrompt(detailData, rank, detailUrl, sourcePageUrl) {
  const caption = safeText(detailData.caption);
  return {
    rank,
    id: detailData.id,
    title: safeText(detailData.title),
    description: safeText(detailData.description),
    featured: false,
    content: normalizePromptText(safeText(detailData.content)),
    contentIsReference: Boolean(detailData.contentIsReference),
    contentReference: detailData.contentReference || null,
    language: safeText(detailData.language),
    translatedContent: normalizePromptText(safeText(detailData.translatedContent)),
    translatedContentIsReference: Boolean(detailData.translatedContentIsReference),
    translatedContentReference: detailData.translatedContentReference || null,
    sourceLink: safeText(detailData.sourceLink),
    sourcePublishedAt: safeText(detailData.sourcePublishedAt),
    authorName: safeText(detailData.authorName),
    authorLink: safeText(detailData.authorLink),
    streamId: safeText(detailData.streamId),
    sourceUrl: safeText(detailData.sourceUrl),
    thumbnail: safeText(detailData.thumbnail),
    caption,
    importedVideoUrl: extractImportedVideoUrl(caption),
    localVideoPath: null,
    contentSource: "youmind detail rsc",
    translatedContentSource: "youmind detail rsc",
    model: safeText(detailData.model),
    type: safeText(detailData.type),
    slug: safeText(detailData.slug),
    href: detailUrl,
    detailUrl,
    sourcePageUrl,
    copiedCount: 0,
    views: 0,
    clicks: 0,
    rawMetrics: {},
    categories: {
      useCases: [],
      styles: [],
      subjects: []
    }
  };
}

function buildReport(items, options, sourcePageUrl, detailUrls, outputPath) {
  return {
    generatedAt: new Date().toISOString(),
    sourcePageUrl,
    outputPath,
    locale: options.locale,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    requestedCount: options.count,
    start: options.start,
    discoveredDetailCount: detailUrls.length,
    extractedCount: items.length,
    items: items.map((item) => ({
      rank: item.rank,
      id: item.id,
      title: item.title,
      model: item.model,
      streamId: item.streamId,
      sourcePublishedAt: item.sourcePublishedAt,
      sourceLink: item.sourceLink,
      detailUrl: item.detailUrl,
      importedVideoUrl: item.importedVideoUrl
    }))
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDir(EXTRACTED_ROOT);
  ensureDir(CACHE_ROOT);

  const sourcePageUrl = `https://youmind.com/${options.locale}/seedance-2-0-prompts/explore?sortBy=${encodeURIComponent(options.sortBy)}&sortOrder=${encodeURIComponent(options.sortOrder)}`;
  const exploreHtml = await fetchText(sourcePageUrl, sourcePageUrl);
  const exploreCachePath = path.join(CACHE_ROOT, `seedance-explore-${options.sortBy}-${options.sortOrder}.html`);

  writeTextIfEnabled(exploreCachePath, exploreHtml, options.savePages);
  const startPage = Math.floor(options.start / DEFAULT_COUNT) + 1;
  const endExclusive = options.start + options.count;
  const endPage = Math.ceil(endExclusive / DEFAULT_COUNT);
  const collectedPrompts = [];
  const pageResponses = [];

  for (let page = startPage; page <= endPage; page += 1) {
    const pageResult = await fetchVideoPromptPage(options, sourcePageUrl, page);
    pageResponses.push(pageResult);

    const pageCachePath = path.join(
      CACHE_ROOT,
      `seedance-explore-${options.sortBy}-${options.sortOrder}-page-${String(page).padStart(3, "0")}.json`
    );
    writeTextIfEnabled(
      pageCachePath,
      `${JSON.stringify(
        {
          request: pageResult.requestPayload,
          response: pageResult.response
        },
        null,
        2
      )}\n`,
      options.savePages
    );

    for (const prompt of pageResult.response.prompts) {
      collectedPrompts.push(prompt);
    }
  }

  const startOffsetInCollected = options.start - (startPage - 1) * DEFAULT_COUNT;
  const selectedPrompts = collectedPrompts.slice(
    startOffsetInCollected,
    startOffsetInCollected + options.count
  );

  if (selectedPrompts.length === 0) {
    throw new Error("No prompts discovered from paginated video prompt API.");
  }

  const normalizedItems = selectedPrompts.map((prompt, index) =>
    normalizeVideoPromptApiItem(prompt, options.start + index + 1, sourcePageUrl, options.locale)
  );
  const discoveredDetailUrls = collectedPrompts
    .map((prompt) => {
      const promptId = Number(prompt && prompt.id);
      const slug = safeText(prompt && prompt.slug);

      if (!Number.isInteger(promptId) || promptId <= 0 || !slug) {
        return "";
      }

      return `https://youmind.com/${options.locale}/video-prompts/${slug}-${promptId}`;
    })
    .filter(Boolean);

  const outputPath = path.join(EXTRACTED_ROOT, options.outputName);
  const reportPath = path.join(
    EXTRACTED_ROOT,
    options.outputName.replace(/\.json$/i, ".report.json")
  );

  fs.writeFileSync(outputPath, `${JSON.stringify(normalizedItems, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(buildReport(normalizedItems, options, sourcePageUrl, discoveredDetailUrls, outputPath), null, 2)}\n`,
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        sourcePageUrl,
        outputPath,
        reportPath,
        discoveredDetailCount: discoveredDetailUrls.length,
        extractedCount: normalizedItems.length,
        sample: normalizedItems.slice(0, 3).map((item) => ({
          rank: item.rank,
          id: item.id,
          title: item.title,
          streamId: item.streamId,
          sourcePublishedAt: item.sourcePublishedAt,
          detailUrl: item.detailUrl
        }))
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
