import type { FeedOpsPageData } from "./feed-ops-types";

export type FeedOpsPageKind = "home" | "featured" | "discussions";

type FeedOpsItem = FeedOpsPageData["candidatePool"][number];

export function buildFallbackFeedOpsPageData(page: FeedOpsPageKind): FeedOpsPageData {
  const commonSummary = {
    pageKey: page,
    statusCode: "unavailable",
    updatedAt: null,
    updatedByDisplayName: null,
    publishedAt: null,
    configuredItemCount: 0,
    candidateItemCount: 0
  } as const;

  if (page === "home") {
    return {
      summary: commonSummary,
      slots: [
        { key: "home-hero", title: "首页轮播", description: "对应 /home 首屏 3 个滚动视频位，只允许挂载 prompt / workflow。", maxItems: 3, allowedTargetTypes: ["prompt", "workflow"], items: [] },
        { key: "recommended-primary", title: "为你推荐（第一组）", description: "对应首页第一组“为你推荐”4 卡内容，只允许挂载 prompt / workflow。", maxItems: 4, allowedTargetTypes: ["prompt", "workflow"], items: [] },
        { key: "recommended-secondary", title: "为你推荐（第二组）", description: "对应首页第二组“为你推荐”4 卡内容，只允许挂载 prompt / workflow。", maxItems: 4, allowedTargetTypes: ["prompt", "workflow"], items: [] },
        { key: "canvas", title: "精选画布", description: "对应首页“精选画布”分区 4 卡内容，只允许挂载 prompt / workflow。", maxItems: 4, allowedTargetTypes: ["prompt", "workflow"], items: [] },
        { key: "commercial", title: "电视广告", description: "对应首页“电视广告”分区 4 卡内容，只允许挂载 prompt / workflow。", maxItems: 4, allowedTargetTypes: ["prompt", "workflow"], items: [] },
        { key: "animation", title: "动画", description: "对应首页“动画”分区 4 卡内容，只允许挂载 prompt / workflow。", maxItems: 4, allowedTargetTypes: ["prompt", "workflow"], items: [] },
        { key: "narrative", title: "叙事短片", description: "对应首页“叙事短片”分区 4 卡内容，只允许挂载 prompt / workflow。", maxItems: 4, allowedTargetTypes: ["prompt", "workflow"], items: [] },
        { key: "mv", title: "MV", description: "对应首页“MV”分区 4 卡内容，只允许挂载 prompt / workflow。", maxItems: 4, allowedTargetTypes: ["prompt", "workflow"], items: [] },
        { key: "creative", title: "创意", description: "对应首页“创意”分区 4 卡内容，只允许挂载 prompt / workflow。", maxItems: 4, allowedTargetTypes: ["prompt", "workflow"], items: [] }
      ],
      candidatePool: []
    };
  }

  if (page === "featured") {
    return {
      summary: commonSummary,
      slots: [
        { key: "featured-all", title: "全部首屏", description: "对应 /featured 默认“全部”tab 首屏不滚动可见的前 12 条内容，可混排 prompt / workflow / post。", maxItems: 12, allowedTargetTypes: ["prompt", "workflow", "post"], items: [] },
        { key: "featured-workflow", title: "工作流 tab", description: "对应精选页“工作流”tab 首屏不滚动可见的前 12 条内容，只允许挂载 workflow。", maxItems: 12, allowedTargetTypes: ["workflow"], items: [] },
        { key: "featured-video-prompt", title: "视频提示词 tab", description: "对应精选页“视频提示词”tab 首屏不滚动可见的前 12 条内容，只允许挂载 prompt。", maxItems: 12, allowedTargetTypes: ["prompt"], items: [] },
        { key: "featured-image-prompt", title: "图片提示词 tab", description: "对应精选页“图片提示词”tab 首屏不滚动可见的前 12 条内容，只允许挂载 prompt。", maxItems: 12, allowedTargetTypes: ["prompt"], items: [] },
        { key: "featured-activity", title: "活动 tab", description: "对应精选页“活动”tab 首屏内容，当前先按活动 / 帖子预留位管理，只允许挂载 post。", maxItems: 12, allowedTargetTypes: ["post"], items: [] }
      ],
      candidatePool: []
    };
  }

  return {
    summary: commonSummary,
    slots: [
      { key: "discussion-channel-order", title: "话题栏目顺序", description: "对应讨论区左侧话题栏目导航，显式控制频道展示顺序。", maxItems: 8, allowedTargetTypes: ["channel"], items: [] },
      { key: "discussion-all-thread-stream", title: "全部帖子顺序", description: "对应“全部”视图前 8 条帖子顺序；未配置满时继续按系统排序补齐。", maxItems: 8, allowedTargetTypes: ["post"], items: [] },
      { key: "discussion-channel-prompt-lab-thread-stream", title: "提示词拆解帖子顺序", description: "对应“提示词拆解”栏目进入后的前 8 条帖子顺序；后台配置优先于系统排序。", maxItems: 8, allowedTargetTypes: ["post"], items: [] },
      { key: "discussion-channel-video-production-thread-stream", title: "视频制作经验帖子顺序", description: "对应“视频制作经验”栏目进入后的前 8 条帖子顺序；后台配置优先于系统排序。", maxItems: 8, allowedTargetTypes: ["post"], items: [] },
      { key: "discussion-channel-canvas-workflows-thread-stream", title: "画布工作流经验帖子顺序", description: "对应“画布工作流经验”栏目进入后的前 8 条帖子顺序；后台配置优先于系统排序。", maxItems: 8, allowedTargetTypes: ["post"], items: [] },
      { key: "discussion-channel-official-events-thread-stream", title: "官方活动帖子顺序", description: "对应“官方活动”栏目进入后的前 8 条帖子顺序；后台配置优先于系统排序。", maxItems: 8, allowedTargetTypes: ["post"], items: [] },
      { key: "discussion-channel-casual-lounge-thread-stream", title: "闲聊茶水间帖子顺序", description: "对应“闲聊茶水间”栏目进入后的前 8 条帖子顺序；后台配置优先于系统排序。", maxItems: 8, allowedTargetTypes: ["post"], items: [] }
    ],
    candidatePool: []
  };
}

