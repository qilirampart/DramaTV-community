export type PrefillVideoAsset = {
  id: string;
  title: string;
  theme: string;
  src: string;
  coverUrl?: string;
  posterUrl?: string;
  durationLabel: string;
  useCase: string;
  keywords: string[];
};

type PrefillVideoTextCandidate = {
  title?: string | null;
  summary?: string | null;
  tags?: string[] | null;
};

type PrefillVideoMediaCandidate = PrefillVideoTextCandidate & {
  coverUrl?: string | null;
  posterUrl?: string | null;
  previewUrl?: string | null;
  sourceUrl?: string | null;
};

type PrefillVideoMediaFallback = {
  coverUrl?: string;
  posterUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
};

const prefillVideos: PrefillVideoAsset[] = [
  {
    id: "prefill-video-001",
    title: "破月冷光下的武侠样片",
    theme: "武侠月光",
    src: "/prefill-videos/001-wuxia-moonlight.mp4",
    coverUrl: "/nano-banana-images/000011-13330/01.jpg",
    posterUrl: "/nano-banana-images/000011-13330/01.jpg",
    durationLabel: "12s",
    useCase: "首页精选武侠样片",
    keywords: ["武侠", "江湖", "月光", "冷光", "刀", "竹林"]
  },
  {
    id: "prefill-video-002",
    title: "仙侠建立镜头样片",
    theme: "仙侠建立镜头",
    src: "/prefill-videos/002-xianxia-establishing.mp4",
    coverUrl: "/nano-banana-images/000020-13326/01.jpg",
    posterUrl: "/nano-banana-images/000020-13326/01.jpg",
    durationLabel: "12s",
    useCase: "视频详情页或首页建立镜头占位",
    keywords: ["仙侠", "国漫", "玄幻", "建立镜头", "云海"]
  },
  {
    id: "prefill-video-003",
    title: "符光傀儡样片",
    theme: "符光傀儡",
    src: "/prefill-videos/003-bronze-puppet.mp4",
    coverUrl: "/nano-banana-images/000020-13326/01.jpg",
    posterUrl: "/nano-banana-images/000020-13326/01.jpg",
    durationLabel: "12s",
    useCase: "工作流案例视频或方法型内容占位",
    keywords: ["傀儡", "符光", "铜", "玄幻", "仙侠"]
  },
  {
    id: "prefill-video-006",
    title: "赛博城市样片",
    theme: "赛博霓虹",
    src: "/prefill-videos/006-cyber-city.mp4",
    coverUrl: "/nano-banana-images/000028-13310/01.jpg",
    posterUrl: "/nano-banana-images/000028-13310/01.jpg",
    durationLabel: "12s",
    useCase: "首页赛博题材样片",
    keywords: ["赛博", "霓虹", "未来", "都市", "城市", "科幻", "列车", "穿城"]
  },
  {
    id: "prefill-video-007",
    title: "二次元舞台样片",
    theme: "舞台表演",
    src: "/prefill-videos/007-anime-stage-dance.mp4",
    coverUrl: "/nano-banana-images/000013-13329/01.jpg",
    posterUrl: "/nano-banana-images/000013-13329/01.jpg",
    durationLabel: "12s",
    useCase: "舞台类视频预填充",
    keywords: ["舞", "舞蹈", "舞台", "偶像", "二次元"]
  },
  {
    id: "prefill-video-009",
    title: "仓库格斗样片",
    theme: "写实动作",
    src: "/prefill-videos/009-warehouse-fight.mp4",
    coverUrl: "/nano-banana-images/000014-13327/01.jpg",
    posterUrl: "/nano-banana-images/000014-13327/01.jpg",
    durationLabel: "12s",
    useCase: "动作打戏详情页占位",
    keywords: ["格斗", "打戏", "动作", "仓库", "特工", "追逐", "雨夜", "夜景", "反光"]
  },
  {
    id: "prefill-video-010",
    title: "竹林对决样片",
    theme: "竹林对决",
    src: "/prefill-videos/010-bamboo-duel.mp4",
    coverUrl: "/nano-banana-images/000011-13330/01.jpg",
    posterUrl: "/nano-banana-images/000011-13330/01.jpg",
    durationLabel: "12s",
    useCase: "武侠对决类详情页占位",
    keywords: ["竹林", "对决", "武侠", "冷兵器", "江湖"]
  },
  {
    id: "prefill-video-011",
    title: "机甲科幻样片",
    theme: "机甲科幻",
    src: "/prefill-videos/011-mecha-city.mp4",
    coverUrl: "/nano-banana-images/000018-13331/01.jpg",
    posterUrl: "/nano-banana-images/000018-13331/01.jpg",
    durationLabel: "12s",
    useCase: "科幻题材精选样片",
    keywords: ["机甲", "机械", "科幻", "未来", "城市"]
  },
  {
    id: "prefill-video-012",
    title: "招式展示样片",
    theme: "动作分镜",
    src: "/prefill-videos/012-moves-showcase.mp4",
    coverUrl: "/nano-banana-images/000024-13314/01.jpg",
    posterUrl: "/nano-banana-images/000024-13314/01.jpg",
    durationLabel: "53s",
    useCase: "动作细节与工作流案例展示",
    keywords: ["招式", "动作", "打戏", "展示", "分镜"]
  },
  {
    id: "prefill-video-014",
    title: "舞蹈测试样片",
    theme: "舞蹈测试",
    src: "/prefill-videos/014-dance-test.mp4",
    coverUrl: "/nano-banana-images/000013-13329/01.jpg",
    posterUrl: "/nano-banana-images/000013-13329/01.jpg",
    durationLabel: "11s",
    useCase: "舞蹈类测试与互动演示",
    keywords: ["舞蹈", "表演", "动作", "测试"]
  }
];

