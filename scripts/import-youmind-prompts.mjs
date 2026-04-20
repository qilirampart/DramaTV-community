import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const publicRoot = path.join(projectRoot, "apps", "web", "public");
const seedanceCatalogPath = path.join(publicRoot, "seedance-data.json");
const nanoBananaCatalogPath = path.join(publicRoot, "nano-banana-data.json");

const DOCKER_CONTAINER = process.env.DRAMATV_POSTGRES_CONTAINER || "dramatv-postgres";
const DB_NAME = process.env.DRAMATV_DB_NAME || "dramatv";
const DB_USER = process.env.DRAMATV_DB_USER || "dramatv";

const IMPORT_NAMESPACE = "2d3b91f4-c745-4f84-b8c5-5f5f8fdaf0dd";
const DEFAULT_LIMIT = 30;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function cleanText(value, fallback = "") {
  return String(value ?? fallback)
    .replace(/\\\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

function toSlug(value) {
  const ascii = String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return ascii || crypto.createHash("sha1").update(String(value ?? "youmind")).digest("hex").slice(0, 12);
}

function uuidV5(name, namespace = IMPORT_NAMESPACE) {
  const namespaceBytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const nameBytes = Buffer.from(name, "utf8");
  const hash = crypto.createHash("sha1").update(namespaceBytes).update(nameBytes).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") {
    return "null";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlArray(values) {
  const uniqueValues = Array.from(new Set(values.map((value) => cleanText(value)).filter(Boolean)));
  if (uniqueValues.length === 0) {
    return "'{}'::text[]";
  }

  return `array[${uniqueValues.map(sqlString).join(", ")}]::text[]`;
}

function parsePublishedAt(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function publicFilePath(publicUrl) {
  if (!publicUrl?.startsWith("/")) {
    return null;
  }

  return path.join(publicRoot, publicUrl.slice(1).replace(/\//g, path.sep));
}

function getMimeType(filePath, fallback) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".mp4":
      return "video/mp4";
    default:
      return fallback;
  }
}

function probeVideo(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,duration",
      "-of",
      "json",
      filePath,
    ],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    return null;
  }

  try {
    const payload = JSON.parse(result.stdout);
    const stream = payload.streams?.[0];
    if (!stream?.width || !stream?.height) {
      return null;
    }

    const durationMs = Number.isFinite(Number(stream.duration))
      ? Math.round(Number(stream.duration) * 1000)
      : null;

    return {
      width: Number(stream.width),
      height: Number(stream.height),
      durationMs,
    };
  } catch {
    return null;
  }
}

function safeSize(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  return fs.statSync(filePath).size;
}

function deriveVideoTags(title) {
  const tags = ["视频提示", "Seedance 2.0", "短片"];
  if (title.includes("战斗") || title.includes("动作")) tags.push("动作");
  if (title.includes("电影") || title.includes("大片")) tags.push("电影感");
  if (title.includes("MV") || title.includes("说唱")) tags.push("MV");
  if (title.includes("浪漫") || title.includes("青春")) tags.push("情绪");
  if (title.includes("赛车") || title.includes("跑车")) tags.push("速度感");
  return tags.slice(0, 5);
}

function deriveImageTags(item) {
  const tags = ["图片提示", "Nano Banana", item.needReferenceImages ? "参考图" : "免参考"];
  const title = item.title ?? "";
  if (title.includes("信息图")) tags.push("信息图");
  if (title.includes("海报") || title.includes("标题")) tags.push("版式");
  if (title.includes("肖像") || title.includes("人像")) tags.push("人像");
  if (Number(item.imageCount) > 1) tags.push("多图");
  return tags.slice(0, 5);
}

function buildAuthor(item) {
  const displayName = cleanText(item.authorName, "YouMind Creator").slice(0, 64);
  const externalKey = cleanText(item.authorLink) || `youmind-author:${displayName}`;
  const suffix = crypto.createHash("sha1").update(externalKey).digest("hex").slice(0, 8);
  const id = uuidV5(`user:${externalKey}`);
  return {
    id,
    username: `youmind-${toSlug(displayName).slice(0, 40)}-${suffix}`,
    displayName,
    bio: cleanText(item.authorLink),
    externalSubject: `youmind:${crypto.createHash("sha1").update(externalKey).digest("hex").slice(0, 32)}`,
  };
}

function buildVideoPrompt(item, index) {
  const videoPath = publicFilePath(item.videoSrc);
  const probe = probeVideo(videoPath);
  if (!probe) {
    return null;
  }

  const author = buildAuthor(item);
  const sourceItemId = String(item.id).replace(/^seedance-/, "");
  const promptId = uuidV5(`prompt:youmind:seedance:${sourceItemId}`);
  const assetId = uuidV5(`asset:youmind:seedance:${sourceItemId}:video`);
  const publishedAt = parsePublishedAt(item.publishedAt);
  const title = cleanText(item.title, "Seedance 视频提示词").slice(0, 160);
  const promptText = cleanText(item.promptText, item.summary);

  return {
    prompt: {
      id: promptId,
      author,
      title,
      summary: cleanText(item.summary, title),
      modality: "video",
      promptText,
      promptTextZh: item.promptLanguage === "zh" ? promptText : null,
      promptTextEn: item.promptLanguage === "en" ? promptText : null,
      promptTextRaw: promptText,
      modelName: "Seedance 2.0",
      sourcePlatform: "youmind",
      sourceCampaign: "youmind-seedance",
      sourceItemId,
      sourceUrl: item.sourceLink,
      publishedAt,
      tags: deriveVideoTags(title),
      likeCount: Math.max(200, 2680 - index * 38),
      favoriteCount: Math.max(80, 1120 - index * 16),
    },
    assets: [
      {
        id: assetId,
        kind: "video",
        objectKey: item.videoSrc,
        fileName: path.basename(videoPath),
        mimeType: "video/mp4",
        sizeBytes: safeSize(videoPath),
        width: probe.width,
        height: probe.height,
        durationMs: probe.durationMs,
      },
    ],
    primaryAssetId: assetId,
  };
}

function buildImagePrompt(item, index) {
  const imageUrls = Array.isArray(item.images) ? item.images : [];
  const existingImages = imageUrls
    .map((url, sortOrder) => ({ url, sortOrder, filePath: publicFilePath(url) }))
    .filter((entry) => entry.filePath && fs.existsSync(entry.filePath));

  if (existingImages.length === 0) {
    return null;
  }

  const author = buildAuthor(item);
  const sourceItemId = String(item.id).replace(/^nano-banana-/, "");
  const promptId = uuidV5(`prompt:youmind:nano-banana:${sourceItemId}`);
  const title = cleanText(item.title, "Nano Banana 图片提示词").slice(0, 160);
  const promptTextZh = cleanText(item.translatedPromptText || item.promptText || item.rawPromptText);
  const promptTextRaw = cleanText(item.rawPromptText || item.promptText || item.translatedPromptText);
  const promptText = promptTextZh || promptTextRaw;

  return {
    prompt: {
      id: promptId,
      author,
      title,
      summary: cleanText(item.summary || item.description, title),
      modality: "image",
      promptText,
      promptTextZh: promptTextZh || null,
      promptTextEn: null,
      promptTextRaw: promptTextRaw || promptText,
      modelName: "Nano Banana",
      sourcePlatform: "youmind",
      sourceCampaign: "youmind-nano-banana",
      sourceItemId,
      sourceUrl: item.sourceLink || item.arenaLink,
      publishedAt: parsePublishedAt(item.publishedAt),
      tags: deriveImageTags(item),
      likeCount: Math.max(180, 1820 - index * 24),
      favoriteCount: Math.max(60, 760 - index * 11),
    },
    assets: existingImages.map((entry) => ({
      id: uuidV5(`asset:youmind:nano-banana:${sourceItemId}:${entry.sortOrder}`),
      kind: "image",
      objectKey: entry.url,
      fileName: path.basename(entry.filePath),
      mimeType: getMimeType(entry.filePath, "image/jpeg"),
      sizeBytes: safeSize(entry.filePath),
      width: null,
      height: null,
      durationMs: null,
    })),
    primaryAssetId: uuidV5(`asset:youmind:nano-banana:${sourceItemId}:0`),
  };
}

function buildImports() {
  const seedance = readJson(seedanceCatalogPath);
  const nanoBanana = readJson(nanoBananaCatalogPath);
  const limit = Number(process.env.YOUMIND_IMPORT_LIMIT || DEFAULT_LIMIT);

  const videoPrompts = seedance.items
    .slice(0, limit)
    .map(buildVideoPrompt)
    .filter(Boolean);
  const imagePrompts = nanoBanana.items
    .slice(0, limit)
    .map(buildImagePrompt)
    .filter(Boolean);

  return [...videoPrompts, ...imagePrompts];
}

function insertUserSql(author) {
  return `
insert into users (
    id, username, display_name, avatar_url, bio, role_code, status_code,
    identity_provider, external_subject, created_at, updated_at
) values (
    ${sqlString(author.id)}::uuid,
    ${sqlString(author.username)},
    ${sqlString(author.displayName)},
    null,
    ${sqlString(author.bio)},
    'creator',
    'active',
    'youmind',
    ${sqlString(author.externalSubject)},
    now(),
    now()
)
on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    bio = excluded.bio,
    role_code = excluded.role_code,
    status_code = excluded.status_code,
    identity_provider = excluded.identity_provider,
    external_subject = excluded.external_subject,
    updated_at = now();

insert into creator_profiles (
    id, user_id, headline, website_url, location_text, featured_status, created_at, updated_at
) values (
    ${sqlString(uuidV5(`creator-profile:${author.id}`))}::uuid,
    ${sqlString(author.id)}::uuid,
    'YouMind 灵感作者',
    ${sqlString(author.bio)},
    'Imported',
    'normal',
    now(),
    now()
)
on conflict (user_id) do update set
    headline = excluded.headline,
    website_url = excluded.website_url,
    updated_at = now();`;
}

function insertAssetSql(asset, promptId, authorId) {
  return `
insert into media_assets (
    id, asset_kind, biz_type, biz_id, storage_provider, bucket_name, object_key,
    file_name, mime_type, size_bytes, width, height, duration_ms, checksum,
    status_code, is_public, created_by, created_at, updated_at
) values (
    ${sqlString(asset.id)}::uuid,
    ${sqlString(asset.kind)},
    'prompt',
    ${sqlString(promptId)}::uuid,
    'local-public',
    'apps-web-public',
    ${sqlString(asset.objectKey)},
    ${sqlString(asset.fileName)},
    ${sqlString(asset.mimeType)},
    ${asset.sizeBytes ?? "null"},
    ${asset.width ?? "null"},
    ${asset.height ?? "null"},
    ${asset.durationMs ?? "null"},
    ${sqlString(crypto.createHash("sha1").update(asset.objectKey).digest("hex"))},
    'ready',
    true,
    ${sqlString(authorId)}::uuid,
    now(),
    now()
)
on conflict (id) do update set
    biz_type = excluded.biz_type,
    biz_id = excluded.biz_id,
    object_key = excluded.object_key,
    file_name = excluded.file_name,
    mime_type = excluded.mime_type,
    size_bytes = excluded.size_bytes,
    width = excluded.width,
    height = excluded.height,
    duration_ms = excluded.duration_ms,
    status_code = excluded.status_code,
    is_public = excluded.is_public,
    updated_at = now();`;
}

function insertPromptSql(entry) {
  const { prompt, primaryAssetId, assets } = entry;
  return `
insert into prompt_entries (
    id, author_id, title, summary, modality, prompt_text, prompt_text_zh,
    prompt_text_en, prompt_text_raw, model_name, source_platform, source_campaign,
    source_item_id, source_url, visibility, publish_status, cover_asset_id,
    primary_example_asset_id, tag_names, example_count, like_count, favorite_count,
    published_at, created_at, updated_at
) values (
    ${sqlString(prompt.id)}::uuid,
    ${sqlString(prompt.author.id)}::uuid,
    ${sqlString(prompt.title)},
    ${sqlString(prompt.summary)},
    ${sqlString(prompt.modality)},
    ${sqlString(prompt.promptText)},
    ${sqlString(prompt.promptTextZh)},
    ${sqlString(prompt.promptTextEn)},
    ${sqlString(prompt.promptTextRaw)},
    ${sqlString(prompt.modelName)},
    ${sqlString(prompt.sourcePlatform)},
    ${sqlString(prompt.sourceCampaign)},
    ${sqlString(prompt.sourceItemId)},
    ${sqlString(prompt.sourceUrl)},
    'public',
    'published',
    ${sqlString(primaryAssetId)}::uuid,
    ${sqlString(primaryAssetId)}::uuid,
    ${sqlArray(prompt.tags)},
    ${assets.length},
    ${prompt.likeCount},
    ${prompt.favoriteCount},
    ${sqlString(prompt.publishedAt)}::timestamptz,
    now(),
    now()
)
on conflict (id) do update set
    author_id = excluded.author_id,
    title = excluded.title,
    summary = excluded.summary,
    modality = excluded.modality,
    prompt_text = excluded.prompt_text,
    prompt_text_zh = excluded.prompt_text_zh,
    prompt_text_en = excluded.prompt_text_en,
    prompt_text_raw = excluded.prompt_text_raw,
    model_name = excluded.model_name,
    source_platform = excluded.source_platform,
    source_campaign = excluded.source_campaign,
    source_item_id = excluded.source_item_id,
    source_url = excluded.source_url,
    cover_asset_id = excluded.cover_asset_id,
    primary_example_asset_id = excluded.primary_example_asset_id,
    tag_names = excluded.tag_names,
    example_count = excluded.example_count,
    like_count = excluded.like_count,
    favorite_count = excluded.favorite_count,
    published_at = excluded.published_at,
    updated_at = now();`;
}

function insertLinkSql(promptId, asset, sortOrder) {
  return `
insert into prompt_example_links (
    id, prompt_id, media_asset_id, role_code, sort_order, created_at
) values (
    ${sqlString(uuidV5(`prompt-link:${promptId}:${asset.id}`))}::uuid,
    ${sqlString(promptId)}::uuid,
    ${sqlString(asset.id)}::uuid,
    'example',
    ${sortOrder},
    now()
)
on conflict (prompt_id, media_asset_id) do update set
    role_code = excluded.role_code,
    sort_order = excluded.sort_order;`;
}

function insertFeedSql(prompt, index) {
  const rankScore = prompt.modality === "video" ? 9000 - index * 8 : 8200 - index * 8;
  return `
insert into feed_items (
    id, channel_code, item_type, target_id, rank_score, status_code, published_at, created_at, updated_at
) values (
    ${sqlString(uuidV5(`feed:recommend:prompt:${prompt.id}`))}::uuid,
    'recommend',
    'prompt',
    ${sqlString(prompt.id)}::uuid,
    ${rankScore},
    'active',
    ${sqlString(prompt.publishedAt)}::timestamptz,
    now(),
    now()
)
on conflict (channel_code, item_type, target_id) do update set
    rank_score = excluded.rank_score,
    status_code = excluded.status_code,
    published_at = excluded.published_at,
    updated_at = now();`;
}

function buildSql(entries) {
  const seenAuthors = new Set();
  const statements = ["begin;"];

  entries.forEach((entry, index) => {
    const author = entry.prompt.author;
    if (!seenAuthors.has(author.id)) {
      statements.push(insertUserSql(author));
      seenAuthors.add(author.id);
    }

    entry.assets.forEach((asset) => {
      statements.push(insertAssetSql(asset, entry.prompt.id, author.id));
    });

    statements.push(insertPromptSql(entry));
    entry.assets.forEach((asset, sortOrder) => {
      statements.push(insertLinkSql(entry.prompt.id, asset, sortOrder));
    });
    statements.push(insertFeedSql(entry.prompt, index));
  });

  statements.push(`
update creator_profiles creator_profile
set video_count = coalesce(content_counts.video_count, 0),
    workflow_count = coalesce(content_counts.workflow_count, 0),
    updated_at = now()
from (
    select
        user_account.id as user_id,
        count(distinct video.id) as video_count,
        count(distinct workflow.id) as workflow_count
    from users user_account
    left join videos video on video.author_id = user_account.id and video.deleted_at is null
    left join workflows workflow on workflow.author_id = user_account.id and workflow.deleted_at is null
    group by user_account.id
) content_counts
where creator_profile.user_id = content_counts.user_id;`);
  statements.push("commit;");

  return statements.join("\n\n");
}

function runPsql(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      ["exec", "-i", DOCKER_CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME, "-v", "ON_ERROR_STOP=1"],
      {
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`psql exited with code ${code}\n${stderr}`));
      }
    });

    child.stdin.end(sql);
  });
}

async function main() {
  const entries = buildImports();
  if (entries.length === 0) {
    throw new Error("No valid YouMind prompt entries were found.");
  }

  const sql = buildSql(entries);
  if (process.argv.includes("--dry-run")) {
    process.stdout.write(sql);
    return;
  }

  const result = await runPsql(sql);
  const videos = entries.filter((entry) => entry.prompt.modality === "video").length;
  const images = entries.filter((entry) => entry.prompt.modality === "image").length;
  process.stdout.write(`Imported YouMind prompts: ${entries.length} (${videos} video, ${images} image)\n`);
  if (result.stderr.trim()) {
    process.stderr.write(result.stderr);
  }
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? String(error)}\n`);
  process.exit(1);
});
