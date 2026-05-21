import type { WorkflowDetailPageView } from "@/lib/contracts/view-models";

type DemoAuthor = {
  id: string;
  displayName: string;
  avatarUrl?: string;
};

export type WorkflowPreviewDefinition = {
  id: string;
  title: string;
  summary: string;
  scenarioText: string;
  tagNames: string[];
  author: DemoAuthor;
  allowCopy: boolean;
  openUrl?: string;
  stats: {
    likeCount: number;
    favoriteCount: number;
    videoBindCount: number;
  };
  relatedVideos: Array<{
    id: string;
    title: string;
    coverUrl?: string;
    author: DemoAuthor;
  }>;
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

export const workflowPreviewDefinitions: WorkflowPreviewDefinition[] = [
  {
    id: "workflow-preview-cinematic-action",
    title: "动作镜头标准工作流",
    summary: "适合动作节奏、角色站位和镜头推进的工作流示例。",
    scenarioText: "适合需要把结果页和方法页串起来展示的动作类社区资源。",
    tagNames: ["动作", "镜头设计", "节奏控制", "工作流"],
    author: demoAuthors.rina,
    allowCopy: true,
    openUrl: "/canvas/runtime-demo-action",
    stats: {
      likeCount: 1340,
      favoriteCount: 520,
      videoBindCount: 18
    },
    relatedVideos: [
      {
        id: "prompt-preview-warehouse",
        title: "仓库动作追逐镜头预览",
        coverUrl: "/nano-banana-images/000014-13327/01.jpg",
        author: demoAuthors.studio
      },
      {
        id: "prompt-preview-bamboo",
        title: "竹林双人打斗镜头预览",
        coverUrl: "/nano-banana-images/000011-13330/01.jpg",
        author: demoAuthors.rina
      }
    ]
  },
  {
    id: "workflow-preview-cyber-brand",
    title: "赛博品牌感工作流",
    summary: "用于未来氛围、城市夜景和品牌镜头的工作流示例。",
    scenarioText: "适合赛博城市、夜景人物和视觉品牌类内容。",
    tagNames: ["赛博", "品牌感", "城市夜景", "工作流"],
    author: demoAuthors.studio,
    allowCopy: true,
    openUrl: "/canvas/runtime-demo-cyber",
    stats: {
      likeCount: 1580,
      favoriteCount: 680,
      videoBindCount: 25
    },
    relatedVideos: [
      {
        id: "prompt-preview-cyber",
        title: "赛博城市霓虹人物镜头预览",
        coverUrl: "/nano-banana-images/000028-13310/01.jpg",
        author: demoAuthors.studio
      },
      {
        id: "prompt-preview-mecha",
        title: "机甲城市战斗镜头预览",
        coverUrl: "/nano-banana-images/000018-13331/01.jpg",
        author: demoAuthors.studio
      }
    ]
  },
  {
    id: "workflow-preview-stage-loop",
    title: "舞台表演循环工作流",
    summary: "用于舞台表演、角色亮相和节奏镜头的工作流示例。",
    scenarioText: "适合舞台、角色展示和聚光灯场景。",
    tagNames: ["舞台", "角色表演", "聚光灯", "工作流"],
    author: demoAuthors.rina,
    allowCopy: false,
    stats: {
      likeCount: 1180,
      favoriteCount: 462,
      videoBindCount: 13
    },
    relatedVideos: [
      {
        id: "prompt-preview-stage",
        title: "舞台角色表演镜头预览",
        coverUrl: "/nano-banana-images/000013-13329/01.jpg",
        author: demoAuthors.rina
      },
      {
        id: "prompt-preview-moves",
        title: "动作招式拆解镜头预览",
        coverUrl: "/nano-banana-images/000024-13314/01.jpg",
        author: demoAuthors.rina
      }
    ]
  },
  {
    id: "workflow-preview-xianxia-atmosphere",
    title: "仙侠氛围工作流",
    summary: "适合环境氛围、人物气质和空间层次的工作流示例。",
    scenarioText: "适合仙侠、环境镜头和情绪铺垫场景。",
    tagNames: ["仙侠", "氛围", "环境层次", "工作流"],
    author: demoAuthors.rina,
    allowCopy: true,
    openUrl: "/canvas/runtime-demo-xianxia",
    stats: {
      likeCount: 1720,
      favoriteCount: 744,
      videoBindCount: 29
    },
    relatedVideos: [
      {
        id: "prompt-preview-xianxia",
        title: "仙侠氛围镜头预览",
        coverUrl: "/nano-banana-images/000020-13326/01.jpg",
        author: demoAuthors.rina
      },
      {
        id: "prompt-preview-forest",
        title: "林地氛围场景镜头预览",
        coverUrl: "/nano-banana-images/000026-13317/01.jpg",
        author: demoAuthors.studio
      }
    ]
  }
];

const workflowPreviewMap = new Map(workflowPreviewDefinitions.map((item) => [item.id, item]));

export function isWorkflowPreview(id: string): boolean {
  return workflowPreviewMap.has(id);
}

export function getWorkflowPreviewCards() {
  return workflowPreviewDefinitions.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    href: `/workflows/${item.id}`,
    author: item.author,
    coverUrl: item.relatedVideos[0]?.coverUrl,
    primaryMetric: item.stats.likeCount,
    secondaryMetric: item.stats.videoBindCount
  }));
}

function buildWorkflowComments(definition: WorkflowPreviewDefinition): WorkflowDetailPageView["comments"] {
  return {
    items: [
      {
        id: `${definition.id}-comment-1`,
        authorId: `${definition.id}-comment-author-1`,
        authorName: "节点整理员",
        content: `${definition.title} 这种版式适合做标准工作流详情页，右侧动作区清晰很多。`,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        likeCount: 19,
        replyCount: 0,
        viewerLiked: false,
        viewerCanDelete: false,
        replies: []
      },
      {
        id: `${definition.id}-comment-2`,
        authorId: `${definition.id}-comment-author-2`,
        authorName: "WorkflowLab",
        content: "如果后续接画布，直接把查看工作流和复制动作挂在这一区就够用了。",
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        likeCount: 14,
        replyCount: 0,
        viewerLiked: false,
        viewerCanDelete: false,
        replies: []
      }
    ],
    hasMore: false
  };
}

export function buildWorkflowPreviewDetailView(id: string): WorkflowDetailPageView {
  const definition = workflowPreviewMap.get(id);

  if (!definition) {
    throw new Error(`Unknown workflow preview: ${id}`);
  }

  const comments = buildWorkflowComments(definition);

  return {
    id: definition.id,
    title: definition.title,
    summary: definition.summary,
    scenarioText: definition.scenarioText,
    isReadonlyPreview: true,
    tagNames: definition.tagNames,
    author: definition.author,
    permissions: {
      allowCopy: definition.allowCopy,
      allowFork: definition.allowCopy
    },
    commentPolicy: {
      commentingEnabled: false,
      canManageComments: false
    },
    canvasBinding: definition.openUrl
      ? {
          bindingType: "internal",
          openUrl: definition.openUrl,
          canCopy: definition.allowCopy
        }
      : undefined,
    stats: {
      likeCount: definition.stats.likeCount,
      favoriteCount: definition.stats.favoriteCount,
      commentCount: comments.items.length,
      videoBindCount: definition.stats.videoBindCount
    },
    relatedVideos: definition.relatedVideos.map((video) => ({
      id: video.id,
      title: video.title,
      coverUrl: video.coverUrl ?? "",
      author: video.author
    })),
    viewerActions: {
      liked: false,
      favorited: false
    },
    comments
  };
}
