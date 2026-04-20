package com.dramatv.community.publish.dto.response;

import java.util.List;

public record WorkflowDraftSubmitResponse(
        String workflowId,
        String publishStatus,
        List<String> taskIds,
        String submitMode
) {
}
