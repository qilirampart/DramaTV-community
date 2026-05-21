package com.dramatv.community.publish.dto.response;

import java.util.List;

public record VideoDraftResponse(
        String draftId,
        String targetId,
        String title,
        String summary,
        String categoryCode,
        String promptText,
        String modelCategory,
        String contentCategory,
        String compositionCategory,
        List<String> tagNames,
        String workflowId,
        String visibility,
        String coverAssetId,
        String sourceAssetId,
        String statusCode,
        DraftLifecycleResponse lifecycle
) {
}
