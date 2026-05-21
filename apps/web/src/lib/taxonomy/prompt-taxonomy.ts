export type PromptCategoryCode = "image_prompt" | "video_prompt";

export type ImagePromptModelCategory =
  | "gpt-image-2"
  | "nanobanana"
  | "midjourney"
  | "other-image-model";

export type VideoPromptModelCategory =
  | "seedance"
  | "kling"
  | "happyhorse"
  | "wan"
  | "other-video-model";

export type PromptCompositionCategory = "single-model" | "multi-model";

export type ImagePromptContentCategory = "real-person" | "animation" | "scene" | "prop" | "other";
export type VideoPromptContentCategory = "real-person" | "animation" | "other";

export type TaxonomyOption<T extends string> = {
  id: T;
  label: string;
};

export type ImagePromptTaxonomySelection = {
  categoryCode: "image_prompt";
  modelCategory?: ImagePromptModelCategory;
  contentCategory?: ImagePromptContentCategory;
  compositionCategory: PromptCompositionCategory;
};

export type VideoPromptTaxonomySelection = {
  categoryCode: "video_prompt";
  modelCategory?: VideoPromptModelCategory;
  contentCategory?: VideoPromptContentCategory;
  compositionCategory: PromptCompositionCategory;
};

export type PromptTaxonomySelection = ImagePromptTaxonomySelection | VideoPromptTaxonomySelection;

export const IMAGE_PROMPT_MODEL_OPTIONS: TaxonomyOption<ImagePromptModelCategory>[] = [
  { id: "gpt-image-2", label: "gpt-image-2" },
  { id: "nanobanana", label: "nanobanana" },
  { id: "midjourney", label: "midjourney" },
  { id: "other-image-model", label: "其他模型" }
];

export const VIDEO_PROMPT_MODEL_OPTIONS: TaxonomyOption<VideoPromptModelCategory>[] = [
  { id: "seedance", label: "seedance" },
  { id: "kling", label: "kling" },
  { id: "happyhorse", label: "happyhorse" },
  { id: "wan", label: "wan" },
  { id: "other-video-model", label: "其他模型" }
];

export const PROMPT_COMPOSITION_OPTIONS: TaxonomyOption<PromptCompositionCategory>[] = [
  { id: "single-model", label: "单模型" },
  { id: "multi-model", label: "模型组合" }
];

export const IMAGE_PROMPT_CONTENT_OPTIONS: TaxonomyOption<ImagePromptContentCategory>[] = [
  { id: "real-person", label: "真人" },
  { id: "animation", label: "动画" },
  { id: "scene", label: "场景" },
  { id: "prop", label: "道具" },
  { id: "other", label: "其他" }
];

export const VIDEO_PROMPT_CONTENT_OPTIONS: TaxonomyOption<VideoPromptContentCategory>[] = [
  { id: "real-person", label: "真人" },
  { id: "animation", label: "动画" },
  { id: "other", label: "其他" }
];

const IMAGE_MODEL_KEYWORDS: Record<ImagePromptModelCategory, string[]> = {
  "gpt-image-2": ["gpt-image-2", "gpt image 2", "gptimage2", "chatgpt image"],
  nanobanana: ["nanobanana", "nano banana", "nano-banana", "nano-banana-pro", "nano banana pro"],
  midjourney: ["midjourney", "mid-journey", "mj"],
  "other-image-model": []
};

const VIDEO_MODEL_KEYWORDS: Record<VideoPromptModelCategory, string[]> = {
  seedance: ["seedance", "seedance 2.0"],
  kling: ["kling"],
  happyhorse: ["happyhorse", "happy horse"],
  wan: ["wan", "wanx", "wan 2.1"],
  "other-video-model": []
};

