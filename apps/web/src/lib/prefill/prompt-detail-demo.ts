import type { VideoDetailPageView } from "@/lib/contracts/view-models";

type DemoAuthor = {
  id: string;
  displayName: string;
  avatarUrl?: string;
};

export type PromptPreviewDefinition = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  coverUrl?: string;
  previewUrl: string;
  durationMs: number;
  author: DemoAuthor;
  stats: {
    playCount: number;
    likeCount: number;
    favoriteCount: number;
  };
  relatedIds: string[];
};

const demoAuthors = {
  rina: {
    id: "11111111-1111-1111-1111-111111111111",
    displayName: "Rina Flux"
  },
  studio: {
    id: "33333333-3333-3333-3333-333333333333",
    displayName: "Follow Studio"
  }
} satisfies Record<string, DemoAuthor>;

export const promptPreviewDefinitions: PromptPreviewDefinition[] = [
  {
    id: "prompt-preview-bamboo",
    title: "月下竹林双人对决",
    summary: "近景情绪压迫配合长焦推入，适合做武侠类视频的第一镜头。",
    tags: ["武侠", "竹林", "月夜", "长焦"],
    coverUrl: "/nano-banana-images/000011-13330/01.jpg",
    previewUrl: "/prefill-videos/010-bamboo-duel.mp4",
    durationMs: 12000,
    author: demoAuthors.rina,
    stats: {
      playCount: 28410,
      likeCount: 1860,
      favoriteCount: 720
    },
    relatedIds: ["prompt-preview-xianxia", "prompt-preview-warehouse"]
  },
  {
    id: "prompt-preview-cyber",
    title: "雨夜赛博街区冲镜",
    summary: "霓虹反差和速度感很强，适合赛博、都市、品牌开场类内容。",
    tags: ["赛博", "夜景", "霓虹", "速度感"],
    coverUrl: "/nano-banana-images/000028-13310/01.jpg",
    previewUrl: "/prefill-videos/006-cyber-city.mp4",
    durationMs: 12000,
    author: demoAuthors.studio,
    stats: {
      playCount: 32280,
      likeCount: 2140,
      favoriteCount: 906
    },
    relatedIds: ["prompt-preview-mecha", "prompt-preview-stage"]
  },
  {
    id: "prompt-preview-stage",
    title: "二次元舞台灯光循环",
    summary: "舞台灯色统一，动作节奏稳定，适合角色展示和演出片段。",
    tags: ["舞台", "角色", "灯光", "循环"],
    coverUrl: "/nano-banana-images/000013-13329/01.jpg",
    previewUrl: "/prefill-videos/007-anime-stage-dance.mp4",
    durationMs: 12000,
    author: demoAuthors.rina,
    stats: {
      playCount: 26100,
      likeCount: 1540,
      favoriteCount: 640
    },
    relatedIds: ["prompt-preview-moves", "prompt-preview-cyber"]
  },
  {
    id: "prompt-preview-warehouse",
    title: "仓库追击打斗切换",
    summary: "中近景切换和停顿节奏完整，适合动作拆分和节奏练习。",
    tags: ["动作", "仓库", "追击", "切镜"],
    coverUrl: "/nano-banana-images/000014-13327/01.jpg",
    previewUrl: "/prefill-videos/009-warehouse-fight.mp4",
    durationMs: 12000,
    author: demoAuthors.studio,
    stats: {
      playCount: 29860,
      likeCount: 2030,
      favoriteCount: 812
    },
    relatedIds: ["prompt-preview-bamboo", "prompt-preview-moves"]
  },
  {
    id: "prompt-preview-xianxia",
    title: "云海仙侠建立镜头",
    summary: "建立镜头信息量足，空间层级清楚，适合作为首页头图内容。",
    tags: ["仙侠", "建立镜头", "云海", "远景"],
    coverUrl: "/nano-banana-images/000020-13326/01.jpg",
    previewUrl: "/prefill-videos/002-xianxia-establishing.mp4",
    durationMs: 12000,
    author: demoAuthors.rina,
    stats: {
      playCount: 34120,
      likeCount: 2480,
      favoriteCount: 1016
    },
    relatedIds: ["prompt-preview-bamboo", "prompt-preview-forest"]
  },
  {
    id: "prompt-preview-mecha",
    title: "机甲城市穿梭镜头",
    summary: "硬表面材质和大场景运动写法稳定，适合科幻和机甲方向。",
    tags: ["机甲", "城市", "未来感", "运动镜头"],
    coverUrl: "/nano-banana-images/000018-13331/01.jpg",
    previewUrl: "/prefill-videos/011-mecha-city.mp4",
    durationMs: 12000,
    author: demoAuthors.studio,
    stats: {
      playCount: 30780,
      likeCount: 1986,
      favoriteCount: 778
    },
    relatedIds: ["prompt-preview-cyber", "prompt-preview-warehouse"]
  },
  {
    id: "prompt-preview-moves",
    title: "动作招式展示排练",
    summary: "适合做连续动作拆解，镜头短，方便改成测试模板。",
    tags: ["动作设计", "招式展示", "短镜头", "模板"],
    coverUrl: "/nano-banana-images/000024-13314/01.jpg",
    previewUrl: "/prefill-videos/012-moves-showcase.mp4",
    durationMs: 53000,
    author: demoAuthors.rina,
    stats: {
      playCount: 21540,
      likeCount: 1390,
      favoriteCount: 592
    },
    relatedIds: ["prompt-preview-stage", "prompt-preview-warehouse"]
  },
  {
    id: "prompt-preview-forest",
    title: "林间轻功绕拍开场",
    summary: "人物和环境关系干净，适合做仙侠、古风和轻功转场内容。",
    tags: ["古风", "林间", "绕拍", "轻功"],
    coverUrl: "/nano-banana-images/000026-13317/01.jpg",
    previewUrl: "/prefill-videos/004-xianxia-forest-a.mp4",
    durationMs: 12000,
    author: demoAuthors.studio,
    stats: {
      playCount: 22760,
      likeCount: 1482,
      favoriteCount: 605
    },
    relatedIds: ["prompt-preview-xianxia", "prompt-preview-bamboo"]
  }
];

