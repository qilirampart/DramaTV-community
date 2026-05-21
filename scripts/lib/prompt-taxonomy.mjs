const IMAGE_MODEL_KEYWORDS = {
  "gpt-image-2": ["gpt-image-2", "gpt image 2", "gptimage2", "chatgpt image"],
  nanobanana: ["nanobanana", "nano banana", "nano-banana", "nano-banana-pro", "nano banana pro"],
  midjourney: ["midjourney", "mid-journey", "mj"],
  "other-image-model": []
};

const VIDEO_MODEL_KEYWORDS = {
  seedance: ["seedance", "seedance 2.0"],
  kling: ["kling"],
  happyhorse: ["happyhorse", "happy horse"],
  wan: ["wan", "wanx", "wan 2.1"],
  "other-video-model": []
};

const IMAGE_CONTENT_KEYWORDS = {
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

const VIDEO_CONTENT_KEYWORDS = {
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

const HIDDEN_PROMPT_TAGS = new Set(["youmind"]);

function normalizeClassifierText(parts) {
  return parts
    .map((part) => (typeof part === "string" ? part : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function includesAnyKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(String(keyword).toLowerCase()));
}

function firstMatchingOption(text, keywordMap, orderedIds, fallback) {
  const matched = orderedIds.find((id) => includesAnyKeyword(text, keywordMap[id] ?? []));
  return matched ?? fallback;
}

function filterHiddenPromptTags(tags = []) {
  return [
    ...new Set(
      tags
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter((tag) => tag && !HIDDEN_PROMPT_TAGS.has(tag.toLowerCase()))
    )
  ];
}

export function buildPromptTaxonomyTags({
  categoryCode,
  modelCategory,
  contentCategory,
  compositionCategory,
  existingTags = []
}) {
  return [
    ...new Set(
      [
        ...filterHiddenPromptTags(existingTags),
        categoryCode === "image_prompt" ? "image-prompt" : "video-prompt",
        modelCategory,
        contentCategory,
        compositionCategory
      ].filter(Boolean)
    )
  ];
}

export function classifyPromptTaxonomy({
  modality,
  title,
  summary,
  promptText,
  modelName,
  sourceCampaign,
  tagNames = [],
  extraSignals = []
}) {
  const text = normalizeClassifierText([
    title,
    summary,
    promptText,
    modelName,
    sourceCampaign,
    ...tagNames,
    ...extraSignals
  ]);
  const compositionCategory = includesAnyKeyword(text, MULTI_MODEL_KEYWORDS) ? "multi-model" : "single-model";

  if (modality === "image") {
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

    return {
      categoryCode: "image_prompt",
      modelCategory,
      contentCategory,
      compositionCategory,
      standardTags: buildPromptTaxonomyTags({
        categoryCode: "image_prompt",
        modelCategory,
        contentCategory,
        compositionCategory
      })
    };
  }

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

  return {
    categoryCode: "video_prompt",
    modelCategory,
    contentCategory,
    compositionCategory,
    standardTags: buildPromptTaxonomyTags({
      categoryCode: "video_prompt",
      modelCategory,
      contentCategory,
      compositionCategory
    })
  };
}

export function buildNormalizedPromptTags(input) {
  const taxonomy = classifyPromptTaxonomy(input);
  return [
    ...new Set(
      [
        ...filterHiddenPromptTags(input.preserveTags ?? []),
        ...taxonomy.standardTags
      ].filter(Boolean)
    )
  ];
}
