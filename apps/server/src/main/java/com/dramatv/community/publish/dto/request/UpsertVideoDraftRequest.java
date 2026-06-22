package com.dramatv.community.publish.dto.request;

import java.util.List;

public record UpsertVideoDraftRequest(
        String title,
        String summary,
        String categoryCode,
        String promptText,
        String promptTextZh,
        String promptTextEn,
        String promptTextRaw,
        String modelName,
        String modelCategory,
        String contentCategory,
        String compositionCategory,
        String sourcePlatform,
        String sourceCampaign,
        String sourceItemId,
        String sourceUrl,
        String publishedAt,
        List<String> tagNames,
        String workflowId,
        String visibility,
        String coverAssetId,
        String sourceAssetId,
        List<String> referenceImageAssetIds,
        List<String> referenceAudioAssetIds
) {
}