const IMAGE_CONTENT_KEYWORDS: Record<ImagePromptContentCategory, string[]> = {
  "real-person": [
    "portrait",
    "photo",
    "photography",
    "photoreal",
    "photorealistic",
    "realistic",
    "fashion",
    "beauty",
    "selfie",
    "model",
    "真人",
    "写实",
    "摄影",
    "人像",
    "实拍"
  ],
  animation: [
    "comic-storyboard",
    "comic storyboard",
    "storyboard",
    "anime",
    "manga",
    "animation",
    "cartoon",
    "illustration",
    "comic",
    "panel",
    "动画",
    "动漫",
    "漫画",
    "插画",
    "分镜"
  ],
  scene: [
    "scene",
    "environment",
    "landscape",
    "interior",
    "exterior",
    "architecture",
    "cityscape",
    "street",
    "room",
    "场景",
    "环境",
    "风景",
    "建筑",
    "空间",
    "室内",
    "室外"
  ],
  prop: [
    "prop",
    "object",
    "product",
    "weapon",
    "car",
    "device",
    "gadget",
    "poster",
    "packaging",
    "道具",
    "产品",
    "物件",
    "载具",
    "海报",
    "包装"
  ],
  other: []
};

const VIDEO_CONTENT_KEYWORDS: Record<VideoPromptContentCategory, string[]> = {
  "real-person": [
    "portrait",
    "photo",
    "photography",
    "photoreal",
    "realistic",
    "camera",
    "cinematic",
    "live action",
    "arri",
    "alexa",
    "sony",
    "imax",
    "真人",
    "写实",
    "实拍",
    "电影感",
    "摄影"
  ],
  animation: [
    "anime",
    "manga",
    "animation",
    "cartoon",
    "ghibli",
    "pixar",
    "2d",
    "3d",
    "cg",
    "动画",
    "动漫",
    "漫画",
    "卡通",
    "二次元"
  ],
  other: []
};

const MULTI_MODEL_KEYWORDS = [
  "multi-model",
  "multiple models",
  "model combo",
  "model combination",
  "mixed model",
  "combine model",
  "blend models",
  "模型组合",
  "多模型",
  "混合模型"
];

