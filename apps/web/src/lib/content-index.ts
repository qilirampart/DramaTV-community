import type { HomeFeedCardView } from "@/lib/contracts/view-models";
import { formatContentKindBadge, normalizeAssetUrl, normalizeText } from "@/lib/presentation";

export type IndexedContentCard = {
  id: string;
  title: string;
  href: string;
  summary?: string;
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  contentKind: "prompt" | "workflow_work" | "post";
  promptModality?: "image" | "video";
  itemType: "video" | "workflow" | "prompt" | "post";
  badge: string;
  primaryMetric: number;
  secondaryMetric: number;
  workflowTitle?: string;
};

export function toIndexedContentCards(items: HomeFeedCardView[]): IndexedContentCard[] {
  return items.map((item) => {
    const href =
      item.itemType === "post"
        ? "/discussions"
        : item.itemType === "prompt"
          ? `/prompts/${item.targetId}`
          : item.itemType === "workflow"
            ? `/workflows/${item.targetId}`
            : `/videos/${item.targetId}`;

    return {
      id: item.targetId,
      title: normalizeText(item.title) ?? "未命名内容",
      href,
      summary: normalizeText(item.summary),
      coverUrl: normalizeAssetUrl(item.coverUrl),
      posterUrl: normalizeAssetUrl(item.posterUrl),
      previewUrl: normalizeAssetUrl(item.previewUrl),
      sourceUrl: normalizeAssetUrl(item.sourceUrl),
      author: {
        id: item.author.id,
        displayName: normalizeText(item.author.displayName) ?? "DramaTV Creator",
        avatarUrl: normalizeAssetUrl(item.author.avatarUrl)
      },
      contentKind: item.contentKind,
      promptModality: item.promptModality,
      itemType: item.itemType,
      badge: formatContentKindBadge(item.contentKind),
      primaryMetric: item.stats?.playCount ?? item.stats?.likeCount ?? 0,
      secondaryMetric: item.stats?.likeCount ?? 0,
      workflowTitle: normalizeText(item.workflow?.title)
    };
  });
}

export function toResourceBadge(
  contentKind: "prompt" | "workflow_work" | "post"
): string {
  switch (contentKind) {
    case "prompt":
      return "提示词";
    case "post":
      return "帖子";
    case "workflow_work":
    default:
      return "工作流";
  }
}
