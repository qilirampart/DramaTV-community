import type { VideoDetailPageView } from "@/lib/contracts/view-models";
import nanoBananaCatalog from "../../../public/nano-banana-data.json";
import seedanceCatalog from "../../../public/seedance-data.json";

type ImportedSeedanceItem = {
  id: string;
  title: string;
  summary: string;
  promptText: string;
  promptLanguage: "en" | "zh";
  authorName: string;
  publishedAt: string;
  featured: boolean;
  sourceLink: string;
  authorLink?: string;
  videoSrc: string;
  thumbnailSrc: string;
};

type ImportedNanoBananaItem = {
  id: string;
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
  needReferenceImages: boolean;
  resultsCount: number;
  imageCount: number;
  images: string[];
  promptText: string;
  rawPromptText: string;
  translatedPromptText?: string;
};

type ImportedPromptDefinition = {
  id: string;
  kind: "video" | "image";
  title: string;
  summary: string;
  promptText: string;
  authorName: string;
  sourceLink: string;
  authorLink?: string;
  publishedAt: string;
  featured: boolean;
  coverUrl?: string;
  previewUrl?: string;
  filterGroup: "short" | "tool";
  tags: string[];
  stats: {
    playCount: number;
    likeCount: number;
    favoriteCount: number;
  };
};

export type ImportedPromptArchiveItem = {
  id: string;
  title: string;
  href: string;
  authorName: string;
  coverUrl?: string;
  resourceType: "PROMPT";
  likes: number;
  createdAt: string;
  keywords: string[];
  filterGroup: "short" | "tool";
};

const videoPromptKeywordRules: Array<{ match: string; tags: string[] }> = [
  { match: "仙侠", tags: ["仙侠", "远景", "建立镜头"] },
  { match: "武侠", tags: ["武侠", "动作", "冷兵器"] },
  { match: "赛博", tags: ["赛博", "霓虹", "都市"] },
  { match: "机甲", tags: ["机甲", "未来感", "城市"] },
  { match: "海洋", tags: ["灾难", "海洋", "电影感"] },
  { match: "浪漫", tags: ["情绪", "人物关系", "电影感"] },
  { match: "MV", tags: ["MV", "表演", "节奏"] },
  { match: "战斗", tags: ["战斗", "特效", "分镜"] },
  { match: "动作", tags: ["动作", "追击", "镜头"] }
];

const imagePromptKeywordRules: Array<{ match: string; tags: string[] }> = [
  { match: "信息图", tags: ["信息图", "版式", "产品图"] },
  { match: "海报", tags: ["海报", "视觉", "平面"] },
  { match: "拼贴", tags: ["拼贴", "时尚", "组图"] },
  { match: "地图", tags: ["地图", "教育", "信息设计"] },
  { match: "专利", tags: ["复古", "文档", "档案"] },
  { match: "自拍", tags: ["自拍", "人像", "写实"] },
  { match: "肖像", tags: ["肖像", "人像", "构图"] },
  { match: "标题", tags: ["标题图", "封面图", "版式"] }
];

function cleanupText(value: string | undefined | null, fallback = "") {
  const source = String(value ?? fallback);
  return source.replace(/\\\\n/g, "\n").replace(/\r\n/g, "\n").trim();
}

function uniqueTags(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, 4);
}

function deriveTags(title: string, baseTags: string[], rules: Array<{ match: string; tags: string[] }>) {
  const tags = [...baseTags];

  rules.forEach((rule) => {
    if (title.includes(rule.match)) {
      tags.push(...rule.tags);
    }
  });

  return uniqueTags(tags);
}

function metricValue(base: number, step: number, index: number, featured: boolean) {
  return Math.max(160, Math.round(base - index * step + (featured ? base * 0.06 : 0)));
}

