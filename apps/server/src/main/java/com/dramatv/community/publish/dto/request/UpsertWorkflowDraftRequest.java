package com.dramatv.community.publish.dto.request;

import java.util.List;

public record UpsertWorkflowDraftRequest(
        String title,
        String summary,
        String scenarioText,
        List<String> tagNames,
        Boolean allowCopy,
        Boolean allowFork,
        String visibility,
        String coverAssetId,
        String exampleAssetId
) {
}
