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
    title: "竹林双人打斗镜头预览",
    summary: "强调人物关系、镜头推进和近景质感的动作类视频提示词预览。",
    tags: ["武侠", "双人打斗", "竹林", "动作调度"],
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
    title: "赛博城市霓虹人物镜头预览",
    summary: "偏品牌感和未来氛围的城市夜景提示词预览。",
    tags: ["赛博", "城市夜景", "霓虹", "品牌感"],
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
    title: "舞台角色表演镜头预览",
    summary: "适合舞台灯光、角色站位和气氛控制的表演类提示词预览。",
    tags: ["舞台", "角色表演", "聚光灯", "节奏"],
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
    title: "仓库动作追逐镜头预览",
    summary: "偏动作设计和空间调度的工业仓库题材提示词预览。",
    tags: ["动作", "仓库", "工业空间", "追逐"],
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
    title: "仙侠氛围镜头预览",
    summary: "强调环境气氛、人物气质和空间层次的仙侠类视频提示词预览。",
    tags: ["仙侠", "氛围", "环境层次", "人物关系"],
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
    title: "机甲城市战斗镜头预览",
    summary: "偏大场景与机械感构图的赛博机甲题材预览。",
    tags: ["机甲", "赛博", "城市", "战斗"],
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
    title: "动作招式拆解镜头预览",
    summary: "强调动作分解、节奏和段落结构的镜头示例。",
    tags: ["动作设计", "招式拆解", "节奏", "段落"],
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
    title: "林地氛围场景镜头预览",
    summary: "适合自然环境、气氛镜头和角色情绪铺垫的场景类预览。",
    tags: ["场景", "森林", "氛围", "情绪"],
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
  return {
    items: [
      {
        id: `${definition.id}-comment-1`,
        authorId: `${definition.id}-comment-author-1`,
        authorName: "镜头拆解员",
        content: `${definition.title} 这种节奏适合放在开头，镜头运动写得比较稳。`,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likeCount: 26,
        replyCount: 0,
        viewerLiked: false,
        viewerCanDelete: false,
        replies: []
      },
      {
        id: `${definition.id}-comment-2`,
        authorId: `${definition.id}-comment-author-2`,
        authorName: "PromptScout",
        content: "标签和情绪词配比克制，复制之后继续往下细化也很方便。",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        likeCount: 18,
        replyCount: 0,
        viewerLiked: false,
        viewerCanDelete: false,
        replies: []
      },
      {
        id: `${definition.id}-comment-3`,
        authorId: `${definition.id}-comment-author-3`,
        authorName: "MotionFrame",
        content: "这种写法适合直接做短视频模板，尤其适合做封面级镜头。",
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        likeCount: 13,
        replyCount: 0,
        viewerLiked: false,
        viewerCanDelete: false,
        replies: []
      }
    ],
    hasMore: false
  };
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
      commentCount: comments.items.length
    },
    commentPolicy: {
      commentingEnabled: false,
      canManageComments: false
    },
    viewerActions: {
      liked: false,
      favorited: false
    },
    relatedVideos,
    comments
  };
}