const importedPromptDefinitions: ImportedPromptDefinition[] = [
  ...(seedanceCatalog.items as ImportedSeedanceItem[])
    .filter((item) => /^\/seedance-videos\/[^/?#]+\.mp4$/i.test(item.videoSrc))
    .map((item, index) => ({
    id: item.id,
    kind: "video" as const,
    title: cleanupText(item.title, "未命名视频提示词"),
    summary: cleanupText(item.summary, "视频提示词归档"),
    promptText: cleanupText(item.promptText),
    authorName: cleanupText(item.authorName, "外部来源作者"),
    sourceLink: item.sourceLink,
    authorLink: item.authorLink,
    publishedAt: item.publishedAt,
    featured: item.featured,
    coverUrl: item.thumbnailSrc,
    previewUrl: item.videoSrc,
    filterGroup: "short" as const,
    tags: deriveTags(
      cleanupText(item.title),
      ["视频提示", item.promptLanguage === "zh" ? "中文" : "English"],
      videoPromptKeywordRules
    ),
    stats: {
      playCount: metricValue(38200, 460, index, item.featured),
      likeCount: metricValue(2680, 38, index, item.featured),
      favoriteCount: metricValue(1120, 16, index, item.featured)
    }
  })),
  ...(nanoBananaCatalog.items as ImportedNanoBananaItem[]).map((item, index) => ({
    id: item.id,
    kind: "image" as const,
    title: cleanupText(item.title, "未命名图片提示词"),
    summary: cleanupText(item.summary || item.description, "图片提示词归档"),
    promptText: cleanupText(item.translatedPromptText || item.promptText || item.rawPromptText),
    authorName: cleanupText(item.authorName, "外部来源作者"),
    sourceLink: item.sourceLink,
    authorLink: item.authorLink,
    publishedAt: item.publishedAt,
    featured: item.featured,
    coverUrl: item.images[0],
    filterGroup: "tool" as const,
    tags: deriveTags(
      cleanupText(item.title),
      [
        "图片提示",
        item.needReferenceImages ? "参考图" : "免参考",
        item.imageCount > 1 ? "多图" : "单图"
      ],
      imagePromptKeywordRules
    ),
    stats: {
      playCount: metricValue(18600, 240, index, item.featured),
      likeCount: metricValue(1820, 24, index, item.featured),
      favoriteCount: metricValue(760, 11, index, item.featured)
    }
  }))
];

const importedPromptMap = new Map(importedPromptDefinitions.map((item) => [item.id, item]));

function buildRelatedCards(definition: ImportedPromptDefinition) {
  return importedPromptDefinitions
    .filter((item) => item.id !== definition.id && item.kind === definition.kind)
    .slice(0, 2)
    .map((item) => ({
      id: item.id,
      title: item.title,
      coverUrl: item.coverUrl ?? "",
      summary: item.summary,
      likeCount: item.stats.likeCount,
      playCount: item.stats.playCount,
      author: {
        id: "",
        displayName: item.authorName
      }
    }));
}

export const importedPromptArchiveItems: ImportedPromptArchiveItem[] = importedPromptDefinitions.map((item) => ({
  id: item.id,
  title: item.title,
  href: `/videos/${item.id}`,
  authorName: item.authorName,
  coverUrl: item.coverUrl,
  resourceType: "PROMPT",
  likes: item.stats.likeCount,
  createdAt: item.publishedAt,
  keywords: item.tags,
  filterGroup: item.filterGroup
}));

export function isImportedPromptVideo(id: string) {
  return importedPromptMap.has(id);
}

export function buildImportedPromptVideoDetailView(id: string): VideoDetailPageView {
  const definition = importedPromptMap.get(id);

  if (!definition) {
    throw new Error(`Unknown imported prompt video: ${id}`);
  }

  return {
    id: definition.id,
    title: definition.title,
    summary: definition.summary,
    promptText: definition.promptText,
    tags: definition.tags,
    media: {
      kind: definition.kind,
      coverUrl: definition.coverUrl,
      previewUrl: definition.previewUrl,
      sourceUrl: definition.previewUrl,
      durationMs: definition.kind === "video" ? 15000 : undefined
    },
    author: {
      id: "",
      displayName: definition.authorName,
      followed: false
    },
    stats: {
      playCount: definition.stats.playCount,
      likeCount: definition.stats.likeCount,
      favoriteCount: definition.stats.favoriteCount,
      commentCount: 0
    },
    commentPolicy: {
      commentingEnabled: false,
      canManageComments: false
    },
    viewerActions: {
      liked: false,
      favorited: false
    },
    relatedVideos: buildRelatedCards(definition),
    comments: {
      items: [],
      hasMore: false
    }
  };
}