const promptPreviewMap = new Map(promptPreviewDefinitions.map((item) => [item.id, item]));

export const promptPreviewVideoId = promptPreviewDefinitions[0].id;

export const promptPreviewHomeCard = {
  id: promptPreviewDefinitions[0].id,
  title: promptPreviewDefinitions[0].title,
  summary: promptPreviewDefinitions[0].summary,
  href: `/videos/${promptPreviewDefinitions[0].id}`,
  author: promptPreviewDefinitions[0].author,
  coverUrl: promptPreviewDefinitions[0].coverUrl,
  primaryMetric: promptPreviewDefinitions[0].stats.likeCount,
  secondaryMetric: promptPreviewDefinitions[0].stats.playCount
} as const;

export function isPromptPreviewVideo(id: string): boolean {
  return promptPreviewMap.has(id);
}

export function getPromptPreviewHomeCards() {
  return promptPreviewDefinitions.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    href: `/videos/${item.id}`,
    author: item.author,
    coverUrl: item.coverUrl,
    primaryMetric: item.stats.likeCount,
    secondaryMetric: item.stats.playCount
  }));
}

function buildPromptComments(definition: PromptPreviewDefinition): VideoDetailPageView["comments"] {
  return [
    {
      id: `${definition.id}-comment-1`,
      authorName: "镜头拆解员",
      content: `${definition.title} 这种节奏适合放在开头，镜头运动写得比较稳。`,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likeCount: 26,
      replyCount: 0,
      viewerLiked: false
    },
    {
      id: `${definition.id}-comment-2`,
      authorName: "PromptScout",
      content: "标签和情绪词配比克制，复制之后继续往下细化也很方便。",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      likeCount: 18,
      replyCount: 0,
      viewerLiked: false
    },
    {
      id: `${definition.id}-comment-3`,
      authorName: "MotionFrame",
      content: "这种写法适合直接做短视频模板，尤其适合做封面级镜头。",
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      likeCount: 13,
      replyCount: 0,
      viewerLiked: false
    }
  ];
}

function buildRelatedVideoCard(id: string) {
  const definition = promptPreviewMap.get(id);
  if (!definition) {
    return null;
  }

  return {
    id: definition.id,
    title: definition.title,
    coverUrl: definition.coverUrl ?? "",
    author: definition.author
  };
}

export function buildPromptPreviewVideoDetailView(id: string = promptPreviewVideoId): VideoDetailPageView {
  const definition = promptPreviewMap.get(id);

  if (!definition) {
    throw new Error(`Unknown prompt preview video: ${id}`);
  }

  const comments = buildPromptComments(definition);
  const relatedVideos = definition.relatedIds
    .map((item) => buildRelatedVideoCard(item))
    .filter((item): item is NonNullable<ReturnType<typeof buildRelatedVideoCard>> => Boolean(item));

  return {
    id: definition.id,
    title: definition.title,
    summary: definition.summary,
    tags: definition.tags,
    media: {
      coverUrl: definition.coverUrl,
      previewUrl: definition.previewUrl,
      sourceUrl: definition.previewUrl,
      durationMs: definition.durationMs
    },
    author: {
      id: definition.author.id,
      displayName: definition.author.displayName,
      avatarUrl: definition.author.avatarUrl,
      followed: false
    },
    stats: {
      playCount: definition.stats.playCount,
      likeCount: definition.stats.likeCount,
      favoriteCount: definition.stats.favoriteCount,
      commentCount: comments.length
    },
    viewerActions: {
      liked: false,
      favorited: false
    },
    relatedVideos,
    comments
  };
}
