const fs = require("fs");
const path = require("path");

const root = process.cwd();
const htmlPath = path.resolve(root, "..", "..", "tmp", "youmind-seedance-page.html");
const outputDir = path.resolve(root, "youmind-seedance-extracted");
const videosDir = path.join(outputDir, "videos");
const outputJson = path.join(outputDir, "seedance-items.all.json");
const legacyOutputJson = path.join(outputDir, "seedance-items.top10.json");
const reportPath = path.join(outputDir, "extraction-report.md");
const overridesPath = path.join(outputDir, "source-overrides.json");

function decodeJsStringLiteral(raw) {
  return JSON.parse(`"${raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
}

function decodeEscapedField(raw) {
  return JSON.parse(
    `"${raw
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t")}"`
  );
}

function collectFlightChunks(html) {
  const regex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  const chunks = [];
  let match;

  while ((match = regex.exec(html))) {
    chunks.push(match[1]);
  }

  return chunks;
}

function isReferenceToken(value) {
  return typeof value === "string" && /^\$\d+$/.test(value);
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

function loadOverrides() {
  if (!fs.existsSync(overridesPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(overridesPath, "utf8"));
}

function extractItems(payload, limit = Number.POSITIVE_INFINITY, overrides = {}) {
  const itemRegex =
    /\\"id\\":(\d+),\\"title\\":\\"([\s\S]*?)\\",\\"description\\":\\"([\s\S]*?)\\",\\"featured\\":(true|false),\\"content\\":\\"([\s\S]*?)\\",\\"language\\":\\"([\s\S]*?)\\",\\"translatedContent\\":\\"([\s\S]*?)\\",\\"sourceLink\\":\\"([\s\S]*?)\\",\\"sourcePublishedAt\\":\\"([\s\S]*?)\\",\\"author\\":\{\\"name\\":\\"([\s\S]*?)\\",\\"link\\":\\"([\s\S]*?)\\"\},\\"videos\\":\[\{\\"streamId\\":\\"([\s\S]*?)\\",\\"sourceUrl\\":\\"([\s\S]*?)\\",\\"thumbnail\\":\\"([\s\S]*?)\\",\\"caption\\":\\"([\s\S]*?)\\"\}/g;

  const items = [];
  let match;

  while ((match = itemRegex.exec(payload)) && items.length < limit) {
    const [
      ,
      id,
      title,
      description,
      featured,
      content,
      language,
      translatedContent,
      sourceLink,
      sourcePublishedAt,
      authorName,
      authorLink,
      streamId,
      sourceUrl,
      thumbnail,
      caption
    ] = match;

    const decodedContent = decodeEscapedField(content);
    const decodedTranslatedContent = decodeEscapedField(translatedContent);
    const decodedCaption = decodeEscapedField(caption);
    const importedVideoUrl = extractImportedVideoUrl(decodedCaption);
    const localVideoPath = findLocalVideoFile(streamId);

    const item = {
      rank: items.length + 1,
      id: Number(id),
      title: decodeEscapedField(title),
      description: decodeEscapedField(description),
      featured: featured === "true",
      content: decodedContent,
      contentIsReference: isReferenceToken(decodedContent),
      contentReference: isReferenceToken(decodedContent) ? decodedContent : null,
      language: decodeEscapedField(language),
      translatedContent: decodedTranslatedContent,
      translatedContentIsReference: isReferenceToken(decodedTranslatedContent),
      translatedContentReference: isReferenceToken(decodedTranslatedContent) ? decodedTranslatedContent : null,
      sourceLink: decodeEscapedField(sourceLink),
      sourcePublishedAt: decodeEscapedField(sourcePublishedAt),
      authorName: decodeEscapedField(authorName),
      authorLink: decodeEscapedField(authorLink),
      streamId: decodeEscapedField(streamId),
      sourceUrl: decodeEscapedField(sourceUrl),
      thumbnail: decodeEscapedField(thumbnail),
      caption: decodedCaption,
      importedVideoUrl,
      localVideoPath,
      contentSource: "youmind next flight",
      translatedContentSource: "youmind next flight"
    };

    const override = overrides[item.sourceLink];

    if (override?.content) {
      item.content = override.content;
      item.contentIsReference = false;
      item.contentReference = null;
      item.contentSource = override.contentSource || "source override";
    }

    if (override?.translatedContent) {
      item.translatedContent = override.translatedContent;
      item.translatedContentIsReference = false;
      item.translatedContentReference = null;
      item.translatedContentSource = override.translatedContentSource || "source override";
    }

    items.push(item);
  }

  return items;
}

function writeSampleFiles(items) {
  items
    .filter((item) => !item.contentIsReference)
    .forEach((item) => {
      const prefix = `${String(item.rank).padStart(2, "0")}-${item.streamId}`;
      const promptPath = path.join(outputDir, `${prefix}.prompt.txt`);
      const translatedPromptPath = path.join(outputDir, `${prefix}.translated.prompt.txt`);
      const summaryPath = path.join(outputDir, `${prefix}.summary.txt`);

      fs.writeFileSync(promptPath, `${item.content}\n`, "utf8");

      if (!item.translatedContentIsReference) {
        fs.writeFileSync(translatedPromptPath, `${item.translatedContent}\n`, "utf8");
      }

      fs.writeFileSync(
        summaryPath,
        [
          `rank: ${item.rank}`,
          `id: ${item.id}`,
          `title: ${item.title}`,
          `author: ${item.authorName}`,
          `publishedAt: ${item.sourcePublishedAt}`,
          `featured: ${item.featured}`,
          `streamId: ${item.streamId}`,
          `thumbnail: ${item.thumbnail}`,
          `sourceUrl: ${item.sourceUrl}`,
          `sourceLink: ${item.sourceLink}`,
          `contentSource: ${item.contentSource}`,
          `translatedContentSource: ${item.translatedContentSource}`,
          `importedVideoUrl: ${item.importedVideoUrl}`,
          `localVideoPath: ${item.localVideoPath || ""}`
        ].join("\n") + "\n",
        "utf8"
      );
    });
}

function writeReport(items) {
  const completeItems = items.filter((item) => !item.contentIsReference);
  const referencedItems = items.filter((item) => item.contentIsReference || item.translatedContentIsReference);
  const downloadedItems = items.filter((item) => item.localVideoPath);

  const lines = [
    "# YouMind Seedance Extraction Report",
    "",
    `- htmlPath: \`${htmlPath}\``,
    `- extractedCount: ${items.length}`,
    `- fullPromptCount: ${completeItems.length}`,
    `- referencedPromptCount: ${referencedItems.length}`,
    `- downloadedVideoCount: ${downloadedItems.length}`,
    "",
    "## Completed Samples",
    ""
  ];

  completeItems.forEach((item) => {
    lines.push(`- #${item.rank} id=${item.id} streamId=${item.streamId}`);
    lines.push(`  title: ${item.title}`);
    lines.push(`  importedVideoUrl: ${item.importedVideoUrl}`);
    lines.push(`  localVideoPath: ${item.localVideoPath || "(not downloaded)"}`);
  });

  lines.push("", "## Referenced Samples", "");

  referencedItems.forEach((item) => {
    lines.push(`- #${item.rank} id=${item.id} streamId=${item.streamId}`);
    lines.push(`  title: ${item.title}`);
    lines.push(`  contentReference: ${item.contentReference || "(inline)"}`);
    lines.push(`  translatedContentReference: ${item.translatedContentReference || "(inline)"}`);
    lines.push("  note: current saved HTML only exposes a Next Flight reference token for at least one prompt field.");
  });

  lines.push(
    "",
    "## Method",
    "",
    "- Parse saved page HTML and merge all `self.__next_f.push([1, ...])` chunks.",
    "- Decode the Next.js flight payload string and regex-extract prompt-card records.",
    "- Read `caption` to recover the original imported MP4 URL from `video.twimg.com`.",
    "- Mark prompt fields like `$23` / `$24` as unresolved flight references instead of pretending they are complete text.",
    "- Save every complete prompt as `.prompt.txt` plus metadata `.summary.txt` for reuse."
  );

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const chunks = collectFlightChunks(html);

  if (chunks.length === 0) {
    throw new Error("No Next.js flight chunks found in saved HTML.");
  }

  const payload = chunks.map(decodeJsStringLiteral).join("");
  const overrides = loadOverrides();
  const requestedLimit = Number(process.argv[2]);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : Number.POSITIVE_INFINITY;
  const items = extractItems(payload, limit, overrides);

  if (items.length === 0) {
    throw new Error("No Seedance items extracted from flight payload.");
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputJson, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  fs.writeFileSync(legacyOutputJson, `${JSON.stringify(items.slice(0, 10), null, 2)}\n`, "utf8");
  writeSampleFiles(items);
  writeReport(items);

  console.log(
    JSON.stringify(
      {
        htmlPath,
        outputJson,
        legacyOutputJson,
        reportPath,
        requestedLimit: Number.isFinite(limit) ? limit : null,
        extractedCount: items.length,
        fullPromptCount: items.filter((item) => !item.contentIsReference).length,
        referencedPromptCount: items.filter(
          (item) => item.contentIsReference || item.translatedContentIsReference
        ).length,
        downloadedVideoCount: items.filter((item) => item.localVideoPath).length,
        sample: items.slice(0, 3).map((item) => ({
          rank: item.rank,
          id: item.id,
          streamId: item.streamId,
          contentReference: item.contentReference,
          importedVideoUrl: item.importedVideoUrl,
          localVideoPath: item.localVideoPath
        }))
      },
      null,
      2
    )
  );
}

main();