export const homeHeroPrefillVideo = prefillVideos[0];

export const homePrefillShowcaseVideos = [
  prefillVideos[0],
  prefillVideos[3],
  prefillVideos[4],
  prefillVideos[7]
];

function normalizeTextValue(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const lower = trimmed.toLowerCase();
  if (lower === "null" || lower === "undefined") {
    return undefined;
  }

  return trimmed;
}

function buildSearchableText(candidate: PrefillVideoTextCandidate): string {
  return [candidate.title, candidate.summary, ...(candidate.tags ?? [])]
    .map((item) => normalizeTextValue(item))
    .filter((item): item is string => Boolean(item))
    .join(" ")
    .toLowerCase();
}

function stripQueryAndHash(value: string): string {
  return value.split("#")[0]?.split("?")[0] ?? value;
}

function extractFileName(value?: string | null): string | undefined {
  const normalized = normalizeTextValue(value);
  if (!normalized) {
    return undefined;
  }

  const pathname = stripQueryAndHash(normalized);
  const segments = pathname.split("/").filter(Boolean);
  const fileName = segments.at(-1);
  return fileName ? fileName.toLowerCase() : undefined;
}

function toFileStem(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/-preview$/, "");
}

function resolvePrefillVideoByMedia(candidate: PrefillVideoMediaCandidate): PrefillVideoAsset | undefined {
  const fileNames = [candidate.previewUrl, candidate.sourceUrl]
    .map((item) => extractFileName(item))
    .filter((item): item is string => Boolean(item));

  if (fileNames.length === 0) {
    return undefined;
  }

  return prefillVideos.find((asset) => {
    const assetFileName = extractFileName(asset.src);
    if (!assetFileName) {
      return false;
    }

    const assetStem = toFileStem(assetFileName);
    return fileNames.some((fileName) => {
      const fileStem = toFileStem(fileName);
      return fileName === assetFileName || fileStem === assetStem;
    });
  });
}

export function resolvePrefillVideoByText(candidate: PrefillVideoTextCandidate): PrefillVideoAsset | undefined {
  const text = buildSearchableText(candidate);
  if (!text) {
    return undefined;
  }

  return prefillVideos.find((asset) =>
    asset.keywords.some((keyword) => text.includes(keyword.toLowerCase()))
  );
}

export function resolvePrefillVideoForTextOrHero(
  candidate: PrefillVideoTextCandidate
): PrefillVideoAsset {
  return resolvePrefillVideoByText(candidate) ?? homeHeroPrefillVideo;
}

export function resolvePrefillVideoCardMediaFallback(
  candidate: PrefillVideoMediaCandidate
): PrefillVideoMediaFallback | undefined {
  const hasCover = Boolean(normalizeTextValue(candidate.coverUrl));
  const hasPoster = Boolean(normalizeTextValue(candidate.posterUrl));
  const hasPreview = Boolean(normalizeTextValue(candidate.previewUrl));
  const hasSource = Boolean(normalizeTextValue(candidate.sourceUrl));

  if (hasCover && hasPoster && (hasPreview || hasSource)) {
    return undefined;
  }

  const asset =
    resolvePrefillVideoByText(candidate) ??
    resolvePrefillVideoByMedia(candidate);

  if (!asset) {
    return undefined;
  }

  const fallback: PrefillVideoMediaFallback = {
    coverUrl: hasCover ? undefined : asset.coverUrl,
    posterUrl: hasPoster ? undefined : asset.posterUrl ?? asset.coverUrl,
    previewUrl: hasPreview || hasSource ? undefined : asset.src,
    sourceUrl: hasSource || hasPreview ? undefined : asset.src
  };

  if (!fallback.coverUrl && !fallback.posterUrl && !fallback.previewUrl && !fallback.sourceUrl) {
    return undefined;
  }

  return fallback;
}
