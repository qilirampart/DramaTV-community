import type { CreatorMiniCardView, DiscussionThreadCardView, HomePageView } from "@/lib/contracts/view-models";
import { getPromptPreviewHomeCards, promptPreviewDefinitions } from "@/lib/prefill/prompt-detail-demo";
import { getWorkflowPreviewCards, workflowPreviewDefinitions } from "@/lib/prefill/workflow-detail-demo";

export type HomeDemoResourceType = "prompt" | "workflow";

export type HomeDemoCard = {
  id: string;
  title: string;
  summary: string;
  href: string;
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  promptModality?: "image" | "video";
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  resourceType: HomeDemoResourceType;
  primaryMetric: number;
  secondaryMetric: number;
};

export type HomeHeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  imageUrl?: string;
  videoUrl?: string;
  resourceType: HomeDemoResourceType;
};

export type HomeLaunchCard = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type HomeDemoCatalog = {
  heroSlides: HomeHeroSlide[];
  filmstrip: HomeDemoCard[];
  promptSection: HomeDemoCard[];
  workflowSection: HomeDemoCard[];
  freshSection: HomeDemoCard[];
  trendingSection: HomeDemoCard[];
  creators: CreatorMiniCardView[];
  launches: HomeLaunchCard[];
};

function toPromptCards(): HomeDemoCard[] {
  return getPromptPreviewHomeCards().map((item) => ({
    ...item,
    resourceType: "prompt"
  }));
}

function toWorkflowCards(): HomeDemoCard[] {
  return getWorkflowPreviewCards().map((item) => ({
    ...item,
    resourceType: "workflow"
  }));
}

function buildCreators(): CreatorMiniCardView[] {
  return [
    {
      id: "11111111-1111-1111-1111-111111111111",
      displayName: "Rina Flux",
      headline: "动作和仙侠方向的镜头设计作者"
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      displayName: "Follow Studio",
      headline: "赛博与品牌片方向的工作流整理者"
    },
    {
      id: "creator-demo-03",
      displayName: "Kite Frame",
      headline: "人物和舞台内容的循环镜头作者"
    },
    {
      id: "creator-demo-04",
      displayName: "North Lens",
      headline: "负责首页头图与长页面封面节奏"
    }
  ];
}

function buildLaunchCards(): HomeLaunchCard[] {
  return [
    {
      id: "launch-publish",
      title: "发布你的作品",
      description: "上传视频、绑定工作流或提示词，直接进入社区分发。",
      href: "/publish"
    },
    {
      id: "launch-featured",
      title: "进入精选页",
      description: "继续看统一风格的提示词和工作流资源卡片。",
      href: "/featured"
    },
    {
      id: "launch-discussion",
      title: "进入讨论区",
      description: "围绕提示词写法、工作流结构和作品节奏展开讨论。",
      href: "/discussions"
    },
    {
      id: "launch-profile",
      title: "查看个人主页",
      description: "统一用作者流浏览自己发布和收藏过的内容。",
      href: "/me"
    }
  ];
}

const promptCards = toPromptCards();
const workflowCards = toWorkflowCards();

export const homeDemoCatalog: HomeDemoCatalog = {
  heroSlides: [
    {
      id: "hero-xianxia",
      title: "首页先做内容感，再做工具感",
      subtitle: "精选长首页",
      description: "头图、分区、推荐和发布入口都统一成社区首页节奏，不再像筛选墙。",
      href: `/videos/${promptPreviewDefinitions[4].id}`,
      imageUrl: promptPreviewDefinitions[4].coverUrl,
      videoUrl: promptPreviewDefinitions[4].previewUrl,
      resourceType: "prompt"
    },
    {
      id: "hero-workflow",
      title: "工作流和提示词只保留两种资源类型",
      subtitle: "类型统一",
      description: "首页角标、点击去向和详情页动作全部以 WORKFLOW / PROMPT 两种资源为准。",
      href: `/workflows/${workflowPreviewDefinitions[1].id}`,
      imageUrl: workflowPreviewDefinitions[1].relatedVideos[0]?.coverUrl,
      videoUrl: promptPreviewDefinitions[1].previewUrl,
      resourceType: "workflow"
    },
    {
      id: "hero-publish",
      title: "发布入口继续保留在首页视野里",
      subtitle: "社区闭环",
      description: "首页长内容流里保留发布和进入讨论区的入口，继续围绕社区闭环做。",
      href: "/publish",
      imageUrl: promptPreviewDefinitions[1].coverUrl,
      videoUrl: promptPreviewDefinitions[2].previewUrl,
      resourceType: "prompt"
    }
  ],
  filmstrip: [promptCards[0], workflowCards[0], promptCards[1], workflowCards[1]],
  promptSection: promptCards,
  workflowSection: workflowCards,
  freshSection: [promptCards[2], promptCards[3], promptCards[5], workflowCards[2], promptCards[7], workflowCards[3]],
  trendingSection: [workflowCards[1], promptCards[4], promptCards[6], workflowCards[0], promptCards[0], promptCards[1]],
  creators: buildCreators(),
  launches: buildLaunchCards()
};

export function mergeHomePageWithDemo(view: HomePageView): HomePageView {
  const discussionHighlights: DiscussionThreadCardView[] =
    view.discussionHighlights.length > 0
      ? view.discussionHighlights
      : [
          {
            id: "discussion-demo-01",
            slug: "prompt-structure-demo",
            href: "/discussions",
            title: "提示词和工作流在首页怎么分层展示",
            excerpt: "把资源类型收敛到两种之后，首页卡片和详情页动作的映射会稳定很多。",
            channelTitle: "首页复刻讨论",
            author: {
              id: "11111111-1111-1111-1111-111111111111",
              displayName: "Rina Flux",
              href: "/creators/11111111-1111-1111-1111-111111111111"
            },
            publishedAtLabel: "今天更新",
            lastActivityLabel: "今天更新",
            likeCount: 26,
            likeCountLabel: "26 likes",
            favoriteCount: 11,
            favoriteCountLabel: "11 favorites",
            replyCountLabel: "8 replies",
            viewerLiked: false,
            viewerFavorited: false,
            tags: ["首页", "提示词", "工作流"]
          },
          {
            id: "discussion-demo-02",
            slug: "detail-layout-demo",
            href: "/discussions",
            title: "详情页右侧动作区统一之后，推荐区和评论区怎么对齐",
            excerpt: "工作流详情和提示词详情都遵循同一套骨架，只替换右侧动作内容。",
            channelTitle: "详情页复刻讨论",
            author: {
              id: "33333333-3333-3333-3333-333333333333",
              displayName: "Follow Studio",
              href: "/creators/33333333-3333-3333-3333-333333333333"
            },
            publishedAtLabel: "2 小时前",
            lastActivityLabel: "2 小时前",
            likeCount: 19,
            likeCountLabel: "19 likes",
            favoriteCount: 7,
            favoriteCountLabel: "7 favorites",
            replyCountLabel: "5 replies",
            viewerLiked: false,
            viewerFavorited: false,
            tags: ["详情页", "排版", "对齐"]
          }
        ];

  return {
    ...view,
    featuredCreators: view.featuredCreators.length > 0 ? view.featuredCreators : homeDemoCatalog.creators,
    discussionHighlights
  };
}