export function feedOpsPageTitle(page: FeedOpsPageKind) {
  if (page === "home") {
    return "首页运营";
  }
  if (page === "featured") {
    return "精选运营";
  }
  return "讨论运营";
}

export function feedOpsPageSubtitle(page: FeedOpsPageKind) {
  if (page === "home") {
    return "管理 /home 首屏 3 个轮播位和 8 个内容分区，对应真实首页首屏可见结构。";
  }
  if (page === "featured") {
    return "管理 /featured 默认“全部”首屏 12 条，以及工作流 / 视频提示词 / 图片提示词 / 活动 4 个分类 tab 的首屏内容。";
  }
  return "管理 /discussions 左侧话题栏目顺序，以及“全部”和各话题栏目各自前 8 条帖子的优先展示顺序。";
}

export function feedOpsModeDetail(page: FeedOpsPageKind) {
  if (page === "home") {
    return "首页工作区已按真实页面收口到 3 个轮播位 + 8 个内容分区；当前只管理内容挂载，不管理“进入无限画布”这类固定入口。";
  }
  if (page === "featured") {
    return "精选页工作区只管理各个 tab 首屏不滚动可见的内容；搜索、排序、模型筛选和内容筛选继续按前台实时逻辑生效，不在这里单独配置。";
  }
  return "讨论区工作区管理左侧栏目顺序，以及“全部”和各话题栏目各自的帖子优先顺序；未配置内容时回落系统排序，右侧热门话题、活跃贡献者和顶部发起讨论入口继续由真实页面数据自动派生。";
}

export function fallbackModeDetail(page: FeedOpsPageKind) {
  if (page === "home") {
    return "首页运营配置读取失败，当前先保留首页结构骨架。";
  }
  if (page === "featured") {
    return "精选运营配置读取失败，当前先保留精选页首屏与分类骨架。";
  }
  return "讨论运营配置读取失败，当前先保留讨论区结构骨架。";
}

export function feedOpsWorkspaceNote(page: FeedOpsPageKind) {
  if (page === "home") {
    return "首页工作区只覆盖首屏轮播和 8 个内容分区，固定文案和画布入口不在挂载范围内。";
  }
  if (page === "featured") {
    return "精选页工作区只覆盖各 tab 首屏内容，搜索 / 排序 / 模型筛选 / 内容筛选仍按前台实时规则生效。";
  }
  return "讨论区工作区覆盖左侧栏目顺序，以及“全部”和每个话题栏目前 8 条帖子顺序；右侧派生信息与顶部发帖入口不在手动挂载范围。";
}

export function feedOpsTabItems(current: FeedOpsPageKind) {
  return [
    { key: "home", label: "首页", href: "/feed-ops/home", active: current === "home" },
    { key: "featured", label: "精选页", href: "/feed-ops/featured", active: current === "featured" },
    { key: "discussions", label: "讨论区", href: "/feed-ops/discussions", active: current === "discussions" }
  ] as const;
}

export function contentMetaText(item: Pick<FeedOpsItem, "itemTypeLabel" | "authorDisplayName" | "channelTitle">) {
  if (item.channelTitle) {
    return `${item.itemTypeLabel} · ${item.authorDisplayName} · ${item.channelTitle}`;
  }
  return `${item.itemTypeLabel} · ${item.authorDisplayName}`;
}

export function trimSummaryText(summaryText?: string | null) {
  const value = summaryText?.trim();
  return value && value.length > 0 ? value : null;
}
