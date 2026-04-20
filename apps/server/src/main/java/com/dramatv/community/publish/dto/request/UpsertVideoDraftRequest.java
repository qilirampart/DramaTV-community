package com.dramatv.community.publish.dto.request;

import java.util.List;

public record UpsertVideoDraftRequest(
        String title,
        String summary,
        String categoryCode,
        List<String> tagNames,
        String workflowId,
        String visibility,
        String coverAssetId,
        String sourceAssetId
) {
}
