package com.dramatv.community.publish.dto.response;

import java.util.List;

public record WorkflowDraftResponse(
        String draftId,
        String targetId,
        String title,
        String summary,
        String scenarioText,
        List<String> tagNames,
        boolean allowCopy,
        boolean allowFork,
        String visibility,
        String coverAssetId,
        String statusCode
) {
}