function normalizeClassifierText(parts: Array<string | undefined>) {
  return parts
    .map((part) => part ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function includesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function firstMatchingOption<T extends string>(
  text: string,
  keywordMap: Record<T, string[]>,
  orderedIds: T[],
  fallback: T
) {
  const matched = orderedIds.find((id) => includesAnyKeyword(text, keywordMap[id]));
  return matched ?? fallback;
}

function classifyImagePromptTaxonomy(text: string): ImagePromptTaxonomySelection {
  const modelCategory = firstMatchingOption(
    text,
    IMAGE_MODEL_KEYWORDS,
    ["gpt-image-2", "nanobanana", "midjourney"],
    "other-image-model"
  );
  const contentCategory = firstMatchingOption(
    text,
    IMAGE_CONTENT_KEYWORDS,
    ["animation", "real-person", "scene", "prop"],
    "other"
  );
  const compositionCategory = includesAnyKeyword(text, MULTI_MODEL_KEYWORDS) ? "multi-model" : "single-model";

  return {
    categoryCode: "image_prompt",
    modelCategory,
    contentCategory,
    compositionCategory
  };
}

function classifyVideoPromptTaxonomy(text: string): VideoPromptTaxonomySelection {
  const modelCategory = firstMatchingOption(
    text,
    VIDEO_MODEL_KEYWORDS,
    ["seedance", "kling", "happyhorse", "wan"],
    "other-video-model"
  );
  const contentCategory = firstMatchingOption(
    text,
    VIDEO_CONTENT_KEYWORDS,
    ["animation", "real-person"],
    "other"
  );
  const compositionCategory = includesAnyKeyword(text, MULTI_MODEL_KEYWORDS) ? "multi-model" : "single-model";

  return {
    categoryCode: "video_prompt",
    modelCategory,
    contentCategory,
    compositionCategory
  };
}

export function buildPromptTaxonomyTags(input: {
  categoryCode: PromptCategoryCode;
  modelCategory?: ImagePromptModelCategory | VideoPromptModelCategory;
  contentCategory?: ImagePromptContentCategory | VideoPromptContentCategory;
  compositionCategory?: PromptCompositionCategory;
  existingTags?: string[];
}) {
  const tags = [
    ...(input.existingTags ?? []),
    input.categoryCode === "image_prompt" ? "image-prompt" : "video-prompt",
    input.modelCategory,
    input.contentCategory,
    input.compositionCategory
  ].filter((value): value is string => Boolean(value));

  return [...new Set(tags)];
}

export function classifyPromptTaxonomy(item: {
  modality: "image" | "video";
  title?: string;
  summary?: string;
  tagNames: string[];
}): PromptTaxonomySelection & { standardTags: string[] } {
  const text = normalizeClassifierText([item.title, item.summary, ...item.tagNames]);

  if (item.modality === "image") {
    const taxonomy = classifyImagePromptTaxonomy(text);

    return {
      ...taxonomy,
      standardTags: buildPromptTaxonomyTags({
        categoryCode: "image_prompt",
        modelCategory: taxonomy.modelCategory,
        contentCategory: taxonomy.contentCategory,
        compositionCategory: taxonomy.compositionCategory
      })
    };
  }

  const taxonomy = classifyVideoPromptTaxonomy(text);

  return {
    ...taxonomy,
    standardTags: buildPromptTaxonomyTags({
      categoryCode: "video_prompt",
      modelCategory: taxonomy.modelCategory,
      contentCategory: taxonomy.contentCategory,
      compositionCategory: taxonomy.compositionCategory
    })
  };
}

export function parsePromptTaxonomySelection(input: {
  categoryCode: PromptCategoryCode;
  tagNames: string[];
  title?: string;
  summary?: string;
  modelCategory?: string;
  contentCategory?: string;
  compositionCategory?: string;
}): PromptTaxonomySelection {
  const hasMeaningfulSignal =
    Boolean(input.modelCategory) ||
    Boolean(input.contentCategory) ||
    Boolean(input.compositionCategory) ||
    input.tagNames.length > 0 ||
    Boolean(input.title?.trim()) ||
    Boolean(input.summary?.trim());
  const tagSet = new Set(input.tagNames);

  if (input.categoryCode === "image_prompt") {
    const fallback = classifyImagePromptTaxonomy(normalizeClassifierText([input.title, input.summary, ...input.tagNames]));
    const compositionCategory =
      PROMPT_COMPOSITION_OPTIONS.find((option) => option.id === input.compositionCategory)?.id ??
      PROMPT_COMPOSITION_OPTIONS.find((option) => tagSet.has(option.id))?.id ??
      fallback.compositionCategory;

    return {
      categoryCode: "image_prompt",
      modelCategory: hasMeaningfulSignal
        ? IMAGE_PROMPT_MODEL_OPTIONS.find((option) => option.id === input.modelCategory)?.id ??
          IMAGE_PROMPT_MODEL_OPTIONS.find((option) => tagSet.has(option.id))?.id ??
          fallback.modelCategory
        : undefined,
      contentCategory: hasMeaningfulSignal
        ? IMAGE_PROMPT_CONTENT_OPTIONS.find((option) => option.id === input.contentCategory)?.id ??
          IMAGE_PROMPT_CONTENT_OPTIONS.find((option) => tagSet.has(option.id))?.id ??
          fallback.contentCategory
        : undefined,
      compositionCategory
    };
  }

  const fallback = classifyVideoPromptTaxonomy(normalizeClassifierText([input.title, input.summary, ...input.tagNames]));
  const compositionCategory =
    PROMPT_COMPOSITION_OPTIONS.find((option) => option.id === input.compositionCategory)?.id ??
    PROMPT_COMPOSITION_OPTIONS.find((option) => tagSet.has(option.id))?.id ??
    fallback.compositionCategory;

  return {
    categoryCode: "video_prompt",
    modelCategory: hasMeaningfulSignal
      ? VIDEO_PROMPT_MODEL_OPTIONS.find((option) => option.id === input.modelCategory)?.id ??
        VIDEO_PROMPT_MODEL_OPTIONS.find((option) => tagSet.has(option.id))?.id ??
        fallback.modelCategory
      : undefined,
    contentCategory: hasMeaningfulSignal
      ? VIDEO_PROMPT_CONTENT_OPTIONS.find((option) => option.id === input.contentCategory)?.id ??
        VIDEO_PROMPT_CONTENT_OPTIONS.find((option) => tagSet.has(option.id))?.id ??
        fallback.contentCategory
      : undefined,
    compositionCategory
  };
}
