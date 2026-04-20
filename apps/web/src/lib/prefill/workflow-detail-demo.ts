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
    title: "动作类镜头统一出片工作流",
    summary: "把角色镜头、动作节奏、封面帧和关联讨论都收进一套详情页展示里。",
    scenarioText: "适合动作、打斗、追击和速度感比较强的视频模板。",
    tagNames: ["动作", "镜头设计", "批量复用", "社区展示"],
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
        title: "仓库追击打斗切换",
        coverUrl: "/nano-banana-images/000014-13327/01.jpg",
        author: demoAuthors.studio
      },
      {
        id: "prompt-preview-bamboo",
        title: "月下竹林双人对决",
        coverUrl: "/nano-banana-images/000011-13330/01.jpg",
        author: demoAuthors.rina
      }
    ]
  },
  {
    id: "workflow-preview-cyber-brand",
    title: "赛博品牌短片拼装工作流",
    summary: "统一处理首页卡片、详情页视频、右侧操作区和推荐内容的排版逻辑。",
    scenarioText: "适合赛博都市、品牌概念片和科技氛围视频。",
    tagNames: ["赛博", "品牌", "短片", "统一模板"],
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
        title: "雨夜赛博街区冲镜",
        coverUrl: "/nano-banana-images/000028-13310/01.jpg",
        author: demoAuthors.studio
      },
      {
        id: "prompt-preview-mecha",
        title: "机甲城市穿梭镜头",
        coverUrl: "/nano-banana-images/000018-13331/01.jpg",
        author: demoAuthors.studio
      }
    ]
  },
  {
    id: "workflow-preview-stage-loop",
    title: "角色舞台循环镜头工作流",
    summary: "控制机位、角色动作和评论区相关内容的统一表达，适合角色展示类内容。",
    scenarioText: "适合舞台、人物展示、演出片段和偶像感镜头。",
    tagNames: ["舞台", "角色", "灯光", "循环"],
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
        title: "二次元舞台灯光循环",
        coverUrl: "/nano-banana-images/000013-13329/01.jpg",
        author: demoAuthors.rina
      },
      {
        id: "prompt-preview-moves",
        title: "动作招式展示排练",
        coverUrl: "/nano-banana-images/000024-13314/01.jpg",
        author: demoAuthors.rina
      }
    ]
  },
  {
    id: "workflow-preview-xianxia-atmosphere",
    title: "仙侠世界观建立镜头工作流",
    summary: "强化大远景、人物出场和推荐内容的一致节奏，适合作为首页头图区内容。",
    scenarioText: "适合仙侠、古风、世界观建立和开篇镜头。",
    tagNames: ["仙侠", "远景", "世界观", "开篇"],
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
        title: "云海仙侠建立镜头",
        coverUrl: "/nano-banana-images/000020-13326/01.jpg",
        author: demoAuthors.rina
      },
      {
        id: "prompt-preview-forest",
        title: "林间轻功绕拍开场",
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
  return [
    {
      id: `${definition.id}-comment-1`,
      authorName: "节点整理员",
      content: `${definition.title} 这种版式适合作为标准工作流详情页，右侧动作区清楚很多。`,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      likeCount: 19,
      replyCount: 0,
      viewerLiked: false
    },
    {
      id: `${definition.id}-comment-2`,
      authorName: "WorkflowLab",
      content: "如果后续接画布，直接把查看工作流和复制动作挂在这一区就够用了。",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      likeCount: 14,
      replyCount: 0,
      viewerLiked: false
    }
  ];
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
      commentCount: comments.length,
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
